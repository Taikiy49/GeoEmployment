import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-[11px] font-medium text-[#374151] mb-1.5">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      {type === 'select' ? (
        <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger
            className="h-9 text-sm rounded-lg border-[#e5e7eb] bg-white focus:ring-bronze focus:border-bronze"
          >
            <SelectValue placeholder={placeholder || 'Select...'} />
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
        <Textarea
          id={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="text-sm rounded-lg border-[#e5e7eb] bg-white focus:ring-bronze focus:border-bronze resize-none"
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-9 text-sm rounded-lg border-[#e5e7eb] bg-white focus:ring-bronze focus:border-bronze"
        />
      )}
      {hint && (
        <p className="text-[10px] text-[#9ca3af] mt-1">{hint}</p>
      )}
    </div>
  );
}