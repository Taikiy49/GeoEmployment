import React, { useId, useState } from 'react';
import NavigationButtons from '../app/NavigationButtons';
import RadioCard from '../app/RadioCard';
import { VETERAN_INTRO_PARAGRAPHS } from '@/lib/legalTexts';
import { localDateValue } from '@/lib/localDate';

const VET_OPTIONS = [
  {
    value: 'protected',
    label: 'I identify as one or more of the following classifications of protected veterans',
    desc: 'Includes Disabled Veteran, Recently Separated Veteran, Active-Duty Wartime/Campaign Badge Veteran, or Armed Forces Service Medal Veteran.',
  },
  {
    value: 'notProtected',
    label: 'I am not a protected veteran',
    desc: null,
  },
  {
    value: 'noAnswer',
    label: 'I do not wish to self-identify',
    desc: null,
  },
];

export default function VeteranStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const id = useId();
  const [showDefinitions, setShowDefinitions] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Affirmative Action: Invitation to Self-Identify as a Protected Veteran (VEVRAA)</h2>
          <p className="text-sm text-gray-500 mt-1">This information is collected for affirmative action reporting only. Your decision to self-identify is voluntary and will not affect your application or employment.</p>
        </div>
        <span className="inline-block text-[11px] font-medium text-bronze bg-bronze/10 border border-bronze/20 px-3 py-1 rounded-full whitespace-nowrap self-start">
          Voluntary self-identification
        </span>
      </div>

      {/* Legal intro */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        {VETERAN_INTRO_PARAGRAPHS.map(paragraph => (
          <p key={paragraph} className="text-xs text-gray-700 leading-relaxed">{paragraph}</p>
        ))}
      </div>

      {/* Status choice */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 id={`${id}-status-heading`} className="text-sm font-semibold text-gray-800">Veteran Status</h3>
            <p className="text-xs text-gray-400 mt-0.5">Select one option.</p>
          </div>
          <button type="button" aria-label="Clear veteran status selection" onClick={() => update('veteranStatus', '')}
            className="text-[11px] text-gray-400 hover:text-gray-600 underline">Clear</button>
        </div>
        <div role="radiogroup" aria-labelledby={`${id}-status-heading`} className="space-y-2">
          {VET_OPTIONS.map(opt => (
            <RadioCard key={opt.value} name={`${id}-status`} value={opt.value} label={opt.label} description={opt.desc} selected={formData.veteranStatus === opt.value} onChange={() => update('veteranStatus', opt.value)} />
          ))}
        </div>

        {/* Definitions toggle */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <button
            type="button"
            aria-expanded={showDefinitions}
            aria-controls={`${id}-definitions`}
            onClick={() => setShowDefinitions(v => !v)}
            className="w-full text-left px-3 py-3 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
          >
            Definitions of protected veteran categories
            <span aria-hidden="true" className="text-gray-400">{showDefinitions ? '▲' : '▼'}</span>
          </button>
            <div id={`${id}-definitions`} hidden={!showDefinitions} className="px-3 py-3 space-y-3 bg-white">
              {[
                { title: 'Disabled Veteran', text: 'A veteran of the U.S. military, ground, naval or air service who is entitled to compensation (or who but for the receipt of military retired pay would be entitled to compensation) under laws administered by the Secretary of Veterans Affairs, or a person who was discharged or released from active duty because of a service-connected disability.' },
                { title: 'Recently Separated Veteran', text: 'Any veteran during the three-year period beginning on the date of such veteran\'s discharge or release from active duty in the U.S. military, ground, naval or air service.' },
                { title: 'Active-Duty Wartime or Campaign Badge Veteran', text: 'A veteran who served on active duty in the U.S. military, ground, naval or air service during a war, or in a campaign or expedition for which a campaign badge has been authorized under the laws administered by the Department of Defense.' },
                { title: 'Armed Forces Service Medal Veteran', text: 'A veteran who, while serving on active duty in the U.S. military, ground, naval or air service, participated in a United States military operation for which an Armed Forces service medal was awarded pursuant to Executive Order No. 12985.' },
              ].map((d, i) => (
                <div key={i}>
                  <p className="text-xs font-semibold text-gray-700">{d.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{d.text}</p>
                </div>
              ))}
            </div>
        </div>
      </div>

      {/* Signature */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Electronic Signature</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${id}-signature`} className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Print Name / Signature</label>
            <input id={`${id}-signature`} aria-describedby={`${id}-signature-hint`} type="text" value={formData.vetSignature || ''} onChange={e => update('vetSignature', e.target.value)}
              placeholder="Type your full legal name"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze italic" />
            <p id={`${id}-signature-hint`} className="text-[10px] text-gray-400 mt-1">By typing your name, you acknowledge this as your electronic signature.</p>
          </div>
          <div>
            <label htmlFor={`${id}-date`} className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date</label>
            <div className="flex gap-2">
              <input id={`${id}-date`} type="date" value={formData.vetDate || ''} onChange={e => update('vetDate', e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze" />
              <button type="button" onClick={() => update('vetDate', localDateValue())}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors whitespace-nowrap">Today</button>
            </div>
          </div>
        </div>
      </div>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
