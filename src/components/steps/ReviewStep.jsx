import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Pencil, Send } from 'lucide-react';
import FormSection from '../app/FormSection';
import { getSubmissionIssues } from '@/lib/applicationValidation';

export default function ReviewStep({ formData, onBack, onSubmit, onNavigate, requiredFields = [] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submissionIssues = getSubmissionIssues(formData, requiredFields);
  const cannotSubmit = submissionIssues.length > 0;
  const actionGroups = new Map();

  submissionIssues.forEach(({ step, task, section, label }) => {
    const groupKey = `${step}:${task}`;
    const existing = actionGroups.get(groupKey) || { step, task, title: section, items: [] };
    existing.items.push(label);
    actionGroups.set(groupKey, existing);
  });
  const requiredActions = [...actionGroups.values()];

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
        description={cannotSubmit
          ? 'You’re almost done. Complete the items below, then return here to submit.'
          : 'Everything required is complete. Review your information, then submit when you’re ready.'}
      >
        <div className="space-y-4">
          {cannotSubmit ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-semibold text-amber-950">
                    {submissionIssues.length} required {submissionIssues.length === 1 ? 'item needs' : 'items need'} your attention
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-amber-800">
                    These are the exact items blocking submission. Select one and we’ll open the specific screen where it can be completed.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {requiredActions.map(action => (
                  <button
                    key={`${action.step}:${action.task}`}
                    type="button"
                    onClick={() => onNavigate(action.step, action.task)}
                    className="group flex min-w-0 items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-3 py-3 text-left transition-colors hover:border-[#A65F2A] hover:bg-[#F8F0E9]"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">{action.title}</span>
                      <span className="mt-1 block text-sm leading-snug text-slate-600">
                        {action.items.join(', ')}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#A65F2A] transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div>
                <p className="text-base font-semibold text-emerald-900">Ready to submit</p>
                <p className="text-sm text-emerald-700">All required information and signatures are complete.</p>
              </div>
            </div>
          )}

          <ReviewBlock title="Personal Information" onEdit={() => onNavigate(1, 2)}>
            <ReviewRow label="Name" value={`${formData.firstName || ''} ${formData.middleName || ''} ${formData.lastName || ''}`.trim()} />
            <ReviewRow label="Email" value={formData.email} />
            <ReviewRow label="Phone" value={formData.phone || formData.cell} />
            <ReviewRow label="Address" value={[formData.address, formData.city, formData.state, formData.zip].filter(Boolean).join(', ')} />
          </ReviewBlock>

          <ReviewBlock title="Application Details" onEdit={() => onNavigate(1, 1)}>
            <ReviewRow label="Position" value={formData.positionAppliedFor} />
            <ReviewRow label="Location" value={formData.preferredLocation} />
            <ReviewRow label="Driver's License" value={formData.driverLicense} />
            <ReviewRow label="Application Date" value={formData.applicationDate} />
            <ReviewRow label="Available Start" value={formData.availableStartDate} />
          </ReviewBlock>

          <ReviewBlock title="Employment History" onEdit={() => onNavigate(2, 0)}>
            {formData.employment.map((job, i) => (
              job.company ? (
                <div key={i} className="mb-2 last:mb-0">
                  <p className="text-base font-medium text-[var(--portal-ink)]">{job.position || 'Position'} at {job.company}</p>
                  <p className="text-sm text-[var(--portal-muted)]">{job.dateFrom} — {job.dateTo || 'Present'}</p>
                </div>
              ) : null
            ))}
          </ReviewBlock>

          <ReviewBlock title="Education" onEdit={() => onNavigate(2, 1)}>
            <ReviewRow label="Highest Level" value={formData.highestEducationLevel} />
            {formData.education.map((edu, i) => (
              edu.institution ? (
                <div key={i} className="mb-2 last:mb-0">
                  <p className="text-base font-medium text-[var(--portal-ink)]">{edu.degree} — {edu.field}</p>
                  <p className="text-sm text-[var(--portal-muted)]">{[edu.institution, edu.location, edu.yearCompleted].filter(Boolean).join(', ')}</p>
                </div>
              ) : null
            ))}
          </ReviewBlock>

          <ReviewBlock title="Certifications & Acknowledgments" onEdit={() => onNavigate(3, 0)}>
            <ReviewRow label="Reference Authorization" value={formData.certifyInitials ? `Initialed: ${formData.certifyInitials}` : 'Missing'} />
            <ReviewRow label="Medical Policy" value={formData.medInitials ? `Initialed: ${formData.medInitials}` : 'Missing'} />
            <ReviewRow label="FCRA Disclosure" value={formData.fcrInitials ? `Initialed: ${formData.fcrInitials}` : 'Missing'} />
            <ReviewRow
              label="Employment Certification"
              value={formData.certificationAgreed
                ? `${formData.certificationSignature || 'Signature missing'} · ${formData.certificationDate || 'Date missing'}`
                : 'Not signed'}
            />
            <ReviewRow label="Resume Uploaded" value={formData.resumeFileUrl ? 'Yes' : 'No'} />
          </ReviewBlock>

          <ReviewBlock title="Alcohol & Drug Testing Agreement" onEdit={() => onNavigate(4, 0)}>
            <ReviewRow
              label="Applicant Signature"
              value={formData.drugTestAgreed
                ? `${formData.drugTestSignature || 'Signature missing'} · ${formData.drugTestDate || 'Date missing'}`
                : 'Not signed'}
            />
          </ReviewBlock>

          <ReviewBlock title="Voluntary Self-Identification Records" onEdit={() => onNavigate(5, 0)}>
            <ReviewRow
              label="EEO Survey"
              value={formData.eeoGender || formData.eeoRace
                ? `${formData.eeoName || 'Name not provided'} · ${formData.eeoDate || 'Date not provided'}`
                : 'No response provided'}
            />
            <ReviewRow
              label="Veteran Form"
              value={formData.veteranStatus
                ? `${formData.vetSignature || 'Signature not provided'} · ${formData.vetDate || 'Date not provided'}`
                : 'No response provided'}
            />
          </ReviewBlock>

          {submitError && (
            <div role="alert" className="flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}
        </div>
      </FormSection>

      <div className="portal-form-actions items-start">
        <button
          type="button"
          onClick={onBack}
          className="portal-button portal-button--secondary"
        >
          Back
        </button>
        <div className="flex min-w-0 flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || cannotSubmit}
            aria-busy={isSubmitting}
            className="portal-button portal-button--primary"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
          {cannotSubmit && (
            <p className="max-w-xs text-right text-sm text-amber-800">
              Submission is blocked until the {submissionIssues.length} required {submissionIssues.length === 1 ? 'item above is' : 'items above are'} completed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewBlock({ title, children, onEdit }) {
  return (
    <div className="border-b border-[var(--portal-line)] py-5 last:border-b-0">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h4 className="text-base font-semibold text-[var(--portal-ink)]">{title}</h4>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-2 text-sm font-semibold text-[var(--portal-bronze)] hover:bg-[var(--portal-bronze-soft)]"
          >
            <Pencil aria-hidden="true" className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-5">
      <span className="text-sm text-[var(--portal-muted)]">{label}</span>
      <span className="min-w-0 break-words text-base text-[var(--portal-ink)] sm:max-w-[65%] sm:text-right">{value || '—'}</span>
    </div>
  );
}
