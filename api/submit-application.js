import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { buildApplicationDocx } from './generate-application-docx.js';
import { convertDocxToPdf } from './convert-docx-to-pdf.js';
import { splitCompliancePdfs } from './split-compliance-pdfs.js';

const HR_RECIPIENTS = (
  process.env.HR_APPLICATION_EMAIL
  || 'employment@geolabs.net,tyamashita@geolabs.net'
).split(',').map(address => address.trim()).filter(Boolean);
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Geolabs Careers <applications@geolabs.net>';
const MICROSOFT_SENDER = process.env.MS_SENDER_EMAIL || 'tyamashita@geolabs.net';
const LOGO_CID = 'geolabs-logo';
const LOGO_SRC = `cid:${LOGO_CID}`;
const LOGO_CONTENT = readFileSync(
  new URL('../public/geolabs-logo.png', import.meta.url),
).toString('base64');
export const logoAttachment = () => ({
  filename: 'geolabs-logo.png',
  content: LOGO_CONTENT,
  type: 'image/png',
  inline: true,
  contentId: LOGO_CID,
});
const hasMicrosoftConfig = () => Boolean(
  process.env.MS_TENANT_ID
  && process.env.MS_CLIENT_ID
  && process.env.MS_CLIENT_SECRET
  && MICROSOFT_SENDER
);

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
  protected: 'I identify as one or more of the following classifications of protected veterans',
  notProtected: 'I am not a protected veteran',
  noAnswer: 'I do not wish to self-identify',
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
    row('Veteran self-identification', veteranLabel(application.eeoData?.veteranStatus)),
  ].join('');

  return `
<!doctype html>
<html><body style="margin:0;background:#f2f5f7;font-family:Arial,'Helvetica Neue',sans-serif;color:#172033;">
  <div style="padding:28px 12px;">
    <div style="max-width:720px;margin:0 auto;">
      <div style="padding:22px 30px;border-radius:14px 14px 0 0;background:#111923;border-bottom:3px solid #a65f2a;">
        <table role="presentation" cellspacing="0" cellpadding="0"><tr>
          <td style="padding-right:14px;"><img src="${LOGO_SRC}" width="58" height="58" alt="Geolabs, Inc." style="display:block;width:58px;height:58px;object-fit:contain;border:0;"></td>
          <td><div style="color:#fff;font-size:19px;font-weight:800;">Geolabs, Inc.</div>
          <div style="margin-top:4px;color:#cbd5e1;font-size:12px;">Employment Application · HR Review Copy</div></td>
        </tr></table>
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
    <div style="padding:20px 28px;border-radius:14px 14px 0 0;background:#111923;border-bottom:3px solid #a65f2a;">
      <table role="presentation" cellspacing="0" cellpadding="0"><tr>
        <td style="padding-right:14px;"><img src="${LOGO_SRC}" width="54" height="54" alt="Geolabs, Inc." style="display:block;width:54px;height:54px;object-fit:contain;border:0;"></td>
        <td><div style="color:#fff;font-size:19px;font-weight:800;">Geolabs, Inc.</div>
        <div style="margin-top:4px;color:#cbd5e1;font-size:12px;">Employment Opportunities</div></td>
      </tr></table>
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

let microsoftTokenCache = null;

async function getMicrosoftAccessToken() {
  if (microsoftTokenCache?.expiresAt > Date.now() + 60_000) {
    return microsoftTokenCache.token;
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(process.env.MS_TENANT_ID)}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MS_CLIENT_ID,
        client_secret: process.env.MS_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    },
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.access_token) {
    throw new Error(result.error_description || result.error || 'Microsoft 365 authentication failed.');
  }

  microsoftTokenCache = {
    token: result.access_token,
    expiresAt: Date.now() + (Number(result.expires_in) || 3600) * 1000,
  };
  return microsoftTokenCache.token;
}

async function sendMicrosoftEmail(payload) {
  const accessToken = await getMicrosoftAccessToken();
  const clientRequestId = randomUUID();
  const message = {
    subject: payload.subject,
    body: { contentType: 'HTML', content: payload.html },
    toRecipients: payload.to.map(address => ({ emailAddress: { address } })),
    replyTo: payload.reply_to
      ? [{ emailAddress: { address: payload.reply_to } }]
      : [],
    attachments: (payload.attachments || []).map(attachment => ({
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: attachment.filename,
      contentType: attachment.type || 'application/octet-stream',
      contentBytes: attachment.content,
      isInline: Boolean(attachment.inline),
      contentId: attachment.contentId,
    })),
  };

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(MICROSOFT_SENDER)}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'client-request-id': clientRequestId,
        'return-client-request-id': 'true',
      },
      body: JSON.stringify({ message, saveToSentItems: true }),
    },
  );

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error?.message || 'Microsoft 365 email delivery failed.');
  }

  return {
    id: response.headers.get('request-id')
      || response.headers.get('client-request-id')
      || clientRequestId,
    provider: 'microsoft-graph',
  };
}

async function sendResendEmail(payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      attachments: (payload.attachments || []).map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        content_type: attachment.type,
        content_id: attachment.contentId,
      })),
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Email delivery failed.');
  return result;
}

export async function sendEmail(payload) {
  if (hasMicrosoftConfig()) return sendMicrosoftEmail(payload);
  return sendResendEmail(payload);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!hasMicrosoftConfig() && !process.env.RESEND_API_KEY) {
    return res.status(503).json({ error: 'Application email delivery is not configured.' });
  }

  try {
    const application = req.body;
    if (!application?.firstName || !application?.lastName || !application?.email) {
      return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }

    const attachments = [logoAttachment()];
    const safeApplicantName = `${application.firstName}-${application.lastName}`
      .replace(/[^a-z0-9-]+/gi, '-')
      .replace(/-+/g, '-');
    const mainApplicationDocx = await buildApplicationDocx(application, { mainApplicationOnly: true });
    const applicationPdf = await convertDocxToPdf(mainApplicationDocx);
    const completeApplication = {
      key: 'complete-application',
      label: 'Complete Employment Application',
      filename: `${safeApplicantName}-Geolabs-Application.pdf`,
      content: applicationPdf.toString('base64'),
      type: 'application/pdf',
      restricted: false,
    };
    const complianceSourceDocx = await buildApplicationDocx(application);
    const complianceSourcePdf = await convertDocxToPdf(complianceSourceDocx);
    const compliancePdfs = await splitCompliancePdfs(complianceSourcePdf, safeApplicantName);
    const generatedDocuments = [completeApplication, ...compliancePdfs.map(document => ({
      ...document,
      content: document.content.toString('base64'),
    }))];
    req.generatedDocuments = generatedDocuments;
    attachments.push(...generatedDocuments.map(({ filename, content, type }) => ({ filename, content, type })));
    const resume = application.resumeAttachment;
    if (resume?.content && resume?.filename) {
      attachments.push({ filename: resume.filename, content: resume.content });
    }

    const hrResult = await sendEmail({
      from: FROM_EMAIL,
      to: HR_RECIPIENTS,
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
        attachments: [logoAttachment()],
      });
    } catch {
      confirmationSent = false;
    }

    return res.status(200).json({
      ok: true,
      applicationId: application.id,
      hrMessageId: hrResult.id,
      emailProvider: hrResult.provider || 'resend',
      confirmationSent,
    });
  } catch (error) {
    console.error('Application delivery failed:', error);
    return res.status(502).json({ error: 'We could not deliver your application. Please try again.' });
  }
}

export { buildHrEmail, buildApplicantEmail };
