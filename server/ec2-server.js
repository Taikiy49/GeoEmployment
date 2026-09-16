import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import parseResume from '../api/parse-resume.js';
import submitApplication from '../api/submit-application.js';
import { sendContinueApplicationEmail } from '../api/send-continue-link.js';
import { getAdminSession, handleAdminAuth } from './admin-auth.js';
import {
  deleteApplication,
  getApplicationDocumentPath,
  getApplication,
  getResumePath,
  listApplications,
  saveApplicationDocuments,
  updateApplication,
  upsertSubmittedApplication,
} from './application-store.js';
import { createJob, deleteJob, getJob, listJobs, updateJob } from './job-store.js';
import { createDraft, deleteDraft, getDraft, updateDraft } from './draft-store.js';
import { normalizeSubmission } from './submission-validation.js';
import { RESUME_SIZE_ERROR } from '../src/lib/resumeLimits.js';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 3000);
const maxBodyBytes = 20 * 1024 * 1024;
const resumeParseWindows = new Map();
const RESUME_PARSE_WINDOW_MS = 15 * 60 * 1000;
const RESUME_PARSE_LIMIT = 6;
const draftLinkWindows = new Map();
const DRAFT_LINK_WINDOW_MS = 60 * 60 * 1000;
const DRAFT_LINK_LIMIT = 4;
const submissionWindows = new Map();
const clientAddress = request => String(request.headers['x-real-ip']
  || String(request.headers['x-forwarded-for'] || '').split(',').at(-1)?.trim()
  || request.socket.remoteAddress || 'unknown');
const rateLimitExceeded = (windows, key, duration, limit) => {
  const now = Date.now();
  for (const [entry, window] of windows) if (now - window.startedAt >= duration) windows.delete(entry);
  if (!windows.has(key) && windows.size >= 10000) return true;
  const window = windows.get(key) || { startedAt: now, attempts: 0 };
  window.attempts += 1;
  windows.set(key, window);
  return window.attempts > limit;
};

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new Error('PAYLOAD_TOO_LARGE');
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw new Error('INVALID_JSON');
  }
}

async function handleApi(request, response, submit, inFlightSubmissions) {
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed.' });
  try {
    request.body = normalizeSubmission(await readJson(request));
  } catch (error) {
    return sendJson(
      response,
      error.message === 'PAYLOAD_TOO_LARGE' ? 413 : error.status || 400,
      { error: error.message === 'PAYLOAD_TOO_LARGE' ? 'Upload is too large.' : error.message },
    );
  }

  const id = request.body.id;
  if (inFlightSubmissions.has(id)) return sendJson(response, 409, { code: 'SUBMISSION_IN_PROGRESS', error: 'This application is already being submitted. Please wait a moment before trying again.' });
  inFlightSubmissions.add(id);
  try {
    const existing = await getApplication(id);
    if (existing) {
      if (existing.submissionFingerprint !== request.body.submissionFingerprint) {
        return sendJson(response, 409, { code: 'APPLICATION_ID_CONFLICT', error: 'An application with this reference is already saved. Please contact employment@geolabs.net if you need to change it.' });
      }
      if (existing.deliveryStatus === 'delivered') return sendJson(response, 200, {
        ok: true, applicationId: id, confirmationSent: Boolean(existing.confirmationSent),
      });
      if (['sending', 'delivery_uncertain'].includes(existing.deliveryStatus)) return sendJson(response, 409, {
        code: 'DELIVERY_REVIEW_REQUIRED', applicationId: id,
        error: 'Your application is saved, but we could not confirm email delivery. Please contact employment@geolabs.net with your application reference instead of submitting another application.',
      });
      // Resume an interrupted delivery without overwriting HR changes or the signed record.
      request.body = { ...existing, resumeAttachment: request.body.resumeAttachment };
    }
    if (rateLimitExceeded(submissionWindows, clientAddress(request), 15 * 60 * 1000, 10)) {
      return sendJson(response, 429, { error: 'Too many submission attempts. Please wait a few minutes before trying again.' });
    }
    try {
      if (!existing) await upsertSubmittedApplication(request.body, 'processing');
      else await updateApplication(id, { deliveryStatus: 'processing' });
    } catch (error) {
      console.error('Application persistence failed:', error);
      return sendJson(response, 500, { error: 'We could not securely save your application. Please try again.' });
    }
    request.saveGeneratedDocuments = documents => saveApplicationDocuments(id, documents);
    request.beforeHrDelivery = () => updateApplication(id, { deliveryStatus: 'sending', deliveryUpdatedAt: new Date().toISOString() });
    request.saveDeliveryReceipt = receipt => updateApplication(id, {
      deliveryStatus: 'delivered', deliveryUpdatedAt: new Date().toISOString(),
      hrMessageId: receipt.id, emailProvider: receipt.provider || 'resend', confirmationSent: false,
    });

    response.status = (statusCode) => {
      response.statusCode = statusCode;
      return response;
    };
    response.json = async (payload) => {
      const statusCode = response.statusCode || 200;
      try {
        await updateApplication(request.body.id, {
          deliveryStatus: payload?.code === 'DELIVERY_REVIEW_REQUIRED' ? 'delivery_uncertain' : statusCode < 300 && payload?.ok ? 'delivered' : 'delivery_failed',
          deliveryUpdatedAt: new Date().toISOString(),
          ...(payload?.hrMessageId ? { hrMessageId: payload.hrMessageId } : {}),
          ...(payload?.emailProvider ? { emailProvider: payload.emailProvider } : {}),
          ...(payload?.confirmationSent !== undefined ? { confirmationSent: payload.confirmationSent } : {}),
        });
      } catch (error) {
        console.error('Application delivery status update failed:', error);
      }
      sendJson(response, statusCode, payload);
      return response;
    };

    return await submit(request, response);
  } finally {
    inFlightSubmissions.delete(id);
  }
}

async function handleResumeParseApi(request, response) {
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed.' });
  if (rateLimitExceeded(resumeParseWindows, clientAddress(request), RESUME_PARSE_WINDOW_MS, RESUME_PARSE_LIMIT)) {
    return sendJson(response, 429, { error: 'Too many resume-analysis attempts. Please wait a few minutes or continue manually.' });
  }
  try {
    request.body = await readJson(request);
  } catch (error) {
    return sendJson(
      response,
      error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400,
      { error: error.message === 'PAYLOAD_TOO_LARGE' ? 'Upload is too large.' : 'Invalid request.' },
    );
  }
  response.status = (statusCode) => {
    response.statusCode = statusCode;
    return response;
  };
  response.json = (payload) => {
    sendJson(response, response.statusCode || 200, payload);
    return response;
  };
  return parseResume(request, response);
}

const bearerToken = request => {
  const match = /^Bearer\s+(.+)$/i.exec(String(request.headers.authorization || ''));
  return match?.[1] || '';
};

const draftPayloadIsValid = draft => (
  draft
  && !Array.isArray(draft)
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(draft.email || '').trim())
  && draft.formData
  && typeof draft.formData === 'object'
  && !Array.isArray(draft.formData)
);

async function handleDraftApi(request, response, sendContinueEmail) {
  const url = new URL(request.url, 'http://localhost');

  if (request.method === 'GET' && url.pathname === '/api/application-drafts/resume') {
    const token = url.searchParams.get('token') || '';
    const draft = token ? await getDraft(token) : null;
    return draft
      ? sendJson(response, 200, { draft })
      : sendJson(response, 404, { error: 'This private link is invalid or has expired.' });
  }

  if (request.method === 'POST' && url.pathname === '/api/application-drafts/link') {
    let body;
    try {
      body = await readJson(request);
    } catch (error) {
      return sendJson(response, error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400, { error: 'The saved application data is invalid.' });
    }
    if (!draftPayloadIsValid(body?.draft)) return sendJson(response, 400, { error: 'Enter a valid email address before requesting a link.' });
    if (rateLimitExceeded(draftLinkWindows, `email:${String(body.draft.email).trim().toLowerCase()}`, DRAFT_LINK_WINDOW_MS, DRAFT_LINK_LIMIT)
      || rateLimitExceeded(draftLinkWindows, `ip:${clientAddress(request)}`, DRAFT_LINK_WINDOW_MS, 12)) {
      return sendJson(response, 429, { error: 'Too many link requests. Please wait before trying again.' });
    }

    let created;
    try {
      created = await createDraft(body.draft);
    } catch (error) {
      return sendJson(response, error.message === 'RESUME_TOO_LARGE' ? 413 : 500, {
        error: error.message === 'RESUME_TOO_LARGE' ? RESUME_SIZE_ERROR : 'We could not securely save your application. Please try again.',
      });
    }
    const siteUrl = String(process.env.PUBLIC_SITE_URL || 'https://careers.geolabs.net').replace(/\/$/, '');
    const applicationPath = body.draft.requisitionId
      ? `/apply/${encodeURIComponent(body.draft.requisitionId)}`
      : '/apply';
    const link = `${siteUrl}${applicationPath}?resume=${encodeURIComponent(created.token)}`;
    try {
      await sendContinueEmail({
        email: String(body.draft.email).trim(),
        firstName: body.draft.formData.firstName,
        position: body.draft.requisitionTitle || body.draft.formData.positionAppliedFor,
        link,
        expiresAt: created.record.expiresAt,
      });
    } catch (error) {
      await deleteDraft(created.token);
      console.error('Continue-link delivery failed:', error);
      return sendJson(response, 502, { error: 'We could not send the private link. Please try again.' });
    }
    if (body.previousToken && body.previousToken !== created.token) await deleteDraft(body.previousToken);
    return sendJson(response, 201, {
      ok: true,
      token: created.token,
      expiresAt: created.record.expiresAt,
      email: String(body.draft.email).trim(),
    });
  }

  if (request.method === 'PUT' && url.pathname === '/api/application-drafts') {
    const token = bearerToken(request);
    if (!token) return sendJson(response, 401, { error: 'A private application token is required.' });
    let body;
    try { body = await readJson(request); } catch { return sendJson(response, 400, { error: 'Invalid saved application data.' }); }
    if (!draftPayloadIsValid(body?.draft)) return sendJson(response, 400, { error: 'Invalid saved application data.' });
    let updated;
    try {
      updated = await updateDraft(token, body.draft);
    } catch (error) {
      return sendJson(response, error.message === 'RESUME_TOO_LARGE' ? 413 : 500, {
        error: error.message === 'RESUME_TOO_LARGE' ? RESUME_SIZE_ERROR : 'We could not update your saved application.',
      });
    }
    return updated
      ? sendJson(response, 200, { ok: true, expiresAt: updated.expiresAt })
      : sendJson(response, 404, { error: 'This private link is invalid or has expired.' });
  }

  if (request.method === 'DELETE' && url.pathname === '/api/application-drafts') {
    const token = bearerToken(request);
    if (!token) return sendJson(response, 401, { error: 'A private application token is required.' });
    await deleteDraft(token);
    return sendJson(response, 200, { ok: true });
  }

  return sendJson(response, 405, { error: 'Method not allowed.' });
}

const parseFilters = value => {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

async function handleAdminApplicationApi(request, response) {
  if (!getAdminSession(request)) {
    sendJson(response, 401, { error: 'Microsoft admin authentication is required.' });
    return;
  }

  const url = new URL(request.url, 'http://localhost');
  const match = /^\/api\/admin\/applications(?:\/([^/]+))?(?:\/(resume)|\/documents\/([^/]+))?$/.exec(url.pathname);
  if (!match) {
    sendJson(response, 404, { error: 'Not found.' });
    return;
  }
  const applicationId = match[1] ? decodeURIComponent(match[1]) : null;
  const resource = match[2];
  const documentKey = match[3] ? decodeURIComponent(match[3]) : null;

  if (request.method === 'GET' && documentKey && applicationId) {
    const application = await getApplication(applicationId);
    const document = application?.documents?.find(item => item.key === documentKey);
    const documentPath = getApplicationDocumentPath(application, documentKey);
    if (!document || !documentPath || !existsSync(documentPath)) {
      sendJson(response, 404, { error: 'Application document not found.' });
      return;
    }
    response.writeHead(200, {
      'Content-Type': document.type || 'application/pdf',
      'Content-Length': statSync(documentPath).size,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.filename || 'application-document.pdf')}`,
      'Cache-Control': 'private, no-store',
    });
    createReadStream(documentPath).pipe(response);
    return;
  }

  if (request.method === 'GET' && resource === 'resume' && applicationId) {
    const application = await getApplication(applicationId);
    const resumePath = getResumePath(application);
    if (!resumePath || !existsSync(resumePath)) {
      sendJson(response, 404, { error: 'Resume not found.' });
      return;
    }
    const size = statSync(resumePath).size;
    response.writeHead(200, {
      'Content-Type': application.resumeContentType || 'application/octet-stream',
      'Content-Length': size,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(application.resumeFileName || 'resume')}`,
      'Cache-Control': 'private, no-store',
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(resumePath).pipe(response);
    return;
  }

  if (request.method === 'GET' && applicationId) {
    const application = await getApplication(applicationId);
    if (!application) sendJson(response, 404, { error: 'Application not found.' });
    else sendJson(response, 200, { application });
    return;
  }

  if (request.method === 'GET') {
    const applications = await listApplications({
      filters: parseFilters(url.searchParams.get('filters')),
      sortField: url.searchParams.get('sort') || '-created_date',
      limit: url.searchParams.get('limit') || 200,
    });
    sendJson(response, 200, { applications });
    return;
  }

  if (request.method === 'POST' && !applicationId) {
    try {
      const application = await readJson(request);
      application.id ||= randomUUID();
      const saved = await upsertSubmittedApplication(application, application.deliveryStatus || 'manual');
      sendJson(response, 201, { application: saved });
    } catch (error) {
      sendJson(response, error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400, { error: 'Invalid application record.' });
    }
    return;
  }

  if (request.method === 'PATCH' && applicationId) {
    try {
      const updates = await readJson(request);
      if (!updates || typeof updates !== 'object' || Array.isArray(updates)) return sendJson(response, 400, { error: 'Invalid update.' });
      const editableFields = new Set(['stage', 'status', 'stageHistory', 'auditTrail', 'recruiterNotes', 'assignedTo', 'rating', 'tags']);
      const application = await updateApplication(applicationId, Object.fromEntries(Object.entries(updates).filter(([key]) => editableFields.has(key))));
      if (!application) sendJson(response, 404, { error: 'Application not found.' });
      else sendJson(response, 200, { application });
    } catch (error) {
      sendJson(response, error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400, { error: 'Invalid update.' });
    }
    return;
  }

  if (request.method === 'DELETE' && applicationId) {
    const deleted = await deleteApplication(applicationId);
    sendJson(response, deleted ? 200 : 404, deleted ? { ok: true } : { error: 'Application not found.' });
    return;
  }

  sendJson(response, 405, { error: 'Method not allowed.' });
}

async function handleJobApi(request, response, admin = false) {
  if (admin && !getAdminSession(request)) return sendJson(response, 401, { error: 'Microsoft admin authentication is required.' });
  const url = new URL(request.url, 'http://localhost');
  const prefix = admin ? '/api/admin/jobs' : '/api/jobs';
  const match = new RegExp(`^${prefix}(?:/([^/]+))?$`).exec(url.pathname);
  if (!match) return sendJson(response, 404, { error: 'Not found.' });
  const id = match[1] ? decodeURIComponent(match[1]) : null;
  const publicJob = job => Object.fromEntries([
    'id', 'externalId', 'title', 'department', 'office', 'employmentType', 'status', 'publishedDate',
    'description', 'requiredQualifications', 'preferredQualifications', 'salaryMin', 'salaryMax',
    'applicationDeadline', 'screeningQuestions', 'created_date', 'updated_date',
  ].filter(key => Object.hasOwn(job, key)).map(key => [key, job[key]]));
  if (request.method === 'GET' && id) {
    const job = await getJob(id);
    return job && (admin || job.status === 'published') ? sendJson(response, 200, { job: admin ? job : publicJob(job) }) : sendJson(response, 404, { error: 'Job opening not found.' });
  }
  if (request.method === 'GET') {
    const jobs = await listJobs({
      filters: parseFilters(url.searchParams.get('filters')),
      sortField: url.searchParams.get('sort') || '-created_date',
      limit: url.searchParams.get('limit') || 200,
      publishedOnly: !admin,
    });
    return sendJson(response, 200, { jobs: admin ? jobs : jobs.map(publicJob) });
  }
  if (!admin) return sendJson(response, 405, { error: 'Method not allowed.' });
  if (request.method === 'POST' && !id) {
    const job = await readJson(request);
    if (!job || typeof job !== 'object' || Array.isArray(job) || typeof job.title !== 'string' || !job.title.trim()) {
      return sendJson(response, 400, { error: 'A job title is required.' });
    }
    job.id ||= randomUUID();
    if (typeof job.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,127}$/i.test(job.id)) return sendJson(response, 400, { error: 'Invalid job reference.' });
    if (await getJob(job.id)) return sendJson(response, 409, { error: 'This job reference already exists.' });
    return sendJson(response, 201, { job: await createJob(job) });
  }
  if (request.method === 'PATCH' && id) {
    const updates = await readJson(request);
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) return sendJson(response, 400, { error: 'Invalid job update.' });
    if (updates.title !== undefined && (typeof updates.title !== 'string' || !updates.title.trim())) return sendJson(response, 400, { error: 'A job title is required.' });
    const job = await updateJob(id, updates);
    return job ? sendJson(response, 200, { job }) : sendJson(response, 404, { error: 'Job opening not found.' });
  }
  if (request.method === 'DELETE' && id) {
    return (await deleteJob(id)) ? sendJson(response, 200, { ok: true }) : sendJson(response, 404, { error: 'Job opening not found.' });
  }
  return sendJson(response, 405, { error: 'Method not allowed.' });
}

function serveApplication(request, response) {
  if (!['GET', 'HEAD'].includes(request.method)) return sendJson(response, 405, { error: 'Method not allowed.' });
  const requestPath = new URL(request.url, 'http://localhost').pathname;
  const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const normalizedPath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  let filePath = join(root, normalizedPath);

  if (!existsSync(filePath) || !statSync(filePath).isFile() || requestPath.endsWith('/')) {
    if (extname(requestPath) || requestPath.startsWith('/assets/')) return sendJson(response, 404, { error: 'File not found.' });
    filePath = join(root, 'index.html');
  }

  const extension = extname(filePath).toLowerCase();
  const fileSize = statSync(filePath).size;
  const baseHeaders = {
    'Content-Type': contentTypes[extension] || 'application/octet-stream',
    'Cache-Control': extension === '.html' ? 'no-cache' : requestPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    'Accept-Ranges': 'bytes',
  };
  const range = request.headers.range;

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const isSuffixRange = match && !match[1] && Boolean(match[2]);
    const suffixLength = isSuffixRange ? Number(match[2]) : 0;
    const start = isSuffixRange
      ? Math.max(fileSize - suffixLength, 0)
      : (match?.[1] ? Number(match[1]) : 0);
    const end = isSuffixRange
      ? fileSize - 1
      : (match?.[2] ? Number(match[2]) : fileSize - 1);

    if (!match || (isSuffixRange && suffixLength === 0) || start > end || start >= fileSize || end >= fileSize) {
      response.writeHead(416, {
        ...baseHeaders,
        'Content-Range': `bytes */${fileSize}`,
      });
      response.end();
      return;
    }

    response.writeHead(206, {
      ...baseHeaders,
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(filePath, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, {
    ...baseHeaders,
    'Content-Length': fileSize,
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(filePath).pipe(response);
}

export function createPortalServer({ submit = submitApplication, sendContinueEmail = sendContinueApplicationEmail } = {}) {
  const inFlightSubmissions = new Set();
  return http.createServer(async (request, response) => {
  try {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/healthz' && ['GET', 'HEAD'].includes(request.method)) {
      return sendJson(response, 200, { ok: true, release: process.env.RELEASE_COMMIT || 'development' });
    }
    if (pathname.startsWith('/api/admin/') && !['GET', 'HEAD'].includes(request.method) && request.headers.origin) {
      let originHost;
      try { originHost = new URL(request.headers.origin).host; } catch { /* Invalid origins are rejected below. */ }
      if (originHost !== request.headers.host) return sendJson(response, 403, { error: 'This admin request must come from the portal.' });
    }
    if (request.url?.startsWith('/auth/')) {
      if (await handleAdminAuth(request, response)) return;
    }
    if (request.url?.startsWith('/api/admin/applications')) {
      await handleAdminApplicationApi(request, response);
      return;
    }
    if (request.url?.startsWith('/api/admin/jobs')) {
      await handleJobApi(request, response, true);
      return;
    }
    if (request.url?.startsWith('/api/jobs')) {
      await handleJobApi(request, response, false);
      return;
    }
    if (pathname === '/api/parse-resume') {
      await handleResumeParseApi(request, response);
      return;
    }
    if (request.url?.startsWith('/api/application-drafts')) {
      await handleDraftApi(request, response, sendContinueEmail);
      return;
    }
    if (pathname === '/api/submit-application') {
      await handleApi(request, response, submit, inFlightSubmissions);
      return;
    }
    if (pathname.startsWith('/api/')) return sendJson(response, 404, { error: 'Not found.' });
    if (new URL(request.url, 'http://localhost').pathname.startsWith('/admin') && !getAdminSession(request)) {
      const returnTo = new URL(request.url, 'http://localhost').pathname;
      response.writeHead(302, {
        Location: `/auth/login?returnTo=${encodeURIComponent(returnTo)}`,
        'Cache-Control': 'no-store',
      });
      response.end();
      return;
    }
    serveApplication(request, response);
  } catch (error) {
    if (error.code === 'DUPLICATE_JOB') return sendJson(response, 409, { error: 'This job reference already exists.' });
    if (error instanceof URIError || ['INVALID_JSON', 'PAYLOAD_TOO_LARGE'].includes(error.message)) {
      return sendJson(response, error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400, { error: error.message === 'PAYLOAD_TOO_LARGE' ? 'Upload is too large.' : 'Invalid request.' });
    }
    console.error(error);
    if (!response.headersSent) sendJson(response, 500, { error: 'Internal server error.' });
    else response.end();
  }
});
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const server = createPortalServer().listen(port, '127.0.0.1', () => {
    console.log(`Geolabs employment portal listening on 127.0.0.1:${port}`);
  });
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    // Finish in-flight document/email work during a planned service restart.
    server.close(() => process.exit(0));
    setTimeout(() => {
      server.closeAllConnections();
      process.exit(1);
    }, 350_000).unref();
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
