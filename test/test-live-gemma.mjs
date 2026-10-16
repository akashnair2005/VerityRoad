/**
 * Live Gemma integration check.
 * Skips unless GEMINI_API_KEY is set.
 * Prefers a Wikimedia road-damage photograph. If download fails, the test fails
 * rather than pretending a tiny generated JPEG is a field photo.
 */
import 'dotenv/config';
import { getApiKey, getModel } from '../src/config.mjs';
import { analyzeEvidence } from '../src/gemma.mjs';
import { detectImageMime } from '../src/validation.mjs';

const POTHOLE_URL =
  'https://upload.wikimedia.org/wikipedia/commons/8/87/Pothole.jpg';

async function loadRoadImage() {
  const res = await fetch(POTHOLE_URL, {
    headers: { 'User-Agent': 'VerityRoadHackathon/1.0 (evidence test)' }
  });
  if (!res.ok) {
    throw new Error(`Could not download road-damage fixture (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const mime = detectImageMime(buffer);
  if (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/webp') {
    throw new Error('Downloaded fixture was not a supported image');
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
  console.log(`Using Wikimedia pothole photograph (${image.mimeType}, ${image.buffer.length} bytes).`);

  const result = await analyzeEvidence({
    issueType: 'road_damage',
    description: 'Photograph of a depression in an asphalt roadway, taken from the roadside.',
    claims: [
      'There is a pothole or broken pavement in the travel surface',
      'The hole is exactly two feet deep',
      'The city owns this road and ignored earlier complaints'
    ],
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

main().catch((err) => {
  console.error('Live Gemma test failed:', err.public?.error || err.message);
  process.exit(1);
});
