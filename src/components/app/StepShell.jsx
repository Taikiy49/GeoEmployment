import React, { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useIsPresent, useReducedMotion } from 'framer-motion';

function StepContent({ children, direction, reduceMotion }) {
  const isPresent = useIsPresent();
  const contentRef = useRef(null);
  // With AnimatePresence mode="wait", the incoming section mounts after the
  // parent's step-change effect. Focus on attachment, not the outgoing node.
  const focusContent = useCallback((node) => {
    contentRef.current = node;
    node?.focus({ preventScroll: true });
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
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? 60 : -60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? -60 : 60, scale: 0.95 }}
      transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
      className="min-h-[400px] focus:outline-none"
    >
      {children}
    </motion.div>
  );
}

export default function StepShell({ children, stepKey, direction }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <StepContent key={stepKey} direction={direction} reduceMotion={reduceMotion}>
        {children}
      </StepContent>
    </AnimatePresence>
  );
}
