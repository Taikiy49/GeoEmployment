import { FROM_EMAIL, logoAttachment, sendEmail } from './submit-application.js';

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export async function sendContinueApplicationEmail({ email, firstName, position, link, expiresAt }) {
  const date = new Date(expiresAt).toLocaleDateString('en-US', {
    timeZone: 'Pacific/Honolulu', month: 'long', day: 'numeric', year: 'numeric',
  });
  return sendEmail({
    from: FROM_EMAIL,
    to: [email],
    reply_to: 'employment@geolabs.net',
    subject: 'Your secure Geolabs application link',
    attachments: [logoAttachment()],
    html: `<!doctype html><html><body style="margin:0;background:#f2f5f7;font-family:Arial,'Helvetica Neue',sans-serif;color:#172033;">
      <div style="padding:28px 12px;"><div style="max-width:600px;margin:0 auto;">
        <div style="padding:20px 28px;border-radius:14px 14px 0 0;background:#111923;border-bottom:3px solid #a65f2a;">
          <table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="padding-right:14px;"><img src="cid:geolabs-logo" width="54" height="54" alt="Geolabs, Inc." style="display:block;object-fit:contain;border:0;"></td><td><div style="color:#fff;font-size:19px;font-weight:800;">Geolabs, Inc.</div><div style="margin-top:4px;color:#cbd5e1;font-size:12px;">Employment Opportunities</div></td></tr></table>
        </div>
        <div style="padding:30px;border:1px solid #dfe5eb;border-top:0;border-radius:0 0 14px 14px;background:#fff;">
          <div style="color:#9a5528;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">Application saved</div>
          <h1 style="margin:8px 0 12px;color:#111827;font-size:22px;">Continue when you’re ready${firstName ? `, ${escapeHtml(firstName)}` : ''}.</h1>
          <p style="margin:0;color:#475569;font-size:14px;line-height:1.7;">Your progress for <strong>${escapeHtml(position || 'your Geolabs application')}</strong> has been securely saved. Use the private button below to continue on any device.</p>
          <p style="margin:24px 0;"><a href="${escapeHtml(link)}" style="display:inline-block;padding:13px 20px;border-radius:9px;background:#a65f2a;color:#fff;text-decoration:none;font-size:13px;font-weight:700;">Continue application</a></p>
          <div style="padding:14px;border-radius:9px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:11px;line-height:1.6;">For your privacy, do not forward this email. Anyone with this link can access your saved application. This link expires on ${escapeHtml(date)}.</div>
          <p style="margin:22px 0 0;color:#64748b;font-size:12px;line-height:1.7;">Questions may be sent to <a href="mailto:employment@geolabs.net" style="color:#9a5528;">employment@geolabs.net</a>.</p>
        </div>
      </div></div>
    </body></html>`,
  });
}
