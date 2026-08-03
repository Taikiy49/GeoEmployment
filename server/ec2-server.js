import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import parseResume from '../api/parse-resume.js';
import submitApplication from '../api/submit-application.js';
import { getAdminSession, handleAdminAuth } from './admin-auth.js';
import {
  deleteApplication,
  getApplication,
  getResumePath,
  listApplications,
  updateApplication,
  upsertSubmittedApplication,
} from './application-store.js';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 3000);
const maxBodyBytes = 20 * 1024 * 1024;
const resumeParseWindows = new Map();
const RESUME_PARSE_WINDOW_MS = 15 * 60 * 1000;
const RESUME_PARSE_LIMIT = 6;

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
  const match = /^\/api\/admin\/applications(?:\/([^/]+))?(?:\/(resume))?$/.exec(url.pathname);
  if (!match) {
    sendJson(response, 404, { error: 'Not found.' });
    return;
  }
  const applicationId = match[1] ? decodeURIComponent(match[1]) : null;
  const resource = match[2];

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
    if (request.url?.startsWith('/api/parse-resume')) {
      await handleResumeParseApi(request, response);
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
