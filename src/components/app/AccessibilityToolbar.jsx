import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CirclePause, CirclePlay, RotateCcw, Square } from 'lucide-react';

const MAX_UTTERANCE_LENGTH = 220;

function splitForSpeech(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [normalized];
  const chunks = [];
  let current = '';

  sentences.forEach((sentence) => {
    const next = `${current} ${sentence}`.trim();
    if (next.length <= MAX_UTTERANCE_LENGTH) {
      current = next;
      return;
    }

    if (current) chunks.push(current);
    if (sentence.length <= MAX_UTTERANCE_LENGTH) {
      current = sentence.trim();
      return;
    }

    const words = sentence.trim().split(/\s+/);
    current = '';
    words.forEach((word) => {
      const wordChunk = `${current} ${word}`.trim();
      if (wordChunk.length > MAX_UTTERANCE_LENGTH && current) {
        chunks.push(current);
        current = word;
      } else {
        current = wordChunk;
      }
    });
  });

  if (current) chunks.push(current);
  return chunks;
}

function getReadableText(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return '';

  const copy = target.cloneNode(true);
  copy.querySelectorAll('[data-read-aloud-ignore], script, style, svg').forEach((node) => node.remove());
  copy.querySelectorAll('input, textarea, select').forEach((field) => {
    const value = field.value || field.getAttribute('value') || '';
    if (value) field.insertAdjacentText('afterend', ` ${value} `);
  });
  return copy.textContent || '';
}

export default function AccessibilityToolbar({ targetSelector, contentKey }) {
  const [supported, setSupported] = useState(true);
  const [state, setState] = useState('idle');
  const [status, setStatus] = useState('Read-aloud is ready.');

  useEffect(() => {
    setSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
  }, []);

  const stop = useCallback((announce = true) => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setState('idle');
    if (announce) setStatus('Read-aloud stopped.');
  }, []);

  useEffect(() => {
    stop(false);
    return () => stop(false);
  }, [contentKey, stop]);

  const start = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const chunks = splitForSpeech(getReadableText(targetSelector));
    if (!chunks.length) {
      setStatus('There is no readable content in this section.');
      return;
    }

    let index = 0;
    const speakNext = () => {
      if (index >= chunks.length) {
        setState('idle');
        setStatus('Finished reading this section.');
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.rate = 0.95;
      utterance.onend = () => {
        index += 1;
        speakNext();
      };
      utterance.onerror = (event) => {
        if (event.error === 'canceled' || event.error === 'interrupted') return;
        setState('idle');
        setStatus('Read-aloud could not continue in this browser.');
      };
      window.speechSynthesis.speak(utterance);
    };

    setState('playing');
    setStatus('Reading this application section aloud.');
    speakNext();
  }, [supported, targetSelector]);

  const togglePause = useCallback(() => {
    if (state === 'playing') {
      window.speechSynthesis.pause();
      setState('paused');
      setStatus('Read-aloud paused.');
    } else if (state === 'paused') {
      window.speechSynthesis.resume();
      setState('playing');
      setStatus('Read-aloud resumed.');
    }
  }, [state]);

  const primaryLabel = useMemo(() => state === 'idle' ? 'Read this section aloud' : 'Restart this section', [state]);

  return (
    <section
      aria-label="Application accessibility tools"
      className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
      data-read-aloud-ignore
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Accessibility tools</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
            Read the current section aloud. Your application information stays in this browser.
          </p>
        </div>

        {supported ? (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={start} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#A65F2A] px-3 py-2 text-xs font-bold text-white hover:bg-[#8A4A22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A65F2A] focus-visible:ring-offset-2">
              {state === 'idle' ? <CirclePlay aria-hidden="true" className="h-4 w-4" /> : <RotateCcw aria-hidden="true" className="h-4 w-4" />}
              {primaryLabel}
            </button>
            {state !== 'idle' && (
              <>
                <button type="button" onClick={togglePause} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A65F2A] focus-visible:ring-offset-2">
                  {state === 'paused' ? <CirclePlay aria-hidden="true" className="h-4 w-4" /> : <CirclePause aria-hidden="true" className="h-4 w-4" />}
                  {state === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <button type="button" onClick={() => stop()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A65F2A] focus-visible:ring-offset-2">
                  <Square aria-hidden="true" className="h-3.5 w-3.5" /> Stop
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="text-xs font-semibold text-slate-600">Read-aloud is not supported by this browser.</p>
        )}
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{status}</p>
    </section>
  );
}
