import React, { useId } from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

const EDUCATION_LEVELS = [
  ['less-than-high-school', 'Less than high school diploma'],
  ['high-school', 'High school diploma or GED'],
  ['some-college', 'Some college, no degree'],
  ['associate', 'Associate’s degree'],
  ['bachelor', 'Bachelor’s degree'],
  ['master', 'Master’s degree'],
  ['professional', 'Professional degree'],
  ['doctorate', 'Doctorate'],
  ['trade-vocational', 'Trade, technical, or vocational program'],
  ['other', 'Other'],
].map(([value, label]) => ({ value, label }));

export default function EducationStep({ formData, setFormData, onNext, onBack }) {
  const id = useId();
  const emptyEducation = () => ({ institution: '', location: '', degree: '', field: '', yearCompleted: '' });
  const education = [...(Array.isArray(formData.education) ? formData.education : [])];
  while (education.length < 2) education.push(emptyEducation());

  const updateEduLevel = (value) => {
    setFormData(prev => ({
      ...prev,
      highestEducationLevel: value,
      education: ['less-than-high-school', 'high-school'].includes(value)
        ? (prev.education || []).map(item => ({ ...item, yearCompleted: '' }))
        : (prev.education || []),
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...education, emptyEducation()],
    }));
  };

  const removeEducation = (index) => {
    if (education.length <= 2) return;
    setFormData(prev => ({
      ...prev,
      education: education.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

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
        <div className="mb-5">
          <FormField
            label="Highest Level of Education Completed"
            type="select"
            value={formData.highestEducationLevel}
            onChange={(v) => updateEduLevel(v)}
            placeholder="Select one…"
            options={EDUCATION_LEVELS}
            required
            hint="High-school graduation dates are not requested. Postsecondary years are optional and used only for credential verification."
          />
        </div>
        <div className="space-y-5">
          {education.map((edu, i) => (
            <div key={i} role="group" aria-labelledby={`${id}-education-${i}`} className="bg-[#f8fafc] rounded-lg border border-[#e2e8f0] p-4 sm:p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-bronze" />
                  <h4 id={`${id}-education-${i}`} className="text-xs font-semibold text-[#0f172a]">Education {i + 1}</h4>
                </div>
                {education.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeEducation(i)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-700"
                    aria-label={`Remove education ${i + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
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
                  label="City / State or Country"
                  value={edu.location}
                  onChange={(v) => updateEdu(i, 'location', v)}
                  placeholder="e.g., Honolulu, HI"
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
        <button
          type="button"
          onClick={addEducation}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#A65F2A]/30 bg-[#A65F2A]/5 px-4 py-2.5 text-xs font-bold text-[#8A4A22] transition-colors hover:bg-[#A65F2A]/10"
        >
          <Plus className="h-4 w-4" /> Add education
        </button>
        <div className="mt-5">
          <FormField
            label="Additional Education"
            type="textarea"
            value={formData.educationAdditional}
            onChange={(v) => setFormData(prev => ({ ...prev, educationAdditional: v }))}
            rows={3}
            placeholder="Additional schools, in-progress programs, licenses, or certifications"
          />
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
