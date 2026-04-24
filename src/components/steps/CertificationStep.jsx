import React, { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

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
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Fair Credit Reporting Act Disclosure</h3>
              <p className="text-xs text-gray-500">Initial below to acknowledge that you have read and understand this disclosure.</p>
            </div>
            <div className="bg-[#fafafa] border border-[#f3f4f6] rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto">
              <p className="text-xs text-[#374151] leading-relaxed">
                By this document, the Company discloses to you that a consumer report, including an investigative consumer report containing information as to your character, general reputation, personal characteristics, and mode of living, may be obtained for employment purposes as part of the pre-employment background investigation and at any time during your employment. Should an investigative consumer report be requested, you will have the right to request a complete and accurate disclosure of the nature and scope of the investigation requested and a written summary of your rights under the Fair Credit Reporting Act.
              </p>
              <p className="text-xs text-[#374151] leading-relaxed">
                I agree that Geolabs, Inc. is hereby authorized to inquire into my background, prior employment, and criminal records and may consider any criminal conviction record after a conditional offer of employment is made. The Company may withdraw a conditional employment offer if a criminal conviction record bears a rational relationship to the duties and responsibilities of the position applied for. Criminal conviction records more than five (5) years old for misdemeanors and seven (7) years for felonies (excluding periods of incarceration) will not be considered.
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
                  className="w-24 h-9 px-3 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze text-center font-semibold tracking-widest"
                />
                <p className="text-xs text-gray-400">Enter 2–4 letters to confirm you have read the above disclosure.</p>
              </div>
            </div>
          </div>

          {/* Other Information */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Other Information</h3>
              <p className="text-xs text-gray-500">If you know anyone currently employed by Geolabs, please let us know. This is used for internal routing and conflict-of-interest review only.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Do you know anyone presently working at Geolabs?"
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
          <div className="bg-bronze-softer border border-bronze-soft rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Work Eligibility</h3>
            <p className="text-xs text-[#374151] leading-relaxed">
              It is the policy of Geolabs, Inc. to hire only U.S. citizens and aliens who are authorized to work in this country. As a condition of employment, you will be required to produce original documents establishing your identity and authorization to work, and to complete the U.S. Citizenship and Immigration Services' Form I-9.
            </p>
          </div>

          {/* Certification & At-Will */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Certification & At-Will Acknowledgment</h3>
              <p className="text-xs text-gray-500">Your signature below confirms each of the statements in this section.</p>
            </div>
            <div className="bg-[#fafafa] border border-[#f3f4f6] rounded-lg p-4 space-y-3">
              <p className="text-xs text-[#374151] leading-relaxed">
                I certify that all information provided on this application is complete and accurate. I understand that my application will not be considered if it is incomplete. Furthermore, I understand that false, misleading, or incomplete information could lead to a decision not to hire, or may be grounds for termination if already employed. I hereby authorize any investigation of the above or related work experience, education, or reputation information for the purposes of evaluating my application for employment.
              </p>
              <p className="text-xs text-[#374151] leading-relaxed">
                This application is not a contract and cannot create a contract. I understand that if I am employed, my employment is "at will" and may be terminated at any time by either the Company or myself, with or without cause or notice.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="certificationAgreed"
                checked={formData.certificationAgreed}
                onCheckedChange={v => update('certificationAgreed', v)}
                className="mt-0.5"
              />
              <label htmlFor="certificationAgreed" className="text-xs text-[#374151] leading-relaxed cursor-pointer">
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
                  className="w-full h-9 px-3 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze"
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