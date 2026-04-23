const CLIENT_ID = 'e00c4440-0129-4b66-94dc-02ea645fd13c';
const TENANT_ID = '0b6bfb2a-ae2a-4961-9c6a-bd500f86bfbc';
const AUTHORIZED_EMAILS = ['lola@geolabs.net', 'tyamashita@geolabs.net'];

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || 'https://geolabs-employment.net';
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    // Error from Azure
    if (error) {
      console.log('Azure error:', error, url.searchParams.get('error_description'));
      return new Response(`<html><body><p>Auth failed: ${error}</p><a href="/">Go back</a></body></html>`, { 
        status: 400, 
        headers: { 'Content-Type': 'text/html' } 
      });
    }

    // Step 1: Initiate login - return auth URL for frontend to redirect to
    if (!code) {
      const redirectUri = `${origin}`;
      const authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?` +
        `client_id=${CLIENT_ID}` +
        `&response_type=code` +
        `&scope=openid%20profile%20email` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_mode=query`;
      return Response.json({ authUrl });
    }

    // Step 2: Handle callback from Azure with code
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          code,
          redirect_uri: origin,
          grant_type: 'authorization_code',
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      const err = await tokenResponse.json();
      console.error('Token exchange failed:', err);
      return new Response('<html><body><p>Token exchange failed</p><a href="/">Go back</a></body></html>', { 
        status: 400, 
        headers: { 'Content-Type': 'text/html' } 
      });
    }

    const { access_token } = await tokenResponse.json();

    // Step 3: Get user info from Microsoft Graph
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { 'Authorization': `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user info');
      return new Response('<html><body><p>Failed to get user info</p><a href="/">Go back</a></body></html>', { 
        status: 400, 
        headers: { 'Content-Type': 'text/html' } 
      });
    }

    const userData = await userResponse.json();
    const userEmail = userData.mail || userData.userPrincipalName;

    console.log(`Microsoft auth: ${userEmail}, authorized: ${AUTHORIZED_EMAILS.includes(userEmail)}`);

    // Step 4: Check authorization and redirect
    if (AUTHORIZED_EMAILS.includes(userEmail)) {
      return new Response(null, { 
        status: 302, 
        headers: { 'Location': '/admin' } 
      });
    } else {
      return new Response(`<html><body><p>Email ${userEmail} not authorized</p><a href="/">Go back</a></body></html>`, { 
        status: 403, 
        headers: { 'Content-Type': 'text/html' } 
      });
    }
  } catch (error) {
    console.error('microsoftAuth error:', error.message);
    return new Response(`<html><body><p>Error: ${error.message}</p><a href="/">Go back</a></body></html>`, { 
      status: 500, 
      headers: { 'Content-Type': 'text/html' } 
    });
  }
});