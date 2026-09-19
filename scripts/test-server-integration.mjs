import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = await mkdtemp(join(tmpdir(), 'geolabs-http-test-'));
process.env.APPLICATION_DATA_DIR = directory;
process.env.ADMIN_SESSION_SECRET = 'isolated-test-secret-not-for-production';
process.env.ADMIN_ALLOWED_EMAILS = 'lola@geolabs.net,tyamashita@geolabs.net';
process.env.HR_APPLICATION_EMAIL = 'employment@geolabs.net,tyamashita@geolabs.net';
process.env.RESEND_API_KEY = 'test-not-a-real-key';
process.env.MS_CLIENT_ID = 'test-client';
process.env.MS_CLIENT_SECRET = 'test-secret';
process.env.MS_TENANT_ID = 'test-tenant';
const { createPortalServer } = await import('../server/ec2-server.js');
const { createSubmissionHandler } = await import('../api/submit-application.js');
const { getApplication, getApplicationDocumentPath, getResumePath, updateApplication } = await import('../server/application-store.js');
const sent = [];
const links = [];
let failHr = false;
let failConfirmation = false;
let failLink = false;
let uncertainDelivery = false;
let holdDelivery;
const submit = createSubmissionHandler({
  buildDocx: async () => Buffer.from('test docx'),
  convertPdf: async () => Buffer.from('%PDF-test package'),
  splitPdfs: async () => ['eeo', 'veteran', 'drug-agreement'].map(key => ({ key, label: key, filename: `${key}.pdf`, content: Buffer.from(`%PDF-${key}`), type: 'application/pdf', restricted: true })),
  deliver: async payload => {
    const isHr = payload.to.includes('employment@geolabs.net');
    if (isHr) {
      const records = JSON.parse(await readFile(join(directory, 'applications.json'), 'utf8'));
      assert.equal(records.at(-1).documents.length, 4, 'All PDFs must be persisted before mail delivery begins.');
      if (holdDelivery) await holdDelivery;
    }
    if ((isHr && failHr) || (!isHr && failConfirmation)) throw new Error('Simulated mail outage');
    if (isHr && uncertainDelivery) throw Object.assign(new Error('Simulated unresolved delivery'), { deliveryUncertain: true });
    sent.push(payload);
    return { id: `test-message-${sent.length}`, provider: 'test' };
  },
});
const submitWithReceiptTest = async (req, res) => {
  if (req.body.id === 'http-receipt-failure') req.saveDeliveryReceipt = async () => { throw new Error('Simulated receipt disk failure'); };
  return submit(req, res);
};
const server = createPortalServer({ submit: submitWithReceiptTest, sendContinueEmail: async payload => {
  if (failLink) throw new Error('Simulated link email outage');
  links.push(payload);
} });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const tokenFor = fields => {
  const payload = Buffer.from(JSON.stringify({ email: 'lola@geolabs.net', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600, ...fields })).toString('base64url');
  return `${payload}.${createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('base64url')}`;
};
const cookie = `geolabs_admin_session=${tokenFor({})}`;
let checks = 0;
const request = async (path, { method = 'GET', body, auth = false, headers = {}, status = 200 } = {}) => {
  const response = await fetch(`${base}${path}`, { method, redirect: 'manual', headers: { ...(auth ? { Cookie: cookie } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  assert.equal(response.status, status, `${method} ${path}: ${await response.clone().text()}`);
  checks += 1;
  return response;
};
const data = {
  firstName: 'Integration', lastName: 'TEST', email: 'applicant@example.com', address: '123 Test Street', city: 'Waipahu', state: 'HI', zip: '96797',
  positionAppliedFor: 'General Application', preferredLocation: 'Waipahu, HI', highestEducationLevel: 'high_school',
  certifyInitials: 'IT', medInitials: 'IT', fcrInitials: 'IT',
  certificationAgreed: true, certificationSignature: 'Integration TEST', certificationDate: '2026-09-13',
  drugTestAgreed: true, drugTestSignature: 'Integration TEST', drugTestDate: '2026-09-13',
  employment: [{ company: 'Test Employer', duties: 'Full responsibilities retained. '.repeat(200) }], education: [], references: [],
};
const application = id => ({ id, firstName: data.firstName, lastName: data.lastName, email: data.email, applicationData: { ...data }, eeoData: { gender: 'noAnswer', race: 'noAnswer', veteranStatus: 'noAnswer' }, resumeAttachment: { filename: 'resume.pdf', type: 'application/pdf', content: Buffer.from('%PDF-test resume').toString('base64') } });
try {
  for (const path of ['/api/admin/applications', '/api/admin/applications/unknown/resume', '/api/admin/jobs']) await request(path, { status: 401 });
  await request('/admin', { status: 302 });
  await request('/auth/session', { headers: { Cookie: 'geolabs_admin_session=%E0%A4%A' } });
  for (const fields of [{ email: 'outsider@example.com' }, { exp: 0 }, { exp: null }, { role: 'user' }]) {
    await request('/api/admin/applications', { headers: { Cookie: `geolabs_admin_session=${tokenFor(fields)}` }, status: 401 });
  }
  await request('/api/admin/applications', { headers: { Cookie: `${cookie}tampered` }, status: 401 });
  await request('/api/admin/jobs', { method: 'POST', auth: true, body: { title: 'Cross-origin attempt' }, headers: { Origin: 'https://unrelated.example.com' }, status: 403 });
  assert.equal((await (await request('/auth/session', { auth: true })).json()).user.email, 'lola@geolabs.net');
  await request('/auth/callback?code=untrusted-without-state', { status: 400 });
  const login = await request('/auth/login?returnTo=https://evil.example', { status: 302 });
  assert.match(login.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
  assert.match(login.headers.get('set-cookie'), /geolabs_oauth_return=%2Fadmin/);
  await request('/api/submit-application', { status: 405 });
  await request('/api/submit-application-extra', { method: 'POST', body: {}, status: 404 });
  for (const body of [null, [], {}, { ...application('missing-fcra'), applicationData: { ...data, fcrInitials: '' } }, { ...application('bad-agreement'), applicationData: { ...data, drugTestAgreed: 'yes' } }, application('../escape')]) {
    await request('/api/submit-application', { method: 'POST', body, status: 400 });
  }
  assert.deepEqual(await readdir(directory), [], 'Invalid submissions must not create applicant records.');
  const first = application('http-valid');
  Object.assign(first, { stage: 'hired', documents: [{ key: 'stolen', storedFilename: '../../secret' }], resumeStoredFilename: '../../secret', submittedAt: '1900-01-01' });
  const submitted = await (await request('/api/submit-application', { method: 'POST', body: first })).json();
  assert.equal(submitted.applicationId, 'http-valid');
  assert.equal(sent.length, 2);
  assert.deepEqual(sent[0].to, ['employment@geolabs.net', 'tyamashita@geolabs.net']);
  assert.equal(sent[0].reply_to, 'applicant@example.com');
  assert.equal(sent[0].attachments.length, 6, 'HR receives logo, main PDF, three separate forms, and résumé.');
  assert.equal(sent[0].attachments.at(-1).type, 'application/pdf');
  assert.deepEqual(sent[1].to, ['applicant@example.com']);
  assert.equal(sent[1].attachments.length, 1, 'Applicant confirmation only contains the inline logo.');
  const record = await getApplication(first.id);
  assert.equal(record.stage, 'applied');
  assert.equal(record.applicationData.employment[0].duties, data.employment[0].duties);
  assert.equal(record.deliveryStatus, 'delivered');
  assert.notEqual(record.submittedAt, '1900-01-01');
  assert.equal(record.resumeStoredFilename.includes('../'), false);
  const resume = await request(`/api/admin/applications/${first.id}/resume`, { auth: true });
  assert.equal(await resume.text(), '%PDF-test resume');
  assert.equal(resume.headers.get('cache-control'), 'private, no-store');
  for (const document of record.documents) await request(document.url, { auth: true });
  await request(`/api/admin/applications/${first.id}`, { method: 'PATCH', auth: true, body: { stage: 'interview', documents: [{ key: 'stolen', storedFilename: '../../secret' }], resumeStoredFilename: '../../secret' } });
  await request('/api/submit-application', { method: 'POST', body: first });
  assert.equal(sent.length, 2, 'Retry of delivered application must not resend either email.');
  assert.equal((await getApplication(first.id)).stage, 'interview');
  assert.equal((await getApplication(first.id)).documents.length, 4);
  const conflict = await request('/api/submit-application', { method: 'POST', body: { ...first, applicationData: { ...data, lastName: 'Overwrite' } }, status: 409 });
  assert.equal((await conflict.json()).code, 'APPLICATION_ID_CONFLICT');
  assert.equal(getResumePath({ resumeStoredFilename: '../../secret' }), null);
  assert.equal(getApplicationDocumentPath({ documents: [{ key: 'bad', storedFilename: '../secret' }] }, 'bad'), null);

  failHr = true;
  const failed = application('http-delivery-retry');
  await request('/api/submit-application', { method: 'POST', body: failed, status: 502 });
  assert.equal((await getApplication(failed.id)).deliveryStatus, 'delivery_failed');
  assert.equal((await getApplication(failed.id)).documents.length, 4);
  failHr = false;
  await request('/api/submit-application', { method: 'POST', body: failed });
  failConfirmation = true;
  const noConfirmation = await (await request('/api/submit-application', { method: 'POST', body: application('http-confirmation-failure') })).json();
  assert.equal(noConfirmation.ok, true);
  assert.equal(noConfirmation.confirmationSent, false);
  failConfirmation = false;
  const receiptFailure = application('http-receipt-failure');
  await request('/api/submit-application', { method: 'POST', body: receiptFailure });
  const acceptedMailCount = sent.length;
  await request('/api/submit-application', { method: 'POST', body: receiptFailure });
  assert.equal(sent.length, acceptedMailCount, 'A receipt-save error after accepted mail must not resend.');
  uncertainDelivery = true;
  const uncertain = application('http-uncertain');
  const unknown = await request('/api/submit-application', { method: 'POST', body: uncertain, status: 502 });
  assert.equal((await unknown.json()).code, 'DELIVERY_REVIEW_REQUIRED');
  assert.equal((await getApplication(uncertain.id)).deliveryStatus, 'delivery_uncertain');
  uncertainDelivery = false;
  await request('/api/submit-application', { method: 'POST', body: uncertain, status: 409 });

  let release;
  holdDelivery = new Promise(resolve => { release = resolve; });
  const simultaneous = application('http-simultaneous');
  const pending = request('/api/submit-application', { method: 'POST', body: simultaneous });
  // Poll local persisted state to ensure the first request has entered processing.
  for (let i = 0; i < 100 && !await getApplication(simultaneous.id); i++) await new Promise(resolve => setTimeout(resolve, 5));
  const inProgress = await request('/api/submit-application', { method: 'POST', body: simultaneous, status: 409 });
  assert.equal((await inProgress.json()).code, 'SUBMISSION_IN_PROGRESS');
  release();
  await pending;
  holdDelivery = null;
  await updateApplication(simultaneous.id, { deliveryStatus: 'sending' });
  const restarted = createPortalServer({ submit });
  await new Promise(resolve => restarted.listen(0, '127.0.0.1', resolve));
  try {
    const countBeforeRestartRetry = sent.length;
    const restartRetry = await fetch(`http://127.0.0.1:${restarted.address().port}/api/submit-application`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(simultaneous) });
    assert.equal(restartRetry.status, 409);
    assert.equal((await restartRetry.json()).code, 'DELIVERY_REVIEW_REQUIRED');
    assert.equal(sent.length, countBeforeRestartRetry, 'An unresolved send after server restart must be reviewed, never silently sent again.');
    checks += 1;
  } finally { await new Promise(resolve => restarted.close(resolve)); }

  const draft = { email: 'draft@example.com', formData: { firstName: 'Draft TEST', email: 'draft@example.com' }, resumeAttachment: application('').resumeAttachment };
  await request('/api/application-drafts/link', { method: 'POST', body: null, status: 400 });
  failLink = true;
  await request('/api/application-drafts/link', { method: 'POST', body: { draft }, status: 502 });
  assert.deepEqual(JSON.parse(await readFile(join(directory, 'application-drafts.json'), 'utf8')), []);
  failLink = false;
  const created = await (await request('/api/application-drafts/link', { method: 'POST', body: { draft }, status: 201 })).json();
  assert.equal(links[0].email, draft.email);
  assert.equal(new URL(links[0].link).searchParams.get('resume'), created.token);
  assert.equal((await readFile(join(directory, 'application-drafts.json'), 'utf8')).includes(created.token), false);
  const restored = await (await request(`/api/application-drafts/resume?token=${created.token}`)).json();
  assert.equal(restored.draft.resumeAttachment.content, draft.resumeAttachment.content);
  await request('/api/application-drafts', { method: 'PUT', body: { draft }, status: 401 });
  await request('/api/application-drafts', { method: 'PUT', body: { draft: { ...draft, resumeAttachment: null } }, headers: { Authorization: `Bearer ${created.token}` } });
  assert.equal((await (await request(`/api/application-drafts/resume?token=${created.token}`)).json()).draft.resumeAttachment, null);
  assert.deepEqual(await readdir(join(directory, 'draft-resumes')), []);
  await request('/api/application-drafts', { method: 'DELETE', headers: { Authorization: `Bearer ${created.token}` } });
  await request(`/api/application-drafts/resume?token=${created.token}`, { status: 404 });

  await Promise.all(Array.from({ length: 12 }, () => request('/api/jobs')));
  const job = { id: 'http-job', title: 'HTTP Test Role', status: 'draft', internalNotes: 'HR-only confidential discussion', hiringManagerEmail: 'private@example.com', recruiterEmail: 'private-recruiter@example.com' };
  await request('/api/admin/jobs', { method: 'POST', body: job, auth: true, status: 201 });
  await request('/api/jobs/http-job', { status: 404 });
  await request('/api/admin/jobs/http-job', { auth: true });
  await request('/api/admin/jobs/http-job', { method: 'PATCH', body: { status: 'published' }, auth: true });
  const publicJob = (await (await request('/api/jobs/http-job')).json()).job;
  assert.equal(publicJob.internalNotes, undefined);
  assert.equal(publicJob.hiringManagerEmail, undefined);
  assert.equal(publicJob.recruiterEmail, undefined);
  assert.equal((await (await request('/api/admin/jobs/http-job', { auth: true })).json()).job.internalNotes, job.internalNotes);
  await request('/api/admin/jobs', { method: 'POST', body: job, auth: true, status: 409 });
  for (const body of [null, [], { title: '' }]) await request('/api/admin/jobs', { method: 'POST', body, auth: true, status: 400 });
  await request('/api/admin/jobs/http-job', { method: 'PATCH', body: null, auth: true, status: 400 });
  await request('/api/admin/jobs/http-job', { method: 'DELETE', auth: true });
  await request('/api/jobs/http-job', { status: 404 });
  await request('/api/admin/applications/http-valid', { method: 'DELETE', auth: true });
  await request('/api/admin/applications/http-valid/resume', { auth: true, status: 404 });
  await request('/assets/missing-test.js', { status: 404 });
  await request('/api/admin/jobs/%FF', { auth: true, status: 400 });
  console.log(`Server HTTP integration passed: ${checks} requests covering auth, validation, duplicate submits, email routing, saved PDFs/resumes, failure recovery, drafts, and jobs. No external email or production data used.`);
} finally {
  await new Promise(resolve => server.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
