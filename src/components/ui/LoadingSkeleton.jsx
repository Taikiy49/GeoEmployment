import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingSkeleton({ width = 'w-full', height = 'h-4', className = '' }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className={`bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded ${width} ${height} ${className}`}
    />
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <LoadingSkeleton height="h-3" width="w-32" className="mb-3" />
        <LoadingSkeleton height="h-10" width="w-full" className="rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <LoadingSkeleton height="h-10" width="w-full" className="rounded-lg" />
        <LoadingSkeleton height="h-10" width="w-full" className="rounded-lg" />
      </div>
      <LoadingSkeleton height="h-12" width="w-full" className="rounded-lg" />
    </div>
  );
}