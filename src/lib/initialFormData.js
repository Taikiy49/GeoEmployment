import { localDateValue } from './localDate.js';

export const INITIAL_FORM_DATA = {
  // Application info
  applicationDate: localDateValue(),
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

  // Education (start with 2 entries; applicants can add more)
  education: [
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
    { name: '', title: '', company: '', phone: '' },
    { name: '', title: '', company: '', phone: '' },
    { name: '', title: '', company: '', phone: '' },
  ],
  certifyInitials: '',

  // Medical
  medInitials: '',
  canPerformDuties: false,
  needsAccommodation: false,

  // Affiliations
  affiliations: '',
  professionalOrgs: '',
  professionalLicenses: '',

  // Certification
  fcrInitials: '',
  knowEmployee: '',
  knowEmployeeName: '',
  certificationAgreed: false,
  certificationSignature: '',
  certificationDate: '',

  // EEO
  eeoName: '',
  eeoDate: '',
  eeoGender: '',
  eeoRace: '',

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
  resumeAutoFillModel: '',
  resumeAutoFillFields: 0,
};
