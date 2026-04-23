import React from 'react';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

export default function AffiliationsStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      <FormSection
        title="Professional Affiliations"
        description="List any professional organizations, memberships, licenses, or affiliations relevant to the position."
      >
        <div className="space-y-4">
          <FormField
            label="Professional Organizations & Memberships"
            type="textarea"
            value={formData.professionalOrgs}
            onChange={(v) => update('professionalOrgs', v)}
            rows={4}
            placeholder="e.g., American Society of Civil Engineers (ASCE), National Ground Water Association..."
            hint="Include any active memberships or past affiliations"
          />
          <FormField
            label="Professional Licenses"
            type="textarea"
            value={formData.professionalLicenses}
            onChange={(v) => update('professionalLicenses', v)}
            rows={3}
            placeholder="e.g., Professional Engineer (PE) - Hawaii #12345, Valid through 12/2025"
            hint="Include license numbers and expiration dates if applicable"
          />
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}