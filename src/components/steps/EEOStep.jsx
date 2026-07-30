import React, { useMemo } from 'react';
import NavigationButtons from '../app/NavigationButtons';

const GENDERS = ['Male', 'Female', 'I do not wish to disclose.'];

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
    desc: 'All persons who identify with more than one of the above five races.',
  },
  {
    value: 'I do not wish to disclose.',
    label: 'I do not wish to disclose.',
    desc: null,
  },
];

function RadioCard({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl border transition-all ${
        selected
          ? 'border-bronze bg-bronze/5 ring-1 ring-bronze'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
        selected ? 'border-bronze' : 'border-gray-300'
      }`}>
        {selected && <span className="w-2 h-2 rounded-full bg-bronze block" />}
      </span>
      {children}
    </button>
  );
}

export default function EEOStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

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
        <p className="text-xs text-gray-700 leading-relaxed">
          The Equal Employment Opportunity Commission (EEOC) requires certain employers to complete an EEO-1 report each year. Covered employers must invite employees and applicants to self-identify gender and race for this report.
        </p>
        <p className="text-xs text-gray-700 leading-relaxed">
          Completion of this form is voluntary and your decision to provide or withhold this information will not affect your opportunity for employment, or the terms or conditions of your employment. This form will be used for EEO-1 reporting purposes only and will be kept separate from all other personnel records and accessed only by Human Resources.
        </p>
        <p className="text-xs text-gray-700 leading-relaxed">
          If you choose not to self-identify at this time, the federal government allows Geolabs, Inc. to determine this information by visual survey and/or other available information.
        </p>
      </div>

      {/* Name + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Name <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
          <input
            type="text"
            value={formData.eeoName || ''}
            onChange={e => update('eeoName', e.target.value)}
            placeholder="Optional"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
          <div className="flex gap-2">
            <input
              type="date"
              value={formData.eeoDate || ''}
              onChange={e => update('eeoDate', e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze"
            />
            <button type="button" onClick={() => update('eeoDate', today)}
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
            <h3 className="text-sm font-semibold text-gray-800">Gender</h3>
            <p className="text-xs text-gray-400 mt-0.5">Select one option, or choose "I do not wish to disclose."</p>
          </div>
          <button type="button" onClick={() => update('eeoGender', '')}
            className="text-[11px] text-gray-400 hover:text-gray-600 underline">Clear</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {GENDERS.map(g => (
            <RadioCard key={g} selected={formData.eeoGender === g} onClick={() => update('eeoGender', g)}>
              <span className="text-sm text-gray-800">{g}</span>
            </RadioCard>
          ))}
        </div>
        <p className="text-[10px] text-gray-400">This section is voluntary. If you do not wish to answer, you may leave it blank.</p>
      </div>

      {/* Race / Ethnicity */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Race / Ethnicity</h3>
            <p className="text-xs text-gray-400 mt-0.5">Select one category that best describes you.</p>
          </div>
          <button type="button" onClick={() => update('eeoRace', '')}
            className="text-[11px] text-gray-400 hover:text-gray-600 underline">Clear</button>
        </div>
        <div className="space-y-2">
          {ETHNICITIES.map(e => (
            <RadioCard key={e.value} selected={formData.eeoRace === e.value} onClick={() => update('eeoRace', e.value)}>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">{e.label}</span>
                {e.desc && <span className="text-xs text-gray-400 mt-0.5 leading-relaxed">{e.desc}</span>}
              </span>
            </RadioCard>
          ))}
        </div>
        <p className="text-[10px] text-gray-400">This section is voluntary. If you do not wish to answer, you may leave it blank.</p>
      </div>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}