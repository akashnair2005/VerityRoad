import { extractJsonFromText, validateAnalysisPayload } from '../src/schema.mjs';
import { validateAnalyzeRequest, detectImageMime, decodeImagePayload } from '../src/validation.mjs';
import { EVIDENCE_STATUSES } from '../src/config.mjs';
import { JPEG_1x1_BASE64, PNG_1x1_BASE64, sampleAnalysis, sampleFinding } from './helpers.mjs';

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`✅ [PASS] ${name}`);
    passed += 1;
  } else {
    console.error(`❌ [FAIL] ${name}`);
    failed += 1;
  }
}

const valid = sampleAnalysis();
assert(validateAnalysisPayload(valid).valid === true, 'Complete analysis payload validates');

const missingDraft = { ...valid };
delete missingDraft.complaint_draft;
assert(validateAnalysisPayload(missingDraft).valid === false, 'Missing complaint_draft is rejected');

const badStatus = sampleAnalysis({
  findings: [sampleFinding('definitely_true')]
});
assert(validateAnalysisPayload(badStatus).valid === false, 'Unknown finding status is rejected');

for (const status of EVIDENCE_STATUSES) {
  const res = validateAnalysisPayload(sampleAnalysis({ findings: [sampleFinding(status)] }));
  assert(res.valid === true, `Status ${status} is accepted`);
}

assert(extractJsonFromText('```json\n{"observations":[]}\n```').observations.length === 0, 'JSON fenced block parses');
assert(extractJsonFromText('not json') === null, 'Non-JSON returns null');

const pngBuf = Buffer.from(PNG_1x1_BASE64, 'base64');
const jpgBuf = Buffer.from(JPEG_1x1_BASE64, 'base64');
assert(detectImageMime(pngBuf) === 'image/png', 'PNG magic bytes detected');
assert(detectImageMime(jpgBuf) === 'image/jpeg', 'JPEG magic bytes detected');
assert(detectImageMime(Buffer.from('hello')) === null, 'Non-image bytes rejected');

const mismatch = decodeImagePayload({ mimeType: 'image/png', data: JPEG_1x1_BASE64 });
assert(Boolean(mismatch.error), 'MIME mismatch is rejected');

const emptyReq = validateAnalyzeRequest({});
assert(Boolean(emptyReq.error), 'Empty analyze request is rejected');

const noClaims = validateAnalyzeRequest({
  issueType: 'road_damage',
  description: 'Pothole near the curb on a residential street.',
  claims: [],
  images: [{ mimeType: 'image/png', data: PNG_1x1_BASE64 }]
});
assert(noClaims.error && noClaims.error.toLowerCase().includes('claim'), 'Empty claims are rejected');

const badType = validateAnalyzeRequest({
  issueType: 'road_damage',
  description: 'Pothole near the curb on a residential street.',
  claims: ['There is a pothole in the lane'],
  images: [{ mimeType: 'application/pdf', data: PNG_1x1_BASE64 }]
});
assert(Boolean(badType.error), 'Non-image MIME is rejected');

const good = validateAnalyzeRequest({
  issueType: 'garbage',
  description: 'Bags piled against a fence beside the sidewalk.',
  claims: ['There are garbage bags piled against the fence'],
  images: [{ mimeType: 'image/png', data: PNG_1x1_BASE64 }]
});
assert(!good.error && good.value.images.length === 1, 'Valid garbage report is accepted');

const huge = 'a'.repeat(7 * 1024 * 1024);
const oversized = validateAnalyzeRequest({
  issueType: 'road_damage',
  description: 'Pothole near the curb on a residential street.',
  claims: ['There is a pothole in the lane'],
  images: [{ mimeType: 'image/png', data: Buffer.from(huge).toString('base64') }]
});
assert(Boolean(oversized.error), 'Oversized image payload is rejected');

console.log(`\nProduct schema/validation: ${passed} passed, ${failed} failed.`);
if (failed) process.exit(1);
