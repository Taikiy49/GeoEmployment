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

  // EEO / Self-ID
  y = checkPage(doc, y, 40, logoData, subtitle);
  // Purple restricted banner
  doc.setFillColor(245, 243, 255);
  doc.setDrawColor(167, 139, 250);
  doc.setLineWidth(0.3);
  doc.rect(10, y, 190, 7, 'FD');
  doc.setTextColor(109, 40, 217);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('RESTRICTED — EEO / Self-Identification Data (Voluntary — For Compliance Reporting Only)', 105, y + 5, { align: 'center' });
  y += 10;
  y = sectionTitle(doc, y, 'EEO Self-Identification (Form EEO-1)');
  y = twoCol(doc, y, [
    ['Name (EEO)', fd.eeoName || '—'],
    ['Date (EEO)', fd.eeoDate || '—'],
    ['Gender', eeo.gender || fd.eeoGender || '—'],
    ['Race / Ethnicity', eeo.race || fd.eeoRace || '—'],
  ]);

  y = checkPage(doc, y, 30, logoData, subtitle);
  y = sectionTitle(doc, y, 'Disability Self-Identification (Form CC-305)');
  y = twoCol(doc, y, [
    ['Disability Status', eeo.disabilityStatus || fd.disabilityStatus || '—'],
    ['Name (CC-305)', fd.disabilityName || '—'],
    ['Date (CC-305)', fd.disabilityDate || '—'],
    ['Employee ID', fd.disabilityEmployeeId || '—'],
    ['Signature (CC-305)', fd.disabilitySignature || '—'],
    ['Signature Date (CC-305)', fd.disabilitySignatureDate || '—'],
  ]);

  y = checkPage(doc, y, 30, logoData, subtitle);
  y = sectionTitle(doc, y, 'Veteran Status Self-Identification (VEVRAA)');
  y = twoCol(doc, y, [
    ['Veteran Status', eeo.veteranStatus || fd.veteranStatus || '—'],
    ['Signature (VEVRAA)', fd.vetSignature || '—'],
    ['Signature Date (VEVRAA)', fd.vetDate || '—'],
  ]);

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