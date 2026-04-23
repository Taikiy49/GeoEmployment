const CLIENT_ID = 'e00c4440-0129-4b66-94dc-02ea645fd13c';
const TENANT_ID = '0b6bfb2a-ae2a-4961-9c6a-bd500f86bfbc';
const AUTHORIZED_EMAILS = ['tyamashita@geolabs.net', 'lola@geolabs.net'];

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || req.headers.get('Referer')?.split('/').slice(0, 3).join('/') || 'https://geolabs-employment.net';
    const baseUrl = origin.replace(/\/$/, '');
    
    let code, error;
    
    // Handle both GET and POST from Azure
    if (req.method === 'POST' && req.headers.get('Content-Type')?.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      code = formData.get('code');
      error = formData.get('error');
    } else {
      code = url.searchParams.get('code');
      error = url.searchParams.get('error');
    }

    // Error from Azure
    if (error) {
      console.error('Azure error:', error, url.searchParams.get('error_description'));
      return new Response(
        `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
          <h2>Authentication Failed</h2>
          <p>${error}</p>
          <a href="/">← Go Back</a>
        </body></html>`,
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Callback from Azure with code
    if (code) {
      const redirectUri = `${baseUrl}/functions/microsoftAuth`;
      
      const tokenResponse = await fetch(
        `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            client_info: '1',
          }).toString(),
        }
      );

      if (!tokenResponse.ok) {
        const err = await tokenResponse.text();
        console.error('Token exchange failed:', err);
        return new Response(
          `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
            <h2>Token Exchange Failed</h2>
            <p>Could not authenticate with Microsoft. Please try again.</p>
            <a href="/">← Go Back</a>
          </body></html>`,
          { status: 400, headers: { 'Content-Type': 'text/html' } }
        );
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Get user info from Microsoft Graph
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!userResponse.ok) {
        console.error('Failed to fetch user info');
        return new Response(
          `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
            <h2>Failed to Get User Info</h2>
            <a href="/">← Go Back</a>
          </body></html>`,
          { status: 400, headers: { 'Content-Type': 'text/html' } }
        );
      }

      const userData = await userResponse.json();
      const userEmail = userData.mail || userData.userPrincipalName;

      console.log(`Microsoft auth attempt: ${userEmail}, authorized: ${AUTHORIZED_EMAILS.includes(userEmail)}`);

      // Check if authorized
      if (AUTHORIZED_EMAILS.includes(userEmail)) {
        return new Response(null, {
          status: 302,
          headers: { 'Location': '/admin' },
        });
      } else {
        return new Response(
          `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
            <h2>Access Denied</h2>
            <p>${userEmail} is not authorized to access this portal.</p>
            <a href="/">← Go Back</a>
          </body></html>`,
          { status: 403, headers: { 'Content-Type': 'text/html' } }
        );
      }
    }

    // Initial login request - return redirect to Azure
    const redirectUri = `${baseUrl}/functions/microsoftAuth`;
    const authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?` +
      `client_id=${CLIENT_ID}` +
      `&response_type=code` +
      `&scope=openid%20profile%20email` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_mode=form_post` +
      `&prompt=select_account`;

    return Response.json({ authUrl });
  } catch (error) {
    console.error('microsoftAuth error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});