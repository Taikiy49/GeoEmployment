import React from 'react';

export default function FormSection({ title, description, children, className = '' }) {
  return (
    <div className={`space-y-5 ${className}`}>
      {(title || description) && (
        <div className="pb-4 border-b border-slate-200">
          {title && (
            <h3 className="text-base font-bold text-slate-950 tracking-tight">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
