import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STAGE_LABELS = {
  applied: 'Applied',
  under_review: 'Under Review',
  phone_screen: 'Phone Screen',
  interview: 'Interview',
  offer: 'Offer Extended',
  hired: 'Hired',
  rejected: 'Not Selected',
  withdrawn: 'Withdrawn',
};

// Default templates if no custom one is saved in the DB
const DEFAULT_TEMPLATES = {
  under_review: {
    subject: `Your Geolabs Application — Under Review`,
    body: `We wanted to let you know that your application is now under active review by our hiring team. We appreciate your patience and will be in touch soon with an update.`,
  },
  phone_screen: {
    subject: `Next Step: Phone Screen — Geolabs`,
    body: `Great news! We'd like to schedule a brief phone screening with you to learn more about your background and interest in the position. A member of our team will reach out to you shortly to arrange a convenient time.`,
  },
  interview: {
    subject: `You're Invited to Interview — Geolabs`,
    body: `Congratulations! We'd like to invite you to interview with our team. You'll be contacted soon with details about the interview format, location, and scheduling.`,
  },
  offer: {
    subject: `An Offer Is Coming Your Way — Geolabs`,
    body: `We're excited to let you know that we have an offer extended for this position. Please watch for further communication from our HR team with the full offer details and next steps.`,
  },
  hired: {
    subject: `Welcome to the Geolabs Team!`,
    body: `We are thrilled to welcome you to the Geolabs family! Our HR team will be in touch shortly with your onboarding details, start date information, and everything you need to get started.`,
  },
  rejected: {
    subject: `Your Geolabs Application — Update`,
    body: `Thank you for your interest in joining Geolabs, Inc. and for the time you invested in your application. After careful consideration, we have decided to move forward with other candidates at this time.\n\nWe were impressed by your background and encourage you to apply for future opportunities that match your experience and interests.`,
  },
  withdrawn: {
    subject: `Application Withdrawal Confirmed — Geolabs`,
    body: `We have received and processed your withdrawal from the application process for this position. We appreciate your time and interest in Geolabs, and we wish you the very best in your career search. We hope you'll consider us again for future opportunities.`,
  },
};

function interpolate(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

function buildEmailHtml(firstName, position, stageLabel, messageBody, appId) {
  // Convert newlines to <br> for HTML
  const htmlBody = messageBody.replace(/\n/g, '<br>');

  return `
<div style="font-family:'Helvetica Neue',Arial,sans-serif; background:#f3f4f6; padding:32px 16px;">
<div style="max-width:600px; margin:0 auto;">

  <!-- Header -->
  <div style="background:#0f172a; border-radius:12px 12px 0 0; padding:28px 32px;">
    <div style="display:flex; align-items:center; gap:12px;">
      <img src="https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/e4e60e6f1_geolabs.png" alt="Geolabs" width="40" height="40" style="border-radius:8px; display:block;" />
      <div>
        <div style="color:#b87333; font-size:18px; font-weight:700; letter-spacing:-0.02em;">Geolabs, Inc.</div>
        <div style="color:#64748b; font-size:12px; margin-top:2px;">Geotechnical · Engineering · Drilling · Since 1975</div>
      </div>
    </div>
  </div>

  <!-- Body -->
  <div style="background:#ffffff; padding:36px 32px; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 12px 12px;">

    <!-- Stage badge -->
    <div style="display:inline-block; background:#fdf7f1; border:1px solid #f6ece2; border-radius:20px; padding:5px 14px; font-size:11px; font-weight:700; color:#b87333; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:20px;">
      ${stageLabel}
    </div>

    <h2 style="margin:0 0 8px; font-size:19px; color:#111827; font-weight:700;">Hi ${firstName},</h2>

    <p style="margin:0 0 28px; font-size:14px; color:#374151; line-height:1.75;">${htmlBody}</p>

    <!-- Application summary -->
    <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:16px 20px; margin-bottom:28px;">
      <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:#9ca3af; margin-bottom:10px;">Application Details</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:5px 0; font-size:13px; color:#6b7280; width:120px;">Position</td>
          <td style="padding:5px 0; font-size:13px; color:#111827; font-weight:600;">${position}</td>
        </tr>
        <tr>
          <td style="padding:5px 0; font-size:13px; color:#6b7280;">Status</td>
          <td style="padding:5px 0; font-size:13px; color:#111827; font-weight:600;">${stageLabel}</td>
        </tr>
        ${appId ? `<tr>
          <td style="padding:5px 0; font-size:13px; color:#6b7280;">Application ID</td>
          <td style="padding:5px 0; font-size:11px; color:#6b7280; font-family:monospace;">${appId}</td>
        </tr>` : ''}
      </table>
    </div>

    <!-- Contact -->
    <div style="border-top:1px solid #f3f4f6; padding-top:20px; font-size:13px; color:#6b7280; line-height:1.7;">
      Questions? Contact our HR team at
      <a href="mailto:employment@geolabs.net" style="color:#b87333; text-decoration:none; font-weight:600;">employment@geolabs.net</a>
      or call <a href="tel:8088415064" style="color:#b87333; text-decoration:none;">(808) 841-5064</a>.
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align:center; padding:20px 0 4px; font-size:11px; color:#9ca3af; line-height:1.8;">
    Geolabs, Inc. · 94-429 Koaki St, Suite 200 · Waipahu, HI 96797<br>
    Equal Opportunity Employer
  </div>

</div>
</div>`.trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { data } = payload;

    if (!data || !data.email || !data.firstName) {
      console.log('Missing candidate data, skipping');
      return Response.json({ skipped: true, reason: 'Missing candidate data' });
    }

    const stage = data.stage;
    const stageLabel = STAGE_LABELS[stage] || stage;
    const firstName = data.firstName;
    const position = data.requisitionTitle || data.positionAppliedFor || 'the position';

    // Only send for meaningful stages
    if (!DEFAULT_TEMPLATES[stage]) {
      console.log(`No template for stage "${stage}", skipping`);
      return Response.json({ skipped: true, reason: `No template for stage: ${stage}` });
    }

    const vars = { firstName, lastName: data.lastName, position, stageLabel };

    // Look up a custom template in the DB for this stage
    let subject, bodyText;
    const customTemplates = await base44.asServiceRole.entities.EmailTemplate.filter({ stageKey: stage, isActive: true });
    if (customTemplates[0]) {
      const tmpl = customTemplates[0];
      subject = interpolate(tmpl.subject, vars);
      bodyText = interpolate(tmpl.body, vars);
      console.log(`Using custom template "${tmpl.name}" for stage ${stage}`);
    } else {
      const def = DEFAULT_TEMPLATES[stage];
      subject = interpolate(def.subject, vars);
      bodyText = interpolate(def.body, vars);
      console.log(`Using default template for stage ${stage}`);
    }

    const htmlBody = buildEmailHtml(firstName, position, stageLabel, bodyText, data.id);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: data.email,
      from_name: 'Geolabs, Inc. HR',
      subject,
      body: htmlBody,
    });

    console.log(`Stage email sent to ${data.email} for stage: ${stage}`);
    return Response.json({ success: true, stage, recipient: data.email });
  } catch (error) {
    console.error('sendStageEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});