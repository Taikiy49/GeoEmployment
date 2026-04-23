export const INITIAL_FORM_DATA = {
  // Application info
  applicationDate: new Date().toISOString().split('T')[0],
  positionAppliedFor: '',
  preferredLocation: '',
  referredBy: '',
  desiredSalary: '',
  availableStartDate: '',

  // General info
  firstName: '',
  middleName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  email: '',
  phone: '',
  cell: '',

  // Employment (3 entries)
  employment: [
    { company: '', address: '', phone: '', position: '', dateFrom: '', dateTo: '', duties: '', reasonForLeaving: '', supervisor: '' },
    { company: '', address: '', phone: '', position: '', dateFrom: '', dateTo: '', duties: '', reasonForLeaving: '', supervisor: '' },
    { company: '', address: '', phone: '', position: '', dateFrom: '', dateTo: '', duties: '', reasonForLeaving: '', supervisor: '' },
  ],

  // Education (3 entries)
  education: [
    { institution: '', degree: '', field: '', yearCompleted: '' },
    { institution: '', degree: '', field: '', yearCompleted: '' },
    { institution: '', degree: '', field: '', yearCompleted: '' },
  ],

  // Skills
  skillsSummary: '',
  certifications: '',
  fieldLabExperience: '',
  computerSkills: '',

  // References (3 entries)
  references: [
    { name: '', company: '', phone: '' },
    { name: '', company: '', phone: '' },
    { name: '', company: '', phone: '' },
  ],

  // Medical
  canPerformDuties: false,
  needsAccommodation: false,

  // Affiliations
  professionalOrgs: '',
  professionalLicenses: '',

  // Certification
  certificationAgreed: false,
  certificationSignature: '',
  certificationDate: '',

  // EEO
  eeoGender: '',
  eeoRace: '',

  // Disability
  disabilityStatus: '',

  // Veteran
  veteranStatus: '',

  // Alcohol & Drug
  drugTestAgreed: false,
  drugTestSignature: '',
  drugTestDate: '',

  // Resume
  resumeFileUrl: '',
  resumeAutoFillTimestamp: '',
};