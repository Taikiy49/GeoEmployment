import { chromium } from 'playwright-core';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const executablePath = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext();

try {
  const firstTab = await context.newPage();
  await firstTab.goto(`${baseUrl}/apply`);
  await firstTab.evaluate(async () => {
    localStorage.clear();
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase('geolabs-employment-portal');
      request.onsuccess = resolve;
      request.onerror = resolve;
      request.onblocked = resolve;
    });
  });
  await firstTab.reload();
  await firstTab.getByRole('button', { name: /start an application/i }).click();

  await firstTab.locator('#resume-input').setInputFiles({
    name: 'Draft-Persistence-Test.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Geolabs resume persistence end-to-end test.'),
  });
  await firstTab.getByText('Resume attached and ready to send with your application.').waitFor();
  await firstTab.getByLabel('First Name').fill('Persistence');
  await firstTab.getByRole('button', { name: /continue/i }).click();
  await firstTab.getByText('Employment History').waitFor();
  await firstTab.getByRole('button', { name: /^back$/i }).click();
  await firstTab.getByText('Draft-Persistence-Test.txt').waitFor();

  const secondTab = await context.newPage();
  await secondTab.goto(`${baseUrl}/apply`);
  await secondTab.getByText('Draft-Persistence-Test.txt').waitFor();
  await secondTab.getByLabel('First Name').waitFor();

  if (await secondTab.getByLabel('First Name').inputValue() !== 'Persistence') {
    throw new Error('A new tab did not restore the saved form fields.');
  }

  await secondTab.reload();
  await secondTab.getByText('Draft-Persistence-Test.txt').waitFor();

  await secondTab.getByLabel('Email Address').fill('tabsync@example.com');
  await firstTab.getByLabel('Email Address').waitFor();
  await firstTab.waitForFunction(() => (
    document.querySelector('input[type="email"]')?.value === 'tabsync@example.com'
  ));

  const storedResume = await secondTab.evaluate(async () => {
    const request = indexedDB.open('geolabs-employment-portal');
    const database = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction('resume-files', 'readonly');
    const recordRequest = transaction.objectStore('resume-files').get('geolabs_application_general');
    const record = await new Promise((resolve, reject) => {
      recordRequest.onsuccess = () => resolve(recordRequest.result);
      recordRequest.onerror = () => reject(recordRequest.error);
    });
    database.close();
    return { name: record?.name, size: record?.size };
  });

  if (storedResume.name !== 'Draft-Persistence-Test.txt' || !storedResume.size) {
    throw new Error('IndexedDB did not retain the resume file.');
  }

  console.log('PASS: fields and resume persist across navigation, refresh, and multiple tabs.');
} finally {
  await browser.close();
}
