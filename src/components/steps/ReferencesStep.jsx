import React from 'react';
import { Users } from 'lucide-react';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

export default function ReferencesStep({ formData, setFormData, onNext, onBack }) {
  const updateRef = (index, field, value) => {
    setFormData(prev => {
      const refs = [...prev.references];
      refs[index] = { ...refs[index], [field]: value };
      return { ...prev, references: refs };
    });
  };

  return (
    <div>
      <FormSection
        title="Professional References"
        description="Please provide three professional references who can speak to your qualifications."
      >
        <div className="space-y-5">
          {formData.references.map((ref, i) => (
            <div key={i} className="bg-[#fafafa] rounded-lg border border-[#e5e7eb] p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-bronze" />
                <h4 className="text-xs font-semibold text-[#111827]">Reference {i + 1} of 3</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField
                  label="Full Name"
                  value={ref.name}
                  onChange={(v) => updateRef(i, 'name', v)}
                  placeholder="First and last name"
                />
                <FormField
                  label="Company / Organization"
                  value={ref.company}
                  onChange={(v) => updateRef(i, 'company', v)}
                  placeholder="Company name"
                />
                <FormField
                  label="Phone Number"
                  type="tel"
                  value={ref.phone}
                  onChange={(v) => updateRef(i, 'phone', v)}
                  placeholder="(000) 000-0000"
                />
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}