import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { seedJobs } from '../src/lib/appData.js';

const dataDirectory = process.env.APPLICATION_DATA_DIR || '/var/lib/geolabs-employment-portal';
const jobsFile = join(dataDirectory, 'job-requisitions.json');
let writeQueue = Promise.resolve();

const ensureStorage = () => mkdir(dataDirectory, { recursive: true, mode: 0o700 });
const readJobs = async () => {
  await ensureStorage();
  try {
    const parsed = JSON.parse(await readFile(jobsFile, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const initial = seedJobs();
    await writeJobs(initial);
    return initial;
  }
};
const writeJobs = async jobs => {
  await ensureStorage();
  const temporaryFile = `${jobsFile}.${process.pid}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(jobs, null, 2), { mode: 0o600 });
  await rename(temporaryFile, jobsFile);
};
const withWriteLock = operation => {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.catch(() => {});
  return next;
};
const sortJobs = (jobs, sortField = '-created_date') => {
  const descending = String(sortField).startsWith('-');
  const field = String(sortField).replace(/^-/, '');
  return [...jobs].sort((left, right) => {
    const comparison = String(left[field] || '').localeCompare(String(right[field] || ''));
    return descending ? -comparison : comparison;
  });
};
const matches = (job, filters = {}) => Object.entries(filters).every(([key, expected]) => expected == null || job[key] === expected);

export async function listJobs({ filters = {}, sortField = '-created_date', limit = 200, publishedOnly = false } = {}) {
  const jobs = (await readJobs()).filter(job => (!publishedOnly || job.status === 'published') && matches(job, filters));
  return sortJobs(jobs, sortField).slice(0, Math.min(Math.max(Number(limit) || 200, 1), 1000));
}
export async function getJob(id) {
  return (await readJobs()).find(job => job.id === id) || null;
}
export async function createJob(job) {
  return withWriteLock(async () => {
    const jobs = await readJobs();
    const now = new Date().toISOString();
    const next = { ...job, id: job.id, created_date: job.created_date || now, updated_date: now };
    jobs.push(next);
    await writeJobs(jobs);
    return next;
  });
}
export async function updateJob(id, updates) {
  return withWriteLock(async () => {
    const jobs = await readJobs();
    const index = jobs.findIndex(job => job.id === id);
    if (index < 0) return null;
    const { id: _id, created_date: _created, ...safeUpdates } = updates;
    jobs[index] = { ...jobs[index], ...safeUpdates, id, updated_date: new Date().toISOString() };
    await writeJobs(jobs);
    return jobs[index];
  });
}
export async function deleteJob(id) {
  return withWriteLock(async () => {
    const jobs = await readJobs();
    const next = jobs.filter(job => job.id !== id);
    if (next.length === jobs.length) return false;
    await writeJobs(next);
    return true;
  });
}
