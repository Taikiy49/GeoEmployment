import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.APPLICATION_DATA_DIR = await mkdtemp(join(tmpdir(), 'geolabs-secure-drafts-'));
const { createDraft, deleteDraft, getDraft, updateDraft } = await import('../server/draft-store.js');

const created = await createDraft({
  email: 'secure-draft@example.com',
  formData: { firstName: 'Secure', lastName: 'Draft', email: 'secure-draft@example.com' },
  currentStep: 2,
  completedSteps: [0, 1],
  activeTasks: { 2: 1 },
  resumeAttachment: {
    filename: 'resume.txt',
    type: 'text/plain',
    content: Buffer.from('secure resume').toString('base64'),
  },
});

assert.ok(created.token.length >= 40, 'Draft tokens must have high entropy.');
const rawStore = await readFile(join(process.env.APPLICATION_DATA_DIR, 'application-drafts.json'), 'utf8');
assert.doesNotMatch(rawStore, new RegExp(created.token), 'Plain draft tokens must never be persisted.');

const restored = await getDraft(created.token);
assert.equal(restored.formData.firstName, 'Secure');
assert.equal(Buffer.from(restored.resumeAttachment.content, 'base64').toString(), 'secure resume');

await updateDraft(created.token, {
  email: 'secure-draft@example.com',
  formData: { ...restored.formData, city: 'Waipahu' },
  currentStep: 3,
  completedSteps: [0, 1, 2],
  activeTasks: {},
});
assert.equal((await getDraft(created.token)).formData.city, 'Waipahu');

const file = join(process.env.APPLICATION_DATA_DIR, 'application-drafts.json');
const records = JSON.parse(await readFile(file, 'utf8'));
records[0].expiresAt = new Date(Date.now() - 1000).toISOString();
await writeFile(file, JSON.stringify(records), { mode: 0o600 });
assert.equal(await getDraft(created.token), null, 'Expired drafts must not be restorable.');

const removable = await createDraft({ email: 'delete@example.com', formData: { email: 'delete@example.com' } });
assert.equal(await deleteDraft(removable.token), true);
assert.equal(await getDraft(removable.token), null);
console.log('Secure draft hashing, resume persistence, updates, expiration, and deletion passed.');
