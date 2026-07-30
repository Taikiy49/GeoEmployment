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
    <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-slate-200">
      <div>
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-all font-semibold border border-slate-300 hover:border-slate-400"
          >
            <ChevronLeft className="w-4 h-4" />
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
            className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-60
              ${isSubmit
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/25'
                : 'bg-[#A65F2A] hover:bg-[#8A4A22] text-white shadow-[#A65F2A]/25'
              }`}
          >
            {isLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : isSubmit
                ? <Send className="w-3.5 h-3.5" />
                : null
            }
            {isSubmit ? 'Submit Application' : nextLabel}
            {!isSubmit && !isLoading && <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
