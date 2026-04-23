import React from 'react';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

export default function VeteranStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      <FormSection
        title="Voluntary Self-Identification of Protected Veteran Status"
        description="This form is used to comply with government regulations. Completion is voluntary and will not subject you to adverse treatment."
      >
        <div className="space-y-5">
          <div className="bg-bronze-softer border border-bronze-soft rounded-lg p-4 space-y-3">
            <p className="text-xs text-[#374151] leading-relaxed">
              If you believe you belong to any of the categories of protected veterans listed below, please indicate by selecting the appropriate option. As a government contractor subject to the Vietnam Era Veterans Readjustment Assistance Act (VEVRAA), we request this information in order to measure the effectiveness of our outreach and recruitment efforts.
            </p>
          </div>

          <FormField
            label="Protected Veteran Status"
            type="select"
            value={formData.veteranStatus}
            onChange={(v) => update('veteranStatus', v)}
            options={[
              { value: 'protected', label: 'I identify as one or more of the classifications of protected veteran' },
              { value: 'not_protected', label: 'I am not a protected veteran' },
              { value: 'decline', label: 'I choose not to self-identify' },
            ]}
          />

          <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-lg p-4">
            <p className="text-[10px] font-semibold text-[#374151] mb-2">Protected Veteran classifications include:</p>
            <ul className="text-[10px] text-[#6b7280] space-y-1.5 list-disc list-inside leading-relaxed">
              <li><strong>Disabled Veteran</strong> — A veteran entitled to disability compensation under laws administered by the VA, or was discharged/released from active duty because of a service-connected disability.</li>
              <li><strong>Recently Separated Veteran</strong> — A veteran discharged or released from active duty within the past three years.</li>
              <li><strong>Active Duty Wartime or Campaign Badge Veteran</strong> — A veteran who served on active duty during a war or in a campaign for which a campaign badge was authorized.</li>
              <li><strong>Armed Forces Service Medal Veteran</strong> — A veteran who, while serving on active duty, participated in a U.S. military operation for which an Armed Forces service medal was awarded.</li>
            </ul>
          </div>
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}