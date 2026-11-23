import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

// Local browser test only. The submit endpoint is blocked defensively: no mail.
const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});

const field = (page, key) => page.locator(`[data-document-field="${key}"]`).locator('input, textarea').first();
const documentNav = page => page.getByRole('navigation', { name: 'Application documents', exact: true });
const progress = page => page.getByRole('navigation', { name: 'Application progress', exact: true });
const editor = page => page.locator('.document-editor');
const screenshotDirectory = 'tmp/simplified-document-review';
await mkdir(screenshotDirectory, { recursive: true });

async function captureEditor(page, name) {
  await editor(page).scrollIntoViewIfNeeded();
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const animation of document.getAnimations()) animation.finish();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.screenshot({ path: `${screenshotDirectory}/${name}.png`, animations: 'disabled' });
  await editor(page).evaluate(node => window.scrollTo({ top: window.scrollY + node.getBoundingClientRect().top - 100, behavior: 'instant' }));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: `${screenshotDirectory}/${name}-overview.png`, animations: 'disabled' });
}

async function startAt(page, step, task = 0) {
  await page.goto(`${baseUrl}/apply`);
  await page.evaluate(({ step, task }) => {
    localStorage.clear();
    localStorage.setItem('geolabs_application_general', JSON.stringify({ firstName: 'Document', lastName: 'TEST' }));
    localStorage.setItem('geolabs_application_general_flowVersion', 'simple-v3');
    localStorage.setItem('geolabs_application_general_step', String(step));
    localStorage.setItem('geolabs_application_general_tasks', JSON.stringify({ [step]: task }));
  }, { step, task });
  await page.reload();
  await editor(page).waitFor();
}

async function paperReady(page, pages = 1) {
  await page.waitForFunction(expected => {
    const canvases = [...document.querySelectorAll('.document-paper-page canvas')];
    return canvases.length === expected && canvases.every(canvas => canvas.dataset.rendered === 'true' && canvas.width > 600 && canvas.height > 700);
  }, pages);
  assert.equal(await editor(page).getByRole('button', { name: 'Next field', exact: true }).count(), 0);
  assert.equal(await editor(page).getByText(/Use the highlighted fields or Next field/).count(), 0);
  assert.equal(await editor(page).getByRole('button', { name: /Readable view|Original document|today/i }).count(), 0, 'The document should not offer duplicate date shortcuts or view switches.');
  const transcript = editor(page).getByRole('region', { name: 'Original document text', exact: true });
  assert.match(await transcript.getAttribute('class'), /sr-only/, 'Original policy text must remain available to assistive tools without a second visible view.');
  assert.notEqual(await transcript.getAttribute('aria-hidden'), 'true');
  assert.ok((await transcript.textContent()).trim().length > 100, 'The accessible transcript must retain the original policy text.');
}

async function assertNoPageOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true, 'Document preview must not make the whole page scroll sideways.');
}

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, timezoneId: 'Pacific/Honolulu', reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/submit-application', route => route.abort('blockedbyclient'));
    await startAt(page, 4);
    await paperReady(page);
    assert.equal(await field(page, 'drugTestSignature').isDisabled(), false);
    await field(page, 'drugTestSignature').fill('Before acknowledgment TEST');
    assert.equal(await page.evaluate(async () => {
      await document.fonts.load('20px "Geolabs Signature"');
      return document.fonts.check('20px "Geolabs Signature"');
    }), true, 'The bundled signature font must load in the real browser.');
    assert.equal(await field(page, 'drugTestAgreed').isChecked(), false, 'Typing a signature must never imply consent.');
    assert.equal(await editor(page).getByRole('button', { name: 'Review required acknowledgment', exact: true }).count(), 0);
    assert.equal(await field(page, 'drugTestDate').getAttribute('type'), 'date', 'Dates retain their native platform picker.');
    assert.equal(await field(page, 'drugTestDate').isDisabled(), true);
    await field(page, 'drugTestAgreed').check();
    await field(page, 'drugTestSignature').fill('Document TEST');
    await field(page, 'drugTestSignature').press('Tab');
    assert.equal(await field(page, 'drugTestDate').evaluate(node => node === document.activeElement), true, 'Tab must focus the next enabled control.');
    assert.equal(await field(page, 'drugTestDate').inputValue(), '', 'Tab must not sign or enter a date.');
    await field(page, 'drugTestDate').fill('2026-11-22');
    await assertNoPageOverflow(page);
    await captureEditor(page, `${viewport.width}-drug-original`);
    assert.equal(await field(page, 'drugTestSignature').inputValue(), 'Document TEST');
    assert.equal(await field(page, 'drugTestDate').inputValue(), '2026-11-22');
    assert.equal(await editor(page).getByText('Typing your name serves as your electronic signature. It is not added automatically.', { exact: true }).count(), 0, 'The redundant document footer should be absent.');
    await field(page, 'drugTestSignature').fill('');
    await field(page, 'drugTestSignature').pressSequentially('Keyboard TEST');
    assert.equal(await field(page, 'drugTestSignature').inputValue(), 'Keyboard TEST', 'Controlled input must retain focus for every character.');
    await field(page, 'drugTestSignature').press('Tab');
    assert.notEqual(await page.evaluate(() => document.activeElement?.tagName), 'BODY');
    await paperReady(page);
    assert.equal(await field(page, 'drugTestSignature').inputValue(), 'Keyboard TEST');
    await page.reload();
    await editor(page).waitFor();
    await paperReady(page);
    assert.equal(await field(page, 'drugTestSignature').inputValue(), 'Keyboard TEST', 'Reload must recover document answers from the existing draft.');
    assert.equal(await field(page, 'drugTestAgreed').isChecked(), true);
    for (let repeat = 0; repeat < 3; repeat += 1) {
      await documentNav(page).getByRole('button', { name: 'EEO survey', exact: true }).click();
      await paperReady(page);
      await documentNav(page).getByRole('button', { name: 'Alcohol & drug agreement', exact: true }).click();
      await paperReady(page);
      assert.equal(await field(page, 'drugTestSignature').inputValue(), 'Keyboard TEST', 'Repeated document changes must preserve answers and a rendered preview.');
    }

    await documentNav(page).getByRole('button', { name: 'EEO survey', exact: true }).click();
    await paperReady(page);
    assert.equal(await editor(page).locator('input[type="radio"]:checked').count(), 0, 'Voluntary answers must start unselected.');
    const female = editor(page).getByRole('radio', { name: 'Female', exact: true });
    await female.locator('..').click();
    assert.equal(await female.isChecked(), true);
    const asian = editor(page).getByRole('radio', { name: 'Asian (not Hispanic or Latino)', exact: true });
    await asian.locator('..').click();
    assert.equal(await asian.isChecked(), true);
    await field(page, 'eeoName').fill('Document TEST');
    await field(page, 'eeoDate').fill('2026-11-22');
    await paperReady(page);
    assert.equal(await page.getByRole('radio', { name: 'Female', exact: true }).isChecked(), true);
    assert.equal(await page.getByRole('radio', { name: 'Asian (not Hispanic or Latino)', exact: true }).isChecked(), true);
    await captureEditor(page, `${viewport.width}-eeo-original`);
    await page.getByRole('button', { name: 'Clear gender selection', exact: true }).click();
    assert.equal(await page.getByRole('radio', { name: 'Female', exact: true }).isChecked(), false);
    await documentNav(page).getByRole('button', { name: 'Veteran status', exact: true }).click();
    await paperReady(page, 2);
    assert.equal(await field(page, 'vetSignature').inputValue(), '', 'Names must not be applied as signatures automatically.');
    const veteranDecline = page.getByRole('radio', { name: 'I do not wish to self-identify', exact: true });
    await veteranDecline.locator('..').click();
    assert.equal(await veteranDecline.isChecked(), true);
    await veteranDecline.press('Tab');
    assert.equal(await field(page, 'vetSignature').evaluate(node => node === document.activeElement), true, 'Tab must reach the signature on page two.');
    await field(page, 'vetSignature').fill('Document TEST');
    await field(page, 'vetDate').fill('2026-11-22');
    await captureEditor(page, `${viewport.width}-veteran-original`);
    assert.equal(await field(page, 'vetSignature').inputValue(), 'Document TEST');
    await page.getByRole('button', { name: 'Clear veteran status selection', exact: true }).click();
    assert.equal(await editor(page).locator('input[type="radio"]:checked').count(), 0);

    await progress(page).getByRole('button', { name: /Requirements/ }).click();
    await progress(page).getByRole('button', { name: /Medical authorization/ }).click();
    await paperReady(page);
    assert.equal(await page.locator('[data-document-field="fcrInitials"] input').count(), 0, 'Medical task must not duplicate certification inputs.');
    await field(page, 'medInitials').fill('DT');
    await field(page, 'canPerformDuties').check();
    await page.getByRole('checkbox', { name: /^I may require a reasonable accommodation/ }).check();
    await captureEditor(page, `${viewport.width}-medical-original`);
    await progress(page).getByRole('button', { name: /Certification/ }).click();
    await paperReady(page);
    assert.equal(await page.locator('[data-document-field="medInitials"] input').count(), 0, 'Certification task must not duplicate medical inputs.');
    await field(page, 'fcrInitials').fill('DT');
    await field(page, 'knowEmployee').fill('Yes');
    await field(page, 'knowEmployeeName').fill('Example Employee');
    assert.equal(await field(page, 'certificationSignature').isDisabled(), false);
    await field(page, 'certificationSignature').fill('Unsigned draft TEST');
    assert.equal(await field(page, 'certificationAgreed').isChecked(), false);
    await field(page, 'certificationAgreed').check();
    await field(page, 'certificationSignature').fill('Document TEST');
    await field(page, 'certificationDate').fill('2026-11-22');
    await assertNoPageOverflow(page);
    await captureEditor(page, `${viewport.width}-certification-original`);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('geolabs_application_general')));
    assert.equal(stored.medInitials, 'DT');
    assert.equal(stored.needsAccommodation, true);
    assert.equal(stored.canPerformDuties, true);
    assert.equal(stored.knowEmployee, 'Yes');
    assert.equal(stored.knowEmployeeName, 'Example Employee');
    assert.equal(stored.eeoName, 'Document TEST');
    assert.equal(stored.eeoRace, 'Asian (not Hispanic or Latino)');
    assert.equal(stored.drugTestSignature, 'Keyboard TEST');
    assert.equal(stored.vetSignature, 'Document TEST');
    for (const key of ['drugTestDate', 'eeoDate', 'vetDate', 'certificationDate']) assert.equal(stored[key], '2026-11-22', `${key} must preserve the date entered through the native input.`);
    assert.equal(await page.getByRole('button', { name: /disability form/i }).count(), 0);
    assert.deepEqual(errors, [], 'No uncaught browser errors are allowed.');
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.route('**/api/submit-application', route => route.abort('blockedbyclient'));
  await startAt(page, 5);
  await paperReady(page);
  await field(page, 'eeoName').fill('Recovery TEST');
  await page.route('**/forms/lola-v1/eeo-survey.pdf', route => route.abort('failed'));
  await page.reload();
  await page.getByRole('alert').getByText(/PDF could not be loaded/).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Next field', exact: true }).count(), 0);
  assert.equal(await editor(page).getByRole('link', { name: /Open blank original PDF/ }).count(), 0);
  assert.equal(await editor(page).getByRole('button', { name: /Readable view|Original document|today/i }).count(), 0);
  await page.unroute('**/forms/lola-v1/eeo-survey.pdf');
  await page.getByRole('button', { name: 'Retry document', exact: true }).click();
  await paperReady(page);
  assert.equal(await field(page, 'eeoName').inputValue(), 'Recovery TEST', 'Preview recovery must preserve saved answers.');
  assert.equal(await page.getByRole('alert').count(), 0, 'A successful retry must clear the error.');
  await context.close();
  console.log('Document editor passed: automatic desktop/mobile original pages, no redundant controls, accessible transcripts, native dates, keyboard/next-field, shared values, draft and PDF retry recovery, voluntary clearing, accommodation, and no disability (no mail sent).');
} finally {
  await browser.close();
}
