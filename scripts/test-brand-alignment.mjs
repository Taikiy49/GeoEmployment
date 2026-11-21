import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Only test a local preview.');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
await mkdir('tmp/brand-review', { recursive: true });
try {
  for (const width of [375, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const request = route.request();
      if (new URL(request.url()).origin !== base || !['GET', 'HEAD'].includes(request.method())) return route.abort();
      return route.continue();
    });
    await page.goto(base);
    await page.evaluate(async () => {
      await Promise.all([document.fonts.load('600 20px Montserrat'), document.fonts.load('400 16px "DM Sans"')]);
      await document.fonts.ready;
    });
    const styles = await page.evaluate(() => ({
      body: getComputedStyle(document.body).fontFamily,
      heading: getComputedStyle(document.querySelector('h1')).fontFamily,
      header: getComputedStyle(document.querySelector('header')).backgroundColor,
      accent: getComputedStyle(document.querySelector('.brand-logo')).backgroundColor,
      fonts: document.fonts.check('600 20px Montserrat') && document.fonts.check('400 16px "DM Sans"'),
    }));
    assert.match(styles.body, /DM Sans/);
    assert.match(styles.heading, /Montserrat/);
    assert.equal(styles.header, 'rgb(45, 49, 66)');
    assert.equal(styles.accent, 'rgb(244, 205, 0)');
    assert.ok(styles.fonts, 'Self-hosted fonts loaded.');
    await page.waitForFunction(() => {
      const video = document.querySelector('video');
      return video && !video.autoplay && video.paused;
    });
    await page.screenshot({ path: `tmp/brand-review/careers-${width}.png`, fullPage: true });
    await page.goto(base + '/apply');
    await page.getByRole('button', { name: 'Begin General Application', exact: true }).click();
    await page.getByRole('navigation', { name: 'Application progress' }).getByRole('button', { name: /Personal information/ }).click();
    const first = page.getByLabel('First Name', { exact: false });
    await first.fill('Brand TEST');
    assert.equal(await first.evaluate(node => getComputedStyle(node).fontSize), '16px');
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => document.activeElement?.matches('input, button, textarea')));
    // Framer entrances are JavaScript-driven; CSS reduced-motion does not
    // settle their opacity. Capture the completed state, not a mid-fade frame.
    await page.waitForFunction(() => {
      const nav = document.querySelector('nav[aria-label="Application progress"]');
      return nav && Number(getComputedStyle(nav.parentElement).opacity) === 1;
    });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: `tmp/brand-review/application-${width}.png`, fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    await page.getByRole('navigation', { name: 'Application progress' }).getByRole('button', { name: /Position/ }).click();
    const select = page.getByRole('combobox').first();
    await select.click();
    await page.getByRole('listbox').waitFor();
    await page.screenshot({ path: `tmp/brand-review/select-${width}.png` });
    await page.keyboard.press('Escape');
    await page.evaluate(() => localStorage.setItem('geolabs_current_user', JSON.stringify({ id: 'brand-test', email: 'brand@example.com', full_name: 'Brand TEST', role: 'admin' })));
    await page.goto(base + '/admin');
    await page.getByRole('heading', { name: 'Hiring Overview' }).waitFor();
    await page.getByText('Active Applications', { exact: true }).waitFor();
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `tmp/brand-review/admin-${width}.png`, fullPage: true });
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: GeoWeb palette, loaded fonts, input scale, keyboard, select, reduced motion, applicant and HR screens.`);
    await page.close();
  }
} finally {
  await browser.close();
}
