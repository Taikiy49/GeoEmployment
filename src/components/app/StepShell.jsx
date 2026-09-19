import React, { useLayoutEffect, useRef } from 'react';

function StepContent({ children, isWelcome }) {
  const contentRef = useRef(null);
  // One navigation owner: focus and scroll the incoming task before paint.
  // Keyed mounts retain task-local reset behavior without a blank fade frame.
  useLayoutEffect(() => {
    const node = contentRef.current;
    node?.focus({ preventScroll: true });
    // On phones, bring the task into view after navigation instead of making
    // applicants scroll past the job context and progress rail on every step.
    if (node && !isWelcome && window.matchMedia('(max-width: 639px)').matches) {
      node.scrollIntoView({ block: 'start', behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isWelcome]);

  return (
    <div
      ref={contentRef}
      id="application-step-content"
      role="region"
      aria-label="Current application section"
      tabIndex={-1}
      className="min-h-[400px] scroll-mt-[88px] focus:outline-none"
    >
      {children}
    </div>
  );
}

export default function StepShell({ children, stepKey }) {
  return (
    <StepContent key={stepKey} isWelcome={String(stepKey).startsWith('0-')}>
      {children}
    </StepContent>
  );
}
