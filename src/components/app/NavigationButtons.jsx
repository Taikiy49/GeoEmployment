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
    <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
      <div>
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-all font-medium"
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
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm disabled:opacity-60
              ${isSubmit
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-900 hover:bg-gray-700'
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