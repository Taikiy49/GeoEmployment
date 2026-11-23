import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormField from './FormField';
import RadioCard from './RadioCard';
import { localDateValue } from '@/lib/localDate';
import { APPLICATION_DOCUMENTS, getApplicationDocument } from '../../../shared/application-documents.js';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './document-editor.css';

let pdfModule;
async function getPdfModule() {
  pdfModule ||= import('pdfjs-dist').then(module => {
    module.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    return module;
  });
  return pdfModule;
}

function PdfPage({ pdf, number, children, onError }) {
  const canvas = useRef(null);
  useEffect(() => {
    let cancelled = false;
    let render;
    if (canvas.current) canvas.current.dataset.rendered = 'false';
    pdf.getPage(number).then(page => {
      if (cancelled || !canvas.current) return;
      const viewport = page.getViewport({ scale: 2 });
      canvas.current.width = viewport.width;
      canvas.current.height = viewport.height;
      render = page.render({ canvasContext: canvas.current.getContext('2d'), viewport });
      return render.promise.then(() => {
        if (!cancelled && canvas.current) canvas.current.dataset.rendered = 'true';
      });
    }).catch(error => {
      if (!cancelled && error.name !== 'RenderingCancelledException') onError();
    });
    return () => { cancelled = true; render?.cancel(); };
  }, [pdf, number, onError]);
  return <div className="document-paper-page" data-document-page={number}>
    <canvas ref={canvas} aria-hidden="true" />
    {children}
  </div>;
}

const boxStyle = box => ({ left: `${box.x / 612 * 100}%`, top: `${box.y / 792 * 100}%`, width: `${box.width / 612 * 100}%`, height: `${box.height / 792 * 100}%` });

export default function DocumentEditor({ documentKey, formData, setFormData, onDocumentChange = undefined, fieldKeys = undefined }) {
  const definition = getApplicationDocument(documentKey);
  const id = useId().replace(/:/g, '');
  const root = useRef(null);
  const lastField = useRef('');
  const [mode, setMode] = useState(() => window.matchMedia('(max-width: 767px)').matches ? 'readable' : 'paper');
  const [previewRequested, setPreviewRequested] = useState(mode === 'paper');
  const [transcript, setTranscript] = useState(null);
  const [loadedPdf, setLoadedPdf] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const pdf = loadedPdf?.template === definition.template && loadedPdf?.attempt === attempt ? loadedPdf.document : null;
  const fields = definition.fields.filter(field => !fieldKeys || fieldKeys.includes(field.key));
  const update = (key, value) => setFormData(previous => ({ ...previous, [key]: value }));

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setTranscript(null);
    setError('');
    fetch(definition.transcript, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Document text unavailable');
      return response.json();
    }).then(value => {
      if (!controller.signal.aborted) setTranscript(value);
    }).catch(() => {
      if (!controller.signal.aborted || !controller.signal.reason?.message?.includes('unmounted')) {
        setError('The document could not be loaded. Retry, or open the original PDF. Your answers have not been lost.');
      }
    }).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(new Error('unmounted')); };
  }, [definition.transcript, attempt]);

  useEffect(() => {
    if (!previewRequested) return;
    let cancelled = false;
    let task;
    const controller = new AbortController();
    // Fetch the small, local template in full so PDF.js has no outstanding
    // streaming reader to reject when an applicant leaves this document.
    const destroy = () => { if (task) void task.destroy().catch(() => {}); };
    const timeout = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        controller.abort();
        setError('The PDF preview is taking too long to load. Retry or use Readable view. Your answers are kept.');
        destroy();
      }
    }, 20000);
    Promise.all([
      getPdfModule(),
      fetch(definition.template, { signal: controller.signal }).then(response => {
        if (!response.ok) throw new Error('PDF unavailable');
        return response.arrayBuffer();
      }),
    ]).then(([module, data]) => {
      if (cancelled) return;
      task = module.getDocument({ data, isEvalSupported: false });
      return task.promise;
    }).then(value => { if (!cancelled && value) setLoadedPdf({ template: definition.template, attempt, document: value }); })
      .catch(() => { if (!cancelled) setError('The PDF preview could not be loaded. Use Readable view, or retry. Your answers are kept.'); })
      .finally(() => clearTimeout(timeout));
    // Keep the same PDF alive while changing views; only release it when the
    // document changes, the editor unmounts, or the applicant explicitly retries.
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); destroy(); };
  }, [definition.template, previewRequested, attempt]);

  const renderError = React.useCallback(() => setError('The PDF preview could not be drawn. Use Readable view, or retry.'), []);
  const nextField = () => {
    const eligible = fields.filter(field => !field.requires || formData[field.requires]);
    if (!eligible.length) return;
    const index = eligible.findIndex(field => field.key === lastField.current);
    const field = eligible[(index + 1) % eligible.length];
    const area = root.current?.querySelector(`[data-document-field="${field.key}"]`);
    const target = area?.querySelector('input:checked, input:not(:disabled), textarea:not(:disabled), button');
    if (target) {
      lastField.current = field.key;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      setAnnouncement(`${field.label}${field.required ? ', required' : ', optional'}`);
    }
  };
  const disabled = field => Boolean(field.requires && !formData[field.requires]);
  const signatureHint = 'Typing your name serves as your electronic signature. It is not added automatically.';
  const clearLabel = field => field.key === 'eeoGender' ? 'Clear gender selection' : field.key === 'eeoRace' ? 'Clear race or ethnicity selection' : 'Clear veteran status selection';

  function readableField(field) {
    const fieldId = `${id}-${field.key}`;
    return <div key={field.key} data-document-field={field.key} onFocus={() => { lastField.current = field.key; }} className="document-readable-field">
      {field.type === 'radio' ? <fieldset>
        <legend className="font-semibold mb-2">{field.label}</legend>
        <div className="space-y-2">
          {field.options.map(option => <RadioCard key={option.value} name={fieldId} value={option.value} label={option.label} selected={formData[field.key] === option.value} onChange={() => update(field.key, option.value)} />)}
        </div>
        <Button type="button" variant="link" aria-label={clearLabel(field)} onClick={() => update(field.key, '')} className="mt-2 min-h-11">Clear selection</Button>
      </fieldset> : field.type === 'checkbox' ? <label htmlFor={fieldId} className="document-acknowledgment">
        <input id={fieldId} name={field.key} type="checkbox" checked={Boolean(formData[field.key])} required={field.required} onChange={event => update(field.key, event.target.checked)} />
        <span>{field.label}{field.required && ' (required)'}</span>
      </label> : <>
        <FormField label={field.label} name={field.key} type={field.type} maxLength={field.maxLength} autoComplete="off" value={formData[field.key] || ''} onChange={value => update(field.key, value)} required={field.required} disabled={disabled(field)} hint={disabled(field) ? 'Please acknowledge the agreement to enable this field.' : field.signature ? signatureHint : ''} />
        {field.type === 'date' && <Button type="button" variant="outline" disabled={disabled(field)} onClick={() => update(field.key, localDateValue())} className="mt-2 min-h-11">Today</Button>}
      </>}
    </div>;
  }

  function paperField(field, pageNumber) {
    const active = fields.some(item => item.key === field.key);
    const fieldId = `${id}-${field.key}`;
    if (field.type === 'radio') return field.options.filter(option => option.rect.page === pageNumber).map(option => <label
      key={option.value} style={boxStyle(option.rect)} className="document-paper-choice" data-document-field={active ? field.key : undefined}
    >
      <span className="sr-only">{field.label}: {option.label}</span>
      <input type="radio" name={fieldId} value={option.value} checked={formData[field.key] === option.value} disabled={!active} onFocus={() => { lastField.current = field.key; }} onChange={() => update(field.key, option.value)} aria-label={option.label} />
    </label>);
    if (!field.rect || field.rect.page !== pageNumber) return null;
    if (!active) return <span key={field.key} style={boxStyle(field.rect)} className="document-paper-value">{field.type === 'checkbox' ? formData[field.key] ? field.trueText || 'X' : '' : formData[field.key] || ''}</span>;
    return <div key={field.key} style={boxStyle(field.rect)} className={`document-paper-field ${field.type === 'checkbox' ? 'document-paper-boolean' : ''}`} data-document-field={field.key} onFocus={() => { lastField.current = field.key; }}>
      <label className="sr-only" htmlFor={fieldId}>{field.label}</label>
      <input id={fieldId} name={field.key} type={field.type} value={field.type === 'checkbox' ? undefined : formData[field.key] || ''} checked={field.type === 'checkbox' ? Boolean(formData[field.key]) : undefined}
        onChange={event => update(field.key, field.type === 'checkbox' ? event.target.checked : event.target.value)}
        disabled={disabled(field)} required={field.required} maxLength={field.maxLength} autoComplete="off"
        aria-describedby={field.signature ? `${id}-signature-hint` : undefined} />
    </div>;
  }

  return <section ref={root} className="document-editor" aria-label={`${definition.label} document editor`}>
    {onDocumentChange && <nav aria-label="Application documents" className="document-navigation">
      {APPLICATION_DOCUMENTS.map(item => <button key={item.key} type="button" aria-current={item.key === documentKey ? 'page' : undefined} onClick={() => onDocumentChange(item.key)}>{item.label}</button>)}
    </nav>}
    <div className="document-toolbar">
      <div role="group" aria-label="Document view" className="flex flex-wrap gap-2">
        <Button type="button" variant={mode === 'paper' ? 'default' : 'outline'} aria-pressed={mode === 'paper'} onClick={() => { setPreviewRequested(true); setMode('paper'); }} className="min-h-11"><FileText aria-hidden="true" />Original document</Button>
        <Button type="button" variant={mode === 'readable' ? 'default' : 'outline'} aria-pressed={mode === 'readable'} onClick={() => setMode('readable')} className="min-h-11">Readable view</Button>
      </div>
      <Button type="button" variant="outline" onClick={nextField} disabled={!transcript || (mode === 'paper' && !pdf)} className="min-h-11">Next field <ArrowRight aria-hidden="true" /></Button>
    </div>
    <p className="text-sm text-brand-muted">{definition.optional ? 'Optional — you may leave this document unanswered. ' : 'Read the document and complete the required fields. '}Both views use the same answers and existing draft save.</p>
    {mode === 'paper' && <p className="text-sm text-brand-muted">Click the highlighted fields to enter your answers. On a small screen, scroll sideways to see the full page or choose Readable view.</p>}
    {error && <div role="alert" className="document-load-error"><p>{error}</p><Button type="button" variant="outline" onClick={() => { setError(''); setAttempt(value => value + 1); }} className="min-h-11 mt-2">Retry document</Button></div>}
    {!transcript && !error && <div role="status" className="document-loading">Loading document…</div>}
    {transcript && <div className={mode === 'paper' ? 'sr-only' : 'document-transcript'} role="region" aria-label="Original document text" tabIndex={mode === 'readable' ? 0 : undefined}>
      {transcript.pages.map((page, index) => <div key={index}>
        <h3 className="font-semibold mb-4">{definition.label}{transcript.pages.length > 1 ? ` — page ${index + 1}` : ''}</h3>
        {page.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="mb-4">{paragraph}</p>)}
      </div>)}
    </div>}
    {transcript && fields.filter(field => !field.rect && field.type !== 'radio').map(readableField)}
    {mode === 'paper' ? <>
      <div className="document-paper-scroll" tabIndex={0} role="region" aria-label={`${definition.label} original pages`}>
        {pdf ? Array.from({ length: pdf.numPages }, (_, index) => <PdfPage key={index} pdf={pdf} number={index + 1} onError={renderError}>
          {definition.fields.map(field => paperField(field, index))}
        </PdfPage>) : <div role="status" className="document-loading">{error ? 'Preview unavailable' : 'Loading PDF preview…'}</div>}
      </div>
      <div className="flex flex-wrap gap-2">
        {fields.filter(field => field.type === 'radio').map(field => <Button key={field.key} type="button" variant="outline" aria-label={clearLabel(field)} onClick={() => update(field.key, '')} className="min-h-11">{clearLabel(field)}</Button>)}
        {fields.filter(field => field.type === 'date').map(field => <Button key={field.key} type="button" variant="outline" disabled={disabled(field)} aria-label={`Set ${field.label} to today`} onClick={() => update(field.key, localDateValue())} className="min-h-11">Today</Button>)}
      </div>
    </> : transcript && <div className="document-readable-fields">{fields.filter(field => field.rect || field.type === 'radio').map(readableField)}</div>}
    <p id={`${id}-signature-hint`} className="text-sm text-brand-muted">{fields.some(field => field.signature) ? signatureHint : 'Selections are voluntary and can be cleared.'}</p>
    <a href={definition.template} target="_blank" rel="noopener noreferrer" className="document-download"><ArrowDownToLine size={16} aria-hidden="true" />Open blank original PDF <span className="sr-only">(opens in a new tab)</span></a>
    <p role="status" className="sr-only">{announcement}</p>
  </section>;
}
