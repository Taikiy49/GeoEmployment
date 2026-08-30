import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(7000);
page.on('pageerror', error => console.error('Browser error:', error.message));

try {
  await page.goto(baseUrl);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('geolabs_current_user', JSON.stringify({ id: 'admin-test', email: 'tyamashita@geolabs.net', full_name: 'Taiki Yamashita', role: 'admin' }));
    localStorage.setItem('geolabs_applications', JSON.stringify([{
      id: 'app-admin-test', firstName: 'Admin', lastName: 'Workflow', email: 'admin.workflow@example.com',
      status: 'active', isDraft: false, stage: 'applied', submittedAt: '2026-08-10T12:00:00-10:00',
      requisitionTitle: 'Engineering Technician or Trainee (Field)', applicationData: { firstName: 'Admin', lastName: 'Workflow', email: 'admin.workflow@example.com' },
      documents: [
        { key: 'complete-application', label: 'Complete Employment Application', url: '/test-main.pdf', restricted: false },
        { key: 'eeo-survey', label: 'EEO Voluntary Self-Identification Survey', url: '/test-eeo.pdf', restricted: true },
      ],
      recruiterNotes: [], stageHistory: [], auditTrail: [],
    }]));
  });

  await page.goto(`${baseUrl}/admin`);
  console.log('Checking overview and navigation...');
  await page.getByRole('heading', { name: 'Hiring Overview' }).waitFor();
  assert.equal(await page.locator('nav a').count(), 4);
  assert.equal(await page.locator('nav a[aria-current="page"]').count(), 1, 'Only one navigation item should be active.');

  await page.getByRole('link', { name: 'Applications' }).click();
  console.log('Checking application search and detail actions...');
  await page.getByPlaceholder('Search name, email, position...').fill('Admin Workflow');
  await page.getByRole('link', { name: /Review/ }).click();
  await page.getByRole('heading', { name: 'Admin Workflow' }).waitFor();
  await page.getByRole('button', { name: 'Under Review' }).click();
  await page.getByRole('button', { name: 'Yes, move to Under Review' }).click();
  await page.getByText('Under Review', { exact: true }).first().waitFor();
  await page.getByPlaceholder('Add a recruiter note...').fill('Reviewed during automated admin workflow test.');
  await page.getByPlaceholder('Add a recruiter note...').locator('xpath=following::button[1]').click();
  await page.getByText('Reviewed during automated admin workflow test.').waitFor();
  assert.equal(await page.getByText('Complete Employment Application (Restricted)', { exact: true }).count(), 0);
  await page.getByText('Complete Employment Application', { exact: true }).waitFor();
  await page.getByText('EEO Voluntary Self-Identification Survey (Restricted)', { exact: true }).waitFor();

  await page.getByRole('link', { name: 'Job Openings' }).click();
  console.log('Checking job creation and publishing...');
  await page.getByRole('link', { name: 'New Opening' }).click();
  await page.getByPlaceholder('e.g., Environmental Scientist II').fill('Admin Workflow Test Opening');
  await page.locator('select').first().selectOption({ label: 'Engineering' });
  await page.getByPlaceholder('Describe the role, responsibilities, and team...').fill('A production-quality workflow test opening.');
  const publishButton = page.getByRole('button', { name: 'Publish Opening', exact: true });
  assert.equal(await publishButton.isEnabled(), true, 'Publish should be enabled when required fields are complete.');
  await publishButton.click();
  await page.waitForURL(/\/admin\/jobs\/job-/);
  await page.getByRole('heading', { name: 'Admin Workflow Test Opening' }).waitFor();
  await page.getByText('Published', { exact: true }).first().waitFor();

  await page.goto(`${baseUrl}/`);
  await page.getByText('Admin Workflow Test Opening', { exact: true }).waitFor();

  await page.goBack();
  await page.getByRole('link', { name: 'Edit' }).click();
  await page.getByPlaceholder('Describe the role, responsibilities, and team...').fill('Updated workflow test opening description.');
  await page.getByRole('button', { name: 'Save Draft' }).click();
  await page.getByText('Updated workflow test opening description.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByText('Paused', { exact: true }).first().waitFor();
  await page.goto(`${baseUrl}/`);
  assert.equal(await page.getByText('Admin Workflow Test Opening', { exact: true }).count(), 0, 'Paused openings must be hidden from applicants.');
  await page.goBack();
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.getByText('Published', { exact: true }).first().waitFor();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByText('Closed', { exact: true }).first().waitFor();

  await page.goto(`${baseUrl}/admin/settings`);
  console.log('Checking access controls and mobile layout...');
  await page.getByRole('heading', { name: 'Access & Security' }).waitFor();
  assert.equal(await page.getByText('Invite HR Admin', { exact: true }).count(), 0);
  assert.equal(await page.getByText('Email Templates', { exact: true }).count(), 0);
  await page.goto(`${baseUrl}/admin/email-templates`);
  await page.waitForURL('**/admin/settings');

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/admin', '/admin/jobs', '/admin/applications', '/admin/settings']) {
    await page.goto(`${baseUrl}${route}`);
    await page.locator('main').waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const offenders = overflow > 1 ? await page.evaluate(() => [...document.querySelectorAll('body *')]
      .map(element => ({ tag: element.tagName, classes: element.className, right: element.getBoundingClientRect().right }))
      .filter(item => item.right > document.documentElement.clientWidth + 1)
      .slice(0, 5)) : [];
    assert.ok(overflow <= 1, `${route} must not overflow horizontally on mobile (overflow: ${overflow}px; offenders: ${JSON.stringify(offenders)}).`);
  }
  console.log('Admin navigation, applications, stages, notes, files, jobs, public publishing, settings, redirects, and mobile layout passed.');
} finally {
  await browser.close();
}
