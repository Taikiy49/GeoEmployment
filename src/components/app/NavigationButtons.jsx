import React from 'react';
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';

export default function NavigationButtons({
  onBack,
  onNext,
  showBack = true,
  showNext = true,
  nextLabel = 'Continue',
  isSubmit = false,
  isLoading = false,
}) {
  return (
    <div className="application-navigation flex items-center justify-between gap-3 mt-8 pt-5 border-t border-slate-200">
      <div>
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="brand-action flex items-center gap-2 text-sm text-slate-600 hover:text-slate-950 rounded-lg hover:bg-slate-100 transition-colors font-semibold border border-brand-line hover:border-brand"
          >
            <ChevronLeft aria-hidden="true" className="w-4 h-4" />
            Back
          </button>
        )}
      </div>
      <div>
        {showNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={isLoading}
            aria-busy={isLoading || undefined}
            className={`brand-action flex items-center gap-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-60
              ${isSubmit
                ? 'bg-brand hover:bg-brand-hover text-white'
                : 'bg-brand hover:bg-brand-hover text-white'
              }`}
          >
            {isLoading
              ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
              : isSubmit
                ? <Send aria-hidden="true" className="w-3.5 h-3.5" />
                : null
            }
            {isSubmit ? 'Submit Application' : nextLabel}
            {!isSubmit && !isLoading && <ChevronRight aria-hidden="true" className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
