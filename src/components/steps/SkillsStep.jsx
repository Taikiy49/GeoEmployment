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
          <FormField
            label="Skills Summary"
            type="textarea"
            value={formData.skillsSummary}
            onChange={(v) => update('skillsSummary', v)}
            rows={4}
            placeholder="e.g., Environmental monitoring, GIS analysis, AutoCAD, field sampling techniques..."
            hint="Include software, tools, technical skills, and communication abilities"
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
          </div>
        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}