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

  const inputClass = "w-full px-4 py-3 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400] transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-[11px] font-bold text-gray-700 mb-2 uppercase tracking-widest">
          {label}
          {required && <span className="text-[#F5C400] ml-1">*</span>}
        </label>
      )}

      {type === 'select' ? (
        <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="h-11 text-sm rounded-lg border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]">
            <SelectValue placeholder={placeholder || 'Select…'} />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-300 text-gray-900">
            {options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100">
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
        <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}