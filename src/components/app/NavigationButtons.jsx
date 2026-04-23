import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';

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
    <div className="flex items-center justify-between mt-8 pt-5 border-t border-[#e5e7eb]">
      <div>
        {showBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="rounded-full px-5 h-9 text-sm border-[#cbd5e1] text-[#374151] hover:bg-[#f9fafb]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}
      </div>
      <div>
        {showNext && (
          <Button
            type="button"
            onClick={onNext}
            disabled={isLoading}
            className="rounded-full px-6 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white border border-bronze-dark shadow-sm"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : isSubmit ? (
              <Send className="w-3.5 h-3.5 mr-1.5" />
            ) : null}
            {isSubmit ? 'Submit Application' : nextLabel}
            {!isSubmit && !isLoading && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        )}
      </div>
    </div>
  );
}