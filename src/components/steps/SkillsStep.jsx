import React from 'react';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

export default function SkillsStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      <FormSection
        title="Professional Skills"
        description="Describe your professional skills, tools, software proficiencies, certifications, and relevant experience."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Years of Relevant Experience"
              value={formData.skillsYearsExperience}
              onChange={(v) => update('skillsYearsExperience', v)}
              placeholder="e.g., 0–1, 2–3, 4+"
              hint="Include related roles, internships, and field experience."
            />
            <FormField
              label="Primary Areas of Focus"
              value={formData.skillsPrimaryFocus}
              onChange={(v) => update('skillsPrimaryFocus', v)}
              placeholder="e.g., Geotechnical, field testing, drafting"
            />
          </div>
          <FormField
            label="Technical Skills & Field / Lab Tools"
            type="textarea"
            value={formData.skillsTechnical}
            onChange={(v) => update('skillsTechnical', v)}
            rows={4}
            placeholder="e.g., soil classification, compaction testing, drilling support, construction observation…"
            hint="Include field procedures, laboratory tests, inspection tasks, and hands-on technical skills."
          />
          <FormField
            label="Certifications & Licenses"
            type="textarea"
            value={formData.certifications}
            onChange={(v) => update('certifications', v)}
            rows={3}
            placeholder="e.g., 40-Hour HAZWOPER, OSHA 30, PE License..."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Field / Lab Experience"
              type="textarea"
              value={formData.fieldLabExperience}
              onChange={(v) => update('fieldLabExperience', v)}
              rows={3}
              placeholder="Describe relevant field or laboratory experience..."
            />
            <FormField
              label="Computer / Software Proficiency"
              type="textarea"
              value={formData.computerSkills}
              onChange={(v) => update('computerSkills', v)}
              rows={3}
              placeholder="e.g., Microsoft Office, Python, ArcGIS, R..."
            />
            <FormField
              label="Communication & Team Skills"
              type="textarea"
              value={formData.skillsCommunication}
              onChange={(v) => update('skillsCommunication', v)}
              rows={3}
              placeholder="e.g., report writing, contractor communication, teamwork, safety awareness…"
            />
          </div>
          <FormField
            label="Additional Skills Summary"
            type="textarea"
            value={formData.skillsSummary}
            onChange={(v) => update('skillsSummary', v)}
            rows={3}
            placeholder="Other relevant skills not already listed above"
            hint="Avoid repeating technical, software, or communication skills already entered in the fields above."
          />
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
