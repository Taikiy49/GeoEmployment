import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Pencil, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormSection from '../app/FormSection';

const FIELD_DESTINATIONS = {
  positionAppliedFor: { step: 1, section: 'Your details' },
  preferredLocation: { step: 1, section: 'Your details' },
  firstName: { step: 1, section: 'Your details' },
  lastName: { step: 1, section: 'Your details' },
  email: { step: 1, section: 'Your details' },
  address: { step: 1, section: 'Your details' },
  city: { step: 1, section: 'Your details' },
  state: { step: 1, section: 'Your details' },
  zip: { step: 1, section: 'Your details' },
  highestEducationLevel: { step: 2, section: 'Experience and education' },
  medInitials: { step: 3, section: 'Requirements and agreements' },
  certifyInitials: { step: 3, section: 'Requirements and agreements' },
};

export default function ReviewStep({ formData, onBack, onSubmit, onNavigate, requiredFields = [] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const missingCoreFields = requiredFields
    .filter(([key]) => !String(formData[key] || '').trim())
    .map(([key, label]) => ({ key, label, ...(FIELD_DESTINATIONS[key] || { step: 1, section: 'Your details' }) }));
  const signaturesMissing = !formData.certificationAgreed || !formData.drugTestAgreed
    || !formData.certificationSignature?.trim() || !formData.certificationDate
    || !formData.drugTestSignature?.trim() || !formData.drugTestDate;
  const invalidEmail = Boolean(formData.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const cannotSubmit = missingCoreFields.length > 0 || signaturesMissing || invalidEmail;
  const actionGroups = new Map();

  missingCoreFields.forEach(({ step, section, label }) => {
    const existing = actionGroups.get(step) || { step, title: section, items: [] };
    existing.items.push(label);
    actionGroups.set(step, existing);
  });
  if (invalidEmail) {
    const existing = actionGroups.get(1) || { step: 1, title: 'Your details', items: [] };
    existing.items.push('Valid email address');
    actionGroups.set(1, existing);
  }
  if (!formData.certificationAgreed || !formData.certificationSignature?.trim() || !formData.certificationDate) {
    const existing = actionGroups.get(3) || { step: 3, title: 'Requirements and agreements', items: [] };
    existing.items.push('Signature and agreement');
    actionGroups.set(3, existing);
  }
  if (!formData.drugTestAgreed || !formData.drugTestSignature?.trim() || !formData.drugTestDate) {
    const existing = actionGroups.get(4) || { step: 4, title: 'Drug policy', items: [] };
    existing.items.push('Drug-testing signature and agreement');
    actionGroups.set(4, existing);
  }
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
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-amber-950">A few items need your attention</h3>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                    Select any item below. We’ll take you directly to the right place and keep everything you’ve already entered.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {requiredActions.map(action => (
                  <button
                    key={action.step}
                    type="button"
                    onClick={() => onNavigate(action.step)}
                    className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-3 text-left transition-colors hover:border-[#A65F2A] hover:bg-[#F8F0E9]"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-slate-900">{action.title}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                        {action.items.join(', ')}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#A65F2A] transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-900">Ready to submit</p>
                <p className="text-xs text-emerald-700">All required information and signatures are complete.</p>
              </div>
            </div>
          )}

          <ReviewBlock title="Personal Information" onEdit={() => onNavigate(1)}>
            <ReviewRow label="Name" value={`${formData.firstName || ''} ${formData.middleName || ''} ${formData.lastName || ''}`.trim()} />
            <ReviewRow label="Email" value={formData.email} />
            <ReviewRow label="Phone" value={formData.phone || formData.cell} />
            <ReviewRow label="Address" value={[formData.address, formData.city, formData.state, formData.zip].filter(Boolean).join(', ')} />
          </ReviewBlock>

          <ReviewBlock title="Application Details" onEdit={() => onNavigate(1)}>
            <ReviewRow label="Position" value={formData.positionAppliedFor} />
            <ReviewRow label="Location" value={formData.preferredLocation} />
            <ReviewRow label="Driver's License" value={formData.driverLicense} />
            <ReviewRow label="Application Date" value={formData.applicationDate} />
            <ReviewRow label="Available Start" value={formData.availableStartDate} />
          </ReviewBlock>

          <ReviewBlock title="Employment History" onEdit={() => onNavigate(2)}>
            {formData.employment.map((job, i) => (
              job.company ? (
                <div key={i} className="mb-2 last:mb-0">
                  <p className="text-xs font-medium text-[#0f172a]">{job.position || 'Position'} at {job.company}</p>
                  <p className="text-[10px] text-[#64748b]">{job.dateFrom} — {job.dateTo || 'Present'}</p>
                </div>
              ) : null
            ))}
          </ReviewBlock>

          <ReviewBlock title="Education" onEdit={() => onNavigate(2)}>
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

          <ReviewBlock title="Certifications & Acknowledgments" onEdit={() => onNavigate(3)}>
            <ReviewRow label="Reference Authorization" value={formData.certifyInitials ? `Initialed: ${formData.certifyInitials}` : 'Missing'} />
            <ReviewRow label="Medical Policy" value={formData.medInitials ? `Initialed: ${formData.medInitials}` : 'Missing'} />
            <ReviewRow
              label="Employment Certification"
              value={formData.certificationAgreed
                ? `${formData.certificationSignature || 'Signature missing'} · ${formData.certificationDate || 'Date missing'}`
                : 'Not signed'}
            />
            <ReviewRow label="Resume Uploaded" value={formData.resumeFileUrl ? 'Yes' : 'No'} />
          </ReviewBlock>

          <ReviewBlock title="Alcohol & Drug Testing Agreement" onEdit={() => onNavigate(4)}>
            <ReviewRow
              label="Applicant Signature"
              value={formData.drugTestAgreed
                ? `${formData.drugTestSignature || 'Signature missing'} · ${formData.drugTestDate || 'Date missing'}`
                : 'Not signed'}
            />
          </ReviewBlock>

          <ReviewBlock title="Voluntary Self-Identification Records" onEdit={() => onNavigate(5)}>
            <ReviewRow
              label="EEO Survey"
              value={formData.eeoGender || formData.eeoRace
                ? `${formData.eeoName || 'Name not provided'} · ${formData.eeoDate || 'Date not provided'}`
                : 'No response provided'}
            />
            <ReviewRow
              label="Disability Form"
              value={formData.disabilityStatus
                ? `${formData.disabilitySignature || formData.disabilityName || 'Name not provided'} · ${formData.disabilitySignatureDate || formData.disabilityDate || 'Date not provided'}`
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

function ReviewBlock({ title, children, onEdit }) {
  return (
    <div className="bg-[#f8fafc] rounded-lg border border-[#e2e8f0] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-[11px] font-semibold text-bronze-dark uppercase tracking-wider">{title}</h4>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-white hover:text-[#8A4A22]"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between items-baseline py-1">
      <span className="text-[11px] text-[#64748b]">{label}</span>
      <span className="max-w-[65%] break-words text-right text-xs font-medium text-[#0f172a]">{value || '—'}</span>
    </div>
  );
}
