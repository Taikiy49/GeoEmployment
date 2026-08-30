import React, { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';
import {
  AT_WILL_TEXT,
  EMPLOYMENT_CERTIFICATION_TEXT,
  FCRA_AUTHORIZATION_TEXT,
  FCRA_DISCLOSURE_TEXT,
  WORK_ELIGIBILITY_TEXT,
} from '@/lib/legalTexts';

export default function CertificationStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const sig = formData.certificationSignature || '';
  const signatureLooksValid = useMemo(() => {
    const cleaned = sig.trim();
    return cleaned.length >= 3 && cleaned.includes(' ');
  }, [sig]);

  return (
    <div>
      <FormSection
        title="Employment Certification & Disclosures"
        description="Please review each disclosure carefully and provide your initials and signature where requested."
      >
        <div className="space-y-6">

          {/* FCRA Disclosure */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Fair Credit Reporting Act Disclosure</h3>
              <p className="text-xs text-gray-500">Initial below to acknowledge that you have read and understand this disclosure.</p>
            </div>
            <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto">
              <p className="text-xs text-[#334155] leading-relaxed">
                {FCRA_DISCLOSURE_TEXT}
              </p>
              <p className="text-xs text-[#334155] leading-relaxed">
                {FCRA_AUTHORIZATION_TEXT}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Applicant's Initials <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={(formData.fcrInitials || '').toUpperCase()}
                  onChange={e => update('fcrInitials', e.target.value)}
                  placeholder="e.g., TY"
                  maxLength={4}
                  className="w-24 h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze text-center font-semibold tracking-widest"
                />
                <p className="text-xs text-gray-400">Enter 2–4 letters to confirm you have read the above disclosure.</p>
              </div>
            </div>
          </div>

          {/* Other Information */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Other Information</h3>
              <p className="text-xs text-gray-500">Please answer the question below.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Do you know anyone presently working for our company?"
                value={formData.knowEmployee}
                onChange={v => update('knowEmployee', v)}
                placeholder="Yes / No"
                hint='If "Yes", please include their name(s) in the field to the right.'
              />
              <FormField
                label="If yes, who?"
                value={formData.knowEmployeeName}
                onChange={v => update('knowEmployeeName', v)}
                placeholder="Name(s) of current employee(s)"
                hint='Example: "Jane Doe (Project Engineer)"'
              />
            </div>
          </div>

          {/* Work Eligibility */}
          <div className="bg-[#F8F0E9] border border-[#A65F2A]/20 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Work Eligibility</h3>
            <p className="text-xs text-[#334155] leading-relaxed">
              {WORK_ELIGIBILITY_TEXT}
            </p>
          </div>

          {/* Certification & At-Will */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Certification & At-Will Acknowledgment</h3>
              <p className="text-xs text-gray-500">Your signature below confirms each of the statements in this section.</p>
            </div>
            <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-lg p-4 space-y-3">
              <p className="text-xs text-[#334155] leading-relaxed">
                {EMPLOYMENT_CERTIFICATION_TEXT}
              </p>
              <p className="text-xs text-[#334155] leading-relaxed">
                {AT_WILL_TEXT}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="certificationAgreed"
                checked={formData.certificationAgreed}
                onCheckedChange={v => update('certificationAgreed', v)}
                className="mt-0.5"
              />
              <label htmlFor="certificationAgreed" className="text-xs text-[#334155] leading-relaxed cursor-pointer">
                I have read and understand the above statements, and I certify that all information provided in this application is accurate and complete.
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Applicant's Signature <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={sig}
                  onChange={e => update('certificationSignature', e.target.value)}
                  placeholder="Type your full legal name"
                  autoComplete="name"
                  className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A65F2A]/30 focus:border-[#A65F2A]"
                />
                <p className="text-[10px] text-gray-400">
                  By typing your name, you acknowledge this as your electronic signature.
                  {!signatureLooksValid && sig.trim().length > 0 && (
                    <span className="text-amber-500"> (Tip: enter first and last name)</span>
                  )}
                </p>
              </div>
              <FormField
                label="Application Date"
                type="date"
                value={formData.certificationDate}
                onChange={v => update('certificationDate', v)}
                required
                hint="Use today's date unless instructed otherwise."
              />
            </div>
          </div>

        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
