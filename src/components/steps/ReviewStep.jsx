import React, { useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormSection from '../app/FormSection';
import NavigationButtons from '../app/NavigationButtons';

export default function ReviewStep({ formData, onBack, onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit();
    setIsSubmitting(false);
  };

  return (
    <div>
      <FormSection
        title="Review & Submit"
        description="Please review the following summary of your application before submitting."
      >
        <div className="space-y-4">
          <ReviewBlock title="Personal Information">
            <ReviewRow label="Name" value={`${formData.firstName || ''} ${formData.middleName || ''} ${formData.lastName || ''}`.trim()} />
            <ReviewRow label="Email" value={formData.email} />
            <ReviewRow label="Phone" value={formData.phone || formData.cell} />
            <ReviewRow label="Address" value={[formData.address, formData.city, formData.state, formData.zip].filter(Boolean).join(', ')} />
          </ReviewBlock>

          <ReviewBlock title="Application Details">
            <ReviewRow label="Position" value={formData.positionAppliedFor} />
            <ReviewRow label="Location" value={formData.preferredLocation} />
            <ReviewRow label="Application Date" value={formData.applicationDate} />
            <ReviewRow label="Available Start" value={formData.availableStartDate} />
          </ReviewBlock>

          <ReviewBlock title="Employment History">
            {formData.employment.map((job, i) => (
              job.company ? (
                <div key={i} className="mb-2 last:mb-0">
                  <p className="text-xs font-medium text-[#111827]">{job.position || 'Position'} at {job.company}</p>
                  <p className="text-[10px] text-[#6b7280]">{job.dateFrom} — {job.dateTo || 'Present'}</p>
                </div>
              ) : null
            ))}
          </ReviewBlock>

          <ReviewBlock title="Education">
            {formData.education.map((edu, i) => (
              edu.institution ? (
                <div key={i} className="mb-2 last:mb-0">
                  <p className="text-xs font-medium text-[#111827]">{edu.degree} — {edu.field}</p>
                  <p className="text-[10px] text-[#6b7280]">{edu.institution}, {edu.yearCompleted}</p>
                </div>
              ) : null
            ))}
          </ReviewBlock>

          <ReviewBlock title="Certifications & Acknowledgments">
            <ReviewRow label="Employment Certification" value={formData.certificationAgreed ? 'Signed' : 'Not signed'} />
            <ReviewRow label="Drug Test Acknowledgment" value={formData.drugTestAgreed ? 'Signed' : 'Not signed'} />
            <ReviewRow label="Resume Uploaded" value={formData.resumeFileUrl ? 'Yes' : 'No'} />
          </ReviewBlock>

          {(!formData.certificationAgreed || !formData.drugTestAgreed || !formData.certificationSignature || !formData.drugTestSignature) && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">
                <strong>Required signatures missing.</strong> You must complete the Employment Certification (Step 11) and Alcohol & Drug Testing (Step 15) signatures before submitting.
              </p>
            </div>
          )}
        </div>
      </FormSection>

      <div className="flex items-center justify-between mt-8 pt-5 border-t border-[#e5e7eb]">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="rounded-full px-5 h-9 text-sm border-[#cbd5e1] text-[#374151]"
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.certificationAgreed || !formData.drugTestAgreed || !formData.certificationSignature || !formData.drugTestSignature}
          className="rounded-full px-6 h-10 text-sm bg-bronze hover:bg-bronze-dark text-white border border-bronze-dark shadow-sm"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </div>
  );
}

function ReviewBlock({ title, children }) {
  return (
    <div className="bg-[#fafafa] rounded-lg border border-[#e5e7eb] p-4">
      <h4 className="text-[11px] font-semibold text-bronze-dark uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between items-baseline py-1">
      <span className="text-[11px] text-[#6b7280]">{label}</span>
      <span className="text-xs text-[#111827] font-medium text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
  );
}