import React from 'react';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

export default function DisabilityStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      <FormSection
        title="Voluntary Self-Identification of Disability"
        description="This form is used to comply with government regulations. Completion is voluntary and will not subject you to adverse treatment."
      >
        <div className="space-y-5">
          <div className="bg-bronze-softer border border-bronze-soft rounded-lg p-4 space-y-3">
            <p className="text-[11px] font-semibold text-[#111827]">
              Form CC-305 · OMB Control Number 1250-0005
            </p>
            <p className="text-xs text-[#374151] leading-relaxed">
              Because we do business with the government, we must reach out to, hire, and provide equal opportunity to qualified people with disabilities. To help us measure how well we are doing, we are asking you to tell us if you have a disability or if you ever had a disability.
            </p>
            <p className="text-xs text-[#374151] leading-relaxed">
              Completing this form is voluntary, and we hope that you will choose to do so. Your answer will be maintained confidentially and will not be seen by selecting officials or anyone involved in the hiring decision. Your decision to complete this form, and your answer, will not harm you in any way.
            </p>
          </div>

          <FormField
            label="Disability Status"
            type="select"
            value={formData.disabilityStatus}
            onChange={(v) => update('disabilityStatus', v)}
            options={[
              { value: 'yes', label: 'Yes, I have a disability (or previously had a disability)' },
              { value: 'no', label: 'No, I do not have a disability' },
              { value: 'decline', label: 'I do not wish to answer' },
            ]}
          />

          <p className="text-[10px] text-[#9ca3af] leading-relaxed">
            Disabilities include, but are not limited to: blindness, deafness, cancer, diabetes, epilepsy, autism, cerebral palsy, HIV/AIDS, schizophrenia, muscular dystrophy, bipolar disorder, major depression, multiple sclerosis (MS), missing limbs, post-traumatic stress disorder (PTSD), obsessive compulsive disorder, impairments requiring use of a wheelchair, and intellectual disability.
          </p>
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}