import React, { useId } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import FormSection from '../app/FormSection';
import NavigationButtons from '../app/NavigationButtons';
import { ESSENTIAL_FUNCTIONS_QUESTION, MEDICAL_AUTHORIZATION_TEXT } from '@/lib/legalTexts';

export default function MedicalStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const id = useId();

  return (
    <div>
      <FormSection
        title="Medical Information & Authorization"
        description="This section outlines Geolabs, Inc.'s pre-employment and ongoing physical examination and testing policy."
      >
        <div className="space-y-5">

          {/* Pre-Employment Physical Disclosure */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Pre-Employment & Employment Physicals</h3>
                <p className="text-xs text-gray-500">Please read and initial to acknowledge this policy.</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-bronze/10 text-bronze">Confidential</span>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Hiring Review Only</span>
              </div>
            </div>

            <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-lg p-4 space-y-3">
              <p className="text-xs text-[#334155] leading-relaxed">
                {MEDICAL_AUTHORIZATION_TEXT}
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor={`${id}-initials`} className="text-xs font-medium text-gray-700">Applicant's Initials <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-3">
                <input
                  id={`${id}-initials`}
                  required
                  aria-describedby={`${id}-initials-hint`}
                  type="text"
                  placeholder="e.g., TY"
                  value={formData.medInitials || ''}
                  onChange={e => update('medInitials', e.target.value)}
                  maxLength={4}
                  className="w-24 h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A65F2A]/30 focus:border-[#A65F2A] text-center font-semibold tracking-widest"
                />
                <p id={`${id}-initials-hint`} className="text-xs text-gray-400">Your initials confirm you have read and understood the above policy.</p>
              </div>
            </div>
          </div>

          {/* ADA / Ability to Perform */}
          <div className="bg-[#F8F0E9] border border-[#A65F2A]/20 rounded-xl p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Ability to Perform Essential Job Functions</h3>
              <p className="text-xs text-gray-500">
                {ESSENTIAL_FUNCTIONS_QUESTION}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="canPerformDuties"
                  checked={formData.canPerformDuties}
                  onCheckedChange={v => update('canPerformDuties', v)}
                  className="mt-0.5"
                />
                <label htmlFor="canPerformDuties" className="text-xs text-[#334155] leading-relaxed cursor-pointer">
                  I am able to perform the essential functions of the position for which I am applying, with or without reasonable accommodation.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="needsAccommodation"
                  checked={formData.needsAccommodation}
                  onCheckedChange={v => update('needsAccommodation', v)}
                  className="mt-0.5"
                />
                <label htmlFor="needsAccommodation" className="text-xs text-[#334155] leading-relaxed cursor-pointer">
                  I may require a reasonable accommodation to perform the essential functions of the position for which I am applying. <span className="text-[#64748b]">(If selected, HR may contact you to discuss specific accommodations.)</span>
                </label>
              </div>
            </div>

            <p className="text-[10px] text-gray-400">
              Do not include medical diagnoses or detailed health history here. Specific accommodation needs may be discussed confidentially with HR after a conditional offer is made.
            </p>
          </div>

        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
