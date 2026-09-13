import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, ShieldCheck, X } from 'lucide-react';
import FormSection from '../app/FormSection';
import NavigationButtons from '../app/NavigationButtons';
import { deleteResumeFile, saveResumeFile, blobToBase64 } from '@/lib/resumeStorage';
import { countResumeValues, mergeResumeAutofill, summarizeResumeData } from '@/lib/resumeAutofill';
import { MAX_RESUME_BYTES, RESUME_SIZE_ERROR } from '@/lib/resumeLimits';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export default function ResumeStep({ formData, setFormData, onNext, onBack, resumeStorageKey }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  // If resume was already uploaded (persisted in formData), start in success state
  const [status, setStatus] = useState(formData.resumeFileUrl ? 'success' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [parseStatus, setParseStatus] = useState(formData.resumeAutoFillTimestamp ? 'applied' : 'idle');
  const [parseError, setParseError] = useState('');
  const [parsedResume, setParsedResume] = useState(null);

  useEffect(() => {
    if (formData.resumeFileUrl && formData.resumeAttachment) {
      setStatus('success');
    } else if (!formData.resumeFileUrl && !file) {
      setStatus('idle');
    }
  }, [file, formData.resumeAttachment, formData.resumeFileUrl]);

  const handleFile = useCallback(async (f) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      setErrorMsg('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT.');
      setStatus('error');
      return;
    }
    if (f.size > MAX_RESUME_BYTES) {
      setErrorMsg(RESUME_SIZE_ERROR);
      setStatus('error');
      return;
    }
    setFile(f);
    setStatus('uploading');
    setErrorMsg('');
    setParsedResume(null);
    setParseStatus('idle');
    setParseError('');

    try {
      await saveResumeFile(resumeStorageKey, f);
      const content = await blobToBase64(f);
      setFormData(prev => ({
        ...prev,
        resumeFileUrl: `attached:${f.name}`,
        resumeFileName: f.name,
        resumeFileSize: f.size,
        resumeAttachment: {
          filename: f.name,
          content,
          type: f.type || 'application/octet-stream',
        },
      }));
      setStatus('success');
    } catch (error) {
      setErrorMsg(error.message || 'Failed to attach resume.');
      setStatus('error');
    }
  }, [resumeStorageKey, setFormData]);

  const analyzeResume = async () => {
    const attachment = formData.resumeAttachment;
    if (!attachment) {
      setParseError('Your saved resume could not be opened. Please attach it again.');
      setParseStatus('error');
      return;
    }
    setParseStatus('analyzing');
    setParseError('');
    try {
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeAttachment: attachment }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Resume analysis failed.');
      if (!countResumeValues(result.data)) throw new Error('We could not find application details in this resume. You can continue manually.');
      setParsedResume(result);
      setParseStatus('preview');
    } catch (error) {
      setParseError(error.message || 'We could not analyze this resume. You can continue manually.');
      setParseStatus('error');
    }
  };

  const applyAutofill = () => {
    if (!parsedResume?.data) return;
    setFormData(previous => mergeResumeAutofill(previous, parsedResume.data, parsedResume));
    setParseStatus('applied');
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  return (
    <div>
      <FormSection
        title="Resume"
        description="Attach a PDF, DOC, DOCX, or TXT resume. It will be delivered securely with your application."
      >
        {/* Upload area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer
            ${dragOver
              ? 'border-[#A65F2A] bg-[#F8F0E9]'
              : file
                ? 'border-success bg-success-soft'
                : 'border-[#cbd5e1] bg-[#f8fafc] hover:border-[#A65F2A] hover:bg-[#FBF5F0]'
            }
          `}
          onClick={() => document.getElementById('resume-input').click()}
        >
          <input
            id="resume-input"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files[0];
              e.target.value = '';
              handleFile(selectedFile);
            }}
          />
          {file || formData.resumeFileUrl ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className={`w-8 h-8 ${status === 'success' ? 'text-success' : 'text-[#A65F2A]'}`} />
              <div className="text-left">
                <p className="text-sm font-medium text-[#0f172a]">{file ? file.name : formData.resumeFileName || 'Resume uploaded'}</p>
                <p className="text-[10px] text-[#64748b]">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : formData.resumeFileSize
                      ? `${(formData.resumeFileSize / 1024).toFixed(1)} KB · Saved with your draft`
                      : 'Saved with your draft'}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setStatus('idle');
                  setParsedResume(null);
                  setParseStatus('idle');
                  setParseError('');
                  deleteResumeFile(resumeStorageKey).catch(() => {});
                  setFormData(prev => ({
                    ...prev,
                    resumeFileUrl: '',
                    resumeFileName: '',
                    resumeFileSize: 0,
                    resumeAttachment: null,
                  }));
                }}
                className="ml-2 p-1 rounded-full hover:bg-[#f1f5f9]"
              >
                <X className="w-4 h-4 text-[#64748b]" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-[#94a3b8] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#334155]">
                Drag & drop your resume here
              </p>
              <p className="text-xs text-[#64748b] mt-1">
                or click to browse · PDF, DOC, DOCX, TXT · Max 2 MB
              </p>
            </>
          )}
        </div>

        {status === 'uploading' && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-[#8A4A22]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Attaching and saving your resume…
          </div>
        )}

        {/* Status messages */}
        {status === 'error' && (
          <div className="mt-4 flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{errorMsg}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-4 flex items-start gap-2 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-800">
              Resume attached and ready to send with your application.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-5 overflow-hidden rounded-xl border border-[#A65F2A]/25 bg-gradient-to-br from-[#fffaf6] to-white">
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#A65F2A] text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-950">Save time with resume autofill</h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Résumé autofill can extract contact information, employment, education, credentials, skills, software, and professional references for your review.
                  </p>
                </div>
              </div>

              {parseStatus === 'idle' && (
                <>
                  <button
                    type="button"
                    onClick={analyzeResume}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#8A4A22] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#743d1b] sm:w-auto"
                  >
                    <Sparkles className="h-4 w-4" />
                    Autofill from this resume
                  </button>
                  <div className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-slate-500">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>By selecting autofill, a temporary copy is processed securely only to extract application details. Nothing is applied until you review and approve it.</span>
                  </div>
                </>
              )}

              {parseStatus === 'analyzing' && (
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-[#A65F2A]/20 bg-white p-3 text-xs font-medium text-[#8A4A22]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reading your resume and organizing application details…
                </div>
              )}

              {parseStatus === 'preview' && parsedResume && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Resume details are ready</p>
                      <p className="mt-1 text-[11px] text-slate-500">Review every autofilled answer as you continue through the application.</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                      {countResumeValues(parsedResume.data)} details
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {summarizeResumeData(parsedResume.data).map(item => (
                      <div key={item.label} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-[11px]">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="font-bold text-[#8A4A22]">{item.count}</span>
                      </div>
                    ))}
                  </div>
                  {parsedResume.warnings?.length > 0 && (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">Please double-check</p>
                      <ul className="mt-1 space-y-1 text-[10px] leading-relaxed text-amber-800">
                        {parsedResume.warnings.slice(0, 3).map(warning => <li key={warning}>• {warning}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={applyAutofill}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#8A4A22] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#743d1b]"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Apply resume details
                    </button>
                    <button
                      type="button"
                      onClick={() => { setParsedResume(null); setParseStatus('idle'); }}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Not now
                    </button>
                  </div>
                </div>
              )}

              {parseStatus === 'applied' && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800">Resume details added</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-emerald-700">We filled blank fields only. Continue through each section to confirm everything is complete and accurate.</p>
                  </div>
                </div>
              )}

              {parseStatus === 'error' && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-xs text-red-700">{parseError}</p>
                  </div>
                  <button type="button" onClick={analyzeResume} className="mt-2 text-[11px] font-bold text-red-700 underline underline-offset-2">Try again</button>
                </div>
              )}
            </div>
          </div>
        )}
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
