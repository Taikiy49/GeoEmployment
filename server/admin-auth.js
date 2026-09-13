import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE = 'geolabs_admin_session';
const STATE_COOKIE = 'geolabs_oauth_state';
const RETURN_COOKIE = 'geolabs_oauth_return';
const SESSION_SECONDS = 8 * 60 * 60;
const STATE_SECONDS = 10 * 60;

const allowedEmails = () => new Set(
  (process.env.ADMIN_ALLOWED_EMAILS || 'tyamashita@geolabs.net,lola@geolabs.net')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean),
);

const sessionSecret = () => process.env.ADMIN_SESSION_SECRET || process.env.MS_CLIENT_SECRET || '';
const redirectUri = () => process.env.MS_ADMIN_REDIRECT_URI
  || 'https://careers.geolabs.net/auth/callback';

const parseCookies = request => Object.fromEntries(
  String(request.headers.cookie || '')
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const separator = part.indexOf('=');
      return separator < 0
        ? [part, '']
        : [part.slice(0, separator), (() => {
          try { return decodeURIComponent(part.slice(separator + 1)); } catch { return ''; }
        })()];
    }),
);

const cookie = (name, value, options = {}) => {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ];
  if (options.maxAge !== undefined) attributes.push(`Max-Age=${options.maxAge}`);
  return attributes.join('; ');
};

const safeEqual = (left, right) => {
  const first = Buffer.from(String(left || ''));
  const second = Buffer.from(String(right || ''));
  return first.length === second.length && timingSafeEqual(first, second);
};

const sign = value => createHmac('sha256', sessionSecret()).update(value).digest('base64url');

const createSession = user => {
  const payload = Buffer.from(JSON.stringify({
    email: user.email,
    name: user.name,
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  })).toString('base64url');
  return `${payload}.${sign(payload)}`;
};

export function getAdminSession(request) {
  const token = parseCookies(request)[SESSION_COOKIE];
  const [payload, signature, extra] = String(token || '').split('.');
  if (!payload || !signature || extra !== undefined || !sessionSecret() || !safeEqual(signature, sign(payload))) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!Number.isFinite(session.exp) || session.exp <= Math.floor(Date.now() / 1000) || session.role !== 'admin') return null;
    if (!allowedEmails().has(String(session.email || '').toLowerCase())) return null;
    return session;
  } catch {
    return null;
  }
}

const redirect = (response, location, cookies = []) => {
  response.writeHead(302, {
    Location: location,
    'Cache-Control': 'no-store',
    ...(cookies.length ? { 'Set-Cookie': cookies } : {}),
  });
  response.end();
};

const sendAuthError = (response, statusCode, title, message) => {
  response.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#172033"><main style="max-width:560px;margin:12vh auto;padding:36px;border:1px solid #dce2e8;border-radius:16px;background:#fff"><div style="color:#9a5528;font-size:12px;font-weight:800;letter-spacing:.12em">GEOLABS, INC.</div><h1 style="margin:12px 0;font-size:28px">${title}</h1><p style="line-height:1.65;color:#526075">${message}</p><a href="/" style="display:inline-block;margin-top:14px;color:#9a5528;font-weight:700">Return to careers</a></main></body></html>`);
};

async function finishMicrosoftLogin(request, response, url) {
  const cookies = parseCookies(request);
  if (!url.searchParams.get('code') || !url.searchParams.get('state') || !cookies[STATE_COOKIE]
    || !safeEqual(url.searchParams.get('state'), cookies[STATE_COOKIE])) {
    sendAuthError(response, 400, 'Sign-in could not be verified', 'Please return to the admin portal and try signing in again.');
    return;
  }

  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(process.env.MS_TENANT_ID)}/oauth2/v2.0/token`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(25_000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MS_CLIENT_ID,
        client_secret: process.env.MS_CLIENT_SECRET,
        code: url.searchParams.get('code'),
        redirect_uri: redirectUri(),
        grant_type: 'authorization_code',
        scope: 'openid profile email User.Read',
      }),
    },
  );
  const token = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !token.access_token) {
    throw new Error(token.error_description || 'Microsoft token exchange failed.');
  }

  const profileResponse = await fetch(
    'https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName',
    { headers: { Authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(25_000) },
  );
  const profile = await profileResponse.json().catch(() => ({}));
  if (!profileResponse.ok) throw new Error(profile.error?.message || 'Microsoft profile lookup failed.');

  const email = String(profile.mail || profile.userPrincipalName || '').toLowerCase();
  if (!allowedEmails().has(email)) {
    sendAuthError(response, 403, 'Access restricted', 'This Microsoft account is not authorized to access the Geolabs, Inc. HR Admin Portal.');
    return;
  }

  const returnTo = String(cookies[RETURN_COOKIE] || '/admin');
  redirect(response, returnTo.startsWith('/admin') ? returnTo : '/admin', [
    cookie(SESSION_COOKIE, createSession({ email, name: profile.displayName || email }), { maxAge: SESSION_SECONDS }),
    cookie(STATE_COOKIE, '', { maxAge: 0 }),
    cookie(RETURN_COOKIE, '', { maxAge: 0 }),
  ]);
}

export async function handleAdminAuth(request, response) {
  const url = new URL(request.url, 'https://careers.geolabs.net');

  if (url.pathname === '/auth/session') {
    const session = getAdminSession(request);
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify({
      authenticated: Boolean(session),
      user: session ? { email: session.email, full_name: session.name, role: 'admin' } : null,
    }));
    return true;
  }

  if (url.pathname === '/auth/logout') {
    redirect(response, '/', [cookie(SESSION_COOKIE, '', { maxAge: 0 })]);
    return true;
  }

  if (url.pathname === '/auth/login') {
    if (!process.env.MS_TENANT_ID || !process.env.MS_CLIENT_ID || !process.env.MS_CLIENT_SECRET || !sessionSecret()) {
      sendAuthError(response, 503, 'Microsoft sign-in is unavailable', 'The HR portal authentication service has not been configured.');
      return true;
    }
    const state = randomBytes(32).toString('base64url');
    const returnTo = String(url.searchParams.get('returnTo') || '/admin');
    const authorizationUrl = new URL(
      `https://login.microsoftonline.com/${encodeURIComponent(process.env.MS_TENANT_ID)}/oauth2/v2.0/authorize`,
    );
    authorizationUrl.search = new URLSearchParams({
      client_id: process.env.MS_CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirectUri(),
      response_mode: 'query',
      scope: 'openid profile email User.Read',
      state,
      prompt: 'select_account',
    }).toString();
    redirect(response, authorizationUrl.toString(), [
      cookie(STATE_COOKIE, state, { maxAge: STATE_SECONDS }),
      cookie(RETURN_COOKIE, returnTo.startsWith('/admin') ? returnTo : '/admin', { maxAge: STATE_SECONDS }),
    ]);
    return true;
  }

  if (url.pathname === '/auth/callback') {
    try {
      await finishMicrosoftLogin(request, response, url);
    } catch (error) {
      console.error('Microsoft admin sign-in failed:', error.message);
      sendAuthError(response, 502, 'Microsoft sign-in failed', 'We could not complete Microsoft authentication. Please try again or contact the portal administrator.');
    }
    return true;
  }

  return false;
}
