import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StepShell({ children, stepKey, direction }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: direction > 0 ? 60 : -60, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: direction > 0 ? -60 : 60, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="min-h-[400px]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}