import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data: app } = payload;

    if (!app || app.isDraft) {
      console.log('Skipping — no data or draft application');
      return Response.json({ ok: true });
    }

    const formData = app.applicationData || {};

    const employmentSummary = (formData.employment || [])
      .filter(e => e.company)
      .slice(0, 3)
      .map(e => `<li><strong>${e.position || 'Position'}</strong> at ${e.company} (${e.dateFrom || ''}–${e.dateTo || 'Present'})</li>`)
      .join('') || '<li>Not provided</li>';

    const educationSummary = (formData.education || [])
      .filter(e => e.institution)
      .slice(0, 3)
      .map(e => `<li>${e.degree || ''} ${e.field ? '– ' + e.field : ''} — ${e.institution}${e.yearCompleted ? ', ' + e.yearCompleted : ''}</li>`)
      .join('') || '<li>Not provided</li>';

    const referencesSummary = (formData.references || [])
      .filter(r => r.name)
      .slice(0, 3)
      .map(r => `<li>${r.name}${r.company ? ' (' + r.company + ')' : ''}${r.phone ? ' — ' + r.phone : ''}</li>`)
      .join('') || '<li>Not provided</li>';

    const submittedAt = app.submittedAt
      ? new Date(app.submittedAt).toLocaleString('en-US', { timeZone: 'Pacific/Honolulu', dateStyle: 'long', timeStyle: 'short' })
      : new Date().toLocaleString('en-US', { timeZone: 'Pacific/Honolulu', dateStyle: 'long', timeStyle: 'short' });

    const position = app.requisitionTitle || app.positionAppliedFor || 'Open Position';

    const subject = `Application Received — ${position} | Geolabs, Inc.`;

    const body = `
<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">

  <div style="background: #0f172a; padding: 28px 32px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #b87333; margin: 0; font-size: 20px;">Geolabs, Inc.</h1>
    <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Geotechnical · Engineering · Drilling</p>
  </div>

  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">

    <h2 style="font-size: 18px; color: #111827; margin: 0 0 8px;">Thank you, ${app.firstName}!</h2>
    <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
      We've received your application for <strong>${position}</strong>. Our HR team will review your materials and be in touch if your background is a match.
    </p>

    <div style="background: #fdf7f1; border: 1px solid #f6ece2; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #945324; text-transform: uppercase; letter-spacing: 0.05em;">Application Summary</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
        <tr><td style="padding: 5px 0; color: #6b7280; width: 140px;">Application ID</td><td style="padding: 5px 0; color: #111827; font-family: monospace; font-size: 12px;">${app.id}</td></tr>
        <tr><td style="padding: 5px 0; color: #6b7280;">Position</td><td style="padding: 5px 0; color: #111827; font-weight: 600;">${position}</td></tr>
        <tr><td style="padding: 5px 0; color: #6b7280;">Submitted</td><td style="padding: 5px 0; color: #111827;">${submittedAt} (HST)</td></tr>
        <tr><td style="padding: 5px 0; color: #6b7280;">Name</td><td style="padding: 5px 0; color: #111827;">${app.firstName} ${app.lastName}</td></tr>
        <tr><td style="padding: 5px 0; color: #6b7280;">Email</td><td style="padding: 5px 0; color: #111827;">${app.email}</td></tr>
        <tr><td style="padding: 5px 0; color: #6b7280;">Phone</td><td style="padding: 5px 0; color: #111827;">${app.phone || formData.cell || '—'}</td></tr>
        ${formData.availableStartDate ? `<tr><td style="padding: 5px 0; color: #6b7280;">Available Start</td><td style="padding: 5px 0; color: #111827;">${formData.availableStartDate}</td></tr>` : ''}
      </table>
    </div>

    <h3 style="font-size: 13px; font-weight: 700; color: #374151; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Employment History</h3>
    <ul style="margin: 0 0 20px; padding-left: 18px; font-size: 13px; color: #374151; line-height: 1.8;">${employmentSummary}</ul>

    <h3 style="font-size: 13px; font-weight: 700; color: #374151; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Education</h3>
    <ul style="margin: 0 0 20px; padding-left: 18px; font-size: 13px; color: #374151; line-height: 1.8;">${educationSummary}</ul>

    ${formData.skillsSummary ? `
    <h3 style="font-size: 13px; font-weight: 700; color: #374151; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Skills</h3>
    <p style="font-size: 13px; color: #374151; margin: 0 0 20px; line-height: 1.6;">${formData.skillsSummary}</p>
    ` : ''}

    <h3 style="font-size: 13px; font-weight: 700; color: #374151; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">References</h3>
    <ul style="margin: 0 0 24px; padding-left: 18px; font-size: 13px; color: #374151; line-height: 1.8;">${referencesSummary}</ul>

    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
      <strong>What happens next?</strong><br>
      Our HR team typically reviews applications within 5–7 business days. If selected for an interview, you will be contacted at <strong>${app.email}</strong>. For questions, email us at <a href="mailto:employment@geolabs.net" style="color: #b87333;">employment@geolabs.net</a>.
    </div>

  </div>

  <p style="text-align: center; font-size: 11px; color: #9ca3af; margin: 16px 0 0;">
    © ${new Date().getFullYear()} Geolabs, Inc. · 94-429 Koaki St, Suite 200, Waipahu, HI 96797<br>
    Equal Opportunity Employer
  </p>

</div>
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Geolabs HR',
      to: app.email,
      subject,
      body,
    });

    console.log(`Confirmation sent to ${app.email} for application ${app.id}`);
    return Response.json({ ok: true, sent_to: app.email });
  } catch (error) {
    console.error('sendApplicantConfirmation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});