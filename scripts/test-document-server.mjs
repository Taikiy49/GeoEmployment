import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

// Vite's static headers are not the production server's headers. Exercise the
// built app on its real server so module workers cannot silently break on ship.
const directory = await mkdtemp(join(tmpdir(), 'geolabs-document-server-'));
process.env.APPLICATION_DATA_DIR = directory;
const { createPortalServer } = await import('../server/ec2-server.js');
let forbiddenCalls = 0;
const rejectExternalAction = async () => {
  forbiddenCalls += 1;
  throw new Error('Document-server verification must not submit applications or send mail.');
};
const server = createPortalServer({ submit: rejectExternalAction, sendContinueEmail: rejectExternalAction });
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const name of ['application-agreements', 'alcohol-drug-agreement', 'eeo-survey', 'veteran-status']) {
    const response = await fetch(`${base}/forms/lola-v1/${name}.pdf`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/pdf');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 4).toString(), '%PDF');
    const transcript = await fetch(`${base}/forms/lola-v1/${name}.json`);
    assert.equal(transcript.status, 200);
    assert.match(transcript.headers.get('content-type'), /application\/json/);
    assert.ok(await transcript.json());
  }
  const workers = (await readdir(new URL('../dist/assets/', import.meta.url)))
    .filter(name => /^pdf\.worker.*\.mjs$/.test(name));
  assert.ok(workers.length > 0, 'The production build must include the PDF module worker.');
  for (const worker of workers) {
    const response = await fetch(`${base}/assets/${worker}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^(text|application)\/javascript/);
    assert.ok((await response.text()).length > 1000);
  }
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/test-document-editor.mjs'], {
      env: { ...process.env, TEST_BASE_URL: base }, stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Production document browser test exited ${code}.`)));
  });
  assert.equal(forbiddenCalls, 0);
  console.log('Original PDF links, transcripts, module worker MIME and desktop/mobile editing passed on the actual Node server. No mail or production storage used.');
} finally {
  if (server.listening) await new Promise(resolve => server.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
