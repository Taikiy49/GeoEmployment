import React, { useId } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import FormSection from '../app/FormSection';
import NavigationButtons from '../app/NavigationButtons';
import DocumentEditor from '../app/DocumentEditor';

const MEDICAL_FIELDS = ['medInitials', 'canPerformDuties'];

export default function MedicalStep({ formData, setFormData, onNext, onBack, onDocumentChange }) {
  const id = useId();

  return (
    <div>
      <FormSection
        title="Medical Information & Authorization"
        description="This section outlines Geolabs, Inc.'s pre-employment and ongoing physical examination and testing policy."
      >
        <div className="space-y-6">
          <DocumentEditor documentKey="application-agreements" fieldKeys={MEDICAL_FIELDS} formData={formData} setFormData={setFormData} onDocumentChange={onDocumentChange} />
          <div className="space-y-3 rounded-lg border border-brand-line bg-brand-soft p-4">
            <h3 className="text-sm font-semibold text-gray-900">Accommodation requests</h3>
            <div className="flex min-h-11 items-start gap-3">
              <Checkbox
                id={`${id}-needs-accommodation`}
                checked={Boolean(formData.needsAccommodation)}
                onCheckedChange={checked => setFormData(previous => ({ ...previous, needsAccommodation: checked === true }))}
                aria-describedby={`${id}-accommodation-hint`}
                className="mt-1"
              />
              <label htmlFor={`${id}-needs-accommodation`} className="cursor-pointer text-sm leading-relaxed text-brand">
                I may require a reasonable accommodation to perform the essential functions of the position for which I am applying.
                <span className="text-brand-muted"> (If selected, HR may contact you to discuss specific accommodations.)</span>
              </label>
            </div>
            <p id={`${id}-accommodation-hint`} className="text-xs text-brand-muted">
              Do not include medical diagnoses or detailed health history here. Specific accommodation needs may be discussed confidentially with HR after a conditional offer is made.
            </p>
          </div>
        </div>
      </FormSection>
      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
