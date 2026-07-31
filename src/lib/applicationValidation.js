const FIELD_DESTINATIONS = {
  positionAppliedFor: { step: 1, task: 1, section: 'Position information' },
  preferredLocation: { step: 1, task: 1, section: 'Position information' },
  firstName: { step: 1, task: 2, section: 'Personal information' },
  lastName: { step: 1, task: 2, section: 'Personal information' },
  email: { step: 1, task: 2, section: 'Personal information' },
  address: { step: 1, task: 2, section: 'Personal information' },
  city: { step: 1, task: 2, section: 'Personal information' },
  state: { step: 1, task: 2, section: 'Personal information' },
  zip: { step: 1, task: 2, section: 'Personal information' },
  highestEducationLevel: { step: 2, task: 1, section: 'Education' },
  certifyInitials: { step: 3, task: 0, section: 'Reference authorization' },
  medInitials: { step: 3, task: 1, section: 'Medical authorization' },
};

const issue = (key, label, destination) => ({ key, label, ...destination });

export function getSubmissionIssues(formData, requiredFields = []) {
  const issues = requiredFields
    .filter(([key]) => !String(formData[key] || '').trim())
    .map(([key, label]) => issue(
      key,
      label,
      FIELD_DESTINATIONS[key] || { step: 1, task: 2, section: 'Personal information' },
    ));

  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    issues.push(issue('emailFormat', 'Enter a complete email address, such as name@example.com', {
      step: 1,
      task: 2,
      section: 'Personal information',
    }));
  }

  if (!formData.certificationAgreed || !formData.certificationSignature?.trim() || !formData.certificationDate) {
    issues.push(issue('employmentCertification', 'Sign, date, and accept the Employment Certification', {
      step: 3,
      task: 3,
      section: 'Employment certification',
    }));
  }

  if (!formData.drugTestAgreed || !formData.drugTestSignature?.trim() || !formData.drugTestDate) {
    issues.push(issue('drugAgreement', 'Sign, date, and accept the Alcohol & Drug Testing agreement', {
      step: 4,
      task: 0,
      section: 'Drug policy agreement',
    }));
  }

  return issues;
}
