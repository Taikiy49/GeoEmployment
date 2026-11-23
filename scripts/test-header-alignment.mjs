import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

// Only exercise a local dev server/preview. No submission, email, auth mutation,
// upload, or external request is allowed to leave these isolated contexts.
const base = new URL(process.env.TEST_BASE_URL || 'http://127.0.0.1:4174');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'Header tests must target a local server.');
assert.ok(['http:', 'https:'].includes(base.protocol), 'Use a local HTTP(S) server.');
assert.equal(base.username + base.password, '', 'Credentials do not belong in the test URL.');
const output = 'tmp/header-comparison';
const widths = [320, 360, 375, 390, 640, 641, 768, 1024, 1150, 1151, 1440, 1920];
const captureWidths = new Set([320, 390, 768, 1440]);
const failures = [];
const reports = [];
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
await mkdir(output, { recursive: true });

function closeTo(actual, expected, label, tolerance = 0.15) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}px, received ${actual}px.`);
}

function expectedGeometry(width) {
  const narrow = width <= 640;
  const logoWidth = width <= 360 ? 198 : narrow ? 216 : width <= 1150 ? 235 : 260;
  const paddingX = narrow ? 14 : 18;
  const imageWidth = logoWidth - paddingX * 2;
  return {
    headerHeight: narrow ? 72 : 78,
    logoWidth,
    logoHeight: narrow ? 82 : 90,
    paddingX,
    imageWidth,
    imageHeight: imageWidth * 300 / 906,
    rightPadding: narrow ? 16 : width <= 1150 ? 24 : Math.min(72, Math.max(24, width * 0.045)),
    mobile: width <= 1150,
  };
}

async function settlePage(page) {
  await page.locator('.brand-logo img').waitFor();
  await page.evaluate(async () => {
    await Promise.all([document.fonts.load('600 20px Montserrat'), document.fonts.load('400 16px "DM Sans"')]);
    await document.fonts.ready;
    await document.querySelector('.brand-logo img').decode();
  });
  // Framer Motion uses JavaScript-driven entrances, so CSS animation disabling
  // alone would capture partially transparent hero text. Wait for the visible
  // content heading and every ancestor to reach their actual final state.
  await page.waitForFunction(() => {
    const heading = [...document.querySelectorAll('#main-content h1, #main-content h2, #main-content h3')]
      .find(node => node.getBoundingClientRect().height > 0);
    if (!heading) return false;
    for (let node = heading; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (Number(style.opacity) < 0.999 || style.visibility === 'hidden') return false;
      if (style.transform !== 'none') {
        const matrix = new DOMMatrixReadOnly(style.transform);
        if (Math.abs(matrix.m41) > 0.01 || Math.abs(matrix.m42) > 0.01 || Math.abs(matrix.m11 - 1) > 0.001 || Math.abs(matrix.m22 - 1) > 0.001) return false;
      }
    }
    return true;
  });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function measure(page) {
  return page.evaluate(() => {
    const rect = node => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    };
    const header = document.querySelector('.brand-header');
    const inner = document.querySelector('.brand-header-inner');
    const logo = document.querySelector('.brand-logo');
    const image = logo.querySelector('img');
    const toggle = document.querySelector('.brand-menu-toggle');
    const headerStyle = getComputedStyle(header);
    return {
      header: rect(header),
      inner: rect(inner),
      logo: rect(logo),
      image: rect(image),
      toggle: rect(toggle),
      icon: rect(toggle.querySelector('svg')),
      main: rect(document.querySelector('#main-content')),
      position: headerStyle.position,
      top: headerStyle.top,
      zIndex: headerStyle.zIndex,
      border: parseFloat(headerStyle.borderBottomWidth),
      headerColor: headerStyle.backgroundColor,
      logoColor: getComputedStyle(logo).backgroundColor,
      logoPadding: [getComputedStyle(logo).paddingTop, getComputedStyle(logo).paddingRight],
      rightPadding: parseFloat(getComputedStyle(inner).paddingRight),
      toggleVisible: getComputedStyle(toggle).display !== 'none',
      trustVisible: getComputedStyle(document.querySelector('.brand-header-trust')).display !== 'none',
      imageNatural: [image.naturalWidth, image.naturalHeight],
      imageAttributes: [image.getAttribute('width'), image.getAttribute('height')],
      imagePath: new URL(image.currentSrc).pathname,
      // Chromium's clientWidth includes a reserved scrollbar-gutter when
      // overlay scrollbars are enabled; the root content box does not.
      viewportWidth: document.documentElement.getBoundingClientRect().width,
      overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth,
    };
  });
}

async function verifyGeometry(page, width, title) {
  const actual = await measure(page);
  const expected = expectedGeometry(width);
  closeTo(actual.header.x, 0, `${title}: header left edge`);
  closeTo(actual.header.y, 0, `${title}: header top edge`);
  closeTo(actual.header.width, actual.viewportWidth, `${title}: full-bleed header`);
  closeTo(actual.header.height, expected.headerHeight, `${title}: header height`);
  closeTo(actual.inner.height, expected.headerHeight, `${title}: inner height`);
  closeTo(actual.logo.x, 0, `${title}: flush-left logo`);
  closeTo(actual.logo.y, 0, `${title}: top-aligned logo`);
  closeTo(actual.logo.width, expected.logoWidth, `${title}: logo width`);
  closeTo(actual.logo.height, expected.logoHeight, `${title}: logo height`);
  closeTo(actual.image.x, expected.paddingX, `${title}: image horizontal inset`);
  closeTo(actual.image.y, (expected.logoHeight - expected.imageHeight) / 2, `${title}: centered image`);
  closeTo(actual.image.width, expected.imageWidth, `${title}: image width`);
  closeTo(actual.image.height, expected.imageHeight, `${title}: uncropped image ratio`);
  closeTo(actual.rightPadding, expected.rightPadding, `${title}: right gutter`);
  closeTo(actual.border, 0, `${title}: no extra header border`);
  assert.deepEqual(actual.imageNatural, [906, 300], `${title}: exact high-resolution official logo.`);
  assert.deepEqual(actual.imageAttributes, ['906', '300'], `${title}: correct intrinsic dimensions.`);
  assert.equal(actual.imagePath, '/geolabs-50th-anniversary.png');
  assert.equal(actual.position, 'sticky', `${title}: sticky positioning.`);
  assert.equal(actual.top, '0px');
  assert.equal(actual.zIndex, '30');
  assert.equal(actual.headerColor, 'rgb(45, 49, 66)');
  assert.equal(actual.logoColor, 'rgb(244, 205, 0)');
  assert.deepEqual(actual.logoPadding, ['10px', `${expected.paddingX}px`]);
  assert.equal(actual.toggleVisible, expected.mobile, `${title}: correct menu breakpoint.`);
  assert.equal(actual.trustVisible, !expected.mobile, `${title}: correct trust-badge breakpoint.`);
  assert.ok(actual.overflow <= 1, `${title}: no horizontal overflow (${actual.overflow}px).`);
  if (expected.mobile) {
    closeTo(actual.toggle.width, 48, `${title}: menu target width`);
    closeTo(actual.toggle.height, 48, `${title}: menu target height`);
    closeTo(actual.icon.width, 28, `${title}: menu icon width`);
    closeTo(actual.icon.height, 28, `${title}: menu icon height`);
    closeTo(actual.toggle.x + actual.toggle.width, actual.viewportWidth - expected.rightPadding, `${title}: menu right alignment`);
  }
  // Exercise actual sticky behavior, not only the CSS declaration.
  await page.evaluate(() => window.scrollTo({ top: 180, behavior: 'instant' }));
  const scrolled = await page.locator('.brand-header').boundingBox();
  closeTo(scrolled.y, 0, `${title}: sticky header while scrolling`);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  return actual;
}

async function assertMenuClosed(page, label) {
  await page.waitForFunction(() => document.querySelector('.brand-menu-toggle')?.getAttribute('aria-expanded') === 'false' && !document.querySelector('#mobile-menu'));
  assert.equal(await page.locator('#mobile-menu').count(), 0, label);
}

async function verifyMenu(page, width, title, screenshotStem) {
  const toggle = page.locator('.brand-menu-toggle');
  const main = page.locator('#main-content');
  const before = await main.boundingBox();
  await toggle.click();
  await page.locator('#mobile-menu').waitFor();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true', `${title}: expanded state.`);
  assert.equal(await toggle.getAttribute('aria-controls'), 'mobile-menu');
  const after = await main.boundingBox();
  for (const key of ['x', 'y', 'width', 'height']) closeTo(after[key], before[key], `${title}: opening menu preserves main ${key}`);
  const menu = await page.locator('#mobile-menu').boundingBox();
  closeTo(menu.x, 0, `${title}: menu left edge`);
  closeTo(menu.y, expectedGeometry(width).headerHeight, `${title}: menu sits below header`);
  const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `${title}: open menu has no overflow.`);
  if (screenshotStem) await page.screenshot({ path: `${output}/${screenshotStem}-menu-open.png`, fullPage: false, animations: 'disabled' });

  await page.keyboard.press('Escape');
  await assertMenuClosed(page, `${title}: Escape closes menu.`);
  assert.equal(await toggle.evaluate(node => node === document.activeElement), true, `${title}: Escape restores toggle focus.`);
  await page.keyboard.press('Space');
  await page.locator('#mobile-menu').waitFor();
  await page.mouse.click(width - 2, menu.y + menu.height + 24);
  await assertMenuClosed(page, `${title}: outside pointer closes menu.`);
  await toggle.click();
  await main.focus();
  await assertMenuClosed(page, `${title}: outside focus closes menu.`);
  await toggle.click();
  await page.setViewportSize({ width: 1151, height: 1000 });
  await assertMenuClosed(page, `${title}: desktop breakpoint closes menu.`);
  assert.equal(await toggle.isVisible(), false, `${title}: desktop toggle hidden.`);
  await page.setViewportSize({ width, height: 1000 });
  await assertMenuClosed(page, `${title}: returning to mobile retains closed state.`);

  // The logo remains inside the header, so focusing it cannot accidentally
  // satisfy the outside-focus test; closure must follow React Router navigation.
  const documentSentinel = await page.evaluate(() => {
    window.__headerDocumentSentinel = crypto.randomUUID();
    return window.__headerDocumentSentinel;
  });
  await toggle.click();
  await page.getByRole('link', { name: 'Geolabs, Inc. careers home', exact: true }).focus();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true', `${title}: in-header focus retains menu.`);
  await page.keyboard.press('Enter');
  await page.waitForURL(url => url.pathname === '/' && !url.hash);
  await assertMenuClosed(page, `${title}: home/route navigation closes menu.`);
  assert.equal(await page.evaluate(() => window.__headerDocumentSentinel), documentSentinel, `${title}: home uses client-side navigation.`);
}

async function verifyKeyboard(page, title) {
  const logo = page.getByRole('link', { name: 'Geolabs, Inc. careers home', exact: true });
  await logo.focus();
  await page.keyboard.press('Shift+Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content', exact: true });
  assert.equal(await skip.evaluate(node => node === document.activeElement), true, `${title}: skip link precedes logo in keyboard order.`);
  const skipBox = await skip.boundingBox();
  assert.ok(skipBox.width >= 44 && skipBox.height >= 20, `${title}: focused skip link is visibly expanded.`);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement?.id === 'main-content');
  assert.equal(await page.locator('#main-content').getAttribute('tabindex'), '-1', `${title}: main accepts skip-link focus.`);
  await logo.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await logo.evaluate(node => node === document.activeElement), true, `${title}: logo keyboard focus.`);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const focus = await logo.evaluate(node => {
    const style = getComputedStyle(node);
    return { visible: node.matches(':focus-visible'), outline: parseFloat(style.outlineWidth), offset: parseFloat(style.outlineOffset) };
  });
  assert.ok(focus.visible && focus.outline >= 2, `${title}: logo has a visible keyboard focus indicator.`);
  assert.equal(focus.offset, -5, `${title}: flush-left focus outline is inset.`);
  await page.keyboard.press('Enter');
  await page.waitForURL(url => url.pathname === '/' && !url.hash);
  await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 2000 });
  assert.equal(await page.evaluate(() => window.scrollY), 0, `${title}: keyboard home activation returns to top.`);
}

async function verifyReducedMotion(page, title) {
  const result = await page.evaluate(() => {
    const longest = value => Math.max(...value.split(',').map(part => parseFloat(part) * (part.trim().endsWith('ms') ? 1 : 1000)));
    const nodes = [...document.querySelectorAll('.brand-header, .brand-header *')];
    return {
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      duration: Math.max(...nodes.map(node => Math.max(longest(getComputedStyle(node).transitionDuration), longest(getComputedStyle(node).animationDuration)))),
      // The existing reduced-motion reset intentionally uses 0.01ms rather
      // than none; do not mistake its next-paint cleanup for perceptible motion.
      activeAnimations: nodes.flatMap(node => node.getAnimations()).filter(animation => animation.playState === 'running' && Number(animation.effect?.getTiming().duration) > 0.1).length,
      video: document.querySelector('video') ? { autoplay: document.querySelector('video').autoplay, paused: document.querySelector('video').paused } : null,
    };
  });
  assert.equal(result.reduced, true, `${title}: reduced-motion preference active.`);
  assert.ok(result.duration <= 0.1, `${title}: header motion suppressed (${result.duration}ms).`);
  assert.equal(result.activeAnimations, 0, `${title}: no running header animations.`);
  if (result.video) assert.deepEqual(result.video, { autoplay: false, paused: true }, `${title}: background video respects reduced motion.`);
}

async function runCase(width, path, reducedMotion = 'no-preference') {
  const title = `${path} ${width}px ${reducedMotion}`;
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion, serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  const blockedWrites = [];
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', route => {
    const request = route.request();
    if (!['GET', 'HEAD'].includes(request.method())) {
      blockedWrites.push(`${request.method()} ${new URL(request.url()).pathname}`);
      return route.abort('blockedbyclient');
    }
    if (new URL(request.url()).origin !== base.origin) return route.abort('blockedbyclient');
    return route.continue();
  });
  // Prevent a dev-server websocket (or any future socket integration) from
  // providing a second unguarded network channel during this read-only suite.
  await context.routeWebSocket('**/*', socket => socket.close());
  try {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded' });
    await settlePage(page);
    const geometry = await verifyGeometry(page, width, title);
    const screenshotStem = reducedMotion === 'no-preference' && captureWidths.has(width) ? `${path === '/' ? 'careers' : 'apply'}-${width}-after` : null;
    if (screenshotStem) await page.screenshot({ path: `${output}/${screenshotStem}.png`, fullPage: false, animations: 'disabled' });
    if (reducedMotion === 'reduce') await verifyReducedMotion(page, title);
    if (width <= 1150) await verifyMenu(page, width, title, screenshotStem);
    await settlePage(page);
    await verifyKeyboard(page, title);
    assert.deepEqual(errors, [], `${title}: no browser exceptions.`);
    assert.deepEqual(blockedWrites, [], `${title}: this header workflow must not attempt writes.`);
    reports.push({ width, path, reducedMotion, header: geometry.header, logo: geometry.logo, image: geometry.image });
    console.log(`PASS ${title}: exact GeoWeb geometry, overflow, sticky, keyboard${width <= 1150 ? ', menu dismissal and no layout shift' : ''}.`);
  } catch (error) {
    failures.push(`${title}: ${error.message}`);
    console.error(`FAIL ${title}: ${error.message}`);
  } finally {
    await context.close();
  }
}

try {
  for (const width of widths) {
    for (const path of ['/', '/apply']) await runCase(width, path);
  }
  for (const width of [390, 1440]) {
    for (const path of ['/', '/apply']) await runCase(width, path, 'reduce');
  }
  assert.deepEqual(failures, [], `Header alignment failures (${failures.length}):\n${failures.join('\n')}`);
  console.log(`Header alignment regression passed: ${reports.length} route/viewport/motion cases. No applications, emails, or API writes sent. Screenshots: ${output}/`);
} finally {
  await browser.close();
}
