import React from 'react';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

export default function EEOStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      <FormSection
        title="Equal Employment Opportunity Self-Identification"
        description="Completion of this form is voluntary. The information will be kept confidential and used only for EEO reporting purposes. It will not affect your application."
      >
        <div className="space-y-5">
          <div className="bg-bronze-softer border border-bronze-soft rounded-lg p-4">
            <p className="text-xs text-[#374151] leading-relaxed">
              Geolabs, Inc. is an Equal Opportunity Employer. We are required to report statistical data about applicants for federal compliance purposes. This information is voluntary and will not affect your consideration for employment. This data is kept separate from your application.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Gender"
              type="select"
              value={formData.eeoGender}
              onChange={(v) => update('eeoGender', v)}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'decline', label: 'I choose not to self-identify' },
              ]}
            />
            <FormField
              label="Race / Ethnicity"
              type="select"
              value={formData.eeoRace}
              onChange={(v) => update('eeoRace', v)}
              options={[
                { value: 'american_indian', label: 'American Indian or Alaska Native' },
                { value: 'asian', label: 'Asian' },
                { value: 'black', label: 'Black or African American' },
                { value: 'hispanic', label: 'Hispanic or Latino' },
                { value: 'native_hawaiian', label: 'Native Hawaiian or Other Pacific Islander' },
                { value: 'white', label: 'White' },
                { value: 'two_or_more', label: 'Two or More Races' },
                { value: 'decline', label: 'I choose not to self-identify' },
              ]}
            />
          </div>
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}