import React from 'react';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
].map(s => ({ value: s, label: s }));

export default function GeneralInfoStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      <FormSection
        title="General Information"
        description="Your personal contact details."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="First Name" value={formData.firstName} onChange={(v) => update('firstName', v)} required />
          <FormField label="Middle Name" value={formData.middleName} onChange={(v) => update('middleName', v)} />
          <FormField label="Last Name" value={formData.lastName} onChange={(v) => update('lastName', v)} required />
          <FormField label="Street Address" value={formData.address} onChange={(v) => update('address', v)} className="sm:col-span-2 lg:col-span-3" required />
          <FormField label="City" value={formData.city} onChange={(v) => update('city', v)} required />
          <FormField label="State" type="select" value={formData.state} onChange={(v) => update('state', v)} options={US_STATES} required />
          <FormField label="ZIP Code" value={formData.zip} onChange={(v) => update('zip', v)} required />
          <FormField label="Email Address" type="email" value={formData.email} onChange={(v) => update('email', v)} required />
          <FormField label="Home Phone" type="tel" value={formData.phone} onChange={(v) => update('phone', v)} />
          <FormField label="Cell Phone" type="tel" value={formData.cell} onChange={(v) => update('cell', v)} />
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}