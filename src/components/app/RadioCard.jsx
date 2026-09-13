import React, { useId } from 'react';

/** A native radio keeps standard screen-reader and arrow-key behavior. */
export default function RadioCard({ name, value, label, description = null, selected, onChange }) {
  const id = useId();
  return (
    <label className={`w-full text-left flex cursor-pointer items-start gap-3 px-3 py-3 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-[#A65F2A] focus-within:ring-offset-2 ${
      selected ? 'border-[#A65F2A] bg-[#A65F2A]/5 ring-1 ring-[#A65F2A]' : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onChange}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-description` : undefined}
        className="sr-only"
      />
      <span aria-hidden="true" className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'border-[#A65F2A]' : 'border-gray-300'}`}>
        {selected && <span className="w-2 h-2 rounded-full bg-[#A65F2A] block" />}
      </span>
      <span className="flex flex-col">
        <span id={`${id}-label`} className="text-sm font-medium text-gray-800">{label}</span>
        {description && <span id={`${id}-description`} className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</span>}
      </span>
    </label>
  );
}
