import React, { useMemo } from 'react';
import NavigationButtons from '../app/NavigationButtons';

const DISABILITY_OPTIONS = [
  { value: 'Yes, I have a disability, or have had one in the past', label: 'Yes, I have a disability, or have had one in the past' },
  { value: 'No, I do not have a disability and have not had one in the past', label: 'No, I do not have a disability and have not had one in the past' },
  { value: 'I do not want to answer', label: 'I do not want to answer' },
];

const DISABILITY_EXAMPLES = [
  'Alcohol or other substance use disorder (not currently using drugs illegally)',
  'Autoimmune disorder, for example, lupus, fibromyalgia, rheumatoid arthritis, HIV/AIDS',
  'Blind or low vision',
  'Cancer (past or present)',
  'Cardiovascular or heart disease',
  'Celiac disease',
  'Cerebral palsy',
  'Deaf or serious difficulty hearing',
  'Diabetes',
  'Disfigurement, for example, disfigurement caused by burns, wounds, accidents, or congenital disorders',
  'Epilepsy or other seizure disorder',
  'Gastrointestinal disorders, for example, Crohn\'s disease, irritable bowel syndrome',
  'Intellectual or developmental disability',
  'Mental health conditions, for example, depression, bipolar disorder, anxiety disorder, schizophrenia, PTSD',
  'Missing limbs or partially missing limbs',
  'Mobility impairment, benefiting from the use of a wheelchair, scooter, walker, leg brace(s) and/or other supports',
  'Nervous system condition, for example, migraine headaches, Parkinson\'s disease, multiple sclerosis (MS)',
  'Neurodivergence, for example, attention-deficit/hyperactivity disorder (ADHD), autism spectrum disorder, dyslexia, dyspraxia, other learning disabilities',
  'Partial or complete paralysis (any cause)',
  'Pulmonary or respiratory conditions, for example, tuberculosis, asthma, emphysema',
  'Short stature (dwarfism)',
  'Traumatic brain injury',
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

export default function DisabilityStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Voluntary Self-Identification of Disability</h2>
          <p className="text-sm text-gray-500 mt-1">Form CC-305 · OMB Control Number 1250-0005 · Expires 04/30/2026</p>
        </div>
        <span className="inline-block text-[11px] font-medium text-bronze bg-bronze/10 border border-bronze/20 px-3 py-1 rounded-full whitespace-nowrap self-start">
          Voluntary &amp; Confidential
        </span>
      </div>

      {/* Name / Date / Employee ID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Name <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
          <input type="text" value={formData.disabilityName || ''} onChange={e => update('disabilityName', e.target.value)}
            placeholder="Optional"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
          <div className="flex gap-2">
            <input type="date" value={formData.disabilityDate || ''} onChange={e => update('disabilityDate', e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze" />
            <button type="button" onClick={() => update('disabilityDate', today)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors whitespace-nowrap">Today</button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Employee ID <span className="text-gray-400 normal-case font-normal">(if applicable)</span></label>
          <input type="text" value={formData.disabilityEmployeeId || ''} onChange={e => update('disabilityEmployeeId', e.target.value)}
            placeholder="Optional"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze" />
        </div>
      </div>

      {/* Why asked */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-semibold text-gray-800">Why are you being asked to complete this form?</h3>
        <p className="text-xs text-gray-700 leading-relaxed">
          We are a federal contractor or subcontractor. The law requires us to provide equal employment opportunity to qualified people with disabilities. We have a goal of having at least 7% of our workers as people with disabilities. The law says we must measure our progress towards this goal. To do this, we must ask applicants and employees if they have a disability or have ever had one. People can become disabled, so we need to ask this question at least every five years.
        </p>
        <p className="text-xs text-gray-700 leading-relaxed">
          Completing this form is voluntary, and we hope that you will choose to do so. Your answer is confidential. No one who makes hiring decisions will see it. Your decision to complete the form and your answer will not harm you in any way. If you want to learn more about the law or this form, visit the U.S. Department of Labor's Office of Federal Contract Compliance Programs (OFCCP) website at www.dol.gov/ofccp.
        </p>
      </div>

      {/* Disability list */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">How do you know if you have a disability?</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          A disability is a condition that substantially limits one or more of your "major life activities." If you have or have ever had such a condition, you are a person with a disability. Disabilities include, but are not limited to:
        </p>
        <div className="bg-gray-50 rounded-lg border border-gray-100 p-3">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            {DISABILITY_EXAMPLES.map((ex, i) => (
              <li key={i} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                {ex}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Status choice */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Voluntary Response</h3>
            <p className="text-xs text-gray-400 mt-0.5">Please select one option below. Your response is voluntary.</p>
          </div>
          <button type="button" onClick={() => update('disabilityStatus', '')}
            className="text-[11px] text-gray-400 hover:text-gray-600 underline">Clear</button>
        </div>
        <div className="space-y-2">
          {DISABILITY_OPTIONS.map(opt => (
            <RadioCard key={opt.value} selected={formData.disabilityStatus === opt.value} onClick={() => update('disabilityStatus', opt.value)}>
              <span className="text-sm text-gray-800">{opt.label}</span>
            </RadioCard>
          ))}
        </div>
      </div>

      {/* Public burden */}
      <p className="text-[10px] text-gray-400 leading-relaxed">
        PUBLIC BURDEN STATEMENT: According to the Paperwork Reduction Act of 1995, no persons are required to respond to a collection of information unless such collection displays a valid OMB control number. This survey should take about 5 minutes to complete.
      </p>

      {/* Signature */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Electronic Signature</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Signature of Applicant</label>
            <input type="text" value={formData.disabilitySignature || ''} onChange={e => update('disabilitySignature', e.target.value)}
              placeholder="Type your full legal name"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze italic" />
            <p className="text-[10px] text-gray-400 mt-1">By typing your name, you acknowledge this as your electronic signature.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date</label>
            <div className="flex gap-2">
              <input type="date" value={formData.disabilitySignatureDate || ''} onChange={e => update('disabilitySignatureDate', e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bronze/25 focus:border-bronze" />
              <button type="button" onClick={() => update('disabilitySignatureDate', today)}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors whitespace-nowrap">Today</button>
            </div>
          </div>
        </div>
      </div>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}