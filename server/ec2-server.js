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

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 3000);
const maxBodyBytes = 20 * 1024 * 1024;
const resumeParseWindows = new Map();
const RESUME_PARSE_WINDOW_MS = 15 * 60 * 1000;
const RESUME_PARSE_LIMIT = 6;
const draftLinkWindows = new Map();
const DRAFT_LINK_WINDOW_MS = 60 * 60 * 1000;
const DRAFT_LINK_LIMIT = 4;

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

async function handleApi(request, response) {
  try {
    request.body = await readJson(request);
  } catch (error) {
    return sendJson(
      response,
      error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400,
      { error: error.message === 'PAYLOAD_TOO_LARGE' ? 'Upload is too large.' : 'Invalid request.' },
    );
  }

  request.body.id ||= randomUUID();
  if (!request.body.firstName || !request.body.lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.body.email || '')) {
    return sendJson(response, 400, { error: 'First name, last name, and a valid email address are required.' });
  }
  try {
    await upsertSubmittedApplication(request.body, 'processing');
  } catch (error) {
    console.error('Application persistence failed:', error);
    return sendJson(response, 500, { error: 'We could not securely save your application. Please try again.' });
  }

  response.status = (statusCode) => {
    response.statusCode = statusCode;
    return response;
  };
  response.json = async (payload) => {
    const statusCode = response.statusCode || 200;
    try {
      if (statusCode < 300 && payload?.ok && request.generatedDocuments?.length) {
        await saveApplicationDocuments(request.body.id, request.generatedDocuments);
      }
      await updateApplication(request.body.id, {
        deliveryStatus: statusCode < 300 && payload?.ok ? 'delivered' : 'delivery_failed',
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

  return submitApplication(request, response);
}

async function handleResumeParseApi(request, response) {
  const now = Date.now();
  const clientAddress = String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
  const previous = resumeParseWindows.get(clientAddress);
  const window = !previous || now - previous.startedAt >= RESUME_PARSE_WINDOW_MS
    ? { startedAt: now, attempts: 0 }
    : previous;
  window.attempts += 1;
  resumeParseWindows.set(clientAddress, window);
  if (window.attempts > RESUME_PARSE_LIMIT) {
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
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(draft.email || '').trim())
  && draft.formData
  && typeof draft.formData === 'object'
);

async function handleDraftApi(request, response) {
  const url = new URL(request.url, 'http://localhost');

  if (request.method === 'GET' && url.pathname === '/api/application-drafts/resume') {
    const token = url.searchParams.get('token') || '';
    const draft = token ? await getDraft(token) : null;
    return draft
      ? sendJson(response, 200, { draft })
      : sendJson(response, 404, { error: 'This private link is invalid or has expired.' });
  }

  if (request.method === 'POST' && url.pathname === '/api/application-drafts/link') {
    const clientAddress = String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown').split(',')[0].trim();
    let body;
    try {
      body = await readJson(request);
    } catch (error) {
      return sendJson(response, error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400, { error: 'The saved application data is invalid.' });
    }
    if (!draftPayloadIsValid(body.draft)) return sendJson(response, 400, { error: 'Enter a valid email address before requesting a link.' });
    const rateKey = `${clientAddress}:${String(body.draft.email).trim().toLowerCase()}`;
    const prior = draftLinkWindows.get(rateKey);
    const window = !prior || Date.now() - prior.startedAt >= DRAFT_LINK_WINDOW_MS ? { startedAt: Date.now(), attempts: 0 } : prior;
    window.attempts += 1;
    draftLinkWindows.set(rateKey, window);
    if (window.attempts > DRAFT_LINK_LIMIT) return sendJson(response, 429, { error: 'Too many link requests. Please wait before trying again.' });

    let created;
    try {
      created = await createDraft(body.draft);
    } catch (error) {
      return sendJson(response, error.message === 'RESUME_TOO_LARGE' ? 413 : 500, {
        error: error.message === 'RESUME_TOO_LARGE' ? 'The résumé is too large to save. Please upload a file smaller than 12 MB.' : 'We could not securely save your application. Please try again.',
      });
    }
    const siteUrl = String(process.env.PUBLIC_SITE_URL || 'https://careers.geolabs.net').replace(/\/$/, '');
    const applicationPath = body.draft.requisitionId
      ? `/apply/${encodeURIComponent(body.draft.requisitionId)}`
      : '/apply';
    const link = `${siteUrl}${applicationPath}?resume=${encodeURIComponent(created.token)}`;
    try {
      await sendContinueApplicationEmail({
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
    if (!draftPayloadIsValid(body.draft)) return sendJson(response, 400, { error: 'Invalid saved application data.' });
    let updated;
    try {
      updated = await updateDraft(token, body.draft);
    } catch (error) {
      return sendJson(response, error.message === 'RESUME_TOO_LARGE' ? 413 : 500, {
        error: error.message === 'RESUME_TOO_LARGE' ? 'The résumé is too large to save. Please upload a file smaller than 12 MB.' : 'We could not update your saved application.',
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
      const application = await updateApplication(applicationId, updates);
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
  if (request.method === 'GET' && id) {
    const job = await getJob(id);
    return job && (admin || job.status === 'published') ? sendJson(response, 200, { job }) : sendJson(response, 404, { error: 'Job opening not found.' });
  }
  if (request.method === 'GET') {
    const jobs = await listJobs({
      filters: parseFilters(url.searchParams.get('filters')),
      sortField: url.searchParams.get('sort') || '-created_date',
      limit: url.searchParams.get('limit') || 200,
      publishedOnly: !admin,
    });
    return sendJson(response, 200, { jobs });
  }
  if (!admin) return sendJson(response, 405, { error: 'Method not allowed.' });
  if (request.method === 'POST' && !id) {
    const job = await readJson(request);
    job.id ||= randomUUID();
    return sendJson(response, 201, { job: await createJob(job) });
  }
  if (request.method === 'PATCH' && id) {
    const job = await updateJob(id, await readJson(request));
    return job ? sendJson(response, 200, { job }) : sendJson(response, 404, { error: 'Job opening not found.' });
  }
  if (request.method === 'DELETE' && id) {
    return (await deleteJob(id)) ? sendJson(response, 200, { ok: true }) : sendJson(response, 404, { error: 'Job opening not found.' });
  }
  return sendJson(response, 405, { error: 'Method not allowed.' });
}

function serveApplication(request, response) {
  const requestPath = new URL(request.url, 'http://localhost').pathname;
  const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const normalizedPath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  let filePath = join(root, normalizedPath);

  if (!existsSync(filePath) || requestPath.endsWith('/')) {
    filePath = join(root, 'index.html');
  }

  const extension = extname(filePath).toLowerCase();
  const fileSize = statSync(filePath).size;
  const baseHeaders = {
    'Content-Type': contentTypes[extension] || 'application/octet-stream',
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
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

const server = http.createServer(async (request, response) => {
  try {
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
    if (request.url?.startsWith('/api/parse-resume')) {
      await handleResumeParseApi(request, response);
      return;
    }
    if (request.url?.startsWith('/api/application-drafts')) {
      await handleDraftApi(request, response);
      return;
    }
    if (request.url?.startsWith('/api/submit-application')) {
      await handleApi(request, response);
      return;
    }
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
    console.error(error);
    if (!response.headersSent) sendJson(response, 500, { error: 'Internal server error.' });
    else response.end();
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Geolabs employment portal listening on 127.0.0.1:${port}`);
});
