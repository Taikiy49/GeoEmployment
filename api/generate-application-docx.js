import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LineRuleType,
  PageBreak,
  PageNumber,
  Packer,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableOfContents,
  TableRow,
  TextRun,
  VerticalAlign,
  Paragraph,
  WidthType,
  convertInchesToTwip,
} from 'docx';
import { ALCOHOL_DRUG_PROGRAM_TEXT } from '../src/lib/legalTexts.js';

const NAVY = '111923';
const BRONZE = 'A65F2A';
const BRONZE_DARK = '87471F';
const SLATE = '475569';
const PALE_BRONZE = 'F8F0E9';
const PALE_SLATE = 'F6F8FA';
const BORDER = 'DDE3E9';
const WHITE = 'FFFFFF';
const RESTRICTED = '8A1538';
const PALE_RESTRICTED = 'FFF5F7';

const empty = 'Not provided';
const valueText = value => {
  if (value === true) return 'Yes — selected';
  if (value === false) return 'No — not selected';
  if (value === undefined || value === null || String(value).trim() === '') return empty;
  return String(value);
};

const titleCase = value => String(value || '')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replaceAll('_', ' ')
  .replace(/\b\w/g, character => character.toUpperCase());

const borders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
  left: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
  right: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
};

const sectionHeading = (text, restricted = false) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  pageBreakBefore: true,
  keepNext: true,
  spacing: {
    before: 280,
    after: 280,
    line: 340,
    lineRule: LineRuleType.EXACT,
  },
  indent: { left: 0, right: 0 },
  children: [
    new TextRun({
      text: '┃',
      bold: true,
      size: 28,
      color: restricted ? RESTRICTED : BRONZE,
    }),
    new TextRun({
      text: `\u00A0\u00A0${text}`,
      bold: true,
      size: 28,
      color: restricted ? RESTRICTED : NAVY,
    }),
  ],
});

const subheading = text => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  keepNext: true,
  spacing: { before: 220, after: 100 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRONZE } },
  children: [new TextRun({ text, bold: true, size: 22, color: NAVY })],
});

const body = (text, options = {}) => new Paragraph({
  spacing: { after: 120, line: 300 },
  children: [
    new TextRun({
      text: valueText(text),
      size: 19,
      color: options.color || SLATE,
      bold: options.bold,
      italics: options.italics,
    }),
  ],
});

const notice = (text, restricted = false) => new Table({
  width: { size: 10080, type: WidthType.DXA },
  columnWidths: [10080],
  layout: TableLayoutType.FIXED,
  borders: {
    top: { style: BorderStyle.SINGLE, size: 2, color: restricted ? 'F0B5C5' : 'DDBA9E' },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: restricted ? 'F0B5C5' : 'DDBA9E' },
    left: { style: BorderStyle.SINGLE, size: 2, color: restricted ? 'F0B5C5' : 'DDBA9E' },
    right: { style: BorderStyle.SINGLE, size: 2, color: restricted ? 'F0B5C5' : 'DDBA9E' },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  },
  rows: [
    new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 10080, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          shading: { type: ShadingType.SOLID, color: restricted ? PALE_RESTRICTED : PALE_BRONZE },
          margins: { top: 210, bottom: 210, left: 240, right: 240 },
          children: [
            new Paragraph({
              spacing: { line: 300 },
              children: [
                new TextRun({
                  text,
                  bold: true,
                  size: 18,
                  color: restricted ? RESTRICTED : BRONZE_DARK,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
});

const responseTable = pairs => new Table({
  width: { size: 10080, type: WidthType.DXA },
  columnWidths: [3300, 6780],
  layout: TableLayoutType.FIXED,
  borders,
  rows: pairs.map(([label, value], index) => new TableRow({
    cantSplit: true,
    children: [
      new TableCell({
        width: { size: 3300, type: WidthType.DXA },
        shading: { type: ShadingType.SOLID, color: index % 2 ? 'F9FAFB' : PALE_SLATE },
        margins: { top: 85, bottom: 85, left: 190, right: 190 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 17, color: SLATE })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 6780, type: WidthType.DXA },
        shading: { type: ShadingType.SOLID, color: WHITE },
        margins: { top: 85, bottom: 85, left: 190, right: 190 },
        children: String(valueText(value)).split('\n').map(line => new Paragraph({
          spacing: { after: 0, line: 250 },
          children: [new TextRun({ text: line || ' ', size: 18, color: NAVY })],
        })),
      }),
    ],
  })),
});

const checkedAnswer = (selected, statement) => `${selected ? '☒' : '☐'} ${statement}`;

const signatureRecord = ({
  heading = 'Electronic signature record',
  statement,
  signature,
  date,
  method = 'Typed electronic signature',
  application,
}) => [
  subheading(heading),
  responseTable([
    ['Exact statement acknowledged', statement],
    ['Signature / initials', signature],
    ['Signature date', date],
    ['Signature method', signature ? method : empty],
    ['Application ID', application.id],
    ['Submission timestamp', safeDate(application.submittedAt)],
    ['Record status', signature ? 'Signed electronically' : 'No signature provided'],
  ]),
];

const applicantName = application => {
  const data = application.applicationData || {};
  return [
    data.firstName || application.firstName,
    data.middleName,
    data.lastName || application.lastName,
  ].filter(Boolean).join(' ');
};

const safeDate = value => {
  if (!value) return empty;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-US', {
    timeZone: 'Pacific/Honolulu',
    dateStyle: 'long',
    timeStyle: 'short',
  });
};

const mappedApplicationFields = new Set([
  'applicationDate', 'positionAppliedFor', 'preferredLocation', 'referredBy',
  'desiredSalary', 'availableStartDate', 'driverLicense',
  'firstName', 'middleName', 'lastName', 'address', 'city', 'state', 'zip',
  'email', 'phone', 'cell', 'employment', 'education', 'highestEducationLevel',
  'educationAdditional', 'skillsSummary', 'skillsYearsExperience',
  'skillsPrimaryFocus', 'skillsTechnical', 'skillsCommunication',
  'certifications', 'fieldLabExperience', 'computerSkills', 'references',
  'certifyInitials', 'medInitials', 'canPerformDuties', 'needsAccommodation',
  'professionalOrgs', 'professionalLicenses', 'affiliations', 'fcrInitials',
  'knowEmployee', 'knowEmployeeName', 'certificationAgreed',
  'certificationSignature', 'certificationDate', 'eeoName', 'eeoDate',
  'eeoGender', 'eeoRace', 'disabilityName', 'disabilityDate',
  'disabilityEmployeeId', 'disabilityStatus', 'disabilitySignature',
  'disabilitySignatureDate', 'veteranStatus', 'vetSignature', 'vetDate',
  'drugTestAgreed', 'drugTestSignature', 'drugTestDate', 'resumeFileUrl',
  'resumeFileName', 'resumeFileSize', 'resumeAutoFillTimestamp',
]);

const extraResponseRows = data => Object.entries(data)
  .filter(([key]) => !mappedApplicationFields.has(key))
  .map(([key, value]) => [
    titleCase(key),
    typeof value === 'object' ? JSON.stringify(value, null, 2) : value,
  ]);

async function logoRun(width, height) {
  try {
    const logoPath = fileURLToPath(new URL('../public/geolabs-logo.png', import.meta.url));
    const data = await readFile(logoPath);
    return new ImageRun({
      data,
      type: 'png',
      transformation: { width, height },
      altText: {
        title: 'Geolabs, Inc.',
        description: 'Geolabs, Inc. logo',
        name: 'Geolabs logo',
      },
    });
  } catch {
    return new TextRun({ text: 'G', bold: true, size: 34, color: BRONZE });
  }
}

export async function buildApplicationDocx(application) {
  const data = application.applicationData || {};
  const eeo = application.eeoData || {};
  const name = applicantName(application);
  const position = application.requisitionTitle
    || data.positionAppliedFor
    || application.positionAppliedFor
    || 'General application';
  const headerLogo = await logoRun(30, 30);
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 440, after: 180 },
      children: [new TextRun({ text: 'Complete Employment Application', bold: true, size: 40, color: NAVY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: name, bold: true, size: 30, color: NAVY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 260 },
      children: [new TextRun({ text: position, size: 22, color: BRONZE_DARK })],
    }),
    notice('CONFIDENTIAL — Authorized HR and compliance personnel only. Voluntary self-identification information must be handled separately from hiring decisions.', true),
    responseTable([
      ['Application ID', application.id],
      ['Submitted', safeDate(application.submittedAt)],
      ['Preferred office', data.preferredLocation || application.preferredLocation],
      ['Applicant email', application.email || data.email],
    ]),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [new TextRun({ text: 'Contents', bold: true, size: 32, color: NAVY })],
    }),
    body('Open this document in Microsoft Word and update the table if page numbers do not refresh automatically.', { italics: true }),
    new TableOfContents('Application contents', {
      hyperlink: true,
      headingStyleRange: '1-2',
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  children.push(
    sectionHeading('1. Submission Overview'),
    notice('Document standard: every submitted response is reproduced without summarization. “Not provided” means the applicant left that field blank. Policy and acknowledgment language is reproduced as presented in the application.'),
    responseTable([
      ['Application ID', application.id],
      ['Application status', application.status],
      ['Application stage', application.stage],
      ['Draft record', application.isDraft],
      ['Application source', application.source],
      ['Requisition ID', application.requisitionId],
      ['Position / requisition title', position],
      ['Submission date and time', safeDate(application.submittedAt)],
      ['Resume attached', data.resumeFileUrl || application.resumeFileUrl ? 'Yes' : 'No'],
      ['Resume filename', data.resumeFileName || application.resumeFileUrl],
      ['Resume storage reference', data.resumeFileUrl || application.resumeFileUrl],
      ['Resume file size', data.resumeFileSize ? `${data.resumeFileSize} bytes` : empty],
      ['Resume processing timestamp', data.resumeAutoFillTimestamp],
    ]),
  );

  children.push(
    sectionHeading('2. Application & Contact Information'),
    subheading('Position information'),
    responseTable([
      ['Date of Application', data.applicationDate],
      ['Position Applied For', data.positionAppliedFor || application.positionAppliedFor],
      ['Preferred Office Location', data.preferredLocation || application.preferredLocation],
      ['Referred By', data.referredBy],
      ['Available Start Date', data.availableStartDate],
      ["Driver's License", data.driverLicense],
    ]),
    subheading('Personal information'),
    responseTable([
      ['First Name', data.firstName || application.firstName],
      ['Middle Name', data.middleName],
      ['Last Name', data.lastName || application.lastName],
      ['Street Address', data.address],
      ['City', data.city],
      ['State', data.state],
      ['ZIP Code', data.zip],
      ['Email Address', data.email || application.email],
      ['Home Phone', data.phone || application.phone],
      ['Cell Phone', data.cell],
    ]),
  );

  children.push(sectionHeading('3. Employment History'));
  const employment = Array.isArray(data.employment) ? data.employment : [];
  for (let index = 0; index < Math.max(3, employment.length); index += 1) {
    const job = employment[index] || {};
    children.push(
      subheading(`Employment ${index + 1}`),
      responseTable([
        ['Company Name', job.company],
        ['Company Address', job.address],
        ['Phone', job.phone],
        ['Position / Title', job.position],
        ['Date Employed From', job.dateFrom],
        ['Date Employed To', job.dateTo],
        ['Primary Duties / Responsibilities', job.duties],
        ['Reason for Leaving', job.reasonForLeaving],
        ['Supervisor Name / Title', job.supervisor],
      ]),
    );
  }

  children.push(sectionHeading('4. Education'));
  children.push(responseTable([
    ['Highest Level of Education Completed', data.highestEducationLevel],
    ['Additional Education', data.educationAdditional],
  ]));
  const education = Array.isArray(data.education) ? data.education : [];
  for (let index = 0; index < Math.max(3, education.length); index += 1) {
    const school = education[index] || {};
    children.push(
      subheading(`Education ${index + 1}`),
      responseTable([
        ['Institution Name', school.institution],
        ['City / State or Country', school.location],
        ['Degree / Diploma', school.degree],
        ['Field of Study', school.field],
        ['Year Completed', school.yearCompleted],
      ]),
    );
  }

  children.push(
    sectionHeading('5. Skills & Qualifications'),
    responseTable([
      ['Years of Relevant Experience', data.skillsYearsExperience],
      ['Primary Areas of Focus', data.skillsPrimaryFocus],
      ['Technical Skills & Field / Lab Tools', data.skillsTechnical],
      ['Certifications & Licenses', data.certifications],
      ['Field / Lab Experience', data.fieldLabExperience],
      ['Computer / Software Proficiency', data.computerSkills],
      ['Communication & Team Skills', data.skillsCommunication],
      ['Additional Skills Summary', data.skillsSummary],
    ]),
  );

  children.push(sectionHeading('6. Professional References'));
  const references = Array.isArray(data.references) ? data.references : [];
  for (let index = 0; index < Math.max(3, references.length); index += 1) {
    const reference = references[index] || {};
    children.push(
      subheading(`Reference ${index + 1} of 3`),
      responseTable([
        ['Full Name', reference.name],
        ['Company / Organization', reference.company],
        ['Phone Number', reference.phone],
      ]),
    );
  }
  children.push(
    subheading('Reference authorization'),
    body('By initialing below, you authorize Geolabs, Inc. to contact the references listed above regarding your employment history and qualifications.'),
    responseTable([["Applicant's Initials", data.certifyInitials]]),
    ...signatureRecord({
      heading: 'Reference authorization signature record',
      statement: 'By initialing below, you authorize Geolabs, Inc. to contact the references listed above regarding your employment history and qualifications.',
      signature: data.certifyInitials,
      date: data.applicationDate || application.submittedAt,
      method: 'Typed initials',
      application,
    }),
  );

  children.push(
    sectionHeading('7. Medical Information & Authorization', true),
    notice('Confidential — Hiring Review Only', true),
    subheading('Pre-Employment & Employment Physicals'),
    body("After an offer of employment is made, but before employment duties begin, applicants are required to undergo a pre-employment physical examination, including drug and alcohol testing, at the Company's expense and by a Company-selected physician. The offer of employment is conditioned upon the results of such examination."),
    body("Employees may also be required, at any time during the course of their employment, to undergo an annual physical examination including drug and alcohol testing, conducted at the Company's expense by a Company-selected physician."),
    body('I authorize the physician conducting the examination, and any laboratory conducting related testing, to disclose the results of such examination and testing to Geolabs, Inc.'),
    responseTable([["Applicant's Initials", data.medInitials]]),
    ...signatureRecord({
      heading: 'Medical authorization signature record',
      statement: 'I authorize the physician conducting the examination, and any laboratory conducting related testing, to disclose the results of such examination and testing to Geolabs, Inc.',
      signature: data.medInitials,
      date: data.applicationDate || application.submittedAt,
      method: 'Typed initials',
      application,
    }),
    subheading('Ability to Perform Essential Job Functions'),
    body('Geolabs, Inc. complies with all applicable provisions of the Americans with Disabilities Act (ADA) and will not discriminate against any qualified applicant with a disability. Reasonable accommodations will be made for known physical or mental limitations unless doing so would impose an undue hardship.'),
    body(checkedAnswer(data.canPerformDuties, 'I am able to perform the essential functions of the position for which I am applying, with or without reasonable accommodation.')),
    body(checkedAnswer(data.needsAccommodation, 'I may require a reasonable accommodation to perform the essential functions of the position for which I am applying. (If selected, HR may contact you to discuss specific accommodations.)')),
    body('Do not include medical diagnoses or detailed health history here. Specific accommodation needs may be discussed confidentially with HR after a conditional offer is made.', { italics: true }),
  );

  children.push(
    sectionHeading('8. Professional Affiliations'),
    responseTable([
      ['Professional Affiliations, Licenses & Memberships', data.affiliations],
      ['Professional Organizations', data.professionalOrgs],
      ['Professional Licenses', data.professionalLicenses],
    ]),
  );

  children.push(
    sectionHeading('9. Employment Certification & Disclosures'),
    subheading('Fair Credit Reporting Act Disclosure'),
    body('By this document, the Company discloses to you that a consumer report, including an investigative consumer report containing information as to your character, general reputation, personal characteristics, and mode of living, may be obtained for employment purposes as part of the pre-employment background investigation and at any time during your employment. Should an investigative consumer report be requested, you will have the right to request a complete and accurate disclosure of the nature and scope of the investigation requested and a written summary of your rights under the Fair Credit Reporting Act.'),
    body('I agree that Geolabs, Inc. is hereby authorized to inquire into my background, prior employment, and criminal records and may consider any criminal conviction record after a conditional offer of employment is made. The Company may withdraw a conditional employment offer if a criminal conviction record bears a rational relationship to the duties and responsibilities of the position applied for. Criminal conviction records more than five (5) years old for misdemeanors and seven (7) years for felonies (excluding periods of incarceration) will not be considered.'),
    responseTable([["Applicant's Initials", data.fcrInitials]]),
    ...signatureRecord({
      heading: 'FCRA disclosure signature record',
      statement: 'I acknowledge that I have read and understand the Fair Credit Reporting Act Disclosure reproduced above.',
      signature: data.fcrInitials,
      date: data.certificationDate || data.applicationDate || application.submittedAt,
      method: 'Typed initials',
      application,
    }),
    subheading('Other Information'),
    body('If you know anyone currently employed by Geolabs, Inc., please let us know. This is used for internal routing and conflict-of-interest review only.'),
    responseTable([
      ['Do you know anyone presently working at Geolabs, Inc.?', data.knowEmployee],
      ['If yes, who?', data.knowEmployeeName],
    ]),
    subheading('Work Eligibility'),
    body("It is the policy of Geolabs, Inc. to hire only U.S. citizens and aliens who are authorized to work in this country. As a condition of employment, you will be required to produce original documents establishing your identity and authorization to work, and to complete the U.S. Citizenship and Immigration Services' Form I-9."),
    subheading('Certification & At-Will Acknowledgment'),
    body('I certify that all information provided on this application is complete and accurate. I understand that my application will not be considered if it is incomplete. Furthermore, I understand that false, misleading, or incomplete information could lead to a decision not to hire, or may be grounds for termination if already employed. I hereby authorize any investigation of the above or related work experience, education, or reputation information for the purposes of evaluating my application for employment.'),
    body('This application is not a contract and cannot create a contract. I understand that if I am employed, my employment is "at will" and may be terminated at any time by either the Company or myself, with or without cause or notice.'),
    body(checkedAnswer(data.certificationAgreed, 'I have read and understand the above statements, and I certify that all information provided in this application is accurate and complete.')),
    responseTable([
      ["Applicant's Signature", data.certificationSignature],
      ['Application Date', data.certificationDate],
    ]),
    ...signatureRecord({
      heading: 'Employment certification signature record',
      statement: 'I have read and understand the above statements, and I certify that all information provided in this application is accurate and complete.',
      signature: data.certificationSignature,
      date: data.certificationDate,
      application,
    }),
  );

  children.push(
    sectionHeading('10. EEO Voluntary Self-Identification Survey', true),
    notice('RESTRICTED COMPLIANCE INFORMATION — Voluntary responses must be kept separate from hiring decisions and accessed only by authorized HR/compliance personnel.', true),
    subheading('EEO Voluntary Self-Identification Survey'),
    body('This information is collected for federal EEO-1 reporting purposes only. It is voluntary and will not affect your opportunity for employment.'),
    body('The Equal Employment Opportunity Commission (EEOC) requires certain employers to complete an EEO-1 report each year. Covered employers must invite employees and applicants to self-identify gender and race for this report.'),
    body('Completion of this form is voluntary and your decision to provide or withhold this information will not affect your opportunity for employment, or the terms or conditions of your employment. This form will be used for EEO-1 reporting purposes only and will be kept separate from all other personnel records and accessed only by Human Resources.'),
    body('If you choose not to self-identify at this time, the federal government allows Geolabs, Inc. to determine this information by visual survey and/or other available information.'),
    subheading('Gender'),
    body('Select one option, or choose "I do not wish to disclose."'),
    body(checkedAnswer((eeo.gender || data.eeoGender) === 'Male', 'Male')),
    body(checkedAnswer((eeo.gender || data.eeoGender) === 'Female', 'Female')),
    body(checkedAnswer((eeo.gender || data.eeoGender) === 'I do not wish to disclose.', 'I do not wish to disclose.')),
    body('This section is voluntary. If you do not wish to answer, you may leave it blank.', { italics: true }),
    subheading('Race / Ethnicity'),
    body('Select one category that best describes you.'),
    body(checkedAnswer((eeo.race || data.eeoRace) === 'Hispanic or Latino', 'Hispanic or Latino — A person of Cuban, Mexican, Puerto Rican, South or Central American, or other Spanish culture or origin, regardless of race.')),
    body(checkedAnswer((eeo.race || data.eeoRace) === 'White (not Hispanic or Latino)', 'White (not Hispanic or Latino) — A person having origins in any of the original peoples of Europe, the Middle East, or North Africa.')),
    body(checkedAnswer((eeo.race || data.eeoRace) === 'Black or African American (not Hispanic or Latino)', 'Black or African American (not Hispanic or Latino) — A person having origins in any of the Black racial groups of Africa.')),
    body(checkedAnswer((eeo.race || data.eeoRace) === 'Native Hawaiian or Other Pacific Islander (not Hispanic or Latino)', 'Native Hawaiian or Other Pacific Islander (not Hispanic or Latino) — A person having origins in any of the peoples of Hawaii, Guam, Samoa, or other Pacific Islands.')),
    body(checkedAnswer((eeo.race || data.eeoRace) === 'Asian (not Hispanic or Latino)', 'Asian (not Hispanic or Latino) — A person having origins in any of the original peoples of the Far East, Southeast Asia, or the Indian Subcontinent (for example, Cambodia, China, India, Japan, Korea, Malaysia, Pakistan, the Philippines, Thailand, and Vietnam).')),
    body(checkedAnswer((eeo.race || data.eeoRace) === 'Native American or Alaska Native (not Hispanic or Latino)', 'Native American or Alaska Native (not Hispanic or Latino) — A person having origins in any of the original peoples of North and South America (including Central America), and who maintains tribal affiliation or community attachment.')),
    body(checkedAnswer((eeo.race || data.eeoRace) === 'Two or More Races (not Hispanic or Latino)', 'Two or More Races (not Hispanic or Latino) — All persons who identify with more than one of the above five races.')),
    body(checkedAnswer((eeo.race || data.eeoRace) === 'I do not wish to disclose.', 'I do not wish to disclose.')),
    body('This section is voluntary. If you do not wish to answer, you may leave it blank.', { italics: true }),
    responseTable([
      ['Name', data.eeoName],
      ['Date', data.eeoDate],
      ['Gender', eeo.gender || data.eeoGender],
      ['Race / Ethnicity', eeo.race || data.eeoRace],
    ]),
  );

  children.push(
    sectionHeading('11. Voluntary Self-Identification of Disability', true),
    notice('Form CC-305 · OMB Control Number 1250-0005 · Expires 04/30/2026 · Voluntary & Confidential', true),
    responseTable([
      ['Name', data.disabilityName],
      ['Date', data.disabilityDate],
      ['Employee ID', data.disabilityEmployeeId],
    ]),
    subheading('Why are you being asked to complete this form?'),
    body('We are a federal contractor or subcontractor. The law requires us to provide equal employment opportunity to qualified people with disabilities. We have a goal of having at least 7% of our workers as people with disabilities. The law says we must measure our progress towards this goal. To do this, we must ask applicants and employees if they have a disability or have ever had one. People can become disabled, so we need to ask this question at least every five years.'),
    body("Completing this form is voluntary, and we hope that you will choose to do so. Your answer is confidential. No one who makes hiring decisions will see it. Your decision to complete the form and your answer will not harm you in any way. If you want to learn more about the law or this form, visit the U.S. Department of Labor's Office of Federal Contract Compliance Programs (OFCCP) website at www.dol.gov/ofccp."),
    subheading('How do you know if you have a disability?'),
    body('A disability is a condition that substantially limits one or more of your "major life activities." If you have or have ever had such a condition, you are a person with a disability. Disabilities include, but are not limited to:'),
    body([
      '• Alcohol or other substance use disorder (not currently using drugs illegally)',
      '• Autoimmune disorder, for example, lupus, fibromyalgia, rheumatoid arthritis, HIV/AIDS',
      '• Blind or low vision',
      '• Cancer (past or present)',
      '• Cardiovascular or heart disease',
      '• Celiac disease',
      '• Cerebral palsy',
      '• Deaf or serious difficulty hearing',
      '• Diabetes',
      '• Disfigurement, for example, disfigurement caused by burns, wounds, accidents, or congenital disorders',
      '• Epilepsy or other seizure disorder',
      "• Gastrointestinal disorders, for example, Crohn's disease, irritable bowel syndrome",
      '• Intellectual or developmental disability',
      '• Mental health conditions, for example, depression, bipolar disorder, anxiety disorder, schizophrenia, PTSD',
      '• Missing limbs or partially missing limbs',
      '• Mobility impairment, benefiting from the use of a wheelchair, scooter, walker, leg brace(s) and/or other supports',
      "• Nervous system condition, for example, migraine headaches, Parkinson's disease, multiple sclerosis (MS)",
      '• Neurodivergence, for example, attention-deficit/hyperactivity disorder (ADHD), autism spectrum disorder, dyslexia, dyspraxia, other learning disabilities',
      '• Partial or complete paralysis (any cause)',
      '• Pulmonary or respiratory conditions, for example, tuberculosis, asthma, emphysema',
      '• Short stature (dwarfism)',
      '• Traumatic brain injury',
    ].join('\n')),
    subheading('Voluntary Response'),
    body('Please select one option below. Your response is voluntary.'),
    body(checkedAnswer((eeo.disabilityStatus || data.disabilityStatus) === 'Yes, I have a disability, or have had one in the past', 'Yes, I have a disability, or have had one in the past')),
    body(checkedAnswer((eeo.disabilityStatus || data.disabilityStatus) === 'No, I do not have a disability and have not had one in the past', 'No, I do not have a disability and have not had one in the past')),
    body(checkedAnswer((eeo.disabilityStatus || data.disabilityStatus) === 'I do not want to answer', 'I do not want to answer')),
    responseTable([
      ['Disability Status', eeo.disabilityStatus || data.disabilityStatus],
      ['Signature of Applicant', data.disabilitySignature],
      ['Signature Date', data.disabilitySignatureDate],
    ]),
    body('PUBLIC BURDEN STATEMENT: According to the Paperwork Reduction Act of 1995, no persons are required to respond to a collection of information unless such collection displays a valid OMB control number. This survey should take about 5 minutes to complete.', { italics: true }),
    ...signatureRecord({
      heading: 'Company electronic record associated with the voluntary disability response',
      statement: 'By typing your name, you acknowledge this as your electronic signature. This company signature record is separate from, and does not modify, Form CC-305.',
      signature: data.disabilitySignature,
      date: data.disabilitySignatureDate,
      application,
    }),
  );

  children.push(
    sectionHeading('12. Invitation to Self-Identify as a Protected Veteran (VEVRAA)', true),
    notice('This information is collected for affirmative action reporting only. Your decision to self-identify is voluntary and will not affect your application or employment.', true),
    body("Under the regulations implementing the affirmative action provisions of the Vietnam Era Veterans' Readjustment Assistance Act (VEVRAA) of 1972 issued by the Office of Federal Contract Compliance Programs (OFCCP), federal contractors are required to invite applicants and current employees to inform the contractor whether they are veterans belonging to one or more of the categories of veterans covered under VEVRAA who wish to benefit under the contractor's affirmative action program (AAP) for covered veterans."),
    body('In extending this invitation, we advise you that: (a) workers and applicants are under no obligation to respond but may do so in the future if they choose; (b) responses will remain confidential within the Human Resources department; and (c) responses will be used only for the necessary information to include in our affirmative action plan.'),
    body('Refusal to provide this information will have no bearing on your application and will not subject you to any adverse treatment.'),
    subheading('Veteran Status'),
    body('Select one option, or choose "I do not wish to self-identify."'),
    body(checkedAnswer((eeo.veteranStatus || data.veteranStatus) === 'protected', 'I identify as one or more classifications of protected veterans — Includes Disabled Veteran, Recently Separated Veteran, Active-Duty Wartime/Campaign Badge Veteran, or Armed Forces Service Medal Veteran.')),
    body(checkedAnswer((eeo.veteranStatus || data.veteranStatus) === 'notProtected', 'I am not a protected veteran')),
    body(checkedAnswer((eeo.veteranStatus || data.veteranStatus) === 'noAnswer', 'I do not wish to self-identify')),
    subheading('Definitions of protected veteran categories'),
    body('Disabled Veteran — A veteran of the U.S. military, ground, naval or air service who is entitled to compensation under laws administered by the Secretary of Veterans Affairs, or who was discharged because of a service-connected disability.'),
    body('Recently Separated Veteran — Any veteran during the three-year period beginning on the date of discharge or release from active duty in the U.S. military, ground, naval or air service.'),
    body('Active-Duty Wartime or Campaign Badge Veteran — A veteran who served on active duty during a war, campaign, or expedition for which a campaign badge has been authorized.'),
    body('Armed Forces Service Medal Veteran — A veteran who participated in a United States military operation for which an Armed Forces service medal was awarded pursuant to Executive Order No. 12985.'),
    responseTable([
      ['Veteran Status', eeo.veteranStatus || data.veteranStatus],
      ['Signature of Applicant', data.vetSignature],
      ['Date', data.vetDate],
    ]),
    ...signatureRecord({
      heading: 'Protected-veteran self-identification signature record',
      statement: 'By typing your name, you acknowledge this as your electronic signature for the voluntary protected-veteran self-identification response reproduced above.',
      signature: data.vetSignature,
      date: data.vetDate,
      application,
    }),
  );

  children.push(
    sectionHeading('13. Alcohol & Drug Testing Program'),
    ...ALCOHOL_DRUG_PROGRAM_TEXT.split('\n\n').map((paragraph, index, paragraphs) => (
      index === 0
        ? subheading(paragraph)
        : notice(paragraph, index === paragraphs.length - 1)
    )),
    body(checkedAnswer(data.drugTestAgreed, 'I have read, understand, and agree to comply with the Alcohol & Drug Testing Program described above. I agree this constitutes a condition of my employment application and any future employment with Geolabs, Inc.')),
    responseTable([
      ['Signature of Applicant', data.drugTestSignature],
      ['Date', data.drugTestDate],
    ]),
    ...signatureRecord({
      heading: 'Alcohol & drug testing agreement signature record',
      statement: 'I have read, understand, and agree to comply with the Alcohol & Drug Testing Program described above. I agree this constitutes a condition of my employment application and any future employment with Geolabs, Inc.',
      signature: data.drugTestSignature,
      date: data.drugTestDate,
      application,
    }),
  );

  const additionalRows = extraResponseRows(data);
  if (additionalRows.length) {
    children.push(
      sectionHeading('14. Additional Submitted Responses'),
      notice('These fields were submitted by the application but are not part of the standard field set. They are included here to ensure that no applicant response is omitted.'),
      responseTable(additionalRows),
    );
  }

  children.push(
    sectionHeading(additionalRows.length ? '15. Application Record' : '14. Application Record'),
    subheading('Stage history'),
  );
  const history = Array.isArray(application.stageHistory) ? application.stageHistory : [];
  children.push(responseTable(
    history.length
      ? history.map((entry, index) => [
        `Event ${index + 1}`,
        [
          `Stage: ${valueText(entry.stage)}`,
          `Changed: ${safeDate(entry.changedAt)}`,
          `Changed by: ${valueText(entry.changedBy)}`,
          `Note: ${valueText(entry.note)}`,
        ].join('\n'),
      ])
      : [['Stage history', empty]],
  ));
  children.push(subheading('Audit trail'));
  const auditTrail = Array.isArray(application.auditTrail) ? application.auditTrail : [];
  children.push(responseTable(
    auditTrail.length
      ? auditTrail.map((entry, index) => [
        `Audit event ${index + 1}`,
        [
          `Action: ${valueText(entry.action)}`,
          `Performed by: ${valueText(entry.performedBy)}`,
          `Performed: ${safeDate(entry.performedAt)}`,
          `Details: ${valueText(entry.details)}`,
        ].join('\n'),
      ])
      : [['Audit trail', empty]],
  ));
  children.push(subheading('Screening questions'));
  const screeningAnswers = Array.isArray(application.screeningAnswers)
    ? application.screeningAnswers
    : [];
  children.push(responseTable(
    screeningAnswers.length
      ? screeningAnswers.map((entry, index) => [
        `Question ${index + 1}: ${valueText(entry.question)}`,
        entry.answer,
      ])
      : [['Screening questions', empty]],
  ));

  const header = new Header({
    children: [
      new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [640, 9440],
        layout: TableLayoutType.FIXED,
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.SINGLE, size: 5, color: BRONZE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: 640, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 80, bottom: 100, left: 220, right: 80 },
                children: [new Paragraph({ children: [headerLogo] })],
              }),
              new TableCell({
                width: { size: 9440, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 80, bottom: 100, left: 80, right: 100 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Geolabs, Inc.', bold: true, size: 18, color: NAVY }),
                      new TextRun({ text: '   |   Confidential Employment Application', size: 16, color: SLATE }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER } },
        children: [
          new TextRun({ text: 'Geolabs, Inc.  •  Confidential  •  Page ', size: 15, color: SLATE }),
          new TextRun({ children: [PageNumber.CURRENT], size: 15, color: SLATE }),
          new TextRun({ text: ' of ', size: 15, color: SLATE }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 15, color: SLATE }),
        ],
      }),
    ],
  });

  const document = new Document({
    creator: 'Geolabs, Inc. Employment Portal',
    title: `${name} — Complete Employment Application`,
    subject: 'Confidential employment application for authorized HR review',
    description: 'Complete application responses, acknowledgments, signatures, and compliance information.',
    styles: {
      default: {
        document: {
          run: { font: 'Aptos', size: 19, color: NAVY },
          paragraph: { spacing: { line: 280 } },
        },
        heading1: {
          run: { font: 'Aptos Display', bold: true, color: NAVY, size: 28 },
          paragraph: { spacing: { before: 240, after: 160 } },
        },
        heading2: {
          run: { font: 'Aptos Display', bold: true, color: NAVY, size: 22 },
          paragraph: { spacing: { before: 180, after: 100 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.72),
            bottom: convertInchesToTwip(0.72),
            left: convertInchesToTwip(0.75),
            right: convertInchesToTwip(0.75),
          },
        },
      },
      headers: { default: header },
      footers: { default: footer },
      children,
    }],
  });

  return Packer.toBuffer(document);
}
