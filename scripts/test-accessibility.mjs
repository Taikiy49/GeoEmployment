import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext();

await context.addInitScript(() => {
  window.__spokenApplicationText = [];
  class MockSpeechSynthesisUtterance {
    constructor(text) {
      this.text = text;
      this.rate = 1;
      this.onend = null;
      this.onerror = null;
    }
  }
  const speechSynthesis = {
    cancel() {},
    pause() {},
    resume() {},
    speak(utterance) {
      window.__spokenApplicationText.push(utterance.text);
      window.setTimeout(() => utterance.onend?.(), 0);
    },
  };
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: MockSpeechSynthesisUtterance });
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: speechSynthesis });
});

const page = await context.newPage();
page.setDefaultTimeout(9000);

try {
  await page.goto(`${baseUrl}/apply`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  assert.equal(await page.getByRole('link', { name: 'Skip to main content' }).count(), 1);
  assert.equal(await page.getByRole('region', { name: 'Current application section' }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Read this section aloud' }).count(), 1);

  await page.getByRole('button', { name: 'Read this section aloud' }).click();
  await page.waitForFunction(() => window.__spokenApplicationText.length > 0);
  assert.match(await page.evaluate(() => window.__spokenApplicationText.join(' ')), /application|resume|begin/i);

  await page.getByRole('button', { name: /begin general application/i }).click();
  await page.getByRole('progressbar', { name: 'Application completion' }).waitFor();
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), '17');
  assert.equal(await page.getByRole('button', { name: /Resume/ }).getAttribute('aria-current'), 'step');

  await page.getByRole('button', { name: /Personal information/ }).click();
  await page.getByLabel('First Name').waitFor();
  await page.getByLabel('First Name').fill('Accessible');
  assert.equal(await page.getByLabel('First Name').inputValue(), 'Accessible');

  const audit = await page.evaluate(() => {
    const visible = (element) => Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    const duplicateIds = [...document.querySelectorAll('[id]')]
      .map((element) => element.id)
      .filter((id, index, all) => id && all.indexOf(id) !== index);
    const unlabeledFields = [...document.querySelectorAll('input, textarea, select')]
      .filter(visible)
      .filter((element) => !element.labels?.length && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby'))
      .map((element) => element.id || element.outerHTML.slice(0, 120));
    const unnamedButtons = [...document.querySelectorAll('button')]
      .filter(visible)
      .filter((element) => !element.innerText.trim() && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby'))
      .map((element) => element.outerHTML.slice(0, 120));
    return { duplicateIds, unlabeledFields, unnamedButtons };
  });

  assert.deepEqual(audit.duplicateIds, [], `Duplicate element IDs: ${audit.duplicateIds.join(', ')}`);
  assert.deepEqual(audit.unlabeledFields, [], `Unlabeled form fields: ${audit.unlabeledFields.join(', ')}`);
  assert.deepEqual(audit.unnamedButtons, [], `Unnamed buttons: ${audit.unnamedButtons.join(', ')}`);
  assert.equal(await page.getByText(/Disability Form/i).count(), 0);

  console.log('Applicant accessibility labels, unique IDs, progress semantics, focusable fields, and read-aloud controls passed.');
} finally {
  await browser.close();
}
