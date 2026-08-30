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
  PageNumber,
  Packer,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  Paragraph,
  WidthType,
  convertInchesToTwip,
} from 'docx';
import {
  ALCOHOL_DRUG_PROGRAM_TEXT,
  AT_WILL_TEXT,
  EEO_INTRO_PARAGRAPHS,
  EMPLOYMENT_CERTIFICATION_TEXT,
  ESSENTIAL_FUNCTIONS_QUESTION,
  FCRA_AUTHORIZATION_TEXT,
  FCRA_DISCLOSURE_TEXT,
  MEDICAL_AUTHORIZATION_TEXT,
  REFERENCE_AUTHORIZATION_TEXT,
  VETERAN_DEFINITIONS,
  VETERAN_INTRO_PARAGRAPHS,
  WORK_ELIGIBILITY_TEXT,
} from '../src/lib/legalTexts.js';

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

const veteranStatusLabel = value => ({
  protected: 'I identify as one or more of the following classifications of protected veterans',
  notProtected: 'I am not a protected veteran',
  noAnswer: 'I do not wish to self-identify',
})[value] || value;

const borders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
  left: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
  right: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
};

const sectionHeading = (text, restricted = false, pageBreakBefore = false) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  pageBreakBefore,
  keepNext: true,
  spacing: {
    before: 220,
    after: 170,
    line: 320,
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
  alignment: options.alignment || AlignmentType.JUSTIFIED,
  spacing: { after: options.after ?? 75, line: options.line ?? 250 },
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
          margins: { top: 130, bottom: 130, left: 220, right: 220 },
          children: [
            new Paragraph({
              spacing: { line: 300 },
              children: [
                new TextRun({
                  text,
                  bold: restricted,
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

const policyTextBox = paragraphs => new Table({
  width: { size: 10080, type: WidthType.DXA },
  columnWidths: [10080],
  layout: TableLayoutType.FIXED,
  borders: {
    top: { style: BorderStyle.SINGLE, size: 2, color: 'DDBA9E' },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: 'DDBA9E' },
    left: { style: BorderStyle.SINGLE, size: 2, color: 'DDBA9E' },
    right: { style: BorderStyle.SINGLE, size: 2, color: 'DDBA9E' },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 10080, type: WidthType.DXA },
          shading: { type: ShadingType.SOLID, color: PALE_BRONZE },
          margins: { top: 120, bottom: 80, left: 180, right: 180 },
          children: paragraphs.map((paragraph, index) => new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: index === paragraphs.length - 1 ? 0 : 85, line: 250 },
            children: [new TextRun({ text: paragraph, size: 21, color: NAVY, bold: false })],
          })),
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

const hasEnteredValue = record => Object.values(record || {})
  .some(value => String(value ?? '').trim() !== '');

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

export async function buildApplicationDocx(application, options = {}) {
  const mainApplicationOnly = Boolean(options.mainApplicationOnly);
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
    notice(mainApplicationOnly
      ? 'CONFIDENTIAL — Authorized HR and interviewing personnel only.'
      : 'CONFIDENTIAL — Authorized HR and compliance personnel only. Voluntary self-identification information must be handled separately from hiring decisions.', true),
    responseTable([
      ['Application ID', application.id],
      ['Submitted', safeDate(application.submittedAt)],
      ['Preferred office', data.preferredLocation || application.preferredLocation],
      ['Applicant email', application.email || data.email],
    ]),
  );

  children.push(
    sectionHeading('1. Submission Overview', false, true),
    responseTable([
      ['Application ID', application.id],
      ['Position Applied For', position],
      ['Submission date and time', safeDate(application.submittedAt)],
      ['Resume attached', data.resumeFileUrl || application.resumeFileUrl ? 'Yes' : 'No'],
      ['Resume filename', data.resumeFileName || application.resumeFileUrl],
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
  const employment = (Array.isArray(data.employment) ? data.employment : []).filter(hasEnteredValue);
  if (!employment.length) children.push(body('No employment history was provided.', { italics: true }));
  for (let index = 0; index < employment.length; index += 1) {
    const job = employment[index];
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
  const education = (Array.isArray(data.education) ? data.education : []).filter(hasEnteredValue);
  if (!education.length) children.push(body('No education entries were provided.', { italics: true }));
  for (let index = 0; index < education.length; index += 1) {
    const school = education[index];
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
  const references = (Array.isArray(data.references) ? data.references : []).filter(hasEnteredValue);
  if (!references.length) children.push(body('No professional references were provided.', { italics: true }));
  for (let index = 0; index < references.length; index += 1) {
    const reference = references[index];
    children.push(
      subheading(`Reference ${index + 1} of ${references.length}`),
      responseTable([
        ['Full Name', reference.name],
        ['Title', reference.title],
        ['Company / Organization', reference.company],
        ['Phone Number', reference.phone],
      ]),
    );
  }
  children.push(
    subheading('Reference authorization'),
    body(REFERENCE_AUTHORIZATION_TEXT),
    responseTable([["Applicant's Initials", data.certifyInitials]]),
  );

  children.push(
    sectionHeading('7. Medical Information & Authorization', true),
    subheading('Pre-Employment & Employment Physicals'),
    body(MEDICAL_AUTHORIZATION_TEXT),
    responseTable([["Applicant's Initials", data.medInitials]]),
    subheading('Ability to Perform Essential Job Functions'),
    body(ESSENTIAL_FUNCTIONS_QUESTION),
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
    body(FCRA_DISCLOSURE_TEXT),
    body(FCRA_AUTHORIZATION_TEXT),
    responseTable([["Applicant's Initials", data.fcrInitials]]),
    subheading('Other Information'),
    responseTable([
      ['Do you know anyone presently working for our company?', data.knowEmployee],
      ['If yes, who?', data.knowEmployeeName],
    ]),
    subheading('Work Eligibility'),
    body(WORK_ELIGIBILITY_TEXT),
    subheading('Certification & At-Will Acknowledgment'),
    body(EMPLOYMENT_CERTIFICATION_TEXT),
    body(AT_WILL_TEXT, { bold: true }),
    body(checkedAnswer(data.certificationAgreed, 'I have read and understand the above statements, and I certify that all information provided in this application is accurate and complete.')),
    responseTable([
      ["Applicant's Signature", data.certificationSignature],
      ['Application Date', data.certificationDate],
    ]),
  );

  if (!mainApplicationOnly) {
    children.push(
      sectionHeading('10. EEO Voluntary Self-Identification Survey', true, true),
    subheading('EEO Voluntary Self-Identification Survey (Applicant Data)'),
    ...EEO_INTRO_PARAGRAPHS.map(paragraph => body(paragraph)),
    subheading('Gender'),
    body('Select one option.'),
    body(checkedAnswer((eeo.gender || data.eeoGender) === 'Male', 'Male')),
    body(checkedAnswer((eeo.gender || data.eeoGender) === 'Female', 'Female')),
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
    responseTable([
      ['Name', data.eeoName],
      ['Date', data.eeoDate],
      ['Gender', eeo.gender || data.eeoGender],
      ['Race / Ethnicity', eeo.race || data.eeoRace],
    ]),
  );

  children.push(
    sectionHeading('11. Affirmative Action: Applicant Invitation to Self-Identify as a Protected Veteran (VEVRAA)', true, true),
    ...VETERAN_INTRO_PARAGRAPHS.map(paragraph => body(paragraph)),
    body('Please complete the information requested below. Thank you for your cooperation.'),
    subheading('Veteran Status'),
    body('Select one option.'),
    body(checkedAnswer((eeo.veteranStatus || data.veteranStatus) === 'protected', 'I identify as one or more of the following classifications of protected veterans:')),
    body(checkedAnswer((eeo.veteranStatus || data.veteranStatus) === 'notProtected', 'I am not a protected veteran')),
    body(checkedAnswer((eeo.veteranStatus || data.veteranStatus) === 'noAnswer', 'I do not wish to self-identify')),
    subheading('Definitions of protected veteran categories'),
    ...VETERAN_DEFINITIONS.map(definition => body(`${definition.title} — ${definition.text}`)),
    responseTable([
      ['Veteran Status', veteranStatusLabel(eeo.veteranStatus || data.veteranStatus)],
      ['Print Name / Signature', data.vetSignature],
      ['Date', data.vetDate],
    ]),
  );

  children.push(
    sectionHeading('12. Alcohol & Drug Testing Program', false, true),
    subheading(ALCOHOL_DRUG_PROGRAM_TEXT.split('\n\n')[0]),
    policyTextBox(ALCOHOL_DRUG_PROGRAM_TEXT.split('\n\n').slice(1, -1)),
    notice(ALCOHOL_DRUG_PROGRAM_TEXT.split('\n\n').at(-1), true),
    body(checkedAnswer(data.drugTestAgreed, 'I have read, understand, and agree to comply with the Alcohol & Drug Testing Program described above. I agree this constitutes a condition of my employment application and any future employment with Geolabs, Inc.'), { alignment: AlignmentType.JUSTIFIED, after: 70, line: 240 }),
    responseTable([
      ['Signature of Applicant', data.drugTestSignature],
      ['Date', data.drugTestDate],
    ]),
  );

  // Internal workflow history remains available in /admin and is intentionally
  // excluded from applicant and supervisor PDFs unless explicitly requested.
  if (options.includeInternalAuditAppendix) {
  const additionalRows = extraResponseRows(data);
  if (additionalRows.length) {
    children.push(
      sectionHeading('14. Additional Submitted Responses', false, true),
      notice('These fields were submitted by the application but are not part of the standard field set. They are included here to ensure that no applicant response is omitted.'),
      responseTable(additionalRows),
    );
  }

  children.push(
    sectionHeading(additionalRows.length ? '15. Application Record' : '14. Application Record', false, true),
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
  }
  }

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
          run: { font: 'Arial', size: 19, color: NAVY },
          paragraph: { spacing: { line: 280 } },
        },
        heading1: {
          run: { font: 'Arial', bold: true, color: NAVY, size: 28 },
          paragraph: { spacing: { before: 240, after: 160 } },
        },
        heading2: {
          run: { font: 'Arial', bold: true, color: NAVY, size: 22 },
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
