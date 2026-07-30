import http from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import submitApplication from '../api/submit-application.js';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 3000);
const maxBodyBytes = 5 * 1024 * 1024;

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

  response.status = (statusCode) => {
    response.statusCode = statusCode;
    return response;
  };
  response.json = (payload) => {
    sendJson(response, response.statusCode || 200, payload);
    return response;
  };

  return submitApplication(request, response);
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
  response.writeHead(200, {
    'Content-Type': contentTypes[extension] || 'application/octet-stream',
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.url?.startsWith('/api/submit-application')) {
      await handleApi(request, response);
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
