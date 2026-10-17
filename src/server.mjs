import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { getApiKey, getModel, getPort, MAX_JSON_BODY_BYTES } from './config.mjs';
import { analyzeEvidence } from './gemma.mjs';
import {
  applyCors,
  checkRateLimit,
  clientIp,
  readJsonBody,
  securityHeaders,
  sendJson
} from './http.mjs';
import { validateAnalyzeRequest } from './validation.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8'
};

function safePublicPath(urlPath) {
  const clean = decodeURIComponent((urlPath || '/').split('?')[0]);
  const relative = clean === '/' ? '/index.html' : clean;
  const resolved = path.resolve(PUBLIC_DIR, `.${relative}`);
  if (!resolved.startsWith(PUBLIC_DIR)) return null;
  return resolved;
}

function serveStatic(req, res) {
  const filePath = safePublicPath(req.url);
  if (!filePath) {
    sendJson(res, 400, { error: 'Invalid path.' });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const tryPaths = fs.existsSync(filePath)
    ? [filePath]
    : [path.join(PUBLIC_DIR, 'index.html')];

  const chosen = tryPaths.find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!chosen) {
    sendJson(res, 404, { error: 'Not found.' });
    return;
  }

  const type = MIME[path.extname(chosen).toLowerCase()] || MIME[ext] || 'application/octet-stream';
  const body = fs.readFileSync(chosen);
  const headers = {
    ...securityHeaders(),
    'Content-Type': type,
    'Content-Length': body.length,
    'Cache-Control': chosen.endsWith('index.html') ? 'no-store' : 'public, max-age=3600'
  };
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.writeHead(200);
  res.end(body);
}

export function createServer(options = {}) {
  const analyzer = options.analyzer || analyzeEvidence;

  return http.createServer(async (req, res) => {
    applyCors(req, res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, securityHeaders());
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    try {
      if (url.pathname === '/health') {
        sendJson(res, 200, { ok: true });
        return;
      }

      if (url.pathname === '/api/ready' && req.method === 'GET') {
        sendJson(res, 200, {
          configured: Boolean(getApiKey()),
          model: getModel(),
          imageRetention: 'Images are held in memory for one analysis request and are not written to disk.'
        });
        return;
      }

      if (url.pathname === '/api/analyze') {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Use POST for /api/analyze.' });
          return;
        }

        const limit = checkRateLimit(clientIp(req));
        if (!limit.allowed) {
          sendJson(res, 429, { error: 'Too many analysis requests. Wait a few minutes and try again.' });
          return;
        }

        let body;
        try {
          body = await readJsonBody(req, MAX_JSON_BODY_BYTES);
        } catch (err) {
          if (err.code === 'PAYLOAD_TOO_LARGE') {
            sendJson(res, 413, { error: 'Request is too large. Use a smaller image.' });
            return;
          }
          sendJson(res, 400, { error: 'Request body must be valid JSON.' });
          return;
        }

        const validated = validateAnalyzeRequest(body);
        if (validated.error) {
          sendJson(res, 400, { error: validated.error });
          return;
        }

        if (!getApiKey() && !options.allowMissingKey) {
          sendJson(res, 503, {
            error: 'The analysis service is not configured. Set GEMINI_API_KEY on the server.'
          });
          return;
        }

        const result = await analyzer(validated.value);
        sendJson(res, 200, {
          ok: true,
          model: result.model,
          method: result.method,
          analysis: result.analysis
        });
        return;
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendJson(res, 405, { error: 'Method not allowed.' });
        return;
      }

      serveStatic(req, res);
    } catch (err) {
      const pub = err.public || {
        status: 500,
        error: 'Something went wrong while analyzing. Retry the request.'
      };
      sendJson(res, pub.status || 500, { error: pub.error });
    }
  });
}

export function startServer() {
  const server = createServer();
  const port = getPort();
  server.listen(port, '0.0.0.0', () => {
    console.log(`VerityRoad listening on port ${port}`);
  });
  return server;
}

const isDirect =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirect) {
  startServer();
}
