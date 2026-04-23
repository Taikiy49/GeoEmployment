import React, { useMemo, useState } from 'react';
import NavigationButtons from '../app/NavigationButtons';

const VET_OPTIONS = [
  {
    value: 'protected',
    label: 'I identify as one or more classifications of protected veterans',
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

function RadioCard({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition-all ${
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

export default function VeteranStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
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
        <p className="text-xs text-gray-700 leading-relaxed">
          Under the regulations implementing the affirmative action provisions of the Vietnam Era Veterans' Readjustment Assistance Act (VEVRAA) of 1972 issued by the Office of Federal Contract Compliance Programs (OFCCP), federal contractors are required to invite applicants and current employees to inform the contractor whether they are veterans belonging to one or more of the categories of veterans covered under VEVRAA who wish to benefit under the contractor's affirmative action program (AAP) for covered veterans.
        </p>
        <p className="text-xs text-gray-700 leading-relaxed">
          In extending this invitation, we advise you that: (a) workers and applicants are under no obligation to respond but may do so in the future if they choose; (b) responses will remain confidential within the Human Resources department; and (c) responses will be used only for the necessary information to include in our affirmative action plan.
        </p>
        <p className="text-xs text-gray-700 leading-relaxed">
          Refusal to provide this information will have no bearing on your application and will not subject you to any adverse treatment.
        </p>
      </div>

      {/* Status choice */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Veteran Status</h3>
            <p className="text-xs text-gray-400 mt-0.5">Select one option, or choose "I do not wish to self-identify."</p>
          </div>
          <button type="button" onClick={() => update('veteranStatus', '')}
            className="text-[11px] text-gray-400 hover:text-gray-600 underline">Clear</button>
        </div>
        <div className="space-y-2">
          {VET_OPTIONS.map(opt => (
            <RadioCard key={opt.value} selected={formData.veteranStatus === opt.value} onClick={() => update('veteranStatus', opt.value)}>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                {opt.desc && <span className="text-xs text-gray-400 mt-0.5">{opt.desc}</span>}
              </span>
            </RadioCard>
          ))}
        </div>

        {/* Definitions toggle */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDefinitions(v => !v)}
            className="w-full text-left px-4 py-3 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
          >
            Definitions of protected veteran categories
            <span className="text-gray-400">{showDefinitions ? '▲' : '▼'}</span>
          </button>
          {showDefinitions && (
            <div className="px-4 py-3 space-y-3 bg-white">
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
          )}
        </div>
      </div>

      {/* Signature */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Electronic Signature</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Signature of Applicant</label>
            <input type="text" value={formData.vetSignature || ''} onChange={e => update('vetSignature', e.target.value)}
              placeholder="Type your full legal name"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze italic" />
            <p className="text-[10px] text-gray-400 mt-1">By typing your name, you acknowledge this as your electronic signature.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date</label>
            <div className="flex gap-2">
              <input type="date" value={formData.vetDate || ''} onChange={e => update('vetDate', e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze" />
              <button type="button" onClick={() => update('vetDate', today)}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors whitespace-nowrap">Today</button>
            </div>
          </div>
        </div>
      </div>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}