import React from 'react';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

export default function ApplicationInfoStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      <FormSection
        title="Application Information"
        description="Please provide details about the position you are applying for."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Date of Application"
            type="date"
            value={formData.applicationDate}
            onChange={(v) => update('applicationDate', v)}
            required
          />
          <FormField
            label="Position Applied For"
            value={formData.positionAppliedFor}
            onChange={(v) => update('positionAppliedFor', v)}
            placeholder="e.g., Environmental Scientist"
            required
          />
          <FormField
            label="Preferred Office Location"
            type="select"
            value={formData.preferredLocation}
            onChange={(v) => update('preferredLocation', v)}
            options={[
              { value: 'waipahu', label: 'Waipahu, HI' },
              { value: 'honolulu', label: 'Honolulu, HI' },
              { value: 'hilo', label: 'Hilo, HI' },
              { value: 'remote', label: 'Remote' },
              { value: 'other', label: 'Other' },
            ]}
            placeholder="Select location"
          />
          <FormField
            label="Referred By"
            value={formData.referredBy}
            onChange={(v) => update('referredBy', v)}
            placeholder="Name of referral, if any"
            hint="Leave blank if not applicable"
          />
          <FormField
            label="Desired Salary / Hourly Rate"
            value={formData.desiredSalary}
            onChange={(v) => update('desiredSalary', v)}
            placeholder="e.g., $65,000/year or $35/hour"
          />
          <FormField
            label="Available Start Date"
            type="date"
            value={formData.availableStartDate}
            onChange={(v) => update('availableStartDate', v)}
          />
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}