import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MAX_RESUME_BYTES, RESUME_SIZE_ERROR } from '../src/lib/resumeLimits.js';

const directory = await mkdtemp(join(tmpdir(), 'geolabs-email-size-test-'));
process.env.APPLICATION_DATA_DIR = directory;
process.env.MS_TENANT_ID = 'size-test';
process.env.MS_CLIENT_ID = 'size-test';
process.env.MS_CLIENT_SECRET = 'size-test';
process.env.GEMINI_API_KEY = 'size-test';
const { sendEmail, MAX_GRAPH_MESSAGE_BYTES } = await import('../api/submit-application.js');
const { createDraft } = await import('../server/draft-store.js');
const { normalizeSubmission } = await import('../server/submission-validation.js');
const { default: parseResume } = await import('../api/parse-resume.js');
const nativeFetch = globalThis.fetch;
const calls = [];
let mailFailure = '';
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  if (String(url).includes('login.microsoftonline.com')) return Response.json({ access_token: 'fake-token', expires_in: 3600 });
  if (String(url).includes('generativelanguage.googleapis.com')) return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ data: { firstName: 'Boundary', explicitSkills: [] }, warnings: [] }) }] } }] });
  assert.match(String(url), /^https:\/\/graph\.microsoft\.com\//, 'Only known mocked endpoints are permitted.');
  if (mailFailure === 'timeout') throw new Error('Simulated network interruption');
  if (mailFailure === 'reject') return Response.json({ error: { message: 'Rejected' } }, { status: 400 });
  if (mailFailure === 'unknown') return Response.json({ error: { message: 'Gateway error' } }, { status: 503 });
  return new Response(null, { status: 202, headers: { 'request-id': 'mock-receipt' } });
};
const attachment = size => ({ filename: 'boundary.txt', type: 'text/plain', content: Buffer.alloc(size, 'a').toString('base64') });
const form = {
  firstName: 'Boundary', lastName: 'TEST', email: 'boundary@example.com', address: '123 Test Street', city: 'Waipahu', state: 'HI', zip: '96797',
  positionAppliedFor: 'General Application', preferredLocation: 'Waipahu, HI', highestEducationLevel: 'high-school',
  certifyInitials: 'BT', medInitials: 'BT', fcrInitials: 'BT',
  certificationAgreed: true, certificationSignature: 'Boundary TEST', certificationDate: '2026-09-13',
  drugTestAgreed: true, drugTestSignature: 'Boundary TEST', drugTestDate: '2026-09-13',
};
const parse = async size => {
  let status = 200;
  let payload;
  await parseResume({ method: 'POST', body: { resumeAttachment: attachment(size) } }, { status(code) { status = code; return this; }, json(value) { payload = value; } });
  return { status, payload };
};
try {
  assert.equal(MAX_RESUME_BYTES, 2 * 1024 * 1024);
  const maximum = attachment(MAX_RESUME_BYTES);
  const oversized = attachment(MAX_RESUME_BYTES + 1);
  normalizeSubmission({ id: 'boundary-test', applicationData: form, resumeAttachment: maximum });
  assert.throws(() => normalizeSubmission({ applicationData: form, resumeAttachment: oversized }), { message: RESUME_SIZE_ERROR });
  await createDraft({ email: form.email, formData: form, resumeAttachment: maximum });
  await assert.rejects(createDraft({ email: form.email, formData: form, resumeAttachment: oversized }), /RESUME_TOO_LARGE/);
  assert.equal((await parse(MAX_RESUME_BYTES)).status, 200);
  const beforeOversizedParse = calls.length;
  assert.equal((await parse(MAX_RESUME_BYTES + 1)).payload.error, RESUME_SIZE_ERROR);
  assert.equal(calls.length, beforeOversizedParse, 'Oversize analysis is rejected without an external request.');

  const base = { to: ['test@example.com'], subject: 'Size boundary test', html: '', attachments: [] };
  await sendEmail(base);
  const overhead = Buffer.byteLength(calls.at(-1).options.body, 'utf8');
  await sendEmail({ ...base, html: 'x'.repeat(MAX_GRAPH_MESSAGE_BYTES - overhead) });
  assert.equal(Buffer.byteLength(calls.at(-1).options.body, 'utf8'), MAX_GRAPH_MESSAGE_BYTES);
  const beforeOversizedMail = calls.length;
  await assert.rejects(sendEmail({ ...base, html: 'x'.repeat(MAX_GRAPH_MESSAGE_BYTES - overhead + 1) }), { code: 'EMAIL_PACKAGE_TOO_LARGE' });
  assert.equal(calls.length, beforeOversizedMail, 'An oversize Graph request must be rejected before requesting a token or sending mail.');
  await sendEmail({ ...base, attachments: [maximum, { filename: 'application.pdf', type: 'application/pdf', content: Buffer.alloc(100_000).toString('base64') }] });
  assert.ok(Buffer.byteLength(calls.at(-1).options.body, 'utf8') < MAX_GRAPH_MESSAGE_BYTES);
  mailFailure = 'reject';
  await assert.rejects(sendEmail(base), error => error.deliveryUncertain === false);
  mailFailure = 'timeout';
  await assert.rejects(sendEmail(base), error => error.deliveryUncertain === true);
  mailFailure = 'unknown';
  await assert.rejects(sendEmail(base), error => error.deliveryUncertain === true);
  console.log('Email/attachment boundaries passed: exactly 2 MB accepted; +1 byte rejected in parsing, draft storage, and submission; Graph JSON exact ceiling accepted/+1 rejected without network; known rejection and ambiguous delivery distinguished. All provider calls mocked.');
} finally {
  globalThis.fetch = nativeFetch;
  await rm(directory, { recursive: true, force: true });
}
