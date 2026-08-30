import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.setDefaultTimeout(9000);

try {
  let linkRequest;
  await page.route('**/api/application-drafts/link', async route => {
    linkRequest = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ok: true, token: 'private-test-token', email: 'continue@example.com', expiresAt: '2026-09-22T00:00:00.000Z' }) });
  });
  await page.goto(`${baseUrl}/apply`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /begin general application/i }).click();
  await page.getByRole('button', { name: /Personal information/ }).click();
  await page.getByLabel('First Name').fill('Continue');
  await page.getByLabel('Last Name').fill('Applicant');
  await page.getByLabel('Email Address').fill('continue@example.com');
  await page.getByRole('button', { name: /Continue on another device/ }).click();
  await page.getByRole('button', { name: 'Email my link' }).click();
  await page.getByText('Private link sent', { exact: true }).waitFor();
  assert.equal(linkRequest.draft.email, 'continue@example.com');
  assert.equal(linkRequest.draft.formData.firstName, 'Continue');
  assert.equal(await page.evaluate(() => localStorage.getItem('geolabs_application_general_resumeToken')), 'private-test-token');

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  let autosaveAuthorized = false;
  await secondPage.route('**/api/application-drafts/resume?token=private-test-token', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ draft: {
      email: 'continue@example.com',
      formData: { firstName: 'Continue', lastName: 'Applicant', email: 'continue@example.com', positionAppliedFor: 'General Application' },
      currentStep: 1,
      completedSteps: [0],
      activeTasks: { 1: 2 },
      flowVersion: 'simple-v3',
    } }),
  }));
  await secondPage.route('**/api/application-drafts', async route => {
    autosaveAuthorized = route.request().headers().authorization === 'Bearer private-test-token';
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await secondPage.goto(`${baseUrl}/apply?resume=private-test-token`);
  await secondPage.getByLabel('First Name').waitFor();
  assert.equal(await secondPage.getByLabel('First Name').inputValue(), 'Continue');
  assert.doesNotMatch(secondPage.url(), /resume=/, 'The private token must be removed from the address after restoration.');
  await secondPage.getByLabel('City').fill('Waipahu');
  await secondPage.waitForTimeout(3000);
  assert.equal(autosaveAuthorized, true, 'Cross-device drafts must autosave with bearer-token authorization.');
  await secondContext.close();
  console.log('Continue-link request, cross-browser restoration, URL cleanup, and authenticated autosave passed.');
} finally {
  await browser.close();
}
