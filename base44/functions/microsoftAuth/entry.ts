const CLIENT_ID = 'e00c4440-0129-4b66-94dc-02ea645fd13c';
const TENANT_ID = '0b6bfb2a-ae2a-4961-9c6a-bd500f86bfbc';
const AUTHORIZED_EMAILS = ['lola@geolabs.net', 'tyamashita@geolabs.net'];

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    let origin = req.headers.get('Origin') || req.headers.get('Referer');
    if (origin) {
      origin = new URL(origin).origin;
    } else {
      origin = 'http://localhost';
    }
    const baseUrl = origin;
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    // Check for auth errors from Azure
    if (error) {
      const errorDescription = url.searchParams.get('error_description') || error;
      console.log('Azure auth error:', errorDescription);
      return new Response(null, { status: 302, headers: { 'Location': '/' } });
    }

    // Step 1: User initiates login - return auth URL
    if (!code) {
      const redirectUri = `${baseUrl}/`;
      const authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?` +
        `client_id=${CLIENT_ID}` +
        `&response_type=code` +
        `&scope=openid%20profile%20email` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_mode=query`;
      return Response.json({ authUrl });
    }

    // Step 2: Exchange code for token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          code,
          redirect_uri: baseUrl,
          grant_type: 'authorization_code',
          scope: 'openid profile email',
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      const err = await tokenResponse.json();
      console.error('Token exchange failed:', err);
      return new Response(null, { status: 302, headers: { 'Location': '/' } });
    }

    const { access_token } = await tokenResponse.json();

    // Step 3: Get user info from Microsoft Graph
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { 'Authorization': `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user info');
      return new Response(null, { status: 302, headers: { 'Location': '/' } });
    }

    const userData = await userResponse.json();
    const userEmail = userData.mail || userData.userPrincipalName;

    console.log(`Microsoft auth attempt: ${userEmail}`);

    // Step 4: Check if user is authorized and redirect accordingly
    const isAuthorized = AUTHORIZED_EMAILS.includes(userEmail);
    const redirectPath = isAuthorized ? '/admin' : '/';

    return new Response(null, { status: 302, headers: { 'Location': redirectPath } });
  } catch (error) {
    console.error('microsoftAuth error:', error.message);
    return new Response(null, { status: 302, headers: { 'Location': '/' } });
  }
});