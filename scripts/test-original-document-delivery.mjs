import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PDFDocument } from 'pdf-lib';

// Exercise the real document-generation path, but never a mail provider.
process.env.RESEND_API_KEY = 'isolated-document-delivery-test';
process.env.HR_APPLICATION_EMAIL = 'employment@geolabs.net,tyamashita@geolabs.net';
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('External network access is forbidden in the document delivery test.'); };
const { normalizeSubmission } = await import('../server/submission-validation.js');
const { createSubmissionHandler, sendEmail, MAX_GRAPH_MESSAGE_BYTES } = await import('../api/submit-application.js');
const { extractPageTexts } = await import('../api/split-compliance-pdfs.js');
const { MAX_RESUME_BYTES } = await import('../src/lib/resumeLimits.js');
const data = {
  firstName: 'TEST', lastName: 'Pipeline', email: 'pipeline@example.invalid',
  address: '123 Synthetic Street', city: 'Waipahu', state: 'HI', zip: '96797',
  positionAppliedFor: 'General Application', preferredLocation: 'Waipahu, HI', highestEducationLevel: 'high-school',
  certifyInitials: 'TP', medInitials: 'TP', fcrInitials: 'TP',
  certificationAgreed: true, certificationSignature: 'TEST Pipeline', certificationDate: '2026-11-22',
  drugTestAgreed: true, drugTestSignature: 'TEST Pipeline', drugTestDate: '2026-11-22',
  eeoName: 'TEST Pipeline', eeoDate: '2026-11-22', vetSignature: 'TEST Pipeline', vetDate: '2026-11-22',
  canPerformDuties: true, affiliations: 'Synthetic Engineering Society',
  employment: [], education: [], references: [],
};
const application = normalizeSubmission({
  id: 'TEST-ORIGINAL-DOCUMENT-DELIVERY', applicationData: data,
  eeoData: { gender: '', race: 'I do not wish to disclose.', veteranStatus: 'noAnswer' },
  resumeAttachment: { filename: 'TEST-Pipeline-Resume.txt', type: 'text/plain', content: Buffer.from('Synthetic test resume.').toString('base64') },
});
let saved;
let beforeHr = false;
let receiptSaved = false;
const messages = [];
const handler = createSubmissionHandler({ deliver: async message => {
  assert.equal(saved.length, 5, 'All five real PDFs must be saved before either email.');
  assert.equal(beforeHr, true);
  if (messages.length === 0) {
    assert.deepEqual(message.to, ['employment@geolabs.net', 'tyamashita@geolabs.net']);
    for (const file of saved) assert.equal(message.attachments.find(item => item.filename === file.filename).content, file.content);
    assert.equal(message.attachments.length, 7, 'HR package includes logo, five PDFs and supplied resume.');
  } else {
    assert.equal(receiptSaved, true);
    assert.deepEqual(message.to, ['pipeline@example.invalid']);
    assert.equal(message.attachments.length, 1, 'Applicant confirmation must not inherit HR compliance attachments.');
  }
  messages.push(message);
  return { id: `mock-only-${messages.length}`, provider: 'isolated-test' };
} });
let status = 200;
let result;
try {
  await handler({
    method: 'POST', body: application,
    saveGeneratedDocuments: async documents => { saved = documents; },
    beforeHrDelivery: async () => { beforeHr = true; },
    saveDeliveryReceipt: async () => { receiptSaved = true; },
  }, {
    status(code) { status = code; return this; },
    json(value) { result = value; return this; },
  });
  assert.equal(status, 200, JSON.stringify(result));
  assert.equal(result.ok, true);
  assert.equal(result.confirmationSent, true);
  assert.equal(messages.length, 2);
  assert.deepEqual(saved.map(file => file.key), ['complete-application', 'application-agreements', 'alcohol-drug-agreement', 'eeo-survey', 'veteran-status']);
  assert.deepEqual(saved.filter(file => file.restricted).map(file => file.key), ['eeo-survey', 'veteran-status']);
  const pages = {};
  if (process.env.PDF_TEST_OUTPUT_DIR) await mkdir(process.env.PDF_TEST_OUTPUT_DIR, { recursive: true });
  for (const file of saved) {
    const bytes = Buffer.from(file.content, 'base64');
    const text = (await extractPageTexts(bytes)).join(' ');
    assert.match(text, /test pipeline/);
    assert.doesNotMatch(text, /voluntary self-identification of disability/);
    pages[file.key] = (await PDFDocument.load(bytes)).getPageCount();
    if (process.env.PDF_TEST_OUTPUT_DIR) await writeFile(join(process.env.PDF_TEST_OUTPUT_DIR, file.filename), bytes);
  }
  assert.equal(pages['application-agreements'], 1);
  assert.equal(pages['alcohol-drug-agreement'], 1);
  assert.equal(pages['eeo-survey'], 1);
  assert.equal(pages['veteran-status'], 2);
  // Include the real five-document package when testing the maximum supported
  // resume size, not a tiny placeholder PDF that understates message overhead.
  process.env.MS_TENANT_ID = 'isolated-test';
  process.env.MS_CLIENT_ID = 'isolated-test';
  process.env.MS_CLIENT_SECRET = 'isolated-test-not-a-secret';
  let messageBytes = 0;
  globalThis.fetch = async (url, options) => {
    if (String(url).startsWith('https://login.microsoftonline.com/')) return Response.json({ access_token: 'mock-token', expires_in: 3600 });
    assert.match(String(url), /^https:\/\/graph\.microsoft\.com\//);
    messageBytes = Buffer.byteLength(options.body, 'utf8');
    assert.ok(messageBytes <= MAX_GRAPH_MESSAGE_BYTES);
    return new Response(null, { status: 202, headers: { 'request-id': 'mock-boundary' } });
  };
  await sendEmail({
    ...messages[0],
    attachments: messages[0].attachments.map(attachment => attachment.filename === 'TEST-Pipeline-Resume.txt'
      ? { ...attachment, content: Buffer.alloc(MAX_RESUME_BYTES).toString('base64') }
      : attachment),
  });
  assert.ok(messageBytes > MAX_RESUME_BYTES);
  console.log(`Real main-plus-original-forms delivery passed: ${JSON.stringify(pages)}. Five PDFs saved and handed unchanged to mocked HR delivery; applicant confirmation separate; five-PDF package plus 2 MB resume fits Graph (${messageBytes} bytes). No external email.`);
} finally {
  globalThis.fetch = originalFetch;
}
