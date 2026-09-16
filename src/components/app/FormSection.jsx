import React from 'react';

export default function FormSection({ title, description, children, className = '' }) {
  return (
    <div className={`portal-form-section space-y-6 ${className}`}>
      {(title || description) && (
        <div className="portal-form-section__heading">
          {title && (
            <h3>{title}</h3>
          )}
          {description && (
            <p>{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
