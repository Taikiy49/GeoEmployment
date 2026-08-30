import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = await mkdtemp(join(tmpdir(), 'geolabs-job-store-test-'));
process.env.APPLICATION_DATA_DIR = directory;
const { createJob, deleteJob, getJob, listJobs, updateJob } = await import(`../server/job-store.js?test=${Date.now()}`);

try {
  const seeded = await listJobs();
  assert.ok(seeded.length >= 4, 'Default job openings should be available on a new server.');
  assert.ok((await listJobs({ publishedOnly: true })).every(job => job.status === 'published'));

  const created = await createJob({ id: 'job-test-shared', title: 'Shared HR Test', department: 'Engineering', status: 'draft' });
  assert.equal((await getJob(created.id)).title, 'Shared HR Test');
  assert.equal((await listJobs({ publishedOnly: true })).some(job => job.id === created.id), false);

  const published = await updateJob(created.id, { status: 'published', office: 'Waipahu, HI' });
  assert.equal(published.status, 'published');
  assert.equal((await listJobs({ filters: { id: created.id }, publishedOnly: true }))[0].office, 'Waipahu, HI');

  assert.equal(await deleteJob(created.id), true);
  assert.equal(await getJob(created.id), null);
  assert.equal(await deleteJob(created.id), false);
  console.log('Shared job store create, read, update, publish, filter, and delete passed.');
} finally {
  await rm(directory, { recursive: true, force: true });
}
