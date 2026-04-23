import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import FormSection from '../app/FormSection';
import NavigationButtons from '../app/NavigationButtons';

export default function MedicalStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      <FormSection
        title="Medical Acknowledgment"
        description="This section asks about your ability to perform the essential functions of the position for which you are applying."
      >
        <div className="space-y-5">
          <div className="bg-bronze-softer border border-bronze-soft rounded-lg p-4">
            <p className="text-xs text-[#374151] leading-relaxed">
              Geolabs, Inc. is committed to complying with all applicable provisions of the Americans with Disabilities Act (ADA). We will not discriminate against any qualified applicant with a disability. We will make reasonable accommodations for known physical or mental limitations of qualified individuals with disabilities, unless such accommodation would impose an undue hardship.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="canPerformDuties"
                checked={formData.canPerformDuties}
                onCheckedChange={(v) => update('canPerformDuties', v)}
                className="mt-0.5"
              />
              <label htmlFor="canPerformDuties" className="text-xs text-[#374151] leading-relaxed cursor-pointer">
                I certify that I am able to perform the essential functions of the position for which I am applying, with or without reasonable accommodation.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="needsAccommodation"
                checked={formData.needsAccommodation}
                onCheckedChange={(v) => update('needsAccommodation', v)}
                className="mt-0.5"
              />
              <label htmlFor="needsAccommodation" className="text-xs text-[#374151] leading-relaxed cursor-pointer">
                I may require reasonable accommodation to perform the essential functions of the position for which I am applying. <span className="text-[#6b7280]">(If checked, you may be contacted to discuss accommodations.)</span>
              </label>
            </div>
          </div>
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}