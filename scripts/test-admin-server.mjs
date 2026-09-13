import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

// The app switches to its actual server-backed stores on non-demo hostnames.
// Chromium maps this .localhost name to the ephemeral loopback test server.
const directory = await mkdtemp(join(tmpdir(), 'geolabs-admin-browser-'));
process.env.APPLICATION_DATA_DIR = directory;
process.env.ADMIN_SESSION_SECRET = randomBytes(32).toString('hex');
process.env.ADMIN_ALLOWED_EMAILS = 'lola@geolabs.net,tyamashita@geolabs.net';
process.env.RESEND_API_KEY = 'isolated-test-no-mail';
const { createPortalServer } = await import('../server/ec2-server.js');
const { upsertSubmittedApplication, saveApplicationDocuments, getApplication } = await import('../server/application-store.js');
const { listJobs } = await import('../server/job-store.js');
let forbiddenCalls = 0;
const rejectExternalAction = async () => { forbiddenCalls += 1; throw new Error('This admin test must never submit applications or send email.'); };
const server = createPortalServer({ submit: rejectExternalAction, sendContinueEmail: rejectExternalAction });
try {
  await upsertSubmittedApplication({
    id: 'app-admin-test', firstName: 'Admin', lastName: 'Workflow', email: 'admin.workflow@example.com',
    status: 'active', stage: 'applied', submittedAt: new Date().toISOString(),
    requisitionTitle: 'Engineering Technician or Trainee (Field)',
    applicationData: { firstName: 'Admin', lastName: 'Workflow', email: 'admin.workflow@example.com' },
    recruiterNotes: [], stageHistory: [], auditTrail: [],
    resumeAttachment: { filename: 'Admin-Workflow-Resume.pdf', type: 'application/pdf', content: Buffer.from('%PDF-1.4\nIsolated resume download fixture.').toString('base64') },
  }, 'delivered');
  await saveApplicationDocuments('app-admin-test', [
    { key: 'complete-application', label: 'Complete Employment Application', filename: 'Application.pdf', restricted: false },
    { key: 'eeo-survey', label: 'EEO Voluntary Self-Identification Survey', filename: 'EEO.pdf', restricted: true },
  ].map(document => ({ ...document, type: 'application/pdf', content: Buffer.from(`%PDF-1.4\nIsolated ${document.key} download fixture.`).toString('base64') })));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const payload = Buffer.from(JSON.stringify({ email: 'lola@geolabs.net', name: 'Lola Test', role: 'admin', exp: Math.floor(Date.now() / 1000) + 1800 })).toString('base64url');
  const cookie = `geolabs_admin_session=${payload}.${createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('base64url')}`;
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/test-admin-portal.mjs'], {
      env: { ...process.env, TEST_BASE_URL: `http://portal.localhost:${port}`, TEST_AUTH_COOKIE: cookie }, stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Real admin browser workflow exited ${code}.`)));
  });
  const application = await getApplication('app-admin-test');
  assert.equal(application.stage, 'under_review');
  assert.equal(application.recruiterNotes.length, 1);
  assert.equal(application.recruiterNotes[0].note, 'Reviewed during automated admin workflow test.');
  assert.equal(application.recruiterNotes[0].authorEmail, 'lola@geolabs.net');
  assert.equal(application.stageHistory.at(-1).stage, 'under_review');
  assert.equal(application.documents.length, 2);
  const job = (await listJobs()).find(item => item.title === 'Admin Workflow Test Opening');
  assert.ok(job, 'The browser-created opening must exist in persistent server storage.');
  assert.equal(job.status, 'closed');
  assert.equal(job.description, 'Updated workflow test opening description.');
  const publicJobs = await (await fetch(`http://127.0.0.1:${port}/api/jobs`)).json();
  assert.equal(publicJobs.jobs.some(item => item.id === job.id), false);
  assert.equal(forbiddenCalls, 0, 'No application submission or email may be triggered.');
  console.log('PASS: admin browser actions persisted to isolated server storage, saved PDFs/resume downloaded, public job visibility updated, no real login or mail used.');
} finally {
  if (server.listening) await new Promise(resolve => server.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
