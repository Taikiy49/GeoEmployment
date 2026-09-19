import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

// Requests are intercepted: this test never submits an application or sends mail.
const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(9000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const requests = [];
const draft = {
  firstName: 'Submission', lastName: 'TEST', email: 'test@example.com',
  address: '123 Test Street', city: 'Waipahu', state: 'HI', zip: '96797',
  positionAppliedFor: 'General Application', preferredLocation: 'Waipahu, HI', highestEducationLevel: 'high_school',
  certifyInitials: 'ST', medInitials: 'ST', fcrInitials: 'ST',
  certificationAgreed: true, certificationSignature: 'Submission TEST', certificationDate: '2026-09-13',
  drugTestAgreed: true, drugTestSignature: 'Submission TEST', drugTestDate: '2026-09-13',
};
try {
  await page.route('**/api/submit-application', async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: requests.length === 1 ? 502 : 200, contentType: 'application/json', body: JSON.stringify(requests.length === 1
      ? { error: 'Test delivery interruption. Your application remains saved.' }
      : { ok: true, applicationId: requests[0].id, confirmationSent: true }) });
  });
  await page.goto(`${baseUrl}/apply`);
  await page.evaluate(data => {
    localStorage.clear();
    localStorage.setItem('geolabs_application_general', JSON.stringify(data));
    localStorage.setItem('geolabs_application_general_step', '6');
    localStorage.setItem('geolabs_application_general_flowVersion', 'simple-v3');
  }, { ...draft, fcrInitials: '' });
  await page.reload();
  assert.equal(await page.getByRole('button', { name: 'Submit Application', exact: true }).isDisabled(), true);
  await page.getByText(/FCRA disclosure initials/).first().waitFor();
  await page.evaluate(data => localStorage.setItem('geolabs_application_general', JSON.stringify(data)), draft);
  await page.reload();
  const submit = page.getByRole('button', { name: 'Submit Application', exact: true });
  await submit.click();
  await page.getByText('Test delivery interruption. Your application remains saved.').waitFor();
  assert.equal(requests.length, 1);
  assert.ok(requests[0].id);
  assert.equal(await page.evaluate(() => localStorage.getItem('geolabs_application_general_submissionId')), requests[0].id);
  await page.reload();
  await submit.click();
  await page.getByText(requests[0].id, { exact: true }).waitFor();
  assert.equal(requests.length, 2);
  assert.equal(requests[1].id, requests[0].id, 'A reload and retry must not create a second application reference.');
  assert.equal(requests[1].applicationData.firstName, 'Submission');
  assert.equal(await page.evaluate(() => localStorage.getItem('geolabs_application_general_submissionId')), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('geolabs_application_general')), null);
  assert.deepEqual(errors, []);
  console.log('Submission blockers, interrupted delivery, stable retry reference, confirmation, and draft cleanup passed (no mail sent).');
} finally {
  await browser.close();
}
