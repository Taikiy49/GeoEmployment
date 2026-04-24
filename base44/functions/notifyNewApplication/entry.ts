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

    // Get the requisition to find the hiring manager / recruiter
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

    // Get all admin users who have notifications enabled (notificationsEnabled != false)
    const allAdmins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const adminEmails = allAdmins
      .filter(u => u.notificationsEnabled !== false && u.email)
      .map(u => u.email);

    console.log(`Admin emails with notifications on: ${adminEmails.join(', ')}`);

    // Merge: requisition contacts + admins, deduplicated
    const recipients = [...new Set([hiringManagerEmail, recruiterEmail, ...adminEmails].filter(Boolean))];

    if (recipients.length === 0) {
      console.log('No recipients found, skipping email');
      return Response.json({ ok: true, skipped: true });
    }

    // Build email body
    const formData = app.applicationData || {};
    const employmentSummary = (formData.employment || [])
      .filter(e => e.company)
      .slice(0, 2)
      .map(e => `  • ${e.position} at ${e.company} (${e.dateFrom || ''}–${e.dateTo || 'Present'})`)
      .join('\n') || '  (not provided)';

    const educationSummary = (formData.education || [])
      .filter(e => e.institution)
      .slice(0, 2)
      .map(e => `  • ${e.degree || ''} ${e.field ? '– ' + e.field : ''} from ${e.institution}`)
      .join('\n') || '  (not provided)';

    const submittedAt = app.submittedAt
      ? new Date(app.submittedAt).toLocaleString('en-US', { timeZone: 'Pacific/Honolulu', dateStyle: 'medium', timeStyle: 'short' })
      : 'just now';

    const subject = `New Application: ${app.firstName} ${app.lastName} — ${requisitionTitle}`;

    const body = `
A new application has been submitted for <strong>${requisitionTitle}</strong>.

<strong>Applicant Details</strong>
━━━━━━━━━━━━━━━━━━━━━━
Name:      ${app.firstName} ${app.lastName}
Email:     ${app.email}
Phone:     ${app.phone || formData.cell || '—'}
Submitted: ${submittedAt}

<strong>Recent Employment</strong>
${employmentSummary}

<strong>Education</strong>
${educationSummary}

<strong>Skills Summary</strong>
${formData.skillsSummary || '  (not provided)'}

─────────────────────────────
View the full application in the HR Admin Portal:
https://geolabs-employment.base44.app/admin/applications/${app.id}

This is an automated notification from the Geolabs ATS.
`.trim();

    // Send to all recipients
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