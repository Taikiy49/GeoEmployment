import React, { useMemo } from 'react';
import NavigationButtons from '../app/NavigationButtons';
import { ALCOHOL_DRUG_PROGRAM_TEXT } from '@/lib/legalTexts';

const POLICY_PARAGRAPHS = ALCOHOL_DRUG_PROGRAM_TEXT.split('\n\n');

export default function AlcoholDrugStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const agreed = !!formData.drugTestAgreed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Agreement to Comply with Geolabs, Inc. Alcohol &amp; Drug Testing Program</h2>
          <p className="text-sm text-gray-500 mt-1">To be completed by all applicants for all positions. Please review the statement below and sign to acknowledge your understanding and agreement.</p>
        </div>
        <span className="inline-block text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full whitespace-nowrap self-start">
          Required
        </span>
      </div>

      {/* Full policy text */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-3 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Policy Statement — Please read carefully</p>
        </div>
        <div className="px-3 py-3 space-y-3 max-h-72 overflow-y-auto">
          {POLICY_PARAGRAPHS.map((para, i) => (
            <p key={i} className={`text-xs leading-relaxed ${
              i === 0 ? 'text-sm font-bold text-gray-900' :
              para.startsWith('ANY APPLICANT') ? 'text-red-700 font-semibold bg-red-50 p-4 rounded-lg border border-red-200' :
              'text-gray-700'
            }`}>
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Checkbox acknowledgment */}
      <label className="flex items-start gap-3 cursor-pointer bg-white border border-gray-200 rounded-xl px-3 py-3 hover:border-bronze transition-colors">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => update('drugTestAgreed', e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-bronze flex-shrink-0"
        />
        <span className="text-sm text-gray-700 leading-relaxed">
          I have read, understand, and agree to comply with the Alcohol &amp; Drug Testing Program described above. I agree this constitutes a condition of my employment application and any future employment with Geolabs, Inc.
        </span>
      </label>

      {/* Signature block — disabled until agreed */}
      <div className={`bg-white border rounded-xl p-4 space-y-4 transition-all ${agreed ? 'border-gray-200' : 'border-gray-100 opacity-50 pointer-events-none'}`}>
        <h3 className="text-sm font-semibold text-gray-800">Electronic Signature</h3>
        {!agreed && (
          <p className="text-xs text-gray-400 italic">Please acknowledge the agreement above to enable the signature fields.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Signature of Applicant</label>
            <input type="text" value={formData.drugTestSignature || ''} onChange={e => update('drugTestSignature', e.target.value)}
              placeholder="Type your full legal name" disabled={!agreed}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze italic disabled:bg-gray-50 disabled:text-gray-300" />
            <p className="text-[10px] text-gray-400 mt-1">Typing your name serves as your electronic signature.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date</label>
            <div className="flex gap-2">
              <input type="date" value={formData.drugTestDate || ''} onChange={e => update('drugTestDate', e.target.value)}
                disabled={!agreed}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze disabled:bg-gray-50" />
              <button type="button" onClick={() => update('drugTestDate', today)} disabled={!agreed}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors whitespace-nowrap disabled:opacity-40">Today</button>
            </div>
          </div>
        </div>
      </div>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
