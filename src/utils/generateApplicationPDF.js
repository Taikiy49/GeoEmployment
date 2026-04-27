import { jsPDF } from 'jspdf';

const LOGO_URL = 'https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/e4e60e6f1_geolabs.png';
const BRONZE = [184, 115, 51];
const NAVY = [15, 23, 42];
const GRAY = [107, 114, 128];
const LIGHT = [249, 250, 251];
const BORDER = [229, 231, 235];

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function header(doc, logoData, subtitle) {
  // Navy bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 28, 'F');
  // Logo
  if (logoData) {
    doc.addImage(logoData, 'PNG', 10, 5, 18, 18);
  }
  // Company name
  doc.setTextColor(184, 115, 51);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Geolabs, Inc.', 32, 13);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 32, 20);
  return 36;
}

function footer(doc, pageNum, total) {
  const y = 287;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(10, y, 200, y);
  doc.setTextColor(...GRAY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Geolabs, Inc. · 94-429 Koaki St, Suite 200 · Waipahu, HI 96797 · Equal Opportunity Employer', 10, y + 4);
  doc.text(`Page ${pageNum} of ${total}`, 200, y + 4, { align: 'right' });
}

function sectionTitle(doc, y, text) {
  doc.setFillColor(253, 247, 241);
  doc.rect(10, y, 190, 7, 'F');
  doc.setTextColor(...BRONZE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(text.toUpperCase(), 14, y + 5);
  return y + 11;
}

function labelValue(doc, y, label, value, colX = 10, colW = 190) {
  const halfW = colW / 2;
  doc.setTextColor(...GRAY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(label, colX, y);
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'bold');
  const lines = doc.splitTextToSize(String(value || '—'), halfW - 4);
  doc.text(lines, colX + halfW * 0.45, y);
  return y + lines.length * 4.5 + 2;
}

function twoCol(doc, y, pairs) {
  // pairs: [[label, value], [label, value]] per row
  let maxY = y;
  pairs.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 10 : 110;
    const rowY = y + row * 14;
    doc.setTextColor(...GRAY);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(label.toUpperCase(), x, rowY);
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize(String(value || '—'), 92);
    doc.text(lines, x, rowY + 4);
    const endY = rowY + 4 + lines.length * 4;
    if (endY > maxY) maxY = endY;
  });
  return maxY + 6;
}

function checkPage(doc, y, needed = 20, logoData, subtitle) {
  if (y + needed > 280) {
    doc.addPage();
    return header(doc, logoData, subtitle);
  }
  return y;
}

// ─── INTERVIEW PACKET (no sensitive data) ───────────────────────────────────
export async function generateInterviewPDF(app) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoData = await loadImage(LOGO_URL);
  const subtitle = 'Interview Packet — Confidential';
  const fd = app.applicationData || {};
  const position = app.requisitionTitle || app.positionAppliedFor || 'Position';
  const name = `${app.firstName} ${app.lastName}`;
  const submitted = app.submittedAt
    ? new Date(app.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  let y = header(doc, logoData, subtitle);

  // Candidate name bar
  doc.setFillColor(245, 240, 232);
  doc.rect(10, y, 190, 14, 'F');
  doc.setTextColor(...NAVY);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(name, 14, y + 9);
  doc.setTextColor(...BRONZE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(position, 14, y + 14);
  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.text(`Applied: ${submitted}`, 196, y + 9, { align: 'right' });
  y += 20;

  // Contact
  y = sectionTitle(doc, y, 'Contact Information');
  y = twoCol(doc, y, [
    ['Name', name],
    ['Email', app.email],
    ['Phone', fd.phone || app.phone || '—'],
    ['Cell', fd.cell || '—'],
    ['Address', [fd.address, fd.city, fd.state, fd.zip].filter(Boolean).join(', ')],
  ]);

  // Application details
  y = checkPage(doc, y, 30, logoData, subtitle);
  y = sectionTitle(doc, y, 'Application Details');
  y = twoCol(doc, y, [
    ['Position Applied For', position],
    ['Available Start Date', fd.availableStartDate || '—'],
    ['Referred By', fd.referredBy || '—'],
  ]);

  // Employment History
  const jobs = (fd.employment || []).filter(e => e.company);
  if (jobs.length) {
    y = checkPage(doc, y, 20, logoData, subtitle);
    y = sectionTitle(doc, y, 'Employment History');
    jobs.forEach((e, i) => {
      y = checkPage(doc, y, 24, logoData, subtitle);
      doc.setFillColor(i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 250 : 255);
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.2);
      doc.rect(10, y, 190, 1, 'S');
      doc.setTextColor(...NAVY);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${e.position || 'Position'} — ${e.company}`, 14, y + 6);
      doc.setTextColor(...GRAY);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text([e.dateFrom, e.dateTo || 'Present'].filter(Boolean).join(' – '), 14, y + 11);
      y += 14;
      if (e.duties) {
        const lines = doc.splitTextToSize(e.duties, 180);
        doc.setTextColor(55, 65, 81);
        doc.setFontSize(8);
        doc.text(lines, 14, y);
        y += lines.length * 4 + 4;
      } else {
        y += 2;
      }
    });
    y += 4;
  }

  // Education
  const edu = (fd.education || []).filter(e => e.institution);
  if (edu.length) {
    y = checkPage(doc, y, 20, logoData, subtitle);
    y = sectionTitle(doc, y, 'Education');
    edu.forEach((e, i) => {
      y = checkPage(doc, y, 16, logoData, subtitle);
      doc.setTextColor(...NAVY);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text([e.degree, e.field].filter(Boolean).join(' — ') || 'Degree', 14, y + 5);
      doc.setTextColor(...GRAY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${e.institution}${e.yearCompleted ? '  ·  ' + e.yearCompleted : ''}`, 14, y + 10);
      y += 15;
    });
    y += 2;
  }

  // Skills
  if (fd.skillsSummary || fd.certifications || fd.computerSkills || fd.fieldLabExperience) {
    y = checkPage(doc, y, 20, logoData, subtitle);
    y = sectionTitle(doc, y, 'Skills & Certifications');
    for (const [label, val] of [
      ['Skills Summary', fd.skillsSummary],
      ['Certifications', fd.certifications],
      ['Software / Computer Skills', fd.computerSkills],
      ['Field / Lab Experience', fd.fieldLabExperience],
    ]) {
      if (val) {
        const lines = doc.splitTextToSize(val, 178);
        y = checkPage(doc, y, lines.length * 4 + 10, logoData, subtitle);
        doc.setTextColor(...GRAY);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(label.toUpperCase(), 14, y);
        y += 4;
        doc.setTextColor(55, 65, 81);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(lines, 14, y);
        y += lines.length * 4 + 6;
      }
    }
  }

  // References
  const refs = (fd.references || []).filter(r => r.name);
  if (refs.length) {
    y = checkPage(doc, y, 20, logoData, subtitle);
    y = sectionTitle(doc, y, 'Professional References');
    refs.forEach(r => {
      y = checkPage(doc, y, 16, logoData, subtitle);
      doc.setTextColor(...NAVY);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(r.name, 14, y + 5);
      doc.setTextColor(...GRAY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const info = [r.company, r.phone, r.email, r.relationship].filter(Boolean).join('  ·  ');
      doc.text(info, 14, y + 10);
      y += 15;
    });
  }

  // Affiliations
  if (fd.affiliations) {
    y = checkPage(doc, y, 20, logoData, subtitle);
    y = sectionTitle(doc, y, 'Professional Affiliations');
    const lines = doc.splitTextToSize(fd.affiliations, 178);
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(lines, 14, y);
    y += lines.length * 4 + 6;
  }

  // Screening answers
  const screening = app.screeningAnswers || [];
  if (screening.length) {
    y = checkPage(doc, y, 20, logoData, subtitle);
    y = sectionTitle(doc, y, 'Screening Questions');
    screening.forEach(qa => {
      const qLines = doc.splitTextToSize(qa.question, 178);
      y = checkPage(doc, y, qLines.length * 4 + 12, logoData, subtitle);
      doc.setTextColor(...GRAY);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(qLines, 14, y);
      y += qLines.length * 4 + 2;
      const aLines = doc.splitTextToSize(qa.answer || '—', 178);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'normal');
      doc.text(aLines, 14, y);
      y += aLines.length * 4 + 6;
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    footer(doc, i, pageCount);
  }

  doc.save(`${name.replace(/ /g, '_')}_Interview_Packet.pdf`);
}

// ─── FULL COMPLIANCE PACKET (everything) ────────────────────────────────────
export async function generateFullPDF(app) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoData = await loadImage(LOGO_URL);
  const subtitle = 'Full Application Record — HR & Compliance Use Only';
  const fd = app.applicationData || {};
  const eeo = app.eeoData || {};
  const position = app.requisitionTitle || app.positionAppliedFor || 'Position';
  const name = `${app.firstName} ${app.lastName}`;
  const submitted = app.submittedAt
    ? new Date(app.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  let y = header(doc, logoData, subtitle);

  // Restricted banner
  doc.setFillColor(245, 243, 255);
  doc.setDrawColor(167, 139, 250);
  doc.setLineWidth(0.4);
  doc.rect(10, y, 190, 8, 'FD');
  doc.setTextColor(109, 40, 217);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('⚠  CONFIDENTIAL — For Authorized HR & Compliance Personnel Only. Do Not Distribute.', 105, y + 5.5, { align: 'center' });
  y += 13;

  // Candidate name bar
  doc.setFillColor(245, 240, 232);
  doc.rect(10, y, 190, 14, 'F');
  doc.setTextColor(...NAVY);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(name, 14, y + 9);
  doc.setTextColor(...BRONZE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(position, 14, y + 14);
  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.text(`Submitted: ${submitted}  ·  ID: ${app.id}`, 196, y + 9, { align: 'right' });
  y += 20;

  // Contact
  y = sectionTitle(doc, y, 'Contact Information');
  y = twoCol(doc, y, [
    ['Name', name],
    ['Email', app.email],
    ['Phone', fd.phone || app.phone || '—'],
    ['Cell', fd.cell || '—'],
    ['Address', [fd.address, fd.city, fd.state, fd.zip].filter(Boolean).join(', ')],
  ]);

  // Application details
  y = checkPage(doc, y, 30, logoData, subtitle);
  y = sectionTitle(doc, y, 'Application Details');
  y = twoCol(doc, y, [
    ['Position Applied For', position],
    ['Available Start Date', fd.availableStartDate || '—'],
    ['Referred By', fd.referredBy || '—'],
    ['Source', app.source || '—'],
    ['Application ID', app.id || '—'],
  ]);

  // Employment History
  const jobs = (fd.employment || []).filter(e => e.company);
  if (jobs.length) {
    y = checkPage(doc, y, 20, logoData, subtitle);
    y = sectionTitle(doc, y, 'Employment History');
    jobs.forEach((e) => {
      y = checkPage(doc, y, 24, logoData, subtitle);
      doc.setTextColor(...NAVY);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${e.position || 'Position'} — ${e.company}`, 14, y + 5);
      doc.setTextColor(...GRAY);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text([e.dateFrom, e.dateTo || 'Present'].filter(Boolean).join(' – '), 14, y + 10);
      if (e.supervisor) doc.text(`Supervisor: ${e.supervisor}`, 120, y + 10);
      y += 13;
      if (e.duties) {
        const lines = doc.splitTextToSize(e.duties, 178);
        doc.setTextColor(55, 65, 81);
        doc.setFontSize(8);
        doc.text(lines, 14, y);
        y += lines.length * 4 + 4;
      }
      if (e.reasonForLeaving) {
        doc.setTextColor(...GRAY);
        doc.setFontSize(7.5);
        doc.text(`Reason for leaving: ${e.reasonForLeaving}`, 14, y);
        y += 6;
      }
      y += 2;
    });
  }

  // Education
  const edu = (fd.education || []).filter(e => e.institution);
  if (edu.length) {
    y = checkPage(doc, y, 20, logoData, subtitle);
    y = sectionTitle(doc, y, 'Education');
    edu.forEach(e => {
      y = checkPage(doc, y, 16, logoData, subtitle);
      doc.setTextColor(...NAVY);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text([e.degree, e.field].filter(Boolean).join(' — ') || 'Degree', 14, y + 5);
      doc.setTextColor(...GRAY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${e.institution}${e.yearCompleted ? '  ·  ' + e.yearCompleted : ''}`, 14, y + 10);
      y += 15;
    });
    y += 2;
  }

  // Skills
  if (fd.skillsSummary || fd.certifications || fd.computerSkills || fd.fieldLabExperience) {
    y = checkPage(doc, y, 20, logoData, subtitle);
    y = sectionTitle(doc, y, 'Skills & Certifications');
    for (const [label, val] of [
      ['Skills Summary', fd.skillsSummary],
      ['Certifications', fd.certifications],
      ['Software / Computer Skills', fd.computerSkills],
      ['Field / Lab Experience', fd.fieldLabExperience],
    ]) {
      if (val) {
        const lines = doc.splitTextToSize(val, 178);
        y = checkPage(doc, y, lines.length * 4 + 10, logoData, subtitle);
        doc.setTextColor(...GRAY);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(label.toUpperCase(), 14, y);
        y += 4;
        doc.setTextColor(55, 65, 81);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(lines, 14, y);
        y += lines.length * 4 + 6;
      }
    }
  }

  // Affiliations
  if (fd.affiliations) {
    y = checkPage(doc, y, 20, logoData, subtitle);
    y = sectionTitle(doc, y, 'Professional Affiliations');
    const lines = doc.splitTextToSize(fd.affiliations, 178);
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(lines, 14, y);
    y += lines.length * 4 + 6;
  }

  // References
  const refs = (fd.references || []).filter(r => r.name);
  if (refs.length) {
    y = checkPage(doc, y, 20, logoData, subtitle);
    y = sectionTitle(doc, y, 'Professional References');
    refs.forEach(r => {
      y = checkPage(doc, y, 16, logoData, subtitle);
      doc.setTextColor(...NAVY);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(r.name, 14, y + 5);
      doc.setTextColor(...GRAY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const info = [r.company, r.phone, r.email, r.relationship].filter(Boolean).join('  ·  ');
      doc.text(info, 14, y + 10);
      y += 15;
    });
  }

  // Screening answers
  const screening = app.screeningAnswers || [];
  if (screening.length) {
    y = checkPage(doc, y, 20, logoData, subtitle);
    y = sectionTitle(doc, y, 'Screening Questions');
    screening.forEach(qa => {
      const qLines = doc.splitTextToSize(qa.question, 178);
      y = checkPage(doc, y, qLines.length * 4 + 12, logoData, subtitle);
      doc.setTextColor(...GRAY);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(qLines, 14, y);
      y += qLines.length * 4 + 2;
      const aLines = doc.splitTextToSize(qa.answer || '—', 178);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'normal');
      doc.text(aLines, 14, y);
      y += aLines.length * 4 + 6;
    });
  }

  // Certifications & Disclosures
  y = checkPage(doc, y, 30, logoData, subtitle);
  y = sectionTitle(doc, y, 'Certifications & Legal Disclosures');
  y = twoCol(doc, y, [
    ['FCRA Initials', fd.fcrInitials || '—'],
    ['Medical Disclosure Initials', fd.medInitials || '—'],
    ['ADA / Can Perform Duties', fd.canPerformDuties ? 'Yes' : 'No'],
    ['Accommodation Requested', fd.needsAccommodation ? 'Yes' : 'No'],
    ['Known Geolabs Employee?', fd.knowEmployee || '—'],
    ['Employee Name(s)', fd.knowEmployeeName || '—'],
    ['Certification Agreed', fd.certificationAgreed ? 'Yes' : 'No'],
    ['Electronic Signature', fd.certificationSignature || '—'],
    ['Signature Date', fd.certificationDate || '—'],
    ['Drug Test Agreed', fd.drugTestAgreed ? 'Yes' : 'No'],
    ['Drug Test Signature', fd.drugTestSignature || '—'],
    ['Drug Test Signed Date', fd.drugTestDate || '—'],
  ]);

  // ── EEO / Self-ID restricted banner ──────────────────────────────────────
  doc.addPage();
  y = header(doc, logoData, subtitle);
  doc.setFillColor(245, 243, 255);
  doc.setDrawColor(167, 139, 250);
  doc.setLineWidth(0.3);
  doc.rect(10, y, 190, 7, 'FD');
  doc.setTextColor(109, 40, 217);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('RESTRICTED — EEO / Self-Identification Data (Voluntary — For Compliance Reporting Only)', 105, y + 5, { align: 'center' });
  y += 12;

  // ── EEO Self-ID (Form EEO-1) ──────────────────────────────────────────────
  y = sectionTitle(doc, y, 'EEO Voluntary Self-Identification Survey (Form EEO-1)');

  const eeoDisclosure = [
    'The Equal Employment Opportunity Commission (EEOC) requires certain employers to complete an EEO-1 report each year. Covered employers must invite employees and applicants to self-identify gender and race for this report.',
    'Completion of this form is voluntary and your decision to provide or withhold this information will not affect your opportunity for employment, or the terms or conditions of your employment. This form will be used for EEO-1 reporting purposes only and will be kept separate from all other personnel records and accessed only by Human Resources.',
    'If you choose not to self-identify at this time, the federal government allows Geolabs, Inc. to determine this information by visual survey and/or other available information.',
  ];
  for (const para of eeoDisclosure) {
    const lines = doc.splitTextToSize(para, 178);
    y = checkPage(doc, y, lines.length * 4 + 6, logoData, subtitle);
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(lines, 14, y);
    y += lines.length * 4 + 4;
  }
  y += 2;

  // EEO Response
  doc.setFillColor(245, 243, 255);
  doc.rect(10, y, 190, 28, 'F');
  doc.setTextColor(109, 40, 217);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('APPLICANT RESPONSE', 14, y + 5);
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${fd.eeoName || '—'}`, 14, y + 11);
  doc.text(`Date: ${fd.eeoDate || '—'}`, 110, y + 11);
  doc.text(`Gender: ${eeo.gender || fd.eeoGender || '—'}`, 14, y + 17);
  const raceLines = doc.splitTextToSize(`Race / Ethnicity: ${eeo.race || fd.eeoRace || '—'}`, 178);
  doc.text(raceLines, 14, y + 23);
  y += 32;

  // ── Disability Self-ID (Form CC-305) ──────────────────────────────────────
  y = checkPage(doc, y, 20, logoData, subtitle);
  y = sectionTitle(doc, y, 'Voluntary Self-Identification of Disability — Form CC-305 (OMB Control No. 1250-0005)');

  const disabilityDisclosure = [
    'Why are you being asked to complete this form? We are a federal contractor or subcontractor. The law requires us to provide equal employment opportunity to qualified people with disabilities. We have a goal of having at least 7% of our workers as people with disabilities. The law says we must measure our progress towards this goal. To do this, we must ask applicants and employees if they have a disability or have ever had one. People can become disabled, so we need to ask this question at least every five years.',
    'Completing this form is voluntary, and we hope that you will choose to do so. Your answer is confidential. No one who makes hiring decisions will see it. Your decision to complete the form and your answer will not harm you in any way. If you want to learn more about the law or this form, visit the U.S. Department of Labor\'s Office of Federal Contract Compliance Programs (OFCCP) website at www.dol.gov/ofccp.',
    'How do you know if you have a disability? A disability is a condition that substantially limits one or more of your "major life activities." If you have or have ever had such a condition, you are a person with a disability. Disabilities include, but are not limited to: Alcohol or other substance use disorder (not currently using drugs illegally); Autoimmune disorder (e.g., lupus, fibromyalgia, rheumatoid arthritis, HIV/AIDS); Blind or low vision; Cancer (past or present); Cardiovascular or heart disease; Celiac disease; Cerebral palsy; Deaf or serious difficulty hearing; Diabetes; Disfigurement; Epilepsy or other seizure disorder; Gastrointestinal disorders (e.g., Crohn\'s disease); Intellectual or developmental disability; Mental health conditions (e.g., depression, bipolar disorder, anxiety disorder, schizophrenia, PTSD); Missing limbs or partially missing limbs; Mobility impairment; Nervous system condition (e.g., migraine headaches, Parkinson\'s disease, multiple sclerosis); Neurodivergence (e.g., ADHD, autism spectrum disorder, dyslexia); Partial or complete paralysis; Pulmonary or respiratory conditions; Short stature (dwarfism); Traumatic brain injury.',
    'PUBLIC BURDEN STATEMENT: According to the Paperwork Reduction Act of 1995, no persons are required to respond to a collection of information unless such collection displays a valid OMB control number. This survey should take about 5 minutes to complete.',
  ];
  for (const para of disabilityDisclosure) {
    const lines = doc.splitTextToSize(para, 178);
    y = checkPage(doc, y, lines.length * 4 + 6, logoData, subtitle);
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(lines, 14, y);
    y += lines.length * 4 + 4;
  }
  y += 2;

  // Disability Response + Signature
  y = checkPage(doc, y, 36, logoData, subtitle);
  doc.setFillColor(245, 243, 255);
  doc.rect(10, y, 190, 36, 'F');
  doc.setTextColor(109, 40, 217);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('APPLICANT RESPONSE & SIGNATURE', 14, y + 5);
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${fd.disabilityName || '—'}`, 14, y + 11);
  doc.text(`Date: ${fd.disabilityDate || '—'}`, 110, y + 11);
  doc.text(`Employee ID: ${fd.disabilityEmployeeId || '—'}`, 14, y + 17);
  const disStatusLines = doc.splitTextToSize(`Disability Status: ${eeo.disabilityStatus || fd.disabilityStatus || '—'}`, 178);
  doc.text(disStatusLines, 14, y + 23);
  doc.setFont('helvetica', 'bold');
  doc.text(`Electronic Signature: ${fd.disabilitySignature || '—'}`, 14, y + 29);
  doc.text(`Signature Date: ${fd.disabilitySignatureDate || '—'}`, 110, y + 29);
  y += 40;

  // ── Veteran Self-ID (VEVRAA) ───────────────────────────────────────────────
  y = checkPage(doc, y, 20, logoData, subtitle);
  y = sectionTitle(doc, y, 'Affirmative Action: Invitation to Self-Identify as a Protected Veteran (VEVRAA)');

  const veteranDisclosure = [
    'Under the regulations implementing the affirmative action provisions of the Vietnam Era Veterans\' Readjustment Assistance Act (VEVRAA) of 1972 issued by the Office of Federal Contract Compliance Programs (OFCCP), federal contractors are required to invite applicants and current employees to inform the contractor whether they are veterans belonging to one or more of the categories of veterans covered under VEVRAA who wish to benefit under the contractor\'s affirmative action program (AAP) for covered veterans.',
    'In extending this invitation, we advise you that: (a) workers and applicants are under no obligation to respond but may do so in the future if they choose; (b) responses will remain confidential within the Human Resources department; and (c) responses will be used only for the necessary information to include in our affirmative action plan. Refusal to provide this information will have no bearing on your application and will not subject you to any adverse treatment.',
    'Definitions of protected veteran categories:',
    'Disabled Veteran: A veteran of the U.S. military, ground, naval or air service who is entitled to compensation (or who but for the receipt of military retired pay would be entitled to compensation) under laws administered by the Secretary of Veterans Affairs, or a person who was discharged or released from active duty because of a service-connected disability.',
    'Recently Separated Veteran: Any veteran during the three-year period beginning on the date of such veteran\'s discharge or release from active duty in the U.S. military, ground, naval or air service.',
    'Active-Duty Wartime or Campaign Badge Veteran: A veteran who served on active duty in the U.S. military, ground, naval or air service during a war, or in a campaign or expedition for which a campaign badge has been authorized under the laws administered by the Department of Defense.',
    'Armed Forces Service Medal Veteran: A veteran who, while serving on active duty in the U.S. military, ground, naval or air service, participated in a United States military operation for which an Armed Forces service medal was awarded pursuant to Executive Order No. 12985.',
  ];
  for (const para of veteranDisclosure) {
    const isBold = para.startsWith('Definitions') || para.match(/^(Disabled Veteran|Recently Separated|Active-Duty|Armed Forces)/);
    const lines = doc.splitTextToSize(para, 178);
    y = checkPage(doc, y, lines.length * 4 + 6, logoData, subtitle);
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(8);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(lines, 14, y);
    y += lines.length * 4 + 4;
  }
  y += 2;

  // Veteran Response + Signature
  y = checkPage(doc, y, 30, logoData, subtitle);
  doc.setFillColor(245, 243, 255);
  doc.rect(10, y, 190, 24, 'F');
  doc.setTextColor(109, 40, 217);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('APPLICANT RESPONSE & SIGNATURE', 14, y + 5);
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const vetStatusLines = doc.splitTextToSize(`Veteran Status: ${eeo.veteranStatus || fd.veteranStatus || '—'}`, 178);
  doc.text(vetStatusLines, 14, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Electronic Signature: ${fd.vetSignature || '—'}`, 14, y + 17);
  doc.text(`Signature Date: ${fd.vetDate || '—'}`, 110, y + 17);
  y += 28;

  // ── Alcohol & Drug Testing Agreement ──────────────────────────────────────
  doc.addPage();
  y = header(doc, logoData, subtitle);
  y = sectionTitle(doc, y, 'Agreement to Comply with Geolabs, Inc. Alcohol & Drug Testing Program');

  const drugPolicyParagraphs = [
    'Geolabs, Inc. is committed to providing a safe, healthy, and productive work environment for all employees and clients. The use of alcohol or drugs on the job compromises the safety and productivity of all employees and is inconsistent with that commitment.',
    'Geolabs, Inc. maintains a Drug-Free Workplace policy. As a condition of employment, all employees and applicants are subject to drug and alcohol testing in accordance with applicable federal and state laws. Testing may occur as part of the pre-employment process, following a workplace accident, based on reasonable suspicion, or on a random basis as permitted by law.',
    'Employees are prohibited from: (a) using, possessing, manufacturing, distributing, or being under the influence of illegal drugs or controlled substances on company premises, in company vehicles, or while conducting company business; (b) reporting to work or performing any company-related duties while under the influence of alcohol or drugs; (c) consuming alcohol during work hours, except as expressly permitted by company policy.',
    'ANY APPLICANT OR EMPLOYEE WHO REFUSES TO SUBMIT TO TESTING, ADULTERATES OR TAMPERS WITH A SAMPLE, OR TESTS POSITIVE FOR PROHIBITED SUBSTANCES WILL BE SUBJECT TO DISQUALIFICATION FROM EMPLOYMENT OR IMMEDIATE TERMINATION, AS PERMITTED BY APPLICABLE LAW.',
    'Prescription medications: Employees using legally prescribed medications that may affect job performance or safety must disclose this to Human Resources prior to performing safety-sensitive duties. The company will make reasonable accommodations in accordance with applicable law.',
    'This policy is subject to modification and will be administered in conformance with all applicable state and federal laws, including the Americans with Disabilities Act (ADA) and the Family and Medical Leave Act (FMLA). Questions about this program should be directed to Human Resources.',
    'By signing below, I acknowledge that I have read and fully understand the above Alcohol & Drug Testing Program statement. I agree to comply with all policies and procedures related to drug and alcohol testing as a condition of my application for employment and, if hired, as a continuing condition of my employment with Geolabs, Inc.',
  ];
  for (const para of drugPolicyParagraphs) {
    const isAllCaps = para === drugPolicyParagraphs[3];
    const lines = doc.splitTextToSize(para, 178);
    y = checkPage(doc, y, lines.length * 4 + 8, logoData, subtitle);
    if (isAllCaps) {
      doc.setFillColor(254, 242, 242);
      doc.rect(10, y - 2, 190, lines.length * 4 + 6, 'F');
      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'normal');
    }
    doc.setFontSize(8);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 6;
  }
  y += 4;

  // Drug Test acknowledgment + Signature
  y = checkPage(doc, y, 36, logoData, subtitle);
  doc.setFillColor(245, 243, 255);
  doc.rect(10, y, 190, 36, 'F');
  doc.setTextColor(109, 40, 217);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('APPLICANT ACKNOWLEDGMENT & SIGNATURE', 14, y + 5);
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const ackLines = doc.splitTextToSize('I have read, understand, and agree to comply with the Alcohol & Drug Testing Program described above. I agree this constitutes a condition of my employment application and any future employment with Geolabs, Inc.', 178);
  doc.text(ackLines, 14, y + 11);
  const sigY = y + 11 + ackLines.length * 4 + 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`Agreed: ${fd.drugTestAgreed ? 'YES — I agree' : 'Not agreed'}`, 14, sigY);
  doc.text(`Electronic Signature: ${fd.drugTestSignature || '—'}`, 14, sigY + 6);
  doc.text(`Signature Date: ${fd.drugTestDate || '—'}`, 110, sigY + 6);
  y += 40;

  // Stage history
  const stageHistory = app.stageHistory || [];
  if (stageHistory.length) {
    y = checkPage(doc, y, 20, logoData, subtitle);
    y = sectionTitle(doc, y, 'Application Stage History');
    stageHistory.forEach(h => {
      y = checkPage(doc, y, 8, logoData, subtitle);
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(h.stage?.replace(/_/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || h.stage, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      doc.text(`${new Date(h.changedAt).toLocaleDateString()}  ·  ${h.changedBy || '—'}`, 70, y);
      y += 6;
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    footer(doc, i, pageCount);
  }

  doc.save(`${name.replace(/ /g, '_')}_Full_Application_Record.pdf`);
}