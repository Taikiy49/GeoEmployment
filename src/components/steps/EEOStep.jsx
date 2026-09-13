import React, { useId } from 'react';
import NavigationButtons from '../app/NavigationButtons';
import RadioCard from '../app/RadioCard';
import { EEO_INTRO_PARAGRAPHS } from '@/lib/legalTexts';
import { localDateValue } from '@/lib/localDate';

const GENDERS = ['Male', 'Female'];

const ETHNICITIES = [
  {
    value: 'Hispanic or Latino',
    label: 'Hispanic or Latino',
    desc: 'A person of Cuban, Mexican, Puerto Rican, South or Central American, or other Spanish culture or origin, regardless of race.',
  },
  {
    value: 'White (not Hispanic or Latino)',
    label: 'White (not Hispanic or Latino)',
    desc: 'A person having origins in any of the original peoples of Europe, the Middle East, or North Africa.',
  },
  {
    value: 'Black or African American (not Hispanic or Latino)',
    label: 'Black or African American (not Hispanic or Latino)',
    desc: 'A person having origins in any of the Black racial groups of Africa.',
  },
  {
    value: 'Native Hawaiian or Other Pacific Islander (not Hispanic or Latino)',
    label: 'Native Hawaiian or Other Pacific Islander (not Hispanic or Latino)',
    desc: 'A person having origins in any of the peoples of Hawaii, Guam, Samoa, or other Pacific Islands.',
  },
  {
    value: 'Asian (not Hispanic or Latino)',
    label: 'Asian (not Hispanic or Latino)',
    desc: 'A person having origins in any of the original peoples of the Far East, Southeast Asia, or the Indian Subcontinent (for example, Cambodia, China, India, Japan, Korea, Malaysia, Pakistan, the Philippines, Thailand, and Vietnam).',
  },
  {
    value: 'Native American or Alaska Native (not Hispanic or Latino)',
    label: 'Native American or Alaska Native (not Hispanic or Latino)',
    desc: 'A person having origins in any of the original peoples of North and South America (including Central America), and who maintains tribal affiliation or community attachment.',
  },
  {
    value: 'Two or More Races (not Hispanic or Latino)',
    label: 'Two or More Races (not Hispanic or Latino)',
    desc: 'All persons who identify with more than one of the above five races. (For the purpose of this group, identifying as Hispanic or Latino and only one of the listed five race groups does not qualify)',
  },
  {
    value: 'I do not wish to disclose.',
    label: 'I do not wish to disclose.',
    desc: null,
  },
];

export default function EEOStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const id = useId();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">EEO Voluntary Self-Identification Survey</h2>
        <p className="text-sm text-gray-500 mt-1">
          This information is collected for federal EEO-1 reporting purposes only. It is voluntary and will not affect your opportunity for employment.
        </p>
        <span className="inline-block mt-2 text-[11px] font-medium text-bronze bg-bronze/10 border border-bronze/20 px-3 py-1 rounded-full">
          Voluntary &amp; Confidential
        </span>
      </div>

      {/* Legal disclosure */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        {EEO_INTRO_PARAGRAPHS.map(paragraph => (
          <p key={paragraph} className="text-xs text-gray-700 leading-relaxed">{paragraph}</p>
        ))}
      </div>

      {/* Name + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${id}-name`} className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Name <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
          <input
            id={`${id}-name`}
            type="text"
            value={formData.eeoName || ''}
            onChange={e => update('eeoName', e.target.value)}
            placeholder="Optional"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze"
          />
        </div>
        <div>
          <label htmlFor={`${id}-date`} className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
          <div className="flex gap-2">
            <input
              id={`${id}-date`}
              type="date"
              value={formData.eeoDate || ''}
              onChange={e => update('eeoDate', e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze"
            />
            <button type="button" onClick={() => update('eeoDate', localDateValue())}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors whitespace-nowrap">
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Gender */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 id={`${id}-gender-heading`} className="text-sm font-semibold text-gray-800">Gender</h3>
            <p className="text-xs text-gray-400 mt-0.5">Select one option.</p>
          </div>
          <button type="button" aria-label="Clear gender selection" onClick={() => update('eeoGender', '')}
            className="text-[11px] text-gray-400 hover:text-gray-600 underline">Clear</button>
        </div>
        <div role="radiogroup" aria-labelledby={`${id}-gender-heading`} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GENDERS.map(g => (
            <RadioCard key={g} name={`${id}-gender`} value={g} label={g} selected={formData.eeoGender === g} onChange={() => update('eeoGender', g)} />
          ))}
        </div>
        <p className="text-[10px] text-gray-400">This section is voluntary. If you do not wish to answer, you may leave it blank.</p>
      </div>

      {/* Race / Ethnicity */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 id={`${id}-race-heading`} className="text-sm font-semibold text-gray-800">Race / Ethnicity</h3>
            <p className="text-xs text-gray-400 mt-0.5">Select one category that best describes you.</p>
          </div>
          <button type="button" aria-label="Clear race or ethnicity selection" onClick={() => update('eeoRace', '')}
            className="text-[11px] text-gray-400 hover:text-gray-600 underline">Clear</button>
        </div>
        <div role="radiogroup" aria-labelledby={`${id}-race-heading`} className="space-y-2">
          {ETHNICITIES.map(e => (
            <RadioCard key={e.value} name={`${id}-race`} value={e.value} label={e.label} description={e.desc} selected={formData.eeoRace === e.value} onChange={() => update('eeoRace', e.value)} />
          ))}
        </div>
        <p className="text-[10px] text-gray-400">This section is voluntary. If you do not wish to answer, you may leave it blank.</p>
      </div>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
