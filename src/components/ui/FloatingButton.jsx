import React from 'react';
import { motion } from 'framer-motion';

export default function FloatingButton({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'primary',
  position = 'bottom-right',
  className = ''
}) {
  const variants = {
    primary: 'bg-[#A65F2A] text-white hover:bg-[#8A4A22] shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-navy border border-gray-200 hover:shadow-lg',
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        fixed ${positionClasses[position]} z-40 rounded-full
        flex items-center gap-2 px-4 py-3 font-medium text-sm
        transition-all ${variants[variant]} ${className}
      `}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {label && <span className="hidden sm:inline">{label}</span>}
    </motion.button>
  );
}