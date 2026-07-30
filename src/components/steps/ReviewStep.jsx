import React, { useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormSection from '../app/FormSection';

export default function ReviewStep({ formData, onBack, onSubmit, requiredFields = [] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const missingCoreFields = requiredFields
    .filter(([key]) => !String(formData[key] || '').trim())
    .map(([, label]) => label);
  const signaturesMissing = !formData.certificationAgreed || !formData.drugTestAgreed
    || !formData.certificationSignature?.trim() || !formData.drugTestSignature?.trim();
  const invalidEmail = Boolean(formData.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const cannotSubmit = missingCoreFields.length > 0 || signaturesMissing || invalidEmail;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit();
    } catch (error) {
      setSubmitError(error.message || 'We could not submit your application. Please try again.');
      setIsSubmitting(false);
    }
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
            <ReviewRow label="Driver's License" value={formData.driverLicense} />
            <ReviewRow label="Application Date" value={formData.applicationDate} />
            <ReviewRow label="Available Start" value={formData.availableStartDate} />
          </ReviewBlock>

          <ReviewBlock title="Employment History">
            {formData.employment.map((job, i) => (
              job.company ? (
                <div key={i} className="mb-2 last:mb-0">
                  <p className="text-xs font-medium text-[#0f172a]">{job.position || 'Position'} at {job.company}</p>
                  <p className="text-[10px] text-[#64748b]">{job.dateFrom} — {job.dateTo || 'Present'}</p>
                </div>
              ) : null
            ))}
          </ReviewBlock>

          <ReviewBlock title="Education">
            <ReviewRow label="Highest Level" value={formData.highestEducationLevel} />
            {formData.education.map((edu, i) => (
              edu.institution ? (
                <div key={i} className="mb-2 last:mb-0">
                  <p className="text-xs font-medium text-[#0f172a]">{edu.degree} — {edu.field}</p>
                  <p className="text-[10px] text-[#64748b]">{[edu.institution, edu.location, edu.yearCompleted].filter(Boolean).join(', ')}</p>
                </div>
              ) : null
            ))}
          </ReviewBlock>

          <ReviewBlock title="Certifications & Acknowledgments">
            <ReviewRow label="Reference Authorization" value={formData.certifyInitials ? 'Initialed' : 'Missing'} />
            <ReviewRow label="Medical Policy" value={formData.medInitials ? 'Initialed' : 'Missing'} />
            <ReviewRow label="Employment Certification" value={formData.certificationAgreed ? 'Signed' : 'Not signed'} />
            <ReviewRow label="Drug Test Acknowledgment" value={formData.drugTestAgreed ? 'Signed' : 'Not signed'} />
            <ReviewRow label="Resume Uploaded" value={formData.resumeFileUrl ? 'Yes' : 'No'} />
          </ReviewBlock>

          {(!formData.certificationAgreed || !formData.drugTestAgreed || !formData.certificationSignature || !formData.drugTestSignature) && (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">
                <strong>Required signatures missing.</strong> You must complete the Employment Certification (Step 11) and Alcohol & Drug Testing (Step 15) signatures before submitting.
              </p>
            </div>
          )}
          {(missingCoreFields.length > 0 || invalidEmail) && (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                <strong>Application details need attention.</strong>{' '}
                {missingCoreFields.length > 0 && `Missing: ${missingCoreFields.join(', ')}.`}
                {invalidEmail && ' Enter a valid email address.'}
              </p>
            </div>
          )}
          {submitError && (
            <div role="alert" className="flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{submitError}</p>
            </div>
          )}
        </div>
      </FormSection>

      <div className="flex items-center justify-between mt-8 pt-5 border-t border-[#e2e8f0]">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="rounded-full px-3 h-9 text-sm border-[#cbd5e1] text-[#334155]"
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || cannotSubmit}
          className="rounded-full px-3 h-10 text-sm bg-bronze hover:bg-bronze-dark text-white border border-bronze-dark shadow-sm"
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
    <div className="bg-[#f8fafc] rounded-lg border border-[#e2e8f0] p-4">
      <h4 className="text-[11px] font-semibold text-bronze-dark uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between items-baseline py-1">
      <span className="text-[11px] text-[#64748b]">{label}</span>
      <span className="text-xs text-[#0f172a] font-medium text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
  );
}
