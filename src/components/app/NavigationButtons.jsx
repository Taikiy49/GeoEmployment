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
    <div className="flex items-center justify-between mt-8 pt-5 border-t border-[#1e2a3a]">
      <div>
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 text-sm text-[#94a3b8] hover:text-white rounded-xl hover:bg-[#1e2a3a] transition-all font-medium border border-[#1e2a3a] hover:border-[#2d3f55]"
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
            className={`flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-60
              ${isSubmit
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/25'
                : 'bg-[#F5C400] hover:bg-[#EFB506] text-[#0d1117] shadow-[#F5C400]/25'
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