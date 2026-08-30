import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dataDirectory = process.env.APPLICATION_DATA_DIR || '/var/lib/geolabs-employment-portal';
const draftsFile = join(dataDirectory, 'application-drafts.json');
const resumesDirectory = join(dataDirectory, 'draft-resumes');
const ttlMs = Number(process.env.APPLICATION_DRAFT_TTL_DAYS || 30) * 24 * 60 * 60 * 1000;
let writeQueue = Promise.resolve();

const hashToken = token => createHash('sha256').update(String(token || '')).digest('hex');
const safeFilename = value => String(value || 'resume')
  .replace(/[^a-z0-9._-]+/gi, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 120) || 'resume';

const ensureStorage = async () => {
  await mkdir(resumesDirectory, { recursive: true, mode: 0o700 });
};

const readDrafts = async () => {
  await ensureStorage();
  try {
    const parsed = JSON.parse(await readFile(draftsFile, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
};

const writeDrafts = async drafts => {
  await ensureStorage();
  const temporaryFile = `${draftsFile}.${process.pid}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(drafts, null, 2), { mode: 0o600 });
  await rename(temporaryFile, draftsFile);
};

const withWriteLock = operation => {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.catch(() => {});
  return next;
};

const removeResume = record => record?.resumeStoredFilename
  ? unlink(join(resumesDirectory, record.resumeStoredFilename)).catch(error => {
    if (error.code !== 'ENOENT') throw error;
  })
  : Promise.resolve();

const saveResume = async (draftId, attachment, existing) => {
  if (!attachment?.content || !attachment?.filename) return existing || null;
  if (Buffer.byteLength(attachment.content, 'base64') > 12 * 1024 * 1024) {
    throw new Error('RESUME_TOO_LARGE');
  }
  if (existing?.storedFilename) await removeResume({ resumeStoredFilename: existing.storedFilename });
  const storedFilename = `${safeFilename(draftId)}-${safeFilename(attachment.filename)}`;
  await writeFile(join(resumesDirectory, storedFilename), Buffer.from(attachment.content, 'base64'), { mode: 0o600 });
  return {
    filename: attachment.filename,
    type: attachment.type || 'application/octet-stream',
    storedFilename,
  };
};

const activeDrafts = drafts => drafts.filter(record => new Date(record.expiresAt).getTime() > Date.now());

export async function createDraft(payload) {
  return withWriteLock(async () => {
    const drafts = activeDrafts(await readDrafts());
    const token = randomBytes(32).toString('base64url');
    const now = new Date().toISOString();
    const id = randomUUID();
    const resume = await saveResume(id, payload.resumeAttachment, null);
    const { resumeAttachment: _attachment, ...draftPayload } = payload;
    const record = {
      id,
      tokenHash: hashToken(token),
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
      payload: draftPayload,
      resume,
    };
    drafts.push(record);
    await writeDrafts(drafts);
    return { token, record };
  });
}
export async function getDraft(token, { includeResume = true } = {}) {
  const tokenHash = hashToken(token);
  const record = activeDrafts(await readDrafts()).find(item => item.tokenHash === tokenHash);
  if (!record) return null;
  let resumeAttachment = null;
  if (includeResume && record.resume?.storedFilename) {
    try {
      resumeAttachment = {
        filename: record.resume.filename,
        type: record.resume.type,
        content: (await readFile(join(resumesDirectory, record.resume.storedFilename))).toString('base64'),
      };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return { ...record.payload, expiresAt: record.expiresAt, resumeAttachment };
}

export async function updateDraft(token, payload) {
  return withWriteLock(async () => {
    const drafts = activeDrafts(await readDrafts());
    const index = drafts.findIndex(item => item.tokenHash === hashToken(token));
    if (index < 0) return null;
    const existing = drafts[index];
    const resume = await saveResume(existing.id, payload.resumeAttachment, existing.resume);
    const { resumeAttachment: _attachment, ...draftPayload } = payload;
    drafts[index] = {
      ...existing,
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
      payload: draftPayload,
      resume,
    };
    await writeDrafts(drafts);
    return drafts[index];
  });
}

export async function deleteDraft(token) {
  return withWriteLock(async () => {
    const drafts = await readDrafts();
    const index = drafts.findIndex(item => item.tokenHash === hashToken(token));
    if (index < 0) return false;
    const [removed] = drafts.splice(index, 1);
    await writeDrafts(drafts);
    await removeResume({ resumeStoredFilename: removed.resume?.storedFilename });
    return true;
  });
}
