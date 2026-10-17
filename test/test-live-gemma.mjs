/**
 * Live Gemma integration check.
 * Skips unless GEMINI_API_KEY is set.
 * Uses the repository's legitimate pothole photograph so the check does not
 * depend on a mutable external fixture URL.
 */
import 'dotenv/config';
import { readFile } from 'fs/promises';
import path from 'path';
import { getApiKey, getModel } from '../src/config.mjs';
import { analyzeEvidence } from '../src/gemma.mjs';
import { detectImageMime } from '../src/validation.mjs';

const LOCAL_POTHOLE_PATH = path.resolve('pothole.jpg');

async function loadRoadImage() {
  const buffer = await readFile(LOCAL_POTHOLE_PATH);
  const mime = detectImageMime(buffer);
  if (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/webp') {
    throw new Error('Local pothole fixture is not a supported image');
  }
  return { mimeType: mime, buffer, base64: buffer.toString('base64') };
}

async function main() {
  const key = getApiKey();
  if (!key) {
    console.log('SKIP: GEMINI_API_KEY is not configured. Live Gemma test was not run.');
    process.exit(0);
  }

  console.log(`Live test model: ${getModel()}`);
  const image = await loadRoadImage();
  console.log(`Using local pothole photograph (${image.mimeType}, ${image.buffer.length} bytes).`);

  const result = await analyzeEvidence({
    issueType: 'road_damage',
    description: 'Photograph of a depression in an asphalt roadway, taken from the roadside.',
    claims: ['There is a pothole or broken pavement in the travel surface.'],
    images: [image]
  });

  if (!result?.analysis?.findings?.length) {
    console.error('FAIL: Live response lacked findings.');
    process.exit(1);
  }
  console.log('Live Gemma analysis returned structured findings.');
  console.log(
    `method=${result.method} findings=${result.analysis.findings.length} quality=${result.analysis.image_quality}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Live Gemma test failed:', err.public?.error || err.message);
    process.exit(1);
  });
