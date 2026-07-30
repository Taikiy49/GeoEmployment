import React from 'react';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

const OFFICE_OPTIONS = [
  { value: 'Oahu – 94-429 Koaki Street, Suite 200, Waipahu, HI 96797', label: 'Oʻahu — Waipahu, HI' },
  { value: 'Maui – 780 Alua Street, 1st Floor, Wailuku, HI 96793', label: 'Maui — Wailuku, HI' },
  { value: 'Kauai – 1639 Haleukana Street, Unit #5, Lihue, HI 96766', label: 'Kauaʻi — Līhuʻe, HI' },
  { value: 'Oakland – 344 20th Street, Suite 340, Oakland, CA 94612', label: 'Oakland — Oakland, CA' },
];

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
            placeholder="Select an office…"
            options={OFFICE_OPTIONS}
            required
          />
          <FormField
            label="Referred By"
            value={formData.referredBy}
            onChange={(v) => update('referredBy', v)}
            placeholder="Name of referral, if any"
            hint="Leave blank if not applicable"
          />
          <FormField
            label="Available Start Date"
            type="date"
            value={formData.availableStartDate}
            onChange={(v) => update('availableStartDate', v)}
          />
          <FormField
            label="Driver's License"
            value={formData.driverLicense}
            onChange={(v) => update('driverLicense', v)}
            placeholder="State and license class, if applicable"
            hint="Include only if relevant to the position."
          />
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
