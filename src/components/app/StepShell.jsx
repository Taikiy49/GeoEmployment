import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function StepShell({ children, stepKey, direction }) {
  const contentRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true });
  }, [stepKey]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        ref={contentRef}
        id="application-step-content"
        role="region"
        aria-label="Current application section"
        tabIndex={-1}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? 60 : -60, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? -60 : 60, scale: 0.95 }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
        className="min-h-[400px] focus:outline-none"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
