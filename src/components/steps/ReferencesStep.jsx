import React, { useId } from 'react';
import { Users } from 'lucide-react';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';
import { REFERENCE_AUTHORIZATION_TEXT } from '@/lib/legalTexts';

export default function ReferencesStep({ formData, setFormData, onNext, onBack }) {
  const id = useId();
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
            <div key={i} role="group" aria-labelledby={`${id}-reference-${i}`} className="bg-[#f8fafc] rounded-lg border border-[#e2e8f0] p-4 sm:p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-bronze" />
                <h4 id={`${id}-reference-${i}`} className="text-xs font-semibold text-[#0f172a]">Reference {i + 1} of 3</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  label="Full Name"
                  value={ref.name}
                  onChange={(v) => updateRef(i, 'name', v)}
                  placeholder="First and last name"
                />
                <FormField
                  label="Title"
                  value={ref.title || ''}
                  onChange={(v) => updateRef(i, 'title', v)}
                  placeholder="e.g., Project Manager"
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
        <div className="mt-5 rounded-xl border border-[#A65F2A]/20 bg-[#F8F0E9] p-4">
          <p className="text-xs leading-relaxed text-slate-700">
            {REFERENCE_AUTHORIZATION_TEXT}
          </p>
          <div className="mt-3 max-w-[12rem]">
            <FormField
              label="Applicant's Initials"
              value={formData.certifyInitials}
              onChange={(v) => setFormData(prev => ({ ...prev, certifyInitials: v.toUpperCase().slice(0, 4) }))}
              placeholder="e.g., TY"
              required
            />
          </div>
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
