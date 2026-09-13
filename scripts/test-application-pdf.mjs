import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { buildApplicationDocx } from '../api/generate-application-docx.js';
import { convertDocxToPdf } from '../api/convert-docx-to-pdf.js';
import { extractPageTexts } from '../api/split-compliance-pdfs.js';

const outputPath = process.argv[2] || '/var/tmp/geolabs-application-render-test.pdf';
const application = {
  id: 'PDF-RENDER-TEST',
  submittedAt: '2026-07-31T12:00:00-10:00',
  applicationDate: '2026-07-31',
  firstName: 'PDF',
  middleName: 'Render',
  lastName: 'Test',
  email: 'pdf-render-test@example.com',
  phone: '(808) 555-0100',
  address: '94-429 Koaki Street',
  city: 'Waipahu',
  state: 'HI',
  zip: '96797',
  positionAppliedFor: 'Engineering Technician or Trainee (Field)',
  preferredLocation: 'Waipahu, HI',
  availableStartDate: '2026-08-15',
  driverLicense: 'Yes — Hawaiʻi Class 3',
  referredBy: 'Geolabs, Inc. website',
  highestEducationLevel: "Bachelor's degree",
  employment: [{
    company: 'Example Materials Laboratory',
    address: 'Honolulu, HI',
    phone: '(808) 555-0110',
    position: 'Laboratory Technician',
    dateFrom: '2024-01',
    dateTo: 'Present',
    duties: 'Prepared samples, recorded test results, and maintained quality-control records.',
    reasonForLeaving: 'Seeking professional growth',
    supervisor: 'Example Supervisor',
  }],
  education: [{
    institution: 'University of Hawaiʻi at Mānoa',
    location: 'Honolulu, HI',
    degree: 'B.S.',
    field: 'Civil Engineering',
    yearCompleted: '2023',
  }],
  skillsYearsExperience: '2 years',
  skillsPrimaryFocus: 'Construction materials testing',
  skillsSummary: 'Experienced with laboratory documentation and field observation.',
  skillsTechnical: 'Soil classification, compaction testing, concrete cylinders',
  skillsCommunication: 'Field reports, client communication, teamwork',
  certifications: 'OSHA 10; First Aid/CPR',
  fieldLabExperience: 'Two years of soil and concrete testing experience.',
  computerSkills: 'Microsoft Office, AutoCAD, Bluebeam',
  professionalOrgs: 'ASCE Hawaiʻi Section',
  professionalLicenses: 'Engineer-in-Training',
  references: [
    { name: 'Reference One', company: 'Example Engineering', phone: '(808) 555-0121' },
    { name: 'Reference Two', company: 'Example Laboratory', phone: '(808) 555-0122' },
    { name: 'Reference Three', company: 'Example Construction', phone: '(808) 555-0123' },
  ],
  certifyInitials: 'PRT',
  medInitials: 'PRT',
  fcrInitials: 'PRT',
  canPerformDuties: true,
  certificationAgreed: true,
  certificationSignature: 'PDF Render Test',
  certificationDate: '2026-07-31',
  drugTestAgreed: true,
  drugTestSignature: 'PDF Render Test',
  drugTestDate: '2026-07-31',
  eeoGender: '',
  eeoRace: 'I do not wish to disclose.',
  veteranStatus: 'noAnswer',
};

// Match the submitted record shape: form responses live in applicationData.
const docx = await buildApplicationDocx({ ...application, applicationData: application }, { mainApplicationOnly: true });
const pdf = await convertDocxToPdf(docx);
const pdfText = (await extractPageTexts(pdf)).join(' ');
assert.match(pdfText, /example materials laboratory/);
assert.match(pdfText, /prepared samples, recorded test results/);
assert.match(pdfText, /civil engineering/);
assert.doesNotMatch(pdfText, /voluntary self-identification of disability/);
await writeFile(outputPath, pdf);
console.log(`${outputPath} (${pdf.length} bytes)`);
