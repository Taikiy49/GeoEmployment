import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';

const endpoint = process.env.APPLICATION_ENDPOINT
  || 'https://careers.geolabs.net/api/submit-application';

if (process.env.SEND_EXAMPLE_APPLICATIONS !== '1') {
  throw new Error('Set SEND_EXAMPLE_APPLICATIONS=1 to send the three labeled test applications.');
}

const today = new Date().toISOString().slice(0, 10);
const applicantEmail = process.env.TEST_APPLICANT_EMAIL || 'tyamashita@geolabs-software.com';

const applicants = [
  {
    firstName: 'TEST Leilani',
    lastName: 'Kawamoto',
    phone: '(808) 555-0101',
    address: '94-429 Koaki Street',
    city: 'Waipahu',
    state: 'HI',
    zip: '96797',
    position: 'Engineering Technician or Trainee (Field)',
    location: 'Waipahu, HI',
    referredBy: 'University of Hawaiʻi career fair',
    availableStartDate: '2026-08-17',
    driverLicense: 'Yes — Hawaiʻi Class 3',
    highestEducationLevel: "Bachelor's degree",
    education: [
      { institution: 'University of Hawaiʻi at Mānoa', location: 'Honolulu, HI', degree: 'B.S.', field: 'Civil Engineering', yearCompleted: '2026' },
    ],
    employment: [
      {
        company: 'Pacific Materials Lab',
        address: 'Honolulu, HI',
        phone: '(808) 555-1101',
        position: 'Laboratory Intern',
        dateFrom: '2025-05',
        dateTo: '2026-05',
        duties: 'Prepared soil samples, recorded moisture-density results, maintained chain-of-custody logs, and assisted with concrete cylinder testing.',
        reasonForLeaving: 'Completed internship after graduation',
        supervisor: 'Malia Spencer',
      },
    ],
    skillsYearsExperience: '1–2 years',
    skillsPrimaryFocus: 'Soils laboratory and construction materials testing',
    skillsSummary: 'TEST APPLICATION — Entry-level civil engineering graduate with careful documentation habits and hands-on laboratory experience.',
    skillsTechnical: 'Soil classification, Atterberg limits, Proctor compaction, concrete cylinders, sample logging',
    skillsCommunication: 'Daily field notes, laboratory worksheets, team handoffs, client-service mindset',
    certifications: 'OSHA 10; First Aid/CPR',
    fieldLabExperience: 'One year supporting a materials laboratory and two university geotechnical laboratory courses.',
    computerSkills: 'Microsoft Excel, Word, AutoCAD, basic Civil 3D',
    professionalOrgs: 'ASCE Hawaiʻi Section — Student Member',
    professionalLicenses: 'Engineer-in-Training exam planned',
    references: [
      { name: 'Malia Spencer', company: 'Pacific Materials Lab', phone: '(808) 555-1101' },
      { name: 'Dr. Aaron Lee', company: 'University of Hawaiʻi', phone: '(808) 555-1102' },
      { name: 'Noah Reyes', company: 'Campus Engineering Club', phone: '(808) 555-1103' },
    ],
    eeoGender: 'Female',
    eeoRace: 'Asian',
    disabilityStatus: 'I do not wish to answer',
    veteranStatus: 'notProtected',
  },
  {
    firstName: 'TEST Marcus',
    lastName: 'Rivera',
    phone: '(415) 555-0202',
    address: '425 Market Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    position: 'Staff Geotechnical Engineer',
    location: 'California',
    referredBy: 'Professional colleague',
    availableStartDate: '2026-09-01',
    driverLicense: 'Yes — California Class C',
    highestEducationLevel: "Master's degree",
    education: [
      { institution: 'University of California, Berkeley', location: 'Berkeley, CA', degree: 'M.S.', field: 'Geotechnical Engineering', yearCompleted: '2022' },
      { institution: 'San José State University', location: 'San José, CA', degree: 'B.S.', field: 'Civil Engineering', yearCompleted: '2020' },
    ],
    employment: [
      {
        company: 'Bay Ground Engineering',
        address: 'Oakland, CA',
        phone: '(510) 555-2201',
        position: 'Project Engineer',
        dateFrom: '2022-07',
        dateTo: 'Present',
        duties: 'Planned subsurface investigations, prepared boring logs, evaluated settlement and bearing capacity, coordinated drill crews, and drafted geotechnical reports.',
        reasonForLeaving: 'Seeking broader project responsibility',
        supervisor: 'Priya Nanduri, P.E.',
      },
      {
        company: 'West Coast Civil',
        address: 'San José, CA',
        phone: '(408) 555-2202',
        position: 'Engineering Intern',
        dateFrom: '2019-06',
        dateTo: '2020-05',
        duties: 'Supported construction observation, reviewed compaction reports, and organized project records.',
        reasonForLeaving: 'Returned to graduate school',
        supervisor: 'Daniel Brooks, P.E.',
      },
    ],
    skillsYearsExperience: '4 years',
    skillsPrimaryFocus: 'Subsurface investigations and geotechnical reporting',
    skillsSummary: 'TEST APPLICATION — Geotechnical engineer experienced with investigation planning, analysis, field coordination, and clear client-ready reporting.',
    skillsTechnical: 'Boring log review, slope stability, settlement analysis, shallow foundations, liquefaction screening',
    skillsCommunication: 'Technical reports, proposals, subcontractor coordination, client meetings, mentoring interns',
    certifications: 'OSHA 30; 40-Hour HAZWOPER',
    fieldLabExperience: 'Managed drilling programs and performed construction observation throughout Northern California.',
    computerSkills: 'gINT, GeoStudio, LPILE, AutoCAD, Bluebeam, Excel',
    professionalOrgs: 'ASCE Geo-Institute',
    professionalLicenses: 'California EIT No. TEST-48291',
    references: [
      { name: 'Priya Nanduri, P.E.', company: 'Bay Ground Engineering', phone: '(510) 555-2201' },
      { name: 'Daniel Brooks, P.E.', company: 'West Coast Civil', phone: '(408) 555-2202' },
      { name: 'Elena Park', company: 'Civic Infrastructure Partners', phone: '(415) 555-2203' },
    ],
    eeoGender: 'Male',
    eeoRace: 'Hispanic or Latino',
    disabilityStatus: 'No, I do not have a disability',
    veteranStatus: 'noAnswer',
  },
  {
    firstName: 'TEST Keoni',
    lastName: 'Matsuda',
    phone: '(808) 555-0303',
    address: '65-120 Kamehameha Highway',
    city: 'Haleiwa',
    state: 'HI',
    zip: '96712',
    position: 'Driller Helper',
    location: 'Waipahu, HI',
    referredBy: 'Geolabs employee referral',
    availableStartDate: '2026-08-10',
    driverLicense: 'Yes — Hawaiʻi Class 4',
    highestEducationLevel: 'High school diploma',
    education: [
      { institution: 'Waialua High School', location: 'Waialua, HI', degree: 'High School Diploma', field: 'General Studies', yearCompleted: '2018' },
      { institution: 'Honolulu Community College', location: 'Honolulu, HI', degree: 'Certificate', field: 'Diesel Mechanics', yearCompleted: '2020' },
    ],
    employment: [
      {
        company: 'Island Utility Contractors',
        address: 'Pearl City, HI',
        phone: '(808) 555-3301',
        position: 'Equipment Operator',
        dateFrom: '2021-03',
        dateTo: 'Present',
        duties: 'Operated skid steers and forklifts, performed daily equipment inspections, supported trenching crews, and maintained safe work zones.',
        reasonForLeaving: 'Interested in drilling and geotechnical fieldwork',
        supervisor: 'Jonah Kim',
      },
      {
        company: 'North Shore Fleet Service',
        address: 'Wahiawā, HI',
        phone: '(808) 555-3302',
        position: 'Diesel Technician Assistant',
        dateFrom: '2019-06',
        dateTo: '2021-02',
        duties: 'Performed preventative maintenance, organized tools and parts, and assisted with hydraulic repairs.',
        reasonForLeaving: 'Accepted full-time equipment-operator role',
        supervisor: 'Robert Silva',
      },
    ],
    skillsYearsExperience: '6 years',
    skillsPrimaryFocus: 'Heavy equipment, field safety, and mechanical support',
    skillsSummary: 'TEST APPLICATION — Safety-focused equipment operator with mechanical aptitude, dependable attendance, and experience supporting outdoor crews.',
    skillsTechnical: 'Equipment inspection, forklift operation, hydraulic hose replacement, hand and power tools, traffic control',
    skillsCommunication: 'Pre-task planning, radio communication, safety briefings, crew coordination',
    certifications: 'OSHA 10; Forklift Operator; First Aid/CPR',
    fieldLabExperience: 'Six years in outdoor construction and fleet environments; comfortable with early starts and physically demanding work.',
    computerSkills: 'Mobile inspection apps, Microsoft Outlook, basic Excel',
    professionalOrgs: 'None',
    professionalLicenses: 'Hawaiʻi Class 4 driver license',
    references: [
      { name: 'Jonah Kim', company: 'Island Utility Contractors', phone: '(808) 555-3301' },
      { name: 'Robert Silva', company: 'North Shore Fleet Service', phone: '(808) 555-3302' },
      { name: 'Kaleo Wong', company: 'Oʻahu Safety Training', phone: '(808) 555-3303' },
    ],
    eeoGender: 'I do not wish to answer',
    eeoRace: 'Native Hawaiian or Other Pacific Islander',
    disabilityStatus: 'I do not wish to answer',
    veteranStatus: 'protected',
  },
];

const buildTestResume = async applicant => Packer.toBuffer(new Document({
  creator: 'Geolabs, Inc. Employment Portal',
  title: `${applicant.firstName} ${applicant.lastName} — Test Resume`,
  sections: [{
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({
          text: `${applicant.firstName} ${applicant.lastName}`,
          bold: true,
          size: 34,
          color: '172033',
        })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 260 },
        children: [new TextRun({
          text: `${applicant.position}  •  ${applicant.location}  •  ${applicant.phone}`,
          size: 19,
          color: '64748B',
        })],
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Professional Summary', bold: true, color: '9A5528' })],
      }),
      new Paragraph({
        spacing: { after: 220, line: 300 },
        children: [new TextRun({ text: applicant.skillsSummary, size: 20, color: '172033' })],
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Experience', bold: true, color: '9A5528' })],
      }),
      ...applicant.employment.flatMap(job => [
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [new TextRun({
            text: `${job.position} — ${job.company}`,
            bold: true,
            size: 21,
            color: '172033',
          })],
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({
            text: `${job.dateFrom} – ${job.dateTo || 'Present'}  •  ${job.address}`,
            size: 18,
            color: '64748B',
          })],
        }),
        new Paragraph({
          spacing: { after: 160, line: 280 },
          children: [new TextRun({ text: job.duties, size: 19, color: '334155' })],
        }),
      ]),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Education', bold: true, color: '9A5528' })],
      }),
      ...applicant.education.map(item => new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({
          text: `${item.degree} ${item.field} — ${item.institution}, ${item.yearCompleted}`,
          size: 20,
          color: '172033',
        })],
      })),
    ],
  }],
}));

const buildApplication = async (applicant, index) => {
  const fullName = `${applicant.firstName} ${applicant.lastName}`;
  const id = `TEST-${Date.now()}-${index + 1}`;
  const resumeFileName = `${id}-${applicant.firstName.replace(/^TEST\s+/, '')}-${applicant.lastName}-Resume.docx`;
  const resumeContent = await buildTestResume(applicant);
  const applicationData = {
    applicationDate: today,
    positionAppliedFor: applicant.position,
    preferredLocation: applicant.location,
    referredBy: applicant.referredBy,
    availableStartDate: applicant.availableStartDate,
    driverLicense: applicant.driverLicense,
    firstName: applicant.firstName,
    middleName: '',
    lastName: applicant.lastName,
    address: applicant.address,
    city: applicant.city,
    state: applicant.state,
    zip: applicant.zip,
    email: applicantEmail,
    phone: applicant.phone,
    cell: applicant.phone,
    employment: applicant.employment,
    education: applicant.education,
    highestEducationLevel: applicant.highestEducationLevel,
    educationAdditional: 'All entries in this application are fictional and intended for production workflow testing.',
    skillsSummary: applicant.skillsSummary,
    skillsYearsExperience: applicant.skillsYearsExperience,
    skillsPrimaryFocus: applicant.skillsPrimaryFocus,
    skillsTechnical: applicant.skillsTechnical,
    skillsCommunication: applicant.skillsCommunication,
    certifications: applicant.certifications,
    fieldLabExperience: applicant.fieldLabExperience,
    computerSkills: applicant.computerSkills,
    references: applicant.references,
    certifyInitials: applicant.firstName.split(' ').at(-1)[0] + applicant.lastName[0],
    medInitials: applicant.firstName.split(' ').at(-1)[0] + applicant.lastName[0],
    canPerformDuties: true,
    needsAccommodation: false,
    professionalOrgs: applicant.professionalOrgs,
    professionalLicenses: applicant.professionalLicenses,
    certificationAgreed: true,
    certificationSignature: fullName,
    certificationDate: today,
    eeoName: fullName,
    eeoDate: today,
    eeoGender: applicant.eeoGender,
    eeoRace: applicant.eeoRace,
    disabilityName: fullName,
    disabilityDate: today,
    disabilityEmployeeId: '',
    disabilityStatus: applicant.disabilityStatus,
    disabilitySignature: fullName,
    disabilitySignatureDate: today,
    veteranStatus: applicant.veteranStatus,
    vetSignature: fullName,
    vetDate: today,
    drugTestAgreed: true,
    drugTestSignature: fullName,
    drugTestDate: today,
    resumeFileUrl: `attached:${resumeFileName}`,
    resumeFileName,
  };

  return {
    id,
    requisitionId: null,
    requisitionTitle: applicant.position,
    stage: 'applied',
    status: 'active',
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    email: applicantEmail,
    phone: applicant.phone,
    positionAppliedFor: applicant.position,
    preferredLocation: applicant.location,
    applicationData,
    resumeFileUrl: applicationData.resumeFileUrl,
    submittedAt: new Date().toISOString(),
    isDraft: false,
    eeoData: {
      gender: applicant.eeoGender,
      race: applicant.eeoRace,
      disabilityStatus: applicant.disabilityStatus,
      veteranStatus: applicant.veteranStatus,
    },
    stageHistory: [{ stage: 'applied', changedAt: new Date().toISOString(), changedBy: 'applicant', note: 'Fictional production workflow test' }],
    auditTrail: [{ action: 'Test application submitted', performedBy: applicantEmail, performedAt: new Date().toISOString(), details: 'Fictional production workflow test' }],
    source: 'production_test',
    resumeAttachment: {
      filename: resumeFileName,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      content: resumeContent.toString('base64'),
    },
  };
};

const startIndex = Math.max(0, Number(process.env.EXAMPLE_START || 0));
const count = Math.max(1, Number(process.env.EXAMPLE_COUNT || applicants.length));
const selectedApplicants = applicants.slice(startIndex, startIndex + count);

const results = [];
for (const [selectedIndex, applicant] of selectedApplicants.entries()) {
  const index = startIndex + selectedIndex;
  const testApplicant = {
    ...applicant,
    firstName: process.env.TEST_FIRST_NAME || applicant.firstName,
    lastName: process.env.TEST_LAST_NAME || applicant.lastName,
  };
  const application = await buildApplication(testApplicant, index);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(application),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${application.firstName} ${application.lastName}: ${result.error || response.status}`);
  }
  results.push({
    applicant: `${application.firstName} ${application.lastName}`,
    position: application.requisitionTitle,
    applicationId: application.id,
    hrMessageId: result.hrMessageId,
    confirmationSent: result.confirmationSent,
  });
}

console.log(JSON.stringify(results, null, 2));
