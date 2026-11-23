import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true });

// Controlled callbacks reproduce native events arriving after cancel() and at
// pause/chunk boundaries, without requiring a particular installed speech voice.
function installSpeechHarness() {
  const harness = {
    utterances: [], paused: false, startsWhilePaused: 0,
    finish(index) { this.utterances[index]?.onend?.(); },
    fail(index) { this.utterances[index]?.onerror?.({ error: 'audio-busy' }); },
    drain() {
      let index = this.utterances.length - 1;
      while (index < this.utterances.length && index < 500) this.finish(index++);
      if (index >= 500) throw new Error('Read-aloud did not finish.');
    },
  };
  window.__speechHarness = harness;
  class MockSpeechSynthesisUtterance {
    constructor(text) { this.text = text; }
  }
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: MockSpeechSynthesisUtterance });
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      // Intentionally retain paused state and old callbacks after cancellation.
      cancel() {},
      pause() { harness.paused = true; },
      resume() { harness.paused = false; },
      speak(utterance) {
        if (harness.paused) harness.startsWhilePaused += 1;
        harness.utterances.push(utterance);
      },
    },
  });
}

async function auditCurrentSection(page, expectedText) {
  const section = page.getByRole('region', { name: 'Current application section', exact: true });
  await section.getByText(expectedText, { exact: true }).first().waitFor();
  await page.waitForFunction(() => document.activeElement?.id === 'application-step-content');
  const audit = await page.evaluate(() => {
    const visible = (element) => Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    const duplicateIds = [...document.querySelectorAll('[id]')].map((element) => element.id)
      .filter((id, index, all) => id && all.indexOf(id) !== index);
    const unlabeledFields = [...document.querySelectorAll('input, textarea, select, [role="combobox"]')]
      .filter(visible)
      .filter((element) => !element.labels?.length && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby'))
      .map((element) => element.id || element.outerHTML.slice(0, 120));
    const unnamedButtons = [...document.querySelectorAll('button')].filter(visible)
      .filter((element) => !element.innerText.trim() && !element.labels?.length && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby'))
      .map((element) => element.outerHTML.slice(0, 120));
    const brokenDescriptions = [...document.querySelectorAll('[aria-describedby]')]
      .flatMap((element) => element.getAttribute('aria-describedby').split(/\s+/))
      .filter((id) => id && !document.getElementById(id));
    return { duplicateIds, unlabeledFields, unnamedButtons, brokenDescriptions };
  });
  for (const [kind, failures] of Object.entries(audit)) {
    assert.deepEqual(failures, [], `${expectedText}: ${kind}: ${failures.join(', ')}`);
  }
}

async function originalDocumentReady(page) {
  await page.waitForFunction(() => {
    const canvases = [...document.querySelectorAll('.document-paper-page canvas')];
    return canvases.length > 0 && canvases.every(canvas => canvas.dataset.rendered === 'true');
  });
  assert.equal(await page.locator('.document-editor').getByRole('button', { name: /Readable view|Original document|today/i }).count(), 0);
}

try {
  const context = await browser.newContext({ timezoneId: 'Pacific/Honolulu' });
  await context.addInitScript(installSpeechHarness);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/apply`);
  assert.equal(await page.getByRole('link', { name: 'Skip to main content' }).count(), 1);
  const tools = page.getByRole('region', { name: 'Application accessibility tools' });
  const read = () => tools.getByRole('button', { name: 'Read this section aloud', exact: true });
  const spokenCount = () => page.evaluate(() => window.__speechHarness.utterances.length);

  // Check visible state against stale defaults, hidden instructions and options.
  await page.getByRole('region', { name: 'Current application section', exact: true }).waitFor();
  await page.evaluate(() => {
    const fixture = document.createElement('div');
    fixture.innerHTML = '<label>Test response<textarea>OLD_TEXTAREA_ANSWER</textarea></label>'
      + '<label>Test selection<select><option>UNSELECTED_OPTION</option><option selected>VISIBLE_SELECTION</option></select></label>'
      + '<div style="display:none">HIDDEN_INSTRUCTIONS</div><div aria-hidden="true">ARIA_HIDDEN_INSTRUCTIONS</div>'
      + '<div data-read-aloud-ignore>IGNORED_INSTRUCTIONS</div>'
      + '<label>Private value<input type="password" value="PRIVATE_PASSWORD"></label>'
      + '<label><input type="checkbox" checked>CHECKED_OPTION</label>'
      + '<label><input type="checkbox">UNCHECKED_OPTION</label>';
    fixture.querySelector('textarea').value = 'CURRENT_TEXTAREA_ANSWER';
    document.getElementById('application-step-content').append(fixture);
  });
  await read().click();
  await page.evaluate(() => window.__speechHarness.drain());
  await read().waitFor();
  const spoken = await page.evaluate(() => window.__speechHarness.utterances.map((utterance) => utterance.text).join(' '));
  assert.equal(spoken.split('CURRENT_TEXTAREA_ANSWER').length - 1, 1, 'A live textarea answer must be read once.');
  assert.match(spoken, /VISIBLE_SELECTION/);
  assert.match(spoken, /Selected\.\s+CHECKED_OPTION/);
  assert.match(spoken, /Not selected\.\s+UNCHECKED_OPTION/);
  assert.doesNotMatch(spoken, /OLD_TEXTAREA_ANSWER|UNSELECTED_OPTION|HIDDEN_INSTRUCTIONS|IGNORED_INSTRUCTIONS|PRIVATE_PASSWORD/);
  await page.reload();

  await read().click();
  const stoppedIndex = (await spokenCount()) - 1;
  await tools.getByRole('button', { name: 'Stop', exact: true }).click();
  await page.evaluate((index) => window.__speechHarness.finish(index), stoppedIndex);
  assert.equal(await spokenCount(), stoppedIndex + 1, 'Stop must invalidate old callbacks.');
  await read().waitFor();
  assert.equal(await read().evaluate((node) => node === document.activeElement), true, 'Stop must retain keyboard focus on the remaining control.');
  await read().click();
  const pausedIndex = (await spokenCount()) - 1;
  await tools.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.evaluate((index) => window.__speechHarness.finish(index), pausedIndex);
  assert.equal(await spokenCount(), pausedIndex + 1, 'A chunk finishing during Pause must wait.');
  await tools.getByRole('button', { name: 'Resume', exact: true }).click();
  assert.equal(await spokenCount(), pausedIndex + 2, 'Resume must continue after a paused chunk boundary.');
  await tools.getByRole('button', { name: 'Pause', exact: true }).click();
  const previousIndex = (await spokenCount()) - 1;
  await tools.getByRole('button', { name: 'Restart this section', exact: true }).click();
  const restartedCount = await spokenCount();
  await page.evaluate((index) => {
    window.__speechHarness.finish(index);
    window.__speechHarness.fail(index);
  }, previousIndex);
  assert.equal(await spokenCount(), restartedCount, 'Old callbacks must not affect Restart.');
  assert.equal(await page.evaluate(() => window.__speechHarness.startsWhilePaused), 0);
  await tools.getByRole('button', { name: 'Pause', exact: true }).waitFor();
  await page.evaluate(() => window.__speechHarness.fail(window.__speechHarness.utterances.length - 1));
  await read().waitFor();
  assert.match(await tools.getByRole('status').innerText(), /could not continue/);

  await read().click();
  const navigationIndex = (await spokenCount()) - 1;
  await page.getByRole('button', { name: /begin general application/i }).click();
  await page.getByRole('progressbar', { name: 'Application completion' }).waitFor();
  await auditCurrentSection(page, 'Resume');
  await read().waitFor();
  await page.evaluate((index) => window.__speechHarness.finish(index), navigationIndex);
  assert.equal(await spokenCount(), navigationIndex + 1, 'Navigation must cancel the old section.');
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), '17');

  await page.getByRole('button', { name: /^2 Position$/ }).click();
  await auditCurrentSection(page, 'Application Information');

  await page.getByRole('button', { name: /Personal information/ }).click();
  await auditCurrentSection(page, 'General Information');
  await page.getByLabel('First Name').fill('Accessible');
  await page.getByLabel('First Name').press('Tab');
  assert.notEqual(await page.evaluate(() => document.activeElement?.tagName), 'BODY');
  await page.getByRole('button', { name: /Experience/ }).click();
  await auditCurrentSection(page, 'Employment History');
  assert.equal(await page.getByRole('group', { name: 'Employer 2 of 3', exact: true }).getByLabel('Company Name', { exact: true }).count(), 1);
  assert.equal(await page.getByLabel('Company Name', { exact: true }).count(), 3);
  await page.getByLabel('Company Name', { exact: true }).nth(1).fill('Second employer only');
  assert.equal(await page.getByLabel('Company Name', { exact: true }).nth(0).inputValue(), '');
  await page.getByRole('button', { name: /Education/ }).click();
  await auditCurrentSection(page, 'Education History');
  assert.equal(await page.getByRole('group', { name: 'Education 2', exact: true }).getByLabel('Institution Name', { exact: true }).count(), 1);
  await page.getByRole('button', { name: 'Add education', exact: true }).click();
  assert.equal(await page.getByLabel('Institution Name', { exact: true }).count(), 3);
  await page.getByRole('button', { name: 'Remove education 3', exact: true }).click();
  assert.equal(await page.getByLabel('Institution Name', { exact: true }).count(), 2);
  await page.getByRole('button', { name: /Skills/ }).click();
  await auditCurrentSection(page, 'Professional Skills');
  await page.getByRole('button', { name: /Requirements/ }).click();
  await auditCurrentSection(page, 'Professional References');
  assert.equal(await page.getByRole('group', { name: 'Reference 3 of 3', exact: true }).getByLabel('Full Name', { exact: true }).count(), 1);
  await page.getByRole('button', { name: /Medical authorization/ }).click();
  await originalDocumentReady(page);
  await auditCurrentSection(page, 'Medical Information & Authorization');
  await page.getByRole('button', { name: /Affiliations/ }).click();
  await auditCurrentSection(page, 'Professional Affiliations');
  await page.getByRole('button', { name: /Certification/ }).click();
  await originalDocumentReady(page);
  await auditCurrentSection(page, 'Employment Certification & Disclosures');
  await page.getByRole('button', { name: /Drug policy/ }).click();
  await originalDocumentReady(page);
  await auditCurrentSection(page, 'Agreement to Comply with Geolabs, Inc. Alcohol & Drug Testing Program');
  const policy = page.getByRole('region', { name: 'Original document text', exact: true });
  await policy.getByText(/The Company has a vital interest/).waitFor();
  assert.match(await policy.getAttribute('class'), /sr-only/, 'The original policy transcript remains exposed to assistive tools without a second visual mode.');
  assert.notEqual(await policy.getAttribute('aria-hidden'), 'true');
  const paper = page.getByRole('region', { name: 'Alcohol & drug agreement original pages', exact: true });
  await paper.focus();
  assert.equal(await paper.evaluate(node => node === document.activeElement), true, 'Original PDF pages must be keyboard reachable for scrolling.');
  const policySpeechStart = await spokenCount();
  await read().click();
  await page.evaluate(() => window.__speechHarness.drain());
  await read().waitFor();
  const policySpeech = await page.evaluate(index => window.__speechHarness.utterances.slice(index).map(utterance => utterance.text).join(' '), policySpeechStart);
  assert.match(policySpeech, /The Company has a vital interest/, 'Read-aloud must include original PDF policy text, not only the form controls.');
  assert.match(policySpeech, /Designated Employer Representative/);
  const drugSignature = page.locator('[data-document-field="drugTestSignature"] input');
  assert.equal(await drugSignature.isDisabled(), true);
  await page.getByRole('checkbox', { name: /^I have read, understand, and agree/ }).check();
  await drugSignature.fill('Accessibility Test');
  await page.clock.setSystemTime(new Date('2026-09-14T08:45:00Z'));
  const drugDate = page.locator('[data-document-field="drugTestDate"] input');
  assert.equal(await drugDate.getAttribute('type'), 'date', 'The platform-owned date picker must remain available.');
  assert.equal(await drugDate.inputValue(), '', 'A signature date must not be added automatically.');
  await drugDate.fill('2026-09-13');
  assert.equal(await drugDate.inputValue(), '2026-09-13');
  await page.getByRole('button', { name: /Optional self-ID/ }).click();
  await originalDocumentReady(page);
  await auditCurrentSection(page, 'EEO Voluntary Self-Identification Survey');
  const gender = page.locator('[data-document-field="eeoGender"]');
  await gender.getByRole('radio', { name: 'Male', exact: true }).focus();
  await page.keyboard.press('Space');
  assert.equal(await gender.getByRole('radio', { name: 'Male', exact: true }).isChecked(), true);
  await page.keyboard.press('ArrowRight');
  assert.equal(await gender.getByRole('radio', { name: 'Female', exact: true }).isChecked(), true);
  assert.equal(await gender.getByRole('radio', { name: 'Male', exact: true }).isChecked(), false);
  await page.getByRole('button', { name: 'Clear gender selection', exact: true }).click();
  assert.equal(await gender.locator('input:checked').count(), 0);
  const race = page.locator('[data-document-field="eeoRace"]');
  await race.getByRole('radio', { name: 'I do not wish to disclose.', exact: true }).focus();
  await page.keyboard.press('Space');
  assert.equal(await race.getByRole('radio', { name: 'I do not wish to disclose.', exact: true }).isChecked(), true);
  const eeoDate = page.getByLabel('Date', { exact: true });
  assert.equal(await eeoDate.getAttribute('type'), 'date');
  await eeoDate.fill('2026-09-13');
  await page.clock.setSystemTime(new Date('2026-09-14T10:05:00Z'));
  assert.equal(await eeoDate.inputValue(), '2026-09-13', 'Crossing midnight must not change an explicitly selected date.');
  await eeoDate.fill('2026-09-14');
  assert.equal(await eeoDate.inputValue(), '2026-09-14');
  await page.getByRole('navigation', { name: 'Application progress' }).getByRole('button', { name: /Veteran status/ }).click();
  await originalDocumentReady(page);
  await auditCurrentSection(page, 'Affirmative Action: Invitation to Self-Identify as a Protected Veteran (VEVRAA)');
  const veteran = page.locator('[data-document-field="veteranStatus"]');
  await veteran.getByRole('radio', { name: 'I am not a protected veteran', exact: true }).focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  assert.equal(await veteran.getByRole('radio', { name: 'I do not wish to self-identify', exact: true }).isChecked(), true);
  const definitions = page.getByRole('region', { name: 'Original document text', exact: true });
  await definitions.getByText(/Recently separated veteran:/).waitFor();
  await definitions.getByText(/Armed Forces Service Medal Veteran:/).waitFor();
  await page.getByLabel('Print Name / Signature', { exact: true }).fill('Accessibility Test');
  await page.getByLabel('Date', { exact: true }).fill('2026-09-14');
  assert.equal(await page.getByLabel('Date', { exact: true }).inputValue(), '2026-09-14');
  assert.equal(await page.getByRole('button', { name: /Disability Form/i }).count(), 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('navigation', { name: 'Application progress' }).getByRole('button', { name: /EEO survey/ }).click();
  await auditCurrentSection(page, 'EEO Voluntary Self-Identification Survey');
  await page.getByRole('button', { name: /^7 Review$/ }).click();
  await auditCurrentSection(page, 'Review & Submit');
  await read().click();
  const unmountedCount = await spokenCount();
  // Keep the document alive to exercise component cleanup, not a full reload
  // that would discard the native callbacks automatically.
  await page.evaluate(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForURL(`${baseUrl}/`);
  await tools.waitFor({ state: 'detached' });
  await page.evaluate((index) => window.__speechHarness.finish(index), unmountedCount - 1);
  assert.equal(await spokenCount(), unmountedCount, 'Leaving the application must stop speech callbacks.');
  assert.deepEqual(errors, [], 'No uncaught browser errors are allowed.');

  const unsupported = await browser.newContext();
  await unsupported.addInitScript(() => {
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
  });
  const unsupportedPage = await unsupported.newPage();
  await unsupportedPage.goto(`${baseUrl}/apply`);
  await unsupportedPage.getByText('Read-aloud is not supported by this browser.', { exact: true }).waitFor();
  await unsupportedPage.getByRole('button', { name: /begin general application/i }).click();
  await unsupportedPage.getByRole('progressbar').waitFor();

  console.log('PASS: speech cancellation, restart, pause boundaries, navigation, live answers, hidden content, unsupported browsers, keyboard focus, reduced motion, and repeated form labels.');
} finally {
  await browser.close();
}
