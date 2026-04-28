import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedInput({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  type = 'text',
  required = false,
  className = ''
}) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="relative">
      {label && (
        <motion.label
          animate={{ y: focused || value ? -24 : 0, scale: focused || value ? 0.85 : 1 }}
          transition={{ duration: 0.2 }}
          className="absolute left-3.5 top-3.5 origin-left text-xs font-medium text-gray-600 pointer-events-none bg-white px-1"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </motion.label>
      )}
      <motion.input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        initial={false}
        animate={{
          borderColor: focused ? '#fbbf24' : '#e5e7eb',
          boxShadow: focused 
            ? '0 0 0 3px rgba(251, 191, 36, 0.1)' 
            : '0 0 0 0px rgba(251, 191, 36, 0)',
        }}
        transition={{ duration: 0.2 }}
        className={`
          w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 
          bg-white focus:outline-none transition-all
          ${className}
        `}
      />
    </div>
  );
}