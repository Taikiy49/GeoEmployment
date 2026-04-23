import React from 'react';
import { Briefcase } from 'lucide-react';
import FormSection from '../app/FormSection';
import FormField from '../app/FormField';
import NavigationButtons from '../app/NavigationButtons';

export default function EmploymentStep({ formData, setFormData, onNext, onBack }) {
  const updateJob = (index, field, value) => {
    setFormData(prev => {
      const emp = [...prev.employment];
      emp[index] = { ...emp[index], [field]: value };
      return { ...prev, employment: emp };
    });
  };

  return (
    <div>
      <FormSection
        title="Employment History"
        description="Please list your three most recent employers, starting with the most recent."
      >
        <div className="space-y-6">
          {formData.employment.map((job, i) => (
            <div key={i} className="bg-[#fafafa] rounded-lg border border-[#e5e7eb] p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-bronze" />
                <h4 className="text-xs font-semibold text-[#111827]">
                  Employer {i + 1} of 3
                </h4>
                {i === 0 && (
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-bronze-soft text-bronze-dark border border-bronze-border">
                    Most recent
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  label="Company Name / Address"
                  value={job.company}
                  onChange={(v) => updateJob(i, 'company', v)}
                  className="sm:col-span-2"
                  placeholder="Company name and address"
                />
                <FormField
                  label="Phone"
                  type="tel"
                  value={job.phone}
                  onChange={(v) => updateJob(i, 'phone', v)}
                  placeholder="(000) 000-0000"
                />
                <FormField
                  label="Position / Title"
                  value={job.position}
                  onChange={(v) => updateJob(i, 'position', v)}
                />
                <FormField
                  label="Date Employed From"
                  type="date"
                  value={job.dateFrom}
                  onChange={(v) => updateJob(i, 'dateFrom', v)}
                />
                <FormField
                  label="Date Employed To"
                  type="date"
                  value={job.dateTo}
                  onChange={(v) => updateJob(i, 'dateTo', v)}
                  hint="Leave blank if current"
                />
                <FormField
                  label="Primary Duties / Responsibilities"
                  type="textarea"
                  value={job.duties}
                  onChange={(v) => updateJob(i, 'duties', v)}
                  className="sm:col-span-2"
                  rows={3}
                  placeholder="Describe your main responsibilities..."
                />
                <FormField
                  label="Reason for Leaving"
                  value={job.reasonForLeaving}
                  onChange={(v) => updateJob(i, 'reasonForLeaving', v)}
                  placeholder="e.g., Career advancement"
                />
                <FormField
                  label="Supervisor Name / Title"
                  value={job.supervisor}
                  onChange={(v) => updateJob(i, 'supervisor', v)}
                  placeholder="e.g., John Smith, Director"
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