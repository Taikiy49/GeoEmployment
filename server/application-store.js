import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dataDirectory = process.env.APPLICATION_DATA_DIR || '/var/lib/geolabs-employment-portal';
const applicationsFile = join(dataDirectory, 'applications.json');
const resumesDirectory = join(dataDirectory, 'resumes');
const documentsDirectory = join(dataDirectory, 'application-documents');
let writeQueue = Promise.resolve();

const ensureStorage = async () => {
  await mkdir(resumesDirectory, { recursive: true, mode: 0o700 });
  await mkdir(documentsDirectory, { recursive: true, mode: 0o700 });
};

const readApplications = async () => {
  await ensureStorage();
  try {
    const parsed = JSON.parse(await readFile(applicationsFile, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
};

const writeApplications = async applications => {
  await ensureStorage();
  const temporaryFile = `${applicationsFile}.${process.pid}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(applications, null, 2), { mode: 0o600 });
  await rename(temporaryFile, applicationsFile);
};

const withWriteLock = operation => {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.catch(() => {});
  return next;
};

const safeFilename = value => String(value || 'resume')
  .replace(/[^a-z0-9._-]+/gi, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 140) || 'resume';

const saveResume = async (applicationId, attachment) => {
  if (!attachment?.content || !attachment?.filename) return null;
  const filename = `${safeFilename(applicationId)}-${safeFilename(attachment.filename)}`;
  const filePath = join(resumesDirectory, filename);
  await writeFile(filePath, Buffer.from(attachment.content, 'base64'), { mode: 0o600 });
  return {
    filename: attachment.filename,
    storedFilename: filename,
    type: attachment.type || 'application/octet-stream',
  };
};

export async function upsertSubmittedApplication(application, deliveryStatus = 'processing') {
  return withWriteLock(async () => {
    const applications = await readApplications();
    const existingIndex = applications.findIndex(item => item.id === application.id);
    const existing = existingIndex >= 0 ? applications[existingIndex] : null;
    const now = new Date().toISOString();
    const resume = await saveResume(application.id, application.resumeAttachment);
    const { resumeAttachment: _resumeAttachment, ...applicationWithoutAttachment } = application;
    const next = {
      ...(existing || {}),
      ...applicationWithoutAttachment,
      id: application.id,
      isDraft: false,
      created_date: existing?.created_date || application.created_date || now,
      updated_date: now,
      deliveryStatus,
      ...(resume ? {
        resumeFileName: resume.filename,
        resumeContentType: resume.type,
        resumeStoredFilename: resume.storedFilename,
        resumeFileUrl: `/api/admin/applications/${encodeURIComponent(application.id)}/resume`,
      } : {}),
    };

    if (existingIndex >= 0) applications[existingIndex] = next;
    else applications.push(next);
    await writeApplications(applications);
    return next;
  });
}

export async function updateApplication(id, updates) {
  return withWriteLock(async () => {
    const applications = await readApplications();
    const index = applications.findIndex(item => item.id === id);
    if (index < 0) return null;
    const { id: _ignoredId, created_date: _ignoredCreated, resumeStoredFilename: _ignoredResume, ...safeUpdates } = updates;
    applications[index] = {
      ...applications[index],
      ...safeUpdates,
      id,
      updated_date: new Date().toISOString(),
    };
    await writeApplications(applications);
    return applications[index];
  });
}

export async function saveApplicationDocuments(applicationId, documents) {
  return withWriteLock(async () => {
    const applications = await readApplications();
    const index = applications.findIndex(item => item.id === applicationId);
    if (index < 0) return null;
    const metadata = [];
    for (const document of documents || []) {
      if (!document?.key || !document?.content) continue;
      const storedFilename = `${safeFilename(applicationId)}-${safeFilename(document.key)}.pdf`;
      await writeFile(join(documentsDirectory, storedFilename), Buffer.from(document.content, 'base64'), { mode: 0o600 });
      metadata.push({
        key: document.key,
        label: document.label,
        filename: document.filename,
        type: document.type || 'application/pdf',
        restricted: Boolean(document.restricted),
        storedFilename,
        url: `/api/admin/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(document.key)}`,
      });
    }
    applications[index] = { ...applications[index], documents: metadata, updated_date: new Date().toISOString() };
    await writeApplications(applications);
    return applications[index];
  });
}

export async function deleteApplication(id) {
  return withWriteLock(async () => {
    const applications = await readApplications();
    const existing = applications.find(item => item.id === id);
    const next = applications.filter(item => item.id !== id);
    if (next.length === applications.length) return false;
    await writeApplications(next);
    if (existing?.resumeStoredFilename) {
      await unlink(join(resumesDirectory, existing.resumeStoredFilename)).catch(error => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
    for (const document of existing?.documents || []) {
      if (!document.storedFilename) continue;
      await unlink(join(documentsDirectory, document.storedFilename)).catch(error => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
    return true;
  });
}

const matches = (application, filters) => Object.entries(filters || {}).every(([key, expected]) => {
  if (expected === undefined || expected === null) return true;
  return application[key] === expected;
});

export async function listApplications({ filters = {}, sortField = '-created_date', limit = 200 } = {}) {
  const applications = (await readApplications()).filter(application => matches(application, filters));
  const descending = String(sortField || '').startsWith('-');
  const field = String(sortField || 'created_date').replace(/^-/, '');
  applications.sort((left, right) => {
    const comparison = String(left[field] || '').localeCompare(String(right[field] || ''));
    return descending ? -comparison : comparison;
  });
  return applications.slice(0, Math.min(Math.max(Number(limit) || 200, 1), 1000));
}

export async function getApplication(id) {
  return (await readApplications()).find(application => application.id === id) || null;
}

export function getResumePath(application) {
  return application?.resumeStoredFilename
    ? join(resumesDirectory, application.resumeStoredFilename)
    : null;
}

export function getApplicationDocumentPath(application, key) {
  const document = application?.documents?.find(item => item.key === key);
  return document?.storedFilename ? join(documentsDirectory, document.storedFilename) : null;
}
