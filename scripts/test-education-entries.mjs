import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(8000);

try {
  await page.goto(`${baseUrl}/apply`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /begin (general )?application/i }).click();
  await page.getByRole('button', { name: /Experience/ }).click();
  await page.getByRole('button', { name: /Education/ }).click();
  await page.getByText('Education History', { exact: true }).waitFor();

  assert.equal(await page.locator('h4').filter({ hasText: /^Education \d+$/ }).count(), 2, 'Education should start with exactly two entries.');
  await page.getByRole('button', { name: 'Add education', exact: true }).click();
  assert.equal(await page.locator('h4').filter({ hasText: /^Education \d+$/ }).count(), 3, 'Add education should create another entry.');
  await page.getByRole('button', { name: 'Remove education 3' }).click();
  assert.equal(await page.locator('h4').filter({ hasText: /^Education \d+$/ }).count(), 2, 'An added education entry should be removable.');
  console.log('Education starts with two entries and supports adding/removing additional entries.');
} finally {
  await browser.close();
}
