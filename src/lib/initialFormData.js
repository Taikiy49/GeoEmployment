export const INITIAL_FORM_DATA = {
  // Application info
  applicationDate: new Date().toISOString().split('T')[0],
  positionAppliedFor: '',
  preferredLocation: '',
  referredBy: '',
  availableStartDate: '',
  driverLicense: '',

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
    { institution: '', location: '', degree: '', field: '', yearCompleted: '' },
    { institution: '', location: '', degree: '', field: '', yearCompleted: '' },
    { institution: '', location: '', degree: '', field: '', yearCompleted: '' },
  ],
  highestEducationLevel: '',
  educationAdditional: '',

  // Skills
  skillsSummary: '',
  skillsYearsExperience: '',
  skillsPrimaryFocus: '',
  skillsTechnical: '',
  skillsCommunication: '',
  certifications: '',
  fieldLabExperience: '',
  computerSkills: '',

  // References (3 entries)
  references: [
    { name: '', company: '', phone: '' },
    { name: '', company: '', phone: '' },
    { name: '', company: '', phone: '' },
  ],
  certifyInitials: '',

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
  eeoName: '',
  eeoDate: '',
  eeoGender: '',
  eeoRace: '',

  // Disability
  disabilityName: '',
  disabilityDate: '',
  disabilityEmployeeId: '',
  disabilityStatus: '',
  disabilitySignature: '',
  disabilitySignatureDate: '',

  // Veteran
  veteranStatus: '',
  vetSignature: '',
  vetDate: '',

  // Alcohol & Drug
  drugTestAgreed: false,
  drugTestSignature: '',
  drugTestDate: '',

  // Resume
  resumeFileUrl: '',
  resumeFileName: '',
  resumeFileSize: 0,
  resumeAutoFillTimestamp: '',
};
