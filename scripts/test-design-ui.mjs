import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

// Run against a built local preview, not production or an HMR server. Nothing in
// this suite submits an application, uploads a resume, or sends an email.
const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseUrl).hostname), 'Design tests must target a local preview.');
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const screenshotDirectory = process.env.TEST_SCREENSHOT_DIR;
if (screenshotDirectory) await mkdir(screenshotDirectory, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });

async function assertLayout(page, label) {
  await page.evaluate(() => document.fonts.ready);
  const layout = await page.evaluate(() => {
    const root = document.documentElement;
    const width = root.clientWidth;
    const overflow = Math.max(root.scrollWidth, document.body.scrollWidth) - width;
    const offenders = overflow > 1
      ? [...document.querySelectorAll('main *')].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > width + 1);
      }).slice(0, 8).map((element) => `${element.tagName}: ${(element.textContent || '').trim().slice(0, 80)}`)
      : [];
    return { overflow, offenders };
  });
  assert.ok(layout.overflow <= 1, `${label}: document overflows by ${layout.overflow}px: ${layout.offenders.join(' | ')}`);
}

async function screenshot(page, width, state) {
  if (screenshotDirectory) {
    const scrollPosition = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
    // Capture from the document top so sticky chrome isn't baked into the
    // middle of a full-page image when the prior interaction scrolled a field.
    await page.evaluate(async () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    await page.screenshot({ path: path.join(screenshotDirectory, `design-${width}-${state}.png`), fullPage: true });
    await page.evaluate(({ x, y }) => window.scrollTo({ top: y, left: x, behavior: 'instant' }), scrollPosition);
  }
}

async function currentSection(page, title) {
  const section = page.getByRole('region', { name: 'Current application section', exact: true });
  await section.getByText(title, { exact: true }).first().waitFor();
  await page.waitForFunction(() => document.activeElement?.id === 'application-step-content');
  const invalidFields = await section.locator('input, textarea, select, [role="combobox"]').evaluateAll((fields) => fields
    .filter((field) => field.getClientRects().length)
    .filter((field) => !field.labels?.length && !field.getAttribute('aria-label') && !field.getAttribute('aria-labelledby'))
    .map((field) => field.outerHTML.slice(0, 140)));
  assert.deepEqual(invalidFields, [], `${title}: all visible fields need an accessible name.`);
  await assertLayout(page, title);
  return section;
}

async function checkSelect(page, label, option) {
  const trigger = page.getByRole('combobox', { name: label, exact: true });
  await trigger.focus();
  await trigger.press('Enter');
  const popup = page.getByRole('listbox');
  await popup.waitFor();
  await popup.evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((animation) => animation.finished.catch(() => {})));
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
  // The authored popup must stay aligned, fit the mobile viewport, and retain
  // keyboard Escape/focus behavior. Native OS pickers are not used here.
  // Radix temporarily hides the background (including its trigger) from the
  // accessibility tree while the modal listbox is open; it remains rendered.
  const triggerBounds = await page.getByRole('combobox', { name: label, exact: true, includeHidden: true }).boundingBox();
  const popupBounds = await popup.boundingBox();
  assert.ok(triggerBounds && popupBounds, `${label}: select needs visible geometry.`);
  assert.ok(Math.abs(triggerBounds.width - popupBounds.width) <= 1, `${label}: popup and trigger widths differ (${popupBounds.width} / ${triggerBounds.width}).`);
  assert.ok(popupBounds.x >= -1 && popupBounds.x + popupBounds.width <= page.viewportSize().width + 1, `${label}: popup must fit the viewport.`);
  assert.ok(popupBounds.y >= -1 && popupBounds.y + popupBounds.height <= page.viewportSize().height + 1, `${label}: open options must fit vertically.`);
  await page.keyboard.press('Escape');
  await popup.waitFor({ state: 'hidden' });
  await page.waitForFunction((id) => document.activeElement?.id === id, await trigger.getAttribute('id'));
  assert.equal(await trigger.evaluate((node) => node === document.activeElement), true, `${label}: Escape returns focus.`);
  await trigger.press('Enter');
  await page.getByRole('option', { name: option, exact: true }).click();
  assert.equal((await trigger.innerText()).trim(), option);
}

try {
  for (const width of [375, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 900 }, reducedMotion: 'reduce', timezoneId: 'Pacific/Honolulu' });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const pageErrors = [];
    const unexpectedWrites = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await context.route('**/*', async (route) => {
      const request = route.request();
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        unexpectedWrites.push(`${request.method()} ${new URL(request.url()).pathname}`);
        return route.abort('blockedbyclient');
      }
      return route.continue();
    });

    try {
      await page.goto(baseUrl);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.waitForFunction(() => {
        const logo = document.querySelector('header img');
        return logo?.complete && logo.naturalWidth > 0;
      });
      const skip = page.getByRole('link', { name: 'Skip to main content', exact: true });
      await page.keyboard.press('Tab');
      assert.equal(await skip.evaluate((node) => node === document.activeElement), true, 'Skip link must be the first keyboard stop.');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.activeElement?.id === 'main-content');
      await assertLayout(page, `${width}px careers home`);
      assert.notEqual(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarColor), 'auto', 'App-owned scroll surfaces inherit the tokenized baseline.');
      await screenshot(page, width, 'careers');
      // Reduced motion must not auto-play the ambient cover video.
      assert.equal(await page.locator('video').evaluateAll((videos) => videos.every((video) => video.paused)), true);

      const search = page.getByRole('searchbox', { name: 'Search open positions', exact: true });
      await search.fill('No matching synthetic UI position 987654');
      await page.getByText('No open positions match your search.', { exact: true }).waitFor();
      await assertLayout(page, `${width}px empty search`);
      const clear = page.getByRole('button', { name: 'Clear search', exact: true });
      await clear.click();
      // Search is URL-backed; wait for the router's state transition to commit.
      await clear.waitFor({ state: 'hidden' });
      assert.equal(await search.inputValue(), '');
      assert.equal(await search.evaluate((node) => node === document.activeElement), true, 'Clearing search returns focus.');
      await search.fill('Driller Helper');
      const jobLink = page.getByRole('link', { name: /Driller Helper/ });
      await jobLink.waitFor();
      const jobPath = await jobLink.getAttribute('href');
      assert.match(jobPath, /^\/apply\/.+/);
      const storageKey = `geolabs_application_${jobPath.split('/').at(-1)}`;
      await jobLink.click();
      await page.waitForURL(`**${jobPath}`);
      await page.getByRole('button', { name: 'Begin Application', exact: true }).waitFor();
      await assertLayout(page, `${width}px job introduction`);
      await screenshot(page, width, 'introduction');
      await page.getByRole('button', { name: 'Begin Application', exact: true }).click();
      await currentSection(page, 'Resume');
      const progress = page.getByRole('progressbar', { name: 'Application completion', exact: true });
      const firstProgress = Number(await progress.getAttribute('aria-valuenow'));
      assert.ok(firstProgress > 0 && firstProgress < 100);

      const navigation = page.getByRole('navigation', { name: 'Application progress', exact: true });
      await navigation.getByRole('button', { name: /Personal information/ }).click();
      await currentSection(page, 'General Information');
      const givenName = `Responsive TEST ${width}`;
      await page.getByLabel('First Name', { exact: false }).fill(givenName);
      const fieldStyle = await page.getByLabel('First Name', { exact: false }).evaluate((field) => ({
        size: parseFloat(getComputedStyle(field).fontSize),
        family: getComputedStyle(field).fontFamily,
        labelSize: parseFloat(getComputedStyle(field.labels[0]).fontSize),
      }));
      assert.ok(fieldStyle.size >= 16, 'Public inputs stay readable without mobile auto-zoom.');
      assert.ok(fieldStyle.labelSize >= 14, 'Field labels preserve the readable design scale.');
      assert.match(fieldStyle.family, /Source Sans 3/);
      await page.getByLabel('Last Name', { exact: false }).fill('Kealoha-Yamashita');
      await page.getByLabel('Email Address', { exact: false }).fill(`design-${width}@example.test`);
      await page.getByLabel('Street Address', { exact: false }).fill('123 Synthetic Application Road, Suite 200');
      await page.getByLabel('City', { exact: false }).fill('Kāneʻohe');
      await checkSelect(page, 'State', 'HI');
      await page.getByLabel('ZIP Code', { exact: false }).fill('96744');
      await page.getByText('Saved on this device', { exact: true }).waitFor();
      await page.waitForFunction(({ key, name }) => JSON.parse(localStorage.getItem(key) || '{}').firstName === name, { key: storageKey, name: givenName });
      await assertLayout(page, `${width}px completed personal fields`);
      await screenshot(page, width, 'personal');
      await page.reload();
      await currentSection(page, 'General Information');
      assert.equal(await page.getByLabel('First Name', { exact: false }).inputValue(), givenName);
      assert.equal(await page.getByLabel('Email Address', { exact: false }).inputValue(), `design-${width}@example.test`);
      assert.equal(Number(await progress.getAttribute('aria-valuenow')), firstProgress, 'Reload preserves stage progress.');

      await navigation.getByRole('button', { name: /Experience/ }).click();
      await currentSection(page, 'Employment History');
      assert.ok(Number(await progress.getAttribute('aria-valuenow')) > firstProgress, 'Stage navigation updates progress.');
      const employer = page.getByRole('group', { name: 'Employer 1 of 3', exact: true });
      await employer.getByLabel('Company Name', { exact: true }).fill('Synthetic UI Test Employer');
      const longDuties = Array.from({ length: 30 }, (_, index) => `• Responsibility ${index + 1}: inspected materials, documented field observations, and coordinated safe work with the project team.`).join('\n');
      await employer.getByLabel('Primary Duties / Responsibilities', { exact: true }).fill(longDuties);
      assert.equal(await employer.getByLabel('Primary Duties / Responsibilities', { exact: true }).inputValue(), longDuties, 'Long duties are retained without truncation.');
      const textareaStyle = await employer.getByLabel('Primary Duties / Responsibilities', { exact: true }).evaluate((field) => ({
        resize: getComputedStyle(field).resize,
        overflow: getComputedStyle(field).overflowY,
        height: field.getBoundingClientRect().height,
        scrollHeight: field.scrollHeight,
      }));
      assert.equal(textareaStyle.resize, 'none');
      assert.equal(textareaStyle.overflow, 'auto');
      assert.ok(textareaStyle.height >= 100 && textareaStyle.height <= 361, 'Textarea grows within its documented bound.');
      assert.ok(textareaStyle.scrollHeight > textareaStyle.height, 'Long answers remain available through a real scroll surface.');
      await assertLayout(page, `${width}px long multiline duties`);
      await screenshot(page, width, 'experience');

      await navigation.getByRole('button', { name: /Education/ }).click();
      await currentSection(page, 'Education History');
      await checkSelect(page, 'Highest Level of Education Completed', 'Master’s degree');
      await page.getByRole('group', { name: 'Education 1', exact: true }).getByLabel('Institution Name', { exact: true }).fill('University of Hawaiʻi at Mānoa — Synthetic Test');
      await page.getByRole('button', { name: 'Add education', exact: true }).click();
      await page.getByRole('group', { name: 'Education 3', exact: true }).waitFor();
      await assertLayout(page, `${width}px education repeated entry`);
      await page.getByRole('button', { name: 'Remove education 3', exact: true }).click();
      assert.equal(await page.getByRole('group', { name: 'Education 3', exact: true }).count(), 0);

      await navigation.getByRole('button', { name: /Review$/ }).click();
      await currentSection(page, 'Review & Submit');
      assert.equal(await page.getByRole('button', { name: 'Submit Application', exact: true }).isDisabled(), true, 'An incomplete application must remain blocked, regardless of stage progress.');
      assert.match(await progress.getAttribute('aria-valuetext'), /attention/i);
      await screenshot(page, width, 'review');
      const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
      assert.equal(saved.positionAppliedFor, 'Driller Helper', 'The chosen job is retained across the full draft flow.');
      assert.equal(saved.employment[0].duties, longDuties);
      assert.equal(saved.highestEducationLevel, 'master');

      // General applications remain a separate entry point and do not overwrite
      // the job-specific draft created above.
      await page.goto(baseUrl);
      await page.getByRole('link', { name: /general application/i }).first().click();
      await page.waitForURL('**/apply');
      await page.getByRole('button', { name: 'Begin General Application', exact: true }).waitFor();
      await assertLayout(page, `${width}px general introduction`);
      assert.deepEqual(pageErrors, [], `${width}px browser exceptions`);
      assert.deepEqual(unexpectedWrites, [], `${width}px suite attempted a write`);
      console.log(`PASS ${width}px: search, job/general entry, keyboard focus, selects, long content, draft recovery, progress, and review blockers.`);
    } catch (error) {
      await screenshot(page, width, 'failure');
      throw new Error(`${width}px responsive flow failed at ${page.url()}: ${error.message}`, { cause: error });
    } finally {
      await context.close();
    }
  }
  console.log('Public careers/application responsive UI regression passed. No applications or emails sent.');
} finally {
  await browser.close();
}
