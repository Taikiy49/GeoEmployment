import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FormField({
  label,
  hint,
  required,
  type = 'text',
  value,
  onChange,
  placeholder,
  options,
  rows = 3,
  className = '',
  disabled = false,
}) {
  const id = label?.toLowerCase().replace(/\s+/g, '-');

  const inputClass = "w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze transition-all disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-400 ml-0.5 normal-case">*</span>}
        </label>
      )}

      {type === 'select' ? (
        <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="h-11 text-sm rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-bronze/25 focus:border-bronze">
            <SelectValue placeholder={placeholder || 'Select…'} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
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
          className={inputClass}
        />
      )}

      {hint && (
        <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}