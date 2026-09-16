import React, { useId, useLayoutEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FormField({
  label,
  hint = '',
  required = false,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  options = [],
  rows = 3,
  className = '',
  disabled = false,
}) {
  const generatedId = useId();
  const id = `field-${generatedId.replace(/:/g, '')}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const textareaRef = useRef(null);
  useLayoutEffect(() => {
    const field = textareaRef.current;
    if (!field) return;
    const resize = () => {
      field.style.height = 'auto';
      field.style.height = `${Math.min(field.scrollHeight + 2, 360)}px`;
    };
    resize();
    const observer = new ResizeObserver(entries => {
      const width = String(entries[0].contentRect.width);
      if (width !== field.dataset.previousWidth) {
        field.dataset.previousWidth = width;
        resize();
      }
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, [value, rows, type]);

  const inputClass = 'portal-field__control';

  return (
    <div className={`portal-field min-w-0 max-w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="portal-field__label">
          {label}
          {required && <span className="portal-field__required" aria-hidden="true"> *</span>}
        </label>
      )}

      {type === 'select' ? (
        <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id={id} aria-label={label} aria-required={required || undefined} aria-describedby={hintId} className="portal-field__control portal-field__select">
            <SelectValue placeholder={placeholder || 'Select…'} />
          </SelectTrigger>
          <SelectContent className="portal-select-popup">
            {options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="portal-select-option">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === 'textarea' ? (
        <textarea
          ref={textareaRef}
          id={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          wrap="soft"
          disabled={disabled}
          required={required}
          aria-describedby={hintId}
          className={`${inputClass} resize-none`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-describedby={hintId}
          className={inputClass}
        />
      )}

      {hint && (
        <p id={hintId} className="portal-field__hint">{hint}</p>
      )}
    </div>
  );
}
