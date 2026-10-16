import http from 'http';
import { createServer } from '../src/server.mjs';
import { resetRateLimitStore } from '../src/http.mjs';
import { JPEG_1x1_BASE64, PNG_1x1_BASE64, sampleAnalysis, sampleFinding } from './helpers.mjs';
import { EVIDENCE_STATUSES } from '../src/config.mjs';

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function request(port, { method = 'GET', path = '/', body, headers = {} }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {
            json = null;
          }
          resolve({ status: res.statusCode, json, text, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function mockAnalyzerFactory(impl) {
  return async (input) => impl(input);
}

async function run() {
  let passed = 0;
  let failed = 0;
  const assert = (condition, name) => {
    if (condition) {
      console.log(`✅ [PASS] [MOCKED API] ${name}`);
      passed += 1;
    } else {
      console.error(`❌ [FAIL] [MOCKED API] ${name}`);
      failed += 1;
    }
  };

  resetRateLimitStore();
  const server = createServer({
    allowMissingKey: true,
    analyzer: mockAnalyzerFactory(async (input) => ({
      model: 'mock-gemma',
      method: 'mock',
      analysis: sampleAnalysis({
        findings: input.claims.map((claim, i) =>
          sampleFinding(EVIDENCE_STATUSES[i % EVIDENCE_STATUSES.length])
        ).map((finding, i) => ({ ...finding, claim: input.claims[i] }))
      })
    }))
  });

  const port = await listen(server);
  const post = (payload) =>
    request(port, {
      method: 'POST',
      path: '/api/analyze',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

  const health = await request(port, { path: '/health' });
  assert(health.status === 200 && health.json.ok === true, 'GET /health');

  const ready = await request(port, { path: '/api/ready' });
  assert(ready.status === 200 && typeof ready.json.configured === 'boolean', 'GET /api/ready');
  assert(ready.headers['x-content-type-options'] === 'nosniff', 'Security headers present');

  const method = await request(port, { method: 'GET', path: '/api/analyze' });
  assert(method.status === 405, 'GET /api/analyze is rejected');

  const malformed = await request(port, {
    method: 'POST',
    path: '/api/analyze',
    headers: { 'Content-Type': 'application/json' },
    body: '{not-json'
  });
  assert(malformed.status === 400, 'Malformed JSON is rejected');

  const empty = await post({});
  assert(empty.status === 400, 'Empty body is rejected');

  const noClaims = await post({
    issueType: 'road_damage',
    description: 'A cavity is visible in the travel lane near the curb.',
    claims: [],
    images: [{ mimeType: 'image/png', data: PNG_1x1_BASE64 }]
  });
  assert(noClaims.status === 400, 'Empty claims return 400');

  const badMime = await post({
    issueType: 'road_damage',
    description: 'A cavity is visible in the travel lane near the curb.',
    claims: ['There is a pothole'],
    images: [{ mimeType: 'image/gif', data: PNG_1x1_BASE64 }]
  });
  assert(badMime.status === 400, 'GIF upload is rejected');

  const ok = await post({
    issueType: 'road_damage',
    description: 'A cavity is visible in the travel lane near the curb.',
    claims: EVIDENCE_STATUSES.map((s) => `Claim for ${s}`),
    images: [{ mimeType: 'image/jpeg', data: JPEG_1x1_BASE64 }]
  });
  assert(ok.status === 200 && ok.json.ok === true, 'Valid mocked analysis succeeds');
  assert(ok.json.method === 'mock', 'Mocked analyzer is labeled in the response method field');
  assert(ok.json.analysis.findings.length === EVIDENCE_STATUSES.length, 'Each claim received a finding');

  const home = await request(port, { path: '/' });
  assert(home.status === 200 && home.text.includes('VerityRoad'), 'Frontend index is served');

  server.close();

  const timeoutServer = createServer({
    allowMissingKey: true,
    analyzer: async () => {
      const err = new Error('timeout');
      err.public = { status: 504, error: 'The analysis timed out. Retry with a smaller image or fewer claims.' };
      throw err;
    }
  });
  const timeoutPort = await listen(timeoutServer);
  const timeoutRes = await request(timeoutPort, {
    method: 'POST',
    path: '/api/analyze',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      issueType: 'garbage',
      description: 'Waste bags stacked against a fence beside the sidewalk.',
      claims: ['Garbage bags are piled against the fence'],
      images: [{ mimeType: 'image/png', data: PNG_1x1_BASE64 }]
    })
  });
  assert(timeoutRes.status === 504, 'Timeout is mapped to 504');
  timeoutServer.close();

  const malformedModelServer = createServer({
    allowMissingKey: true,
    analyzer: async () => {
      const err = new Error('malformed model response');
      err.public = { status: 502, error: 'The model returned an incomplete result. Retry the analysis.' };
      throw err;
    }
  });
  const malformedPort = await listen(malformedModelServer);
  const malformedRes = await request(malformedPort, {
    method: 'POST',
    path: '/api/analyze',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      issueType: 'road_damage',
      description: 'A cavity is visible in the travel lane near the curb.',
      claims: ['There is a pothole'],
      images: [{ mimeType: 'image/png', data: PNG_1x1_BASE64 }]
    })
  });
  assert(malformedRes.status === 502, 'Malformed model output is mapped to 502');
  malformedModelServer.close();

  process.env.GEMINI_API_KEY = '';
  process.env.GOOGLE_API_KEY = '';
  const missingKeyServer = createServer();
  const missingPort = await listen(missingKeyServer);
  const missingRes = await request(missingPort, {
    method: 'POST',
    path: '/api/analyze',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      issueType: 'road_damage',
      description: 'A cavity is visible in the travel lane near the curb.',
      claims: ['There is a pothole'],
      images: [{ mimeType: 'image/png', data: PNG_1x1_BASE64 }]
    })
  });
  assert(missingRes.status === 503, 'Missing API key returns 503');
  missingKeyServer.close();

  console.log(`\nAPI tests (mocked except missing-key path): ${passed} passed, ${failed} failed.`);
  if (failed) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
