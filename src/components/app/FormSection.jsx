import React from 'react';

export default function FormSection({ title, description, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5 sm:p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-5">
          {title && (
            <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
          )}
          {description && (
            <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}