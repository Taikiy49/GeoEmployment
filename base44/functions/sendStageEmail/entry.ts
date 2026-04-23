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

const STAGE_MESSAGES = {
  under_review: `Your application is now under active review by our hiring team. We appreciate your patience and will be in touch soon.`,
  phone_screen: `We'd like to schedule a brief phone screening with you. A member of our team will reach out to you shortly to arrange a convenient time.`,
  interview: `Congratulations — we'd like to invite you to interview with our team! You'll be contacted soon with details about the interview format and scheduling.`,
  offer: `We're pleased to let you know that we have an offer extended for this position. Please watch for further communication from our HR team with the details.`,
  hired: `Welcome to the Geolabs team! We're thrilled to have you join us. Our HR team will be in touch with your onboarding details and next steps.`,
  rejected: `Thank you for your interest in joining Geolabs, Inc. and for the time you invested in your application. After careful consideration, we have decided to move forward with other candidates. We encourage you to apply for future opportunities with us.`,
  withdrawn: `We have received your withdrawal from the application process. We wish you the best in your career search and hope you'll consider Geolabs again in the future.`,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Validate we have an application record
    if (!data || !data.email || !data.firstName) {
      console.log('Missing candidate data, skipping email:', JSON.stringify({ event }));
      return Response.json({ skipped: true, reason: 'Missing candidate data' });
    }

    const stage = data.stage;
    const stageLabel = STAGE_LABELS[stage] || stage;
    const stageMessage = STAGE_MESSAGES[stage];

    // Only send emails for stages that have a meaningful message
    if (!stageMessage) {
      console.log(`No email template for stage "${stage}", skipping.`);
      return Response.json({ skipped: true, reason: `No template for stage: ${stage}` });
    }

    const firstName = data.firstName || 'Applicant';
    const position = data.requisitionTitle || data.positionAppliedFor || 'the position';

    const subject = `Your Geolabs Application — ${stageLabel}`;

    const body = `
Dear ${firstName},

${stageMessage}

━━━━━━━━━━━━━━━━━━━━━━━━
Application Summary
━━━━━━━━━━━━━━━━━━━━━━━━
Position: ${position}
Current Status: ${stageLabel}
Application ID: ${data.id || event?.entity_id || '—'}

If you have questions, please don't hesitate to reach out to us at hawaii@geolabs.net or (808) 841-5064.

Thank you for your interest in Geolabs, Inc.

Warm regards,
Geolabs, Inc. — Human Resources
94-429 Koaki Street, Suite 200
Waipahu, Hawaii 96797
(808) 841-5064 · hawaii@geolabs.net
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: data.email,
      from_name: 'Geolabs, Inc. HR',
      subject,
      body,
    });

    console.log(`Stage email sent to ${data.email} for stage: ${stage}`);
    return Response.json({ success: true, stage, recipient: data.email });
  } catch (error) {
    console.error('sendStageEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});