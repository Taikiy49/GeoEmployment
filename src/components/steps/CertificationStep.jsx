import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

export default function CertificationStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      <FormSection
        title="Employment Certification"
        description="Please read the following carefully and provide your electronic signature."
      >
        <div className="space-y-5">
          <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
            <p className="text-xs text-[#374151] leading-relaxed">
              I certify that the information provided in this application is true and complete to the best of my knowledge. I understand that any false or misleading information may result in disqualification from consideration for employment, or if hired, may result in immediate termination.
            </p>
            <p className="text-xs text-[#374151] leading-relaxed">
              I authorize Geolabs, Inc. to verify all information provided in this application, including education, employment history, and references. I release Geolabs, Inc. and all parties providing information from any liability arising from providing or receiving such information.
            </p>
            <p className="text-xs text-[#374151] leading-relaxed">
              I understand that if employed, my employment is at-will, meaning either Geolabs, Inc. or I may terminate the employment relationship at any time, with or without cause or notice. I acknowledge that no representative of Geolabs, Inc., other than the President, has the authority to enter into any agreement for employment other than at-will.
            </p>
            <p className="text-xs text-[#374151] leading-relaxed">
              I understand that Geolabs, Inc. may conduct a background check, including criminal history, credit check, and verification of credentials, as part of the hiring process. I consent to such investigations and release Geolabs, Inc. from any liability in connection with these investigations.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="certificationAgreed"
              checked={formData.certificationAgreed}
              onCheckedChange={(v) => update('certificationAgreed', v)}
              className="mt-0.5"
            />
            <label htmlFor="certificationAgreed" className="text-xs text-[#374151] leading-relaxed cursor-pointer">
              I have read and understand the above statements, and I certify that all information provided in this application is accurate and complete.
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <FormField
              label="Electronic Signature (Type Full Name)"
              value={formData.certificationSignature}
              onChange={(v) => update('certificationSignature', v)}
              placeholder="Type your full legal name"
              required
            />
            <FormField
              label="Date"
              type="date"
              value={formData.certificationDate}
              onChange={(v) => update('certificationDate', v)}
              required
            />
          </div>
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}