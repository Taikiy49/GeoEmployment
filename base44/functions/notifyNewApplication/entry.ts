import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { data: app } = payload;

    if (!app) {
      console.log('No application data in payload, skipping');
      return Response.json({ ok: true });
    }

    // Get requisition for hiring manager / recruiter
    let hiringManagerEmail = null;
    let recruiterEmail = null;
    let requisitionTitle = app.requisitionTitle || app.positionAppliedFor || 'Position';

    if (app.requisitionId) {
      const reqs = await base44.asServiceRole.entities.JobRequisition.filter({ id: app.requisitionId });
      if (reqs[0]) {
        hiringManagerEmail = reqs[0].hiringManagerEmail;
        recruiterEmail = reqs[0].recruiterEmail;
        requisitionTitle = reqs[0].title || requisitionTitle;
      }
    }

    // Get admins with notifications enabled
    const allAdmins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const adminEmails = allAdmins
      .filter(u => u.notificationsEnabled !== false && u.email)
      .map(u => u.email);

    const recipients = [...new Set([hiringManagerEmail, recruiterEmail, ...adminEmails].filter(Boolean))];

    if (recipients.length === 0) {
      console.log('No recipients found, skipping');
      return Response.json({ ok: true, skipped: true });
    }

    const formData = app.applicationData || {};

    const submittedAt = app.submittedAt
      ? new Date(app.submittedAt).toLocaleString('en-US', { timeZone: 'Pacific/Honolulu', dateStyle: 'long', timeStyle: 'short' })
      : new Date().toLocaleString('en-US', { timeZone: 'Pacific/Honolulu', dateStyle: 'long', timeStyle: 'short' });

    const employmentRows = (formData.employment || [])
      .filter(e => e.company)
      .slice(0, 3)
      .map(e => `
        <tr>
          <td style="padding:10px 12px; border-bottom:1px solid #f3f4f6;">
            <div style="font-weight:600; color:#111827; font-size:13px;">${e.position || 'Position'} — ${e.company}</div>
            <div style="color:#6b7280; font-size:12px; margin-top:2px;">${[e.dateFrom, e.dateTo || 'Present'].filter(Boolean).join(' – ')}</div>
          </td>
        </tr>`)
      .join('');

    const educationRows = (formData.education || [])
      .filter(e => e.institution)
      .slice(0, 3)
      .map(e => `
        <tr>
          <td style="padding:10px 12px; border-bottom:1px solid #f3f4f6;">
            <div style="font-weight:600; color:#111827; font-size:13px;">${[e.degree, e.field].filter(Boolean).join(' – ')}</div>
            <div style="color:#6b7280; font-size:12px; margin-top:2px;">${e.institution}${e.yearCompleted ? ', ' + e.yearCompleted : ''}</div>
          </td>
        </tr>`)
      .join('');

    const infoRow = (label, value) => value ? `
      <tr>
        <td style="padding:9px 12px; color:#6b7280; font-size:13px; width:130px; border-bottom:1px solid #f3f4f6; vertical-align:top;">${label}</td>
        <td style="padding:9px 12px; color:#111827; font-size:13px; font-weight:500; border-bottom:1px solid #f3f4f6;">${value}</td>
      </tr>` : '';

    const tableWrap = (rows) => rows
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; border-collapse:separate; border-spacing:0;">${rows}</table>`
      : `<p style="color:#9ca3af; font-size:13px; margin:0;">Not provided</p>`;

    const section = (title, content) => `
      <div style="margin-bottom:24px;">
        <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#b87333; margin-bottom:10px;">${title}</div>
        ${content}
      </div>`;

    const subject = `New Application: ${app.firstName} ${app.lastName} — ${requisitionTitle}`;

    const body = `
<div style="font-family:'Helvetica Neue',Arial,sans-serif; background:#f3f4f6; padding:32px 16px;">
<div style="max-width:600px; margin:0 auto;">

  <!-- Header -->
  <div style="background:#0f172a; border-radius:12px 12px 0 0; padding:28px 32px;">
    <div style="color:#b87333; font-size:18px; font-weight:700;">Geolabs HR Portal</div>
    <div style="color:#64748b; font-size:12px; margin-top:3px;">New Application Alert</div>
  </div>

  <!-- Body -->
  <div style="background:#ffffff; padding:36px 32px; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 12px 12px;">

    <h2 style="margin:0 0 6px; font-size:19px; color:#111827;">New Application Received</h2>
    <p style="margin:0 0 28px; font-size:14px; color:#6b7280; line-height:1.7;">
      <strong style="color:#111827;">${app.firstName} ${app.lastName}</strong> has submitted an application for <strong style="color:#111827;">${requisitionTitle}</strong>.
    </p>

    ${section('Applicant Details',
      `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; border-collapse:separate; border-spacing:0;">
        ${infoRow('Name', app.firstName + ' ' + app.lastName)}
        ${infoRow('Email', `<a href="mailto:${app.email}" style="color:#b87333; text-decoration:none;">${app.email}</a>`)}
        ${infoRow('Phone', app.phone || formData.cell || null)}
        ${infoRow('Submitted', submittedAt + ' HST')}
        ${infoRow('Position', requisitionTitle)}
        ${formData.availableStartDate ? infoRow('Available Start', formData.availableStartDate) : ''}
      </table>`
    )}

    ${section('Employment History', tableWrap(employmentRows || null))}
    ${section('Education', tableWrap(educationRows || null))}
    ${formData.skillsSummary ? section('Skills & Qualifications', `<p style="font-size:13px; color:#374151; line-height:1.7; margin:0; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:14px 16px;">${formData.skillsSummary}</p>`) : ''}

    <!-- CTA -->
    <div style="text-align:center; margin-top:8px;">
      <a href="https://geolabs-employment.base44.app/admin/applications/${app.id}"
         style="display:inline-block; background:#b87333; color:#ffffff; font-size:13px; font-weight:600; padding:12px 28px; border-radius:8px; text-decoration:none; letter-spacing:0.01em;">
        View Full Application →
      </a>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align:center; padding:20px 0 4px; font-size:11px; color:#9ca3af; line-height:1.8;">
    This is an automated alert from the Geolabs ATS.<br>
    Manage notification preferences in <a href="https://geolabs-employment.base44.app/admin/settings" style="color:#9ca3af;">Admin Settings</a>.
  </div>

</div>
</div>`.trim();

    for (const email of recipients) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Geolabs HR',
        to: email,
        subject,
        body,
      });
      console.log(`Notification sent to ${email} for application ${app.id}`);
    }

    return Response.json({ ok: true, notified: recipients });
  } catch (error) {
    console.error('notifyNewApplication error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});