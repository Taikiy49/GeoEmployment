import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const previewUrl = new URL(process.env.TEST_BASE_URL || 'http://127.0.0.1:4174');
assert.ok(['localhost', '127.0.0.1'].includes(previewUrl.hostname), 'Auth routing tests require a loopback preview.');
// A .localhost alias exercises the non-demo /auth/session code path while all
// traffic remains on the local static preview, with auth/API responses mocked.
previewUrl.hostname = 'auth-check.localhost';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true, args: ['--host-resolver-rules=MAP auth-check.localhost 127.0.0.1', '--no-proxy-server'] });
const job = { id: 'auth-routing-test', title: 'Auth Routing Test Opening', status: 'published', department: 'Engineering', office: 'Waipahu, HI', employmentType: 'full_time', description: 'Synthetic read-only public job fixture.' };

async function testCase(sessionMode, pathname, isAdmin = false) {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const pageErrors = [];
  let sessionRequests = 0;
  let loginRequests = 0;
  let adminRequests = 0;
  let unexpectedWrites = 0;
  let releasePending;
  const pending = new Promise((resolve) => { releasePending = resolve; });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      unexpectedWrites += 1;
      return route.abort('blockedbyclient');
    }
    if (url.pathname === '/auth/session') {
      sessionRequests += 1;
      if (sessionMode === 'pending') await pending;
      if (sessionMode === 'network-error') return route.abort('failed');
      if (sessionMode === '503' || sessionMode === 'pending') return route.fulfill({ status: 503, json: { error: 'Synthetic session outage' } });
      const role = sessionMode === 'admin' ? 'admin' : 'applicant';
      return route.fulfill({ json: sessionMode === 'anonymous'
        ? { authenticated: false }
        : { authenticated: true, user: { role, email: 'synthetic@example.test', full_name: 'Synthetic Routing Test' } } });
    }
    if (url.pathname === '/auth/login') {
      loginRequests += 1;
      return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Isolated login boundary</title><h1>Isolated login boundary</h1>' });
    }
    if (url.pathname.startsWith('/api/admin/')) {
      adminRequests += 1;
      return route.fulfill({ json: { jobs: [job], applications: [] } });
    }
    if (url.pathname === '/api/jobs') return route.fulfill({ json: { jobs: [job] } });
    return route.continue();
  });

  try {
    await page.goto(new URL(pathname, previewUrl).href);
    if (isAdmin) {
      if (sessionMode === 'admin') {
        await page.getByRole('heading', { name: 'Job Openings', exact: true }).waitFor();
        // The heading mounts before the data-fetch effect. Wait for its result,
        // not a machine-speed-dependent request counter immediately on mount.
        await page.getByRole('link', { name: job.title, exact: true }).waitFor();
        assert.ok(adminRequests > 0, 'An authorized admin can load the protected store.');
        assert.equal(loginRequests, 0);
      } else if (sessionMode === 'pending') {
        await page.getByRole('status').filter({ hasText: 'Checking administrator access' }).waitFor();
        assert.equal(await page.getByRole('heading', { name: 'Job Openings', exact: true }).count(), 0);
        assert.equal(adminRequests, 0, 'A pending auth check must not mount protected children.');
        releasePending();
        await page.getByRole('heading', { name: 'Isolated login boundary' }).waitFor();
        assert.equal(adminRequests, 0);
      } else {
        await page.getByRole('heading', { name: 'Isolated login boundary' }).waitFor();
        assert.equal(new URL(page.url()).searchParams.get('returnTo'), pathname);
        assert.equal(adminRequests, 0, 'Denied sessions must never mount the protected store.');
      }
    } else {
      if (pathname === '/') {
        await page.getByRole('heading', { level: 1 }).waitFor();
        await page.getByRole('link', { name: /Auth Routing Test Opening/ }).waitFor();
      } else {
        await page.getByRole('button', { name: /^Begin (General )?Application$/ }).click();
        await page.getByRole('navigation', { name: 'Application progress' }).getByRole('button', { name: /Personal information/ }).click();
        const field = page.getByLabel('First Name', { exact: false });
        await field.fill('Public outage TEST');
        assert.equal(await field.inputValue(), 'Public outage TEST');
      }
      assert.ok(sessionRequests > 0, 'The test must exercise the production session-lookup path.');
      assert.equal(loginRequests, 0, 'A public visitor must not be redirected for an admin auth failure.');
      assert.equal(new URL(page.url()).pathname, pathname);
      assert.equal(adminRequests, 0);
      if (sessionMode === 'pending') {
        const response = page.waitForResponse((result) => new URL(result.url()).pathname === '/auth/session');
        releasePending();
        await response;
      }
    }
    assert.deepEqual(pageErrors, []);
    assert.equal(unexpectedWrites, 0);
    console.log(`PASS ${sessionMode} session: ${pathname} ${isAdmin ? '(protected)' : '(public)'}`);
  } finally {
    releasePending();
    await context.close();
  }
}

try {
  for (const mode of ['503', 'network-error', 'pending']) {
    for (const pathname of ['/', '/apply', `/apply/${job.id}`]) await testCase(mode, pathname);
  }
  for (const mode of ['anonymous', 'non-admin', '503', 'network-error', 'pending', 'admin']) {
    await testCase(mode, '/admin/jobs', true);
  }
  console.log('Public routes remain available during admin-auth failures; protected routes still fail closed. No login, email, or data write performed.');
} finally {
  await browser.close();
}
