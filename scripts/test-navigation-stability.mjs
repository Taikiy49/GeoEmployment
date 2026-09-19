import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

// A built local preview is required. All network writes are blocked, and no
// application, resume, email, or production data is submitted by this suite.
const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const localHosts = ['localhost', '127.0.0.1', '[::1]'];
assert.ok(localHosts.includes(new URL(baseUrl).hostname), 'Navigation tests must target a local preview.');
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true });

function installNavigationProbe() {
  const probe = { armed: false, done: false, frames: [], scrollCalls: [] };
  window.__navigationProbe = probe;
  const recordScroll = (method, args) => {
    if (!probe.armed) return;
    probe.scrollCalls.push({ method, behavior: args[0]?.behavior || 'auto' });
  };
  const scrollTo = window.scrollTo.bind(window);
  window.scrollTo = (...args) => {
    recordScroll('window.scrollTo', args);
    return scrollTo(...args);
  };
  const scrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (...args) {
    recordScroll('element.scrollIntoView', args);
    return scrollIntoView.apply(this, args);
  };
  // Start at the actual click, before React receives it. Sampling only after a
  // waitFor selector would miss the outgoing fade/blank frames we are guarding.
  document.addEventListener('click', () => {
    if (!probe.armed || probe.started) return;
    probe.started = true;
    const start = performance.now();
    const sample = () => {
      const regions = [...document.querySelectorAll('[role="region"][aria-label="Current application section"]')];
      const frame = { elapsed: performance.now() - start, count: regions.length, regions: [] };
      for (const region of regions) {
        let opacity = 1;
        let hidden = false;
        for (let element = region; element; element = element.parentElement) {
          const style = getComputedStyle(element);
          opacity *= Number(style.opacity);
          hidden ||= element.hidden || element.inert || element.getAttribute('aria-hidden') === 'true'
            || style.display === 'none' || style.visibility === 'hidden';
        }
        frame.regions.push({ opacity, hidden, id: region.id });
      }
      probe.frames.push(frame);
      if (frame.elapsed < 350) requestAnimationFrame(sample);
      else { probe.done = true; probe.armed = false; }
    };
    requestAnimationFrame(sample);
  }, true);
}

async function verifyLayout(page, title) {
  await page.evaluate(() => document.fonts.ready);
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const headings = [...document.querySelectorAll('#application-step-content h3')].slice(0, 1)
      .filter(node => node.getClientRects().length)
      .map(node => ({ text: node.textContent, font: getComputedStyle(node).fontFamily, size: parseFloat(getComputedStyle(node).fontSize) }));
    const fields = [...document.querySelectorAll('#application-step-content input:not([type="checkbox"]):not([type="radio"]), #application-step-content textarea')]
      .filter(node => node.getClientRects().length)
      .map(node => ({ fontSize: parseFloat(getComputedStyle(node).fontSize), width: node.getBoundingClientRect().width }));
    return {
      overflow: Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth,
      headings,
      fields,
    };
  });
  assert.ok(result.overflow <= 1, `${title}: no horizontal document overflow (${result.overflow}px).`);
  assert.ok(result.headings.length, `${title}: readable headings must render.`);
  for (const heading of result.headings) {
    assert.match(heading.font, /Inter|system-ui|Segoe UI/i, `${title}: ${heading.text} uses the original normal-width font stack.`);
    assert.doesNotMatch(heading.font, /condensed|narrow|barlow/i, `${title}: no tall condensed heading font.`);
    assert.ok(heading.size >= 16, `${title}: heading retains the original type scale.`);
  }
  for (const field of result.fields) {
    assert.ok(field.fontSize >= 14, `${title}: input text retains the original readable scale.`);
    assert.ok(field.width > 0, `${title}: visible fields retain usable width.`);
  }
}

async function navigate(page, locator, title) {
  await page.evaluate(() => {
    const probe = window.__navigationProbe;
    Object.assign(probe, { armed: true, started: false, done: false, frames: [], scrollCalls: [] });
  });
  await locator.click();
  await page.waitForFunction(() => window.__navigationProbe.done);
  const probe = await page.evaluate(() => window.__navigationProbe);
  assert.ok(probe.frames.length >= 8, `${title}: capture enough animation frames to detect a flash.`);
  const badFrames = probe.frames.filter(frame => frame.count !== 1 || frame.regions.some(region =>
    region.opacity < 0.999 || region.hidden || region.id !== 'application-step-content'));
  assert.deepEqual(badFrames, [], `${title}: every sampled frame must have exactly one fully visible current section.`);
  assert.deepEqual(probe.scrollCalls.filter(call => call.behavior === 'smooth'), [], `${title}: navigation must not launch a competing smooth scroll.`);
  assert.ok(probe.scrollCalls.length <= 1, `${title}: only one navigation owner scrolls after mount: ${JSON.stringify(probe.scrollCalls)}`);
  const section = page.getByRole('region', { name: 'Current application section', exact: true });
  await section.getByText(title, { exact: true }).first().waitFor();
  assert.equal(await section.evaluate(node => node === document.activeElement), true, `${title}: focus belongs to the incoming section.`);
  const position = await section.evaluate(node => ({ top: node.getBoundingClientRect().top, bottom: node.getBoundingClientRect().bottom, scrollY: window.scrollY }));
  if (page.viewportSize().width < 640) {
    assert.ok(position.top >= -1 && position.top < page.viewportSize().height / 2, `${title}: phone navigation brings the form into view (${position.top}px).`);
  } else {
    assert.equal(position.scrollY, 0, `${title}: desktop navigation consistently starts at the page top.`);
  }
  await verifyLayout(page, title);
}

async function verifyPublicRouting(page) {
  const sentinel = await page.evaluate(() => {
    window.__navigationDocumentSentinel = crypto.randomUUID();
    return window.__navigationDocumentSentinel;
  });
  await page.getByRole('link', { name: 'Geolabs, Inc. careers home', exact: true }).click();
  await page.waitForURL(url => url.pathname === '/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  assert.equal(await page.evaluate(() => window.__navigationDocumentSentinel), sentinel, 'Home navigation keeps the document.');
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  await page.getByRole('link', { name: /general application/i }).first().click();
  await page.waitForURL(url => url.pathname === '/apply');
  await page.getByRole('button', { name: 'Begin General Application', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.__navigationDocumentSentinel), sentinel, 'Application navigation keeps the document.');
}

try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    for (const width of [375, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 900 }, reducedMotion, timezoneId: 'Pacific/Honolulu' });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [];
      const writes = [];
      page.on('pageerror', error => errors.push(error.message));
      await context.addInitScript(installNavigationProbe);
      await context.route('**/*', async route => {
        const request = route.request();
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
          writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
          return route.abort('blockedbyclient');
        }
        if (!localHosts.includes(new URL(request.url()).hostname)) return route.abort('blockedbyclient');
        return route.continue();
      });
      try {
        await page.goto(`${baseUrl}/apply`);
        await verifyPublicRouting(page);
        await navigate(page, page.getByRole('button', { name: 'Begin General Application', exact: true }), 'Resume');
        const navigation = page.getByRole('navigation', { name: 'Application progress', exact: true });
        const section = page.getByRole('region', { name: 'Current application section', exact: true });
        await navigate(page, section.getByRole('button', { name: 'Continue', exact: true }), 'Application Information');
        await navigate(page, section.getByRole('button', { name: 'Back', exact: true }), 'Resume');
        await navigate(page, navigation.getByRole('button', { name: /Personal information/ }), 'General Information');
        const name = `Navigation TEST ${width} ${reducedMotion}`;
        const firstName = page.getByLabel('First Name', { exact: false });
        await firstName.fill(name);
        await firstName.press('End');
        await firstName.press('!');
        assert.equal(await firstName.inputValue(), `${name}!`, 'Typing preserves every character.');
        assert.equal(await firstName.evaluate(node => node === document.activeElement), true, 'A form-value update does not steal focus.');
        await navigate(page, navigation.getByRole('button', { name: /Experience/ }), 'Employment History');
        const employer = page.getByRole('group', { name: 'Employer 1 of 3', exact: true });
        const duties = 'Synthetic navigation check: inspect materials, document results, and coordinate safe field work.';
        await employer.getByLabel('Primary Duties / Responsibilities', { exact: true }).fill(duties);
        await navigate(page, navigation.getByRole('button', { name: /Skills/ }), 'Professional Skills');
        await navigate(page, section.getByRole('button', { name: 'Back', exact: true }), 'Education History');
        await navigate(page, section.getByRole('button', { name: 'Back', exact: true }), 'Employment History');
        assert.equal(await employer.getByLabel('Primary Duties / Responsibilities', { exact: true }).inputValue(), duties, 'Back navigation retains typed duties.');
        await navigate(page, navigation.getByRole('button', { name: /Your details/ }), 'General Information');
        assert.equal(await firstName.inputValue(), `${name}!`, 'Stage/task navigation retains typed personal details.');
        await navigate(page, navigation.getByRole('button', { name: /Review$/ }), 'Review & Submit');
        assert.equal(await page.getByRole('button', { name: 'Submit Application', exact: true }).isDisabled(), true, 'Incomplete applications remain blocked after navigation.');
        assert.deepEqual(errors, [], `${width}px ${reducedMotion}: browser exceptions.`);
        assert.deepEqual(writes, [], `${width}px ${reducedMotion}: no external or API writes.`);
        console.log(`PASS ${width}px ${reducedMotion}: no fade/blank frames or document reloads, single scroll owner, normal-width headings, focus, Back/Continue/stage/task navigation, and retained answers.`);
      } catch (error) {
        throw new Error(`${width}px ${reducedMotion} navigation failed: ${error.message}`, { cause: error });
      } finally {
        await context.close();
      }
    }
  }
  console.log('Navigation stability regression passed. No applications or emails sent.');
} finally {
  await browser.close();
}
