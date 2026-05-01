import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, convertInchesToTwip
} from 'docx';

function saveAs(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const BRAND_COLOR = '1A2E5A'; // navy
const ACCENT_COLOR = 'B8730F'; // bronze
const LIGHT_BG = 'F5F0E8';
const PURPLE_BG = 'EDE9FE';
const AMBER_BG = 'FEF3C7';
const BLUE_BG = 'EFF6FF';

function heading(text, level = 2) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: level === 1 ? 28 : 22, color: BRAND_COLOR })],
    spacing: { before: 240, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT_COLOR } },
  });
}

function sectionHeading(text) {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 18, color: ACCENT_COLOR })],
    spacing: { before: 200, after: 80 },
    shading: { type: ShadingType.SOLID, color: LIGHT_BG },
  });
}

function labelValue(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 18, color: '374151' }),
      new TextRun({ text: value || '—', size: 18, color: '4B5563' }),
    ],
    spacing: { after: 60 },
  });
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: text || '', size: 18, color: '374151', ...opts })],
    spacing: { after: 80 },
  });
}

function boldText(text) {
  return new Paragraph({
    children: [new TextRun({ text: text || '', bold: true, size: 18, color: BRAND_COLOR })],
    spacing: { after: 60 },
  });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB' } },
    spacing: { after: 120 },
    children: [],
  });
}

function bannerParagraph(text, bgColor, textColor) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 18, color: textColor || BRAND_COLOR })],
    shading: { type: ShadingType.SOLID, color: bgColor },
    spacing: { before: 120, after: 120 },
    alignment: AlignmentType.CENTER,
  });
}

function twoColTable(pairs) {
  const rows = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const left = pairs[i];
    const right = pairs[i + 1];
    rows.push(new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: left[0] + ':', bold: true, size: 16, color: '9CA3AF' })] }),
            new Paragraph({ children: [new TextRun({ text: left[1] || '—', size: 18, color: '374151' })] }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        }),
        new TableCell({
          children: right ? [
            new Paragraph({ children: [new TextRun({ text: right[0] + ':', bold: true, size: 16, color: '9CA3AF' })] }),
            new Paragraph({ children: [new TextRun({ text: right[1] || '—', size: 18, color: '374151' })] }),
          ] : [new Paragraph({ children: [] })],
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        }),
      ],
    }));
  }
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
  });
}

// ─── INTERVIEW PACKET ────────────────────────────────────────────────────────
export async function generateInterviewDOCX(app) {
  const fd = app.applicationData || {};
  const name = `${app.firstName} ${app.lastName}`;
  const position = app.requisitionTitle || app.positionAppliedFor || 'Position';
  const submitted = app.submittedAt
    ? new Date(app.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const sections = [];

  // Title block
  sections.push(
    new Paragraph({ children: [new TextRun({ text: 'GEOLABS, INC.', bold: true, size: 32, color: BRAND_COLOR })], alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [new TextRun({ text: 'Interview Packet — Confidential', size: 20, color: ACCENT_COLOR })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    divider(),
    new Paragraph({ children: [new TextRun({ text: name, bold: true, size: 28, color: BRAND_COLOR })], spacing: { after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: position, size: 20, color: ACCENT_COLOR })], spacing: { after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: `Applied: ${submitted}`, size: 18, color: '6B7280' })], spacing: { after: 200 } }),
  );

  // Contact
  sections.push(sectionHeading('Contact Information'));
  sections.push(twoColTable([
    ['Name', name], ['Email', app.email],
    ['Phone', fd.phone || app.phone || '—'], ['Cell', fd.cell || '—'],
    ['Address', [fd.address, fd.city, fd.state, fd.zip].filter(Boolean).join(', ')],
  ]));

  // Application Details
  sections.push(sectionHeading('Application Details'));
  sections.push(twoColTable([
    ['Position Applied For', position],
    ['Available Start Date', fd.availableStartDate || '—'],
    ['Referred By', fd.referredBy || '—'],
  ]));

  // Employment
  const jobs = (fd.employment || []).filter(e => e.company);
  if (jobs.length) {
    sections.push(sectionHeading('Employment History'));
    jobs.forEach(e => {
      sections.push(boldText(`${e.position || 'Position'} — ${e.company}`));
      sections.push(bodyText(`${[e.dateFrom, e.dateTo || 'Present'].filter(Boolean).join(' – ')}${e.supervisor ? `  |  Supervisor: ${e.supervisor}` : ''}`));
      if (e.duties) sections.push(bodyText(e.duties));
      if (e.reasonForLeaving) sections.push(bodyText(`Reason for leaving: ${e.reasonForLeaving}`, { italics: true }));
      sections.push(divider());
    });
  }

  // Education
  const edu = (fd.education || []).filter(e => e.institution);
  if (edu.length) {
    sections.push(sectionHeading('Education'));
    edu.forEach(e => {
      sections.push(boldText([e.degree, e.field].filter(Boolean).join(' — ') || 'Degree'));
      sections.push(bodyText(`${e.institution}${e.yearCompleted ? '  ·  ' + e.yearCompleted : ''}`));
    });
  }

  // Skills
  if (fd.skillsSummary || fd.certifications || fd.computerSkills || fd.fieldLabExperience) {
    sections.push(sectionHeading('Skills & Certifications'));
    if (fd.skillsSummary) { sections.push(boldText('Skills Summary')); sections.push(bodyText(fd.skillsSummary)); }
    if (fd.certifications) { sections.push(boldText('Certifications')); sections.push(bodyText(fd.certifications)); }
    if (fd.computerSkills) { sections.push(boldText('Software / Computer Skills')); sections.push(bodyText(fd.computerSkills)); }
    if (fd.fieldLabExperience) { sections.push(boldText('Field / Lab Experience')); sections.push(bodyText(fd.fieldLabExperience)); }
  }

  // References
  const refs = (fd.references || []).filter(r => r.name);
  if (refs.length) {
    sections.push(sectionHeading('Professional References'));
    refs.forEach(r => {
      sections.push(boldText(r.name));
      sections.push(bodyText([r.company, r.phone, r.email, r.relationship].filter(Boolean).join('  ·  ')));
    });
  }

  // Affiliations
  if (fd.affiliations) {
    sections.push(sectionHeading('Professional Affiliations'));
    sections.push(bodyText(fd.affiliations));
  }

  // Screening
  const screening = app.screeningAnswers || [];
  if (screening.length) {
    sections.push(sectionHeading('Screening Questions'));
    screening.forEach(qa => {
      sections.push(boldText(qa.question));
      sections.push(bodyText(qa.answer || '—'));
    });
  }

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.25), right: convertInchesToTwip(1.25) } } }, children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${name.replace(/ /g, '_')}_Interview_Packet.docx`);
}

// ─── FULL COMPLIANCE RECORD ──────────────────────────────────────────────────
export async function generateFullDOCX(app) {
  const fd = app.applicationData || {};
  const eeo = app.eeoData || {};
  const name = `${app.firstName} ${app.lastName}`;
  const position = app.requisitionTitle || app.positionAppliedFor || 'Position';
  const submitted = app.submittedAt
    ? new Date(app.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const sections = [];

  // Title block
  sections.push(
    new Paragraph({ children: [new TextRun({ text: 'GEOLABS, INC.', bold: true, size: 32, color: BRAND_COLOR })], alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [new TextRun({ text: 'Full Application Record — HR & Compliance Use Only', size: 20, color: ACCENT_COLOR })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    bannerParagraph('⚠  CONFIDENTIAL — For Authorized HR & Compliance Personnel Only. Do Not Distribute.', 'EDE9FE', '6D28D9'),
    divider(),
    new Paragraph({ children: [new TextRun({ text: name, bold: true, size: 28, color: BRAND_COLOR })], spacing: { after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: position, size: 20, color: ACCENT_COLOR })], spacing: { after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: `Submitted: ${submitted}  ·  ID: ${app.id}`, size: 18, color: '6B7280' })], spacing: { after: 200 } }),
  );

  // Contact
  sections.push(sectionHeading('Contact Information'));
  sections.push(twoColTable([
    ['Name', name], ['Email', app.email],
    ['Phone', fd.phone || app.phone || '—'], ['Cell', fd.cell || '—'],
    ['Address', [fd.address, fd.city, fd.state, fd.zip].filter(Boolean).join(', ')],
  ]));

  // Application Details
  sections.push(sectionHeading('Application Details'));
  sections.push(twoColTable([
    ['Position Applied For', position], ['Available Start Date', fd.availableStartDate || '—'],
    ['Referred By', fd.referredBy || '—'], ['Source', app.source || '—'],
    ['Application ID', app.id || '—'],
  ]));

  // Employment
  const jobs = (fd.employment || []).filter(e => e.company);
  if (jobs.length) {
    sections.push(sectionHeading('Employment History'));
    jobs.forEach(e => {
      sections.push(boldText(`${e.position || 'Position'} — ${e.company}`));
      sections.push(bodyText(`${[e.dateFrom, e.dateTo || 'Present'].filter(Boolean).join(' – ')}${e.supervisor ? `  |  Supervisor: ${e.supervisor}` : ''}`));
      if (e.duties) sections.push(bodyText(e.duties));
      if (e.reasonForLeaving) sections.push(bodyText(`Reason for leaving: ${e.reasonForLeaving}`, { italics: true }));
      sections.push(divider());
    });
  }

  // Education
  const edu = (fd.education || []).filter(e => e.institution);
  if (edu.length) {
    sections.push(sectionHeading('Education'));
    edu.forEach(e => {
      sections.push(boldText([e.degree, e.field].filter(Boolean).join(' — ') || 'Degree'));
      sections.push(bodyText(`${e.institution}${e.yearCompleted ? '  ·  ' + e.yearCompleted : ''}`));
    });
  }

  // Skills
  if (fd.skillsSummary || fd.certifications || fd.computerSkills || fd.fieldLabExperience) {
    sections.push(sectionHeading('Skills & Certifications'));
    if (fd.skillsSummary) { sections.push(boldText('Skills Summary')); sections.push(bodyText(fd.skillsSummary)); }
    if (fd.certifications) { sections.push(boldText('Certifications')); sections.push(bodyText(fd.certifications)); }
    if (fd.computerSkills) { sections.push(boldText('Software / Computer Skills')); sections.push(bodyText(fd.computerSkills)); }
    if (fd.fieldLabExperience) { sections.push(boldText('Field / Lab Experience')); sections.push(bodyText(fd.fieldLabExperience)); }
  }

  // Affiliations
  if (fd.affiliations) {
    sections.push(sectionHeading('Professional Affiliations'));
    sections.push(bodyText(fd.affiliations));
  }

  // References
  const refs = (fd.references || []).filter(r => r.name);
  if (refs.length) {
    sections.push(sectionHeading('Professional References'));
    refs.forEach(r => {
      sections.push(boldText(r.name));
      sections.push(bodyText([r.company, r.phone, r.email, r.relationship].filter(Boolean).join('  ·  ')));
    });
  }

  // Screening
  const screening = app.screeningAnswers || [];
  if (screening.length) {
    sections.push(sectionHeading('Screening Questions'));
    screening.forEach(qa => {
      sections.push(boldText(qa.question));
      sections.push(bodyText(qa.answer || '—'));
    });
  }

  // ── MEDICAL & ADA ──────────────────────────────────────────────────────────
  sections.push(new Paragraph({ children: [], pageBreakBefore: true }));
  sections.push(bannerParagraph('MEDICAL INFORMATION & AUTHORIZATION — Confidential / Hiring Review Only', AMBER_BG, '92400E'));

  sections.push(sectionHeading('Pre-Employment & Employment Physicals'));
  sections.push(bodyText('After an offer of employment is made, but before employment duties begin, applicants are required to undergo a pre-employment physical examination, including drug and alcohol testing, at the Company\'s expense and by a Company-selected physician. The offer of employment is conditioned upon the results of such examination.'));
  sections.push(bodyText('Employees may also be required, at any time during the course of their employment, to undergo an annual physical examination including drug and alcohol testing, conducted at the Company\'s expense by a Company-selected physician.'));
  sections.push(bodyText('I authorize the physician conducting the examination, and any laboratory conducting related testing, to disclose the results of such examination and testing to Geolabs, Inc.'));
  sections.push(new Paragraph({ shading: { type: ShadingType.SOLID, color: AMBER_BG }, children: [new TextRun({ text: `Applicant's Initials: ${fd.medInitials || '—'}`, bold: true, size: 18 })], spacing: { before: 100, after: 100 } }));

  sections.push(sectionHeading('Ability to Perform Essential Job Functions (ADA)'));
  sections.push(bodyText('Geolabs, Inc. complies with all applicable provisions of the Americans with Disabilities Act (ADA) and will not discriminate against any qualified applicant with a disability. Reasonable accommodations will be made for known physical or mental limitations unless doing so would impose an undue hardship.'));
  sections.push(bodyText('☐  Checkbox 1 — "I am able to perform the essential functions of the position for which I am applying, with or without reasonable accommodation."'));
  sections.push(bodyText('☐  Checkbox 2 — "I may require a reasonable accommodation to perform the essential functions of the position for which I am applying."'));
  sections.push(new Paragraph({
    shading: { type: ShadingType.SOLID, color: AMBER_BG },
    children: [
      new TextRun({ text: `Can Perform Essential Functions: ${fd.canPerformDuties ? 'YES — Checked' : 'Not checked'}     `, bold: true, size: 18 }),
      new TextRun({ text: `Accommodation Requested: ${fd.needsAccommodation ? 'YES — Checked' : 'Not checked'}`, bold: true, size: 18 }),
    ],
    spacing: { before: 100, after: 100 },
  }));

  // ── FCRA & CERTIFICATION ───────────────────────────────────────────────────
  sections.push(new Paragraph({ children: [], pageBreakBefore: true }));
  sections.push(bannerParagraph('FAIR CREDIT REPORTING ACT DISCLOSURE & EMPLOYMENT CERTIFICATION', BLUE_BG, '1E40AF'));

  sections.push(sectionHeading('Fair Credit Reporting Act (FCRA) Disclosure'));
  sections.push(bodyText('By this document, the Company discloses to you that a consumer report, including an investigative consumer report containing information as to your character, general reputation, personal characteristics, and mode of living, may be obtained for employment purposes as part of the pre-employment background investigation and at any time during your employment.'));
  sections.push(bodyText('I agree that Geolabs, Inc. is hereby authorized to inquire into my background, prior employment, and criminal records and may consider any criminal conviction record after a conditional offer of employment is made. Criminal conviction records more than five (5) years old for misdemeanors and seven (7) years for felonies (excluding periods of incarceration) will not be considered.'));
  sections.push(new Paragraph({ shading: { type: ShadingType.SOLID, color: BLUE_BG }, children: [new TextRun({ text: `Applicant's Initials: ${fd.fcrInitials || '—'}`, bold: true, size: 18 })], spacing: { before: 100, after: 100 } }));

  sections.push(sectionHeading('Work Eligibility Statement'));
  sections.push(bodyText('It is the policy of Geolabs, Inc. to hire only U.S. citizens and aliens who are authorized to work in this country. As a condition of employment, you will be required to produce original documents establishing your identity and authorization to work, and to complete the U.S. Citizenship and Immigration Services\' Form I-9.'));

  sections.push(sectionHeading('Certification & At-Will Employment Acknowledgment'));
  sections.push(bodyText('I certify that all information provided on this application is complete and accurate. I understand that false, misleading, or incomplete information could lead to a decision not to hire, or may be grounds for termination if already employed. I hereby authorize any investigation of the above or related work experience, education, or reputation information for the purposes of evaluating my application for employment.'));
  sections.push(bodyText('This application is not a contract. I understand that if I am employed, my employment is "at will" and may be terminated at any time by either the Company or myself, with or without cause or notice.'));
  sections.push(new Paragraph({
    shading: { type: ShadingType.SOLID, color: BLUE_BG },
    children: [
      new TextRun({ text: `Certification Agreed: ${fd.certificationAgreed ? 'YES — Checked' : 'Not checked'}`, bold: true, size: 18 }),
      new TextRun({ text: `     Knows Geolabs Employee?: ${fd.knowEmployee || '—'}`, size: 18 }),
    ],
    spacing: { before: 80, after: 60 },
  }));
  sections.push(new Paragraph({
    shading: { type: ShadingType.SOLID, color: BLUE_BG },
    children: [
      new TextRun({ text: `Electronic Signature: ${fd.certificationSignature || '—'}`, bold: true, size: 18 }),
      new TextRun({ text: `     Date: ${fd.certificationDate || '—'}`, size: 18 }),
    ],
    spacing: { before: 60, after: 100 },
  }));

  // ── EEO ───────────────────────────────────────────────────────────────────
  sections.push(new Paragraph({ children: [], pageBreakBefore: true }));
  sections.push(bannerParagraph('RESTRICTED — EEO / Self-Identification Data (Voluntary — For Compliance Reporting Only)', PURPLE_BG, '6D28D9'));

  sections.push(sectionHeading('EEO Voluntary Self-Identification Survey (Form EEO-1)'));
  sections.push(bodyText('The Equal Employment Opportunity Commission (EEOC) requires certain employers to complete an EEO-1 report each year. Completion of this form is voluntary and will not affect your opportunity for employment. This form will be kept separate from all other personnel records and accessed only by Human Resources.'));
  sections.push(twoColTable([
    ['Name', fd.eeoName || '—'], ['Date', fd.eeoDate || '—'],
    ['Gender', eeo.gender || fd.eeoGender || '—'], ['Race / Ethnicity', eeo.race || fd.eeoRace || '—'],
  ]));

  sections.push(sectionHeading('Voluntary Self-Identification of Disability — Form CC-305'));
  sections.push(bodyText('We are a federal contractor or subcontractor. The law requires us to provide equal employment opportunity to qualified people with disabilities. Completing this form is voluntary and your answer is confidential.'));
  sections.push(twoColTable([
    ['Name', fd.disabilityName || '—'], ['Date', fd.disabilityDate || '—'],
    ['Disability Status', eeo.disabilityStatus || fd.disabilityStatus || '—'], ['Employee ID', fd.disabilityEmployeeId || '—'],
    ['Electronic Signature', fd.disabilitySignature || '—'], ['Signature Date', fd.disabilitySignatureDate || '—'],
  ]));

  sections.push(sectionHeading('Veteran Self-Identification — VEVRAA'));
  sections.push(bodyText('Under VEVRAA regulations, federal contractors are required to invite applicants to inform the contractor whether they belong to a protected veteran category. Responses are confidential and used only for affirmative action reporting.'));
  sections.push(twoColTable([
    ['Veteran Status', eeo.veteranStatus || fd.veteranStatus || '—'],
    ['Electronic Signature', fd.vetSignature || '—'],
    ['Signature Date', fd.vetDate || '—'],
  ]));

  // ── Drug & Alcohol ─────────────────────────────────────────────────────────
  sections.push(new Paragraph({ children: [], pageBreakBefore: true }));
  sections.push(sectionHeading('Alcohol & Drug Testing Agreement'));
  sections.push(bodyText('Geolabs, Inc. maintains a Drug-Free Workplace policy. As a condition of employment, all employees and applicants are subject to drug and alcohol testing in accordance with applicable federal and state laws.'));
  sections.push(new Paragraph({
    shading: { type: ShadingType.SOLID, color: 'FEE2E2' },
    children: [new TextRun({ text: 'ANY APPLICANT OR EMPLOYEE WHO REFUSES TO SUBMIT TO TESTING, ADULTERATES OR TAMPERS WITH A SAMPLE, OR TESTS POSITIVE FOR PROHIBITED SUBSTANCES WILL BE SUBJECT TO DISQUALIFICATION FROM EMPLOYMENT OR IMMEDIATE TERMINATION.', bold: true, size: 18, color: 'B91C1C' })],
    spacing: { before: 100, after: 100 },
  }));
  sections.push(bodyText('By signing below, I acknowledge that I have read and fully understand the above Alcohol & Drug Testing Program statement and agree to comply with all related policies.'));
  sections.push(twoColTable([
    ['Agreed', fd.drugTestAgreed ? 'YES — I agree' : 'Not agreed'], ['Electronic Signature', fd.drugTestSignature || '—'],
    ['Signature Date', fd.drugTestDate || '—'],
  ]));

  // Stage history
  const stageHistory = app.stageHistory || [];
  if (stageHistory.length) {
    sections.push(sectionHeading('Application Stage History'));
    stageHistory.forEach(h => {
      sections.push(bodyText(`${h.stage?.replace(/_/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase())}  —  ${new Date(h.changedAt).toLocaleDateString()}  ·  ${h.changedBy || '—'}`));
    });
  }

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.25), right: convertInchesToTwip(1.25) } } }, children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${name.replace(/ /g, '_')}_Full_Application_Record.docx`);
}