import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Geolabs HR',
      to: 'lola@geolabs.net',
      subject: 'Account Setup Instructions — Geolabs HR Portal',
      body: `Hi Lola,

Welcome to the Geolabs HR Portal! Your account is ready to use.

To get started:
1. Log in with your email: lola@geolabs.net
2. Set up your account credentials
3. Access the applicant tracking system and job board

If you have any questions, contact employment@geolabs.net.

Best regards,
Geolabs HR Team`,
    });

    console.log('Account setup email sent to lola@geolabs.net');
    return Response.json({ ok: true, sent_to: 'lola@geolabs.net' });
  } catch (error) {
    console.error('Error sending email:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});