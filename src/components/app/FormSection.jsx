import React from 'react';

export default function FormSection({ title, description, children, className = '' }) {
  return (
    <div className={`space-y-5 ${className}`}>
      {(title || description) && (
        <div className="pb-4 border-b border-[#1e2a3a]">
          {title && (
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-[#94a3b8] mt-1 leading-relaxed">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}