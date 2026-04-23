import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StepShell({ children, stepKey, direction }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="min-h-[400px]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}