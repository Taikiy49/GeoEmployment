import React, { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useIsPresent, useReducedMotion } from 'framer-motion';

function StepContent({ children, reduceMotion }) {
  const isPresent = useIsPresent();
  const contentRef = useRef(null);
  // With AnimatePresence mode="wait", the incoming section mounts after the
  // parent's step-change effect. Focus on attachment, not the outgoing node.
  const focusContent = useCallback((node) => {
    contentRef.current = node;
    node?.focus({ preventScroll: true });
    // On phones, bring the task into view after navigation instead of making
    // applicants scroll past the job context and progress rail on every step.
    if (node?.closest('.portal-application__workspace') && window.matchMedia('(max-width: 639px)').matches) {
      node.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, []);
  useEffect(() => {
    if (contentRef.current) contentRef.current.inert = !isPresent;
  }, [isPresent]);

  return (
    <motion.div
      ref={focusContent}
      id={isPresent ? 'application-step-content' : undefined}
      role="region"
      aria-label="Current application section"
      aria-hidden={!isPresent || undefined}
      tabIndex={-1}
      initial={{ opacity: reduceMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: reduceMotion ? 1 : 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.12, ease: 'easeOut' }}
      className="min-h-[400px] focus:outline-none"
    >
      {children}
    </motion.div>
  );
}

export default function StepShell({ children, stepKey }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <StepContent key={stepKey} reduceMotion={reduceMotion}>
        {children}
      </StepContent>
    </AnimatePresence>
  );
}
