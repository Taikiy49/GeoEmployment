import React from 'react';
import { GraduationCap } from 'lucide-react';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

export default function EducationStep({ formData, setFormData, onNext, onBack }) {
  const updateEdu = (index, field, value) => {
    setFormData(prev => {
      const edu = [...prev.education];
      edu[index] = { ...edu[index], [field]: value };
      return { ...prev, education: edu };
    });
  };

  return (
    <div>
      <FormSection
        title="Education History"
        description="List your education background, starting with the most recent."
      >
        <div className="space-y-5">
          {formData.education.map((edu, i) => (
            <div key={i} className="bg-[#fafafa] rounded-lg border border-[#e5e7eb] p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-4 h-4 text-bronze" />
                <h4 className="text-xs font-semibold text-[#111827]">Education {i + 1}</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  label="Institution Name"
                  value={edu.institution}
                  onChange={(v) => updateEdu(i, 'institution', v)}
                  className="sm:col-span-2"
                  placeholder="University or school name"
                />
                <FormField
                  label="Degree / Diploma"
                  value={edu.degree}
                  onChange={(v) => updateEdu(i, 'degree', v)}
                  placeholder="e.g., B.S., M.S., Ph.D."
                />
                <FormField
                  label="Field of Study"
                  value={edu.field}
                  onChange={(v) => updateEdu(i, 'field', v)}
                  placeholder="e.g., Environmental Science"
                />
                <FormField
                  label="Year Completed"
                  value={edu.yearCompleted}
                  onChange={(v) => updateEdu(i, 'yearCompleted', v)}
                  placeholder="e.g., 2020"
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