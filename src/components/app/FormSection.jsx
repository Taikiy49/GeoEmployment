import React from 'react';

export default function FormSection({ title, description, children, className = '' }) {
  return (
    <div className={`space-y-5 ${className}`}>
      {(title || description) && (
        <div className="pb-4 border-b border-slate-200">
          {title && (
            <h3 className="text-xl sm:text-2xl font-semibold text-brand tracking-tight">{title}</h3>
          )}
          {description && (
            <p className="text-base text-brand-muted mt-2 leading-relaxed max-w-[70ch]">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
