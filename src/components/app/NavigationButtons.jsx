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
    <div className="application-navigation portal-form-actions">
      <div>
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="portal-button portal-button--secondary"
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
            className="portal-button portal-button--primary"
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
