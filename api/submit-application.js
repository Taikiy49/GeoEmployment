const HR_RECIPIENT = process.env.HR_APPLICATION_EMAIL || 'tyamashita@geolabs.net';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Geolabs Careers <applications@geolabs.net>';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const present = (value) => value !== undefined && value !== null && String(value).trim() !== '';
const text = (value, fallback = 'Not provided') => present(value) ? escapeHtml(value) : fallback;
const yesNo = (value) => value === true ? 'Yes' : value === false ? 'No' : text(value);
const join = (values) => values.filter(present).map(escapeHtml).join(' · ') || 'Not provided';
const paragraph = (value) => text(value).replaceAll('\n', '<br>');

const veteranLabel = (value) => ({
  protected: 'I identify as a protected veteran',
  notProtected: 'I am not a protected veteran',
  noAnswer: 'I do not wish to answer',
})[value] || text(value);

const row = (label, value) => `
  <tr>
    <td style="width:34%;padding:10px 12px;border-bottom:1px solid #e8edf2;color:#64748b;font-size:12px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 12px;border-bottom:1px solid #e8edf2;color:#172033;font-size:13px;font-weight:600;line-height:1.5;">${value}</td>
  </tr>`;

const table = (rows) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dfe5eb;border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden;background:#fff;">
    ${rows}
  </table>`;

const section = (title, content, restricted = false) => `
  <div style="margin:0 0 28px;">
    <div style="margin:0 0 10px;color:${restricted ? '#9f1239' : '#9a5528'};font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">
      ${escapeHtml(title)}
    </div>
    ${content}
  </div>`;

const historyCards = (items, render) => {
  const filtered = (items || []).filter(item => Object.values(item || {}).some(present));
  if (!filtered.length) return '<p style="margin:0;color:#94a3b8;font-size:13px;">Not provided</p>';
  return filtered.map(render).join('');
};

function buildHrEmail(application) {
  const data = application.applicationData || {};
  const fullName = join([data.firstName || application.firstName, data.middleName, data.lastName || application.lastName]);
  const position = text(application.requisitionTitle || data.positionAppliedFor || application.positionAppliedFor, 'General application');
  const submitted = new Date(application.submittedAt || Date.now()).toLocaleString('en-US', {
    timeZone: 'Pacific/Honolulu',
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const employment = historyCards(data.employment, job => `
    <div style="margin:0 0 10px;padding:14px 16px;border:1px solid #dfe5eb;border-radius:10px;background:#fff;">
      <div style="color:#172033;font-size:13px;font-weight:700;">${text(job.position, 'Position')} at ${text(job.company, 'Company')}</div>
      <div style="margin-top:3px;color:#64748b;font-size:12px;">${join([job.dateFrom, job.dateTo || 'Present', job.address])}</div>
      ${present(job.supervisor) ? `<div style="margin-top:8px;color:#475569;font-size:12px;"><strong>Supervisor:</strong> ${text(job.supervisor)}${present(job.phone) ? ` · ${text(job.phone)}` : ''}</div>` : ''}
      ${present(job.duties) ? `<div style="margin-top:8px;color:#475569;font-size:12px;line-height:1.6;"><strong>Responsibilities:</strong><br>${paragraph(job.duties)}</div>` : ''}
      ${present(job.reasonForLeaving) ? `<div style="margin-top:8px;color:#475569;font-size:12px;"><strong>Reason for leaving:</strong> ${text(job.reasonForLeaving)}</div>` : ''}
    </div>`);

  const education = historyCards(data.education, item => `
    <div style="margin:0 0 10px;padding:14px 16px;border:1px solid #dfe5eb;border-radius:10px;background:#fff;">
      <div style="color:#172033;font-size:13px;font-weight:700;">${join([item.degree, item.field])}</div>
      <div style="margin-top:3px;color:#64748b;font-size:12px;">${join([item.institution, item.location, item.yearCompleted])}</div>
    </div>`);

  const references = historyCards(data.references, item => `
    <div style="margin:0 0 10px;padding:14px 16px;border:1px solid #dfe5eb;border-radius:10px;background:#fff;">
      <div style="color:#172033;font-size:13px;font-weight:700;">${text(item.name)}</div>
      <div style="margin-top:3px;color:#64748b;font-size:12px;">${join([item.company, item.phone])}</div>
    </div>`);

  const contactRows = [
    row('Name', fullName),
    row('Email', `<a href="mailto:${escapeHtml(application.email)}" style="color:#9a5528;text-decoration:none;">${text(application.email)}</a>`),
    row('Phone', text(application.phone || data.phone || data.cell)),
    row('Address', join([data.address, data.city, data.state, data.zip])),
    row('Preferred office', text(data.preferredLocation || application.preferredLocation)),
    row('Available start', text(data.availableStartDate)),
    row('Referred by', text(data.referredBy)),
    row('Desired salary', text(data.desiredSalary)),
    row("Driver's license", text(data.driverLicense)),
  ].join('');

  const qualificationRows = [
    row('Highest education', text(data.highestEducationLevel)),
    row('Years of experience', text(data.skillsYearsExperience)),
    row('Primary focus', text(data.skillsPrimaryFocus)),
    row('Skills summary', paragraph(data.skillsSummary)),
    row('Technical skills', paragraph(data.skillsTechnical)),
    row('Field / lab experience', paragraph(data.fieldLabExperience)),
    row('Computer skills', paragraph(data.computerSkills)),
    row('Certifications', paragraph(data.certifications)),
    row('Professional licenses', paragraph(data.professionalLicenses)),
    row('Professional organizations', paragraph(data.professionalOrgs)),
  ].join('');

  const complianceRows = [
    row('Can perform essential duties', yesNo(data.canPerformDuties)),
    row('Accommodation requested', yesNo(data.needsAccommodation)),
    row('Reference authorization', present(data.certifyInitials) ? `Acknowledged by ${text(data.certifyInitials)}` : 'Not provided'),
    row('Employment certification', data.certificationAgreed ? `Signed by ${text(data.certificationSignature)} on ${text(data.certificationDate)}` : 'Not signed'),
    row('Drug-testing acknowledgment', data.drugTestAgreed ? `Signed by ${text(data.drugTestSignature)} on ${text(data.drugTestDate)}` : 'Not signed'),
  ].join('');

  const restrictedRows = [
    row('Gender', text(application.eeoData?.gender)),
    row('Race / ethnicity', text(application.eeoData?.race)),
    row('Disability self-identification', text(application.eeoData?.disabilityStatus)),
    row('Veteran self-identification', veteranLabel(application.eeoData?.veteranStatus)),
  ].join('');

  return `
<!doctype html>
<html><body style="margin:0;background:#f2f5f7;font-family:Arial,'Helvetica Neue',sans-serif;color:#172033;">
  <div style="padding:28px 12px;">
    <div style="max-width:720px;margin:0 auto;">
      <div style="padding:26px 30px;border-radius:14px 14px 0 0;background:#111923;border-bottom:3px solid #a65f2a;">
        <div style="color:#fff;font-size:19px;font-weight:800;">Geolabs, Inc.</div>
        <div style="margin-top:4px;color:#cbd5e1;font-size:12px;">Employment Application · HR Review Copy</div>
      </div>
      <div style="padding:30px;background:#fff;border:1px solid #dfe5eb;border-top:0;border-radius:0 0 14px 14px;">
        <div style="margin-bottom:28px;padding-bottom:22px;border-bottom:1px solid #dfe5eb;">
          <div style="color:#9a5528;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">New application</div>
          <h1 style="margin:7px 0 5px;color:#111827;font-size:24px;line-height:1.25;">${fullName}</h1>
          <div style="color:#475569;font-size:14px;font-weight:600;">${position}</div>
          <div style="margin-top:8px;color:#94a3b8;font-size:11px;">Submitted ${escapeHtml(submitted)} HST · Application ${text(application.id)}</div>
        </div>

        ${section('Applicant & position', table(contactRows))}
        ${section('Employment history', employment)}
        ${section('Education', education)}
        ${section('Skills & qualifications', table(qualificationRows))}
        ${section('Professional references', references)}
        ${section('Certifications & acknowledgments', table(complianceRows))}

        <div style="margin-top:34px;padding:18px;border:1px solid #fecdd3;border-radius:10px;background:#fff7f8;">
          <div style="margin-bottom:10px;color:#9f1239;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">Restricted compliance information</div>
          <p style="margin:0 0 14px;color:#881337;font-size:11px;line-height:1.55;">Voluntary self-identification data should be kept separate from hiring decisions and accessed only for authorized compliance purposes.</p>
          ${table(restrictedRows)}
        </div>
      </div>
      <div style="padding:18px;text-align:center;color:#94a3b8;font-size:10px;line-height:1.6;">
        Geolabs, Inc. · 94-429 Koaki Street, Suite 200 · Waipahu, HI 96797<br>
        This message contains confidential applicant information. Handle according to company policy.
      </div>
    </div>
  </div>
</body></html>`;
}

function buildApplicantEmail(application) {
  const position = text(application.requisitionTitle || application.positionAppliedFor, 'the selected position');
  return `
<!doctype html>
<html><body style="margin:0;background:#f2f5f7;font-family:Arial,'Helvetica Neue',sans-serif;color:#172033;">
  <div style="padding:28px 12px;"><div style="max-width:600px;margin:0 auto;">
    <div style="padding:24px 28px;border-radius:14px 14px 0 0;background:#111923;border-bottom:3px solid #a65f2a;">
      <div style="color:#fff;font-size:19px;font-weight:800;">Geolabs, Inc.</div>
      <div style="margin-top:4px;color:#cbd5e1;font-size:12px;">Employment Opportunities</div>
    </div>
    <div style="padding:30px;border:1px solid #dfe5eb;border-top:0;border-radius:0 0 14px 14px;background:#fff;">
      <div style="color:#9a5528;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">Application received</div>
      <h1 style="margin:8px 0 12px;color:#111827;font-size:22px;">Thank you, ${text(application.firstName)}.</h1>
      <p style="margin:0;color:#475569;font-size:14px;line-height:1.7;">We received your application for <strong style="color:#172033;">${position}</strong>. Our HR team will review your information and contact you if your experience matches the role.</p>
      <div style="margin-top:24px;padding:16px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;">
        <div style="color:#64748b;font-size:11px;">Application reference</div>
        <div style="margin-top:4px;color:#172033;font-size:13px;font-weight:700;">${text(application.id)}</div>
      </div>
      <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.7;">Questions or accommodation requests may be sent to <a href="mailto:employment@geolabs.net" style="color:#9a5528;">employment@geolabs.net</a>.</p>
    </div>
  </div></div>
</body></html>`;
}

async function sendEmail(payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Email delivery failed.');
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Application email delivery is not configured.' });

  try {
    const application = req.body;
    if (!application?.firstName || !application?.lastName || !application?.email) {
      return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }

    const attachments = [];
    const resume = application.resumeAttachment;
    if (resume?.content && resume?.filename) {
      attachments.push({ filename: resume.filename, content: resume.content });
    }

    const hrResult = await sendEmail({
      from: FROM_EMAIL,
      to: [HR_RECIPIENT],
      reply_to: application.email,
      subject: `Application: ${application.firstName} ${application.lastName} — ${application.requisitionTitle || application.positionAppliedFor || 'General Application'}`,
      html: buildHrEmail(application),
      attachments,
    });

    let confirmationSent = true;
    try {
      await sendEmail({
        from: FROM_EMAIL,
        to: [application.email],
        reply_to: 'employment@geolabs.net',
        subject: `Application received — ${application.requisitionTitle || application.positionAppliedFor || 'Geolabs, Inc.'}`,
        html: buildApplicantEmail(application),
      });
    } catch {
      confirmationSent = false;
    }

    return res.status(200).json({
      ok: true,
      applicationId: application.id,
      hrMessageId: hrResult.id,
      confirmationSent,
    });
  } catch (error) {
    console.error('Application delivery failed:', error);
    return res.status(502).json({ error: 'We could not deliver your application. Please try again.' });
  }
}
