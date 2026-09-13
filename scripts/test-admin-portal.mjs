import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const serverMode = Boolean(process.env.TEST_AUTH_COOKIE);
const hostname = new URL(baseUrl).hostname;
if (serverMode) assert.ok(hostname.endsWith('.localhost'), 'Real admin workflow tests must target an isolated .localhost server.');
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true, args: serverMode ? [`--host-resolver-rules=MAP ${hostname} 127.0.0.1`] : [] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(7000);
const browserErrors = [];
page.on('pageerror', error => browserErrors.push(error.message));
const apiRequests = [];
const apiResponses = [];
page.on('request', request => {
  if (request.url().includes('/api/admin/')) apiRequests.push({ method: request.method(), path: new URL(request.url()).pathname });
});
page.on('response', response => {
  if (response.url().includes('/api/admin/')) apiResponses.push({ method: response.request().method(), path: new URL(response.url()).pathname, status: response.status() });
});

try {
  if (serverMode) {
    const separator = process.env.TEST_AUTH_COOKIE.indexOf('=');
    assert.ok(separator > 0, 'TEST_AUTH_COOKIE must include its cookie name.');
    await page.context().addCookies([{
      name: process.env.TEST_AUTH_COOKIE.slice(0, separator), value: process.env.TEST_AUTH_COOKIE.slice(separator + 1),
      url: baseUrl, httpOnly: true, sameSite: 'Lax',
    }]);
    // No network calls outside the isolated server are part of this workflow.
    await page.route('**/*', async route => {
      const request = route.request();
      if (new URL(request.url()).hostname !== hostname) return route.abort();
      // Exercise a normal slow save so a test cannot mistake typed textarea
      // content for a saved recruiter note and reload before the request lands.
      if (request.method() === 'PATCH' && new URL(request.url()).pathname === '/api/admin/applications/app-admin-test'
        && request.postDataJSON()?.recruiterNotes) await new Promise(resolve => setTimeout(resolve, 250));
      return route.continue();
    });
  }
  await page.goto(baseUrl);
  if (!serverMode) await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('geolabs_current_user', JSON.stringify({ id: 'admin-test', email: 'tyamashita@geolabs.net', full_name: 'Taiki Yamashita', role: 'admin' }));
    localStorage.setItem('geolabs_applications', JSON.stringify([{
      id: 'app-admin-test', firstName: 'Admin', lastName: 'Workflow', email: 'admin.workflow@example.com',
      status: 'active', isDraft: false, stage: 'applied', submittedAt: '2026-08-10T12:00:00-10:00',
      requisitionTitle: 'Engineering Technician or Trainee (Field)', applicationData: { firstName: 'Admin', lastName: 'Workflow', email: 'admin.workflow@example.com' },
      documents: [
        { key: 'complete-application', label: 'Complete Employment Application', url: '/test-main.pdf', restricted: false },
        { key: 'eeo-survey', label: 'EEO Voluntary Self-Identification Survey', url: '/test-eeo.pdf', restricted: true },
      ],
      recruiterNotes: [], stageHistory: [], auditTrail: [],
    }]));
  });

  await page.goto(`${baseUrl}/admin`);
  console.log('Checking overview and navigation...');
  await page.getByRole('heading', { name: 'Hiring Overview' }).waitFor();
  assert.equal(await page.locator('nav a').count(), 4);
  assert.equal(await page.locator('nav a[aria-current="page"]').count(), 1, 'Only one navigation item should be active.');

  await page.getByRole('link', { name: 'Applications' }).click();
  console.log('Checking application search and detail actions...');
  await page.getByPlaceholder('Search name, email, position...').fill('Admin Workflow');
  await page.getByRole('link', { name: /Review/ }).click();
  await page.getByRole('heading', { name: 'Admin Workflow' }).waitFor();
  await page.getByRole('button', { name: 'Under Review' }).click();
  const stageResponse = serverMode ? page.waitForResponse(response => response.request().method() === 'PATCH'
    && new URL(response.url()).pathname === '/api/admin/applications/app-admin-test'
    && response.request().postDataJSON()?.stage === 'under_review') : null;
  await page.getByRole('button', { name: 'Yes, move to Under Review' }).click();
  if (stageResponse) {
    const response = await stageResponse;
    assert.equal(response.status(), 200, 'The candidate stage update must succeed.');
    assert.equal((await response.json()).application.stage, 'under_review');
  }
  const savedStage = page.getByRole('heading', { name: 'Admin Workflow' }).locator('..').getByText('Under Review', { exact: true });
  await savedStage.waitFor();
  await page.getByPlaceholder('Add a recruiter note...').fill('Reviewed during automated admin workflow test.');
  if (process.env.TEST_ADMIN_TRACE) console.log('Typed-note text matches before saving:', await page.getByText('Reviewed during automated admin workflow test.', { exact: true }).evaluateAll(nodes => nodes.map(node => node.tagName)));
  const noteResponse = serverMode ? page.waitForResponse(response => response.request().method() === 'PATCH'
    && new URL(response.url()).pathname === '/api/admin/applications/app-admin-test'
    && Boolean(response.request().postDataJSON()?.recruiterNotes)) : null;
  await page.getByRole('button', { name: 'Save recruiter note', exact: true }).click();
  if (noteResponse) {
    const response = await noteResponse;
    assert.equal(response.status(), 200, 'The recruiter note update must succeed.');
    assert.equal((await response.json()).application.recruiterNotes.at(-1).note, 'Reviewed during automated admin workflow test.');
  }
  const savedNote = page.locator('p').filter({ hasText: /^Reviewed during automated admin workflow test\.$/ });
  await savedNote.waitFor();
  await page.waitForFunction(() => document.querySelector('textarea[placeholder="Add a recruiter note..."]')?.value === '');
  await page.reload();
  await savedNote.waitFor();
  await savedStage.waitFor();
  assert.equal(await page.getByText('Complete Employment Application (Restricted)', { exact: true }).count(), 0);
  await page.getByText('Complete Employment Application', { exact: true }).waitFor();
  await page.getByText('EEO Voluntary Self-Identification Survey (Restricted)', { exact: true }).waitFor();
  if (serverMode) {
    const links = page.getByRole('link').filter({ hasText: /Complete Employment Application|EEO Voluntary Self-Identification Survey|View \/ Download Resume/ });
    assert.equal(await links.count(), 3);
    for (const link of await links.all()) {
      const path = await link.getAttribute('href');
      const response = await page.evaluate(async url => {
        const result = await fetch(url);
        return { status: result.status, headers: Object.fromEntries(result.headers), text: await result.text() };
      }, path);
      assert.equal(response.status, 200, `Saved attachment should load: ${path}`);
      assert.match(response.headers['content-type'], /application\/pdf/);
      assert.equal(response.headers['cache-control'], 'private, no-store');
      assert.match(response.text, /^%PDF-/);
    }
  }

  await page.getByRole('link', { name: 'Job Openings' }).click();
  console.log('Checking job creation and publishing...');
  await page.getByRole('link', { name: 'New Opening' }).click();
  const titleInput = page.getByLabel('Job Title', { exact: false });
  await titleInput.click();
  await page.keyboard.type('Admin Workflow Test Opening');
  assert.equal(await titleInput.inputValue(), 'Admin Workflow Test Opening', 'Typing must retain focus through every keystroke.');
  assert.equal(await titleInput.evaluate(input => document.activeElement === input), true);
  await page.locator('select').first().selectOption({ label: 'Engineering' });
  const descriptionInput = page.getByLabel('Job Description', { exact: false });
  await descriptionInput.click();
  await page.keyboard.type('A production-quality workflow test opening.');
  assert.equal(await descriptionInput.inputValue(), 'A production-quality workflow test opening.');
  const publishButton = page.getByRole('button', { name: 'Publish Opening', exact: true });
  assert.equal(await publishButton.isEnabled(), true, 'Publish should be enabled when required fields are complete.');
  await publishButton.click();
  await page.waitForURL(/\/admin\/jobs\/job-/);
  await page.getByRole('heading', { name: 'Admin Workflow Test Opening' }).waitFor();
  const createdJobUrl = page.url();
  await page.getByText('Published', { exact: true }).first().waitFor();

  await page.goto(`${baseUrl}/`);
  await page.getByText('Admin Workflow Test Opening', { exact: true }).waitFor();

  await page.goBack();
  await page.getByRole('link', { name: 'Edit' }).click();
  await page.getByPlaceholder('Describe the role, responsibilities, and team...').fill('Updated workflow test opening description.');
  await page.getByRole('button', { name: 'Save Draft' }).click();
  await page.getByText('Updated workflow test opening description.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByText('Paused', { exact: true }).first().waitFor();
  await page.goto(`${baseUrl}/`);
  assert.equal(await page.getByText('Admin Workflow Test Opening', { exact: true }).count(), 0, 'Paused openings must be hidden from applicants.');
  await page.goBack();
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.getByText('Published', { exact: true }).first().waitFor();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByText('Closed', { exact: true }).first().waitFor();
  await page.reload();
  await page.getByText('Closed', { exact: true }).first().waitFor();
  if (serverMode) {
    const state = await page.evaluate(async id => (await fetch(`/api/admin/jobs/${id}`)).json(), createdJobUrl.split('/').at(-1));
    assert.equal(state.job.status, 'closed');
    assert.equal(state.job.description, 'Updated workflow test opening description.');
  }

  await page.goto(`${baseUrl}/admin/settings`);
  console.log('Checking access controls and mobile layout...');
  await page.getByRole('heading', { name: 'Access & Security' }).waitFor();
  assert.equal(await page.getByText('Invite HR Admin', { exact: true }).count(), 0);
  assert.equal(await page.getByText('Email Templates', { exact: true }).count(), 0);
  await page.goto(`${baseUrl}/admin/email-templates`);
  await page.waitForURL('**/admin/settings');

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/admin', '/admin/jobs', '/admin/applications', '/admin/settings']) {
    await page.goto(`${baseUrl}${route}`);
    await page.locator('main').waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const offenders = overflow > 1 ? await page.evaluate(() => [...document.querySelectorAll('body *')]
      .map(element => ({ tag: element.tagName, classes: element.className, right: element.getBoundingClientRect().right }))
      .filter(item => item.right > document.documentElement.clientWidth + 1)
      .slice(0, 5)) : [];
    assert.ok(overflow <= 1, `${route} must not overflow horizontally on mobile (overflow: ${overflow}px; offenders: ${JSON.stringify(offenders)}).`);
  }
  assert.deepEqual(browserErrors, [], 'Admin workflows should not produce uncaught browser errors.');
  if (serverMode) {
    assert.ok(apiRequests.some(request => request.method === 'PATCH' && request.path === '/api/admin/applications/app-admin-test'), 'Candidate updates must use the real server.');
    assert.ok(apiRequests.some(request => request.method === 'POST' && request.path === '/api/admin/jobs'), 'Job creation must use the real server.');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('geolabs_applications') || '[]').length), 0, 'Candidate data must not be seeded in browser storage for this test.');
  }
  console.log('Admin navigation, applications, stages, notes, files, jobs, public publishing, settings, redirects, and mobile layout passed.');
} catch (error) {
  console.error('Admin workflow failure diagnostics:', JSON.stringify({ browserErrors, apiRequests, apiResponses }));
  if (serverMode) {
    const persisted = await page.evaluate(async () => {
      const response = await fetch('/api/admin/applications/app-admin-test');
      const data = await response.json();
      return { status: response.status, stage: data.application?.stage, noteCount: data.application?.recruiterNotes?.length };
    }).catch(() => null);
    console.error('Persisted synthetic candidate state:', JSON.stringify(persisted));
  }
  throw error;
} finally {
  await browser.close();
}
