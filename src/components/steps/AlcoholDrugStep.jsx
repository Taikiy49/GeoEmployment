import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

export default function AlcoholDrugStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      <FormSection
        title="Alcohol & Drug Testing Program Acknowledgment"
        description="Please read the following policy and provide your electronic signature to acknowledge."
      >
        <div className="space-y-5">
          <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
            <p className="text-xs text-[#374151] leading-relaxed">
              Geolabs, Inc. maintains a Drug-Free Workplace policy. As a condition of employment, all employees and applicants are subject to drug and alcohol testing in accordance with applicable federal and state laws.
            </p>
            <p className="text-xs text-[#374151] leading-relaxed">
              Testing may occur as part of the pre-employment process, following a workplace accident, based on reasonable suspicion, or on a random basis. Refusal to submit to testing, or testing positive for prohibited substances, may result in disqualification from employment or immediate termination.
            </p>
            <p className="text-xs text-[#374151] leading-relaxed">
              By signing below, I acknowledge that I have read and understand Geolabs, Inc.'s Alcohol and Drug Testing Program, and I agree to comply with all policies and procedures related to drug and alcohol testing as a condition of my employment.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="drugTestAgreed"
              checked={formData.drugTestAgreed}
              onCheckedChange={(v) => update('drugTestAgreed', v)}
              className="mt-0.5"
            />
            <label htmlFor="drugTestAgreed" className="text-xs text-[#374151] leading-relaxed cursor-pointer">
              I have read and understand the Alcohol and Drug Testing Program policy, and I agree to comply with all related requirements as a condition of my employment with Geolabs, Inc.
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <FormField
              label="Electronic Signature (Type Full Name)"
              value={formData.drugTestSignature}
              onChange={(v) => update('drugTestSignature', v)}
              placeholder="Type your full legal name"
              required
            />
            <FormField
              label="Date"
              type="date"
              value={formData.drugTestDate}
              onChange={(v) => update('drugTestDate', v)}
              required
            />
          </div>
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}