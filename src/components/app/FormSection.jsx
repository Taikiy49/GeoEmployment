import React from 'react';

export default function FormSection({ title, description, children, className = '' }) {
  return (
    <div className={`space-y-5 ${className}`}>
      {(title || description) && (
        <div className="pb-4 border-b border-gray-100">
          {title && (
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}