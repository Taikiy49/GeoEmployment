import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  // Read the live controls, not a clone: select options and textarea textContent
  // can differ from the answer the applicant currently sees.
  const readNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (!(node instanceof Element)) return '';
    if (node.matches('[data-read-aloud-ignore], [hidden], [aria-hidden="true"], script, style, svg')) return '';
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return '';

    if (node instanceof HTMLInputElement) {
      if (['hidden', 'password', 'file'].includes(node.type)) return '';
      if (['checkbox', 'radio'].includes(node.type)) return node.checked ? 'Selected. ' : 'Not selected. ';
      return `${node.value} `;
    }
    if (node instanceof HTMLTextAreaElement) return `${node.value} `;
    if (node instanceof HTMLSelectElement) {
      return `${[...node.selectedOptions].map((option) => option.text).join(', ')} `;
    }
    const selection = node.getAttribute('aria-checked');
    const prefix = selection === 'true' ? 'Selected. ' : selection === 'false' ? 'Not selected. ' : '';
    return `${prefix}${[...node.childNodes].map(readNode).join(' ')} `;
  };
  return readNode(target);
}

export default function AccessibilityToolbar({ targetSelector, contentKey }) {
  const [supported, setSupported] = useState(true);
  const [state, setState] = useState('idle');
  const [status, setStatus] = useState('Read-aloud is ready.');
  const playbackRef = useRef(null);
  const primaryButtonRef = useRef(null);
  const controlsRef = useRef(null);

  const retainControlFocus = useCallback(() => {
    if (controlsRef.current?.contains(document.activeElement)) {
      primaryButtonRef.current?.focus({ preventScroll: true });
    }
  }, []);

  useEffect(() => {
    setSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
  }, []);

  const cancelPlayback = useCallback(() => {
    // Browsers can dispatch an old onend/onerror after cancel(). Invalidate the
    // session first so those callbacks cannot restart a stopped section.
    playbackRef.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    cancelPlayback();
    retainControlFocus();
    setState('idle');
    setStatus('Read-aloud stopped.');
  }, [cancelPlayback, retainControlFocus]);

  useEffect(() => {
    cancelPlayback();
    setState('idle');
    setStatus('Read-aloud is ready.');
    return cancelPlayback;
  }, [contentKey, targetSelector, cancelPlayback]);

  const start = useCallback(() => {
    if (!supported) return;
    cancelPlayback();
    const chunks = splitForSpeech(getReadableText(targetSelector));
    if (!chunks.length) {
      setState('idle');
      setStatus('There is no readable content in this section.');
      return;
    }

    const playback = { index: 0, paused: false, utterance: null, speakNext: null };
    playbackRef.current = playback;
    const speakNext = () => {
      if (playbackRef.current !== playback || playback.paused) return;
      if (playback.index >= chunks.length) {
        playbackRef.current = null;
        retainControlFocus();
        setState('idle');
        setStatus('Finished reading this section.');
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[playback.index]);
      playback.utterance = utterance;
      utterance.rate = 0.95;
      utterance.lang = document.documentElement.lang || 'en-US';
      utterance.onend = () => {
        if (playbackRef.current !== playback || playback.utterance !== utterance) return;
        playback.utterance = null;
        playback.index += 1;
        speakNext();
      };
      utterance.onerror = () => {
        if (playbackRef.current !== playback || playback.utterance !== utterance) return;
        cancelPlayback();
        retainControlFocus();
        setState('idle');
        setStatus('Read-aloud could not continue in this browser.');
      };
      window.speechSynthesis.speak(utterance);
    };
    playback.speakNext = speakNext;

    // cancel() does not reset the paused state in every browser.
    window.speechSynthesis.resume();
    setState('playing');
    setStatus('Reading this application section aloud.');
    speakNext();
  }, [cancelPlayback, retainControlFocus, supported, targetSelector]);

  const togglePause = useCallback(() => {
    const playback = playbackRef.current;
    if (!playback) return;
    if (state === 'playing') {
      playback.paused = true;
      window.speechSynthesis.pause();
      setState('paused');
      setStatus('Read-aloud paused.');
    } else if (state === 'paused') {
      playback.paused = false;
      window.speechSynthesis.resume();
      setState('playing');
      setStatus('Read-aloud resumed.');
      // An utterance can finish just as Pause is pressed. Resume the next
      // chunk explicitly if there is no native utterance left to resume.
      if (!playback.utterance) playback.speakNext();
    }
  }, [state]);

  const primaryLabel = state === 'idle' ? 'Read this section aloud' : 'Restart this section';

  return (
    <section
      aria-label="Application accessibility tools"
      className="portal-accessibility"
      data-read-aloud-ignore
    >
      <div className="portal-accessibility__inner">
        <div>
          <h2>Accessibility tools</h2>
          <p>
            Read the current section, including entered answers, using your browser’s speech tools.
          </p>
        </div>

        {supported ? (
          <div ref={controlsRef} className="flex flex-wrap items-center gap-2">
            <button ref={primaryButtonRef} type="button" onClick={start} className="portal-button portal-button--secondary">
              {state === 'idle' ? <CirclePlay aria-hidden="true" className="h-4 w-4" /> : <RotateCcw aria-hidden="true" className="h-4 w-4" />}
              {primaryLabel}
            </button>
            {state !== 'idle' && (
              <>
                <button type="button" onClick={togglePause} className="portal-button portal-button--secondary">
                  {state === 'paused' ? <CirclePlay aria-hidden="true" className="h-4 w-4" /> : <CirclePause aria-hidden="true" className="h-4 w-4" />}
                  {state === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <button type="button" onClick={() => stop()} className="portal-button portal-button--secondary">
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
