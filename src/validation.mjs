import {
  ALLOWED_MIME,
  ISSUE_TYPES,
  MAX_CLAIM_CHARS,
  MAX_CLAIMS,
  MAX_DESCRIPTION_CHARS,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  MIN_CLAIM_CHARS,
  MIN_DESCRIPTION_CHARS
} from './config.mjs';

export function detectImageMime(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  const riff = buffer.slice(0, 4).toString('ascii');
  const webp = buffer.slice(8, 12).toString('ascii');
  if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp';
  return null;
}

export function decodeImagePayload(image) {
  if (!image || typeof image !== 'object') {
    return { error: 'Each image must be an object with mimeType and data.' };
  }
  const declared = String(image.mimeType || image.mime_type || '').toLowerCase().trim();
  if (!ALLOWED_MIME[declared]) {
    return { error: 'Unsupported image type. Use JPEG, PNG, or WEBP.' };
  }
  const raw = typeof image.data === 'string' ? image.data : '';
  const cleaned = raw.includes(',') ? raw.slice(raw.indexOf(',') + 1) : raw;
  if (!cleaned) return { error: 'Image data is empty.' };
  let buffer;
  try {
    buffer = Buffer.from(cleaned, 'base64');
  } catch {
    return { error: 'Image data is not valid base64.' };
  }
  if (!buffer.length) return { error: 'Image data is empty.' };
  if (buffer.length > MAX_IMAGE_BYTES) {
    return { error: `Each image must be ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))} MB or smaller.` };
  }
  const detected = detectImageMime(buffer);
  if (!detected) {
    return { error: 'File contents do not match a supported image format.' };
  }
  if (detected !== declared) {
    return { error: 'Declared image type does not match file contents.' };
  }
  return { mimeType: detected, buffer, base64: buffer.toString('base64') };
}

export function parseClaimsInput(claims) {
  if (Array.isArray(claims)) {
    return claims.map((c) => String(c || '').trim()).filter(Boolean);
  }
  if (typeof claims === 'string') {
    return claims
      .split(/\r?\n|;/)
      .map((line) => line.replace(/^[\s*-•\d.)]+/, '').trim())
      .filter(Boolean);
  }
  return [];
}

export function validateAnalyzeRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' };
  }

  const issueType = String(body.issueType || '').trim();
  if (!ISSUE_TYPES.includes(issueType)) {
    return { error: 'Select an issue type: road damage or garbage.' };
  }

  const description = String(body.description || '').trim();
  if (description.length < MIN_DESCRIPTION_CHARS) {
    return { error: 'Enter a short description of what you observed.' };
  }
  if (description.length > MAX_DESCRIPTION_CHARS) {
    return { error: `Description must be ${MAX_DESCRIPTION_CHARS} characters or fewer.` };
  }

  const claims = parseClaimsInput(body.claims);
  if (claims.length === 0) {
    return { error: 'Add at least one specific claim to compare against the photo.' };
  }
  if (claims.length > MAX_CLAIMS) {
    return { error: `Use ${MAX_CLAIMS} claims or fewer.` };
  }
  for (const claim of claims) {
    if (claim.length < MIN_CLAIM_CHARS) {
      return { error: 'Each claim must be at least a short phrase.' };
    }
    if (claim.length > MAX_CLAIM_CHARS) {
      return { error: `Each claim must be ${MAX_CLAIM_CHARS} characters or fewer.` };
    }
  }

  const images = Array.isArray(body.images) ? body.images : [];
  if (images.length === 0) {
    return { error: 'Upload at least one photograph.' };
  }
  if (images.length > MAX_IMAGES) {
    return { error: `Upload at most ${MAX_IMAGES} photographs.` };
  }

  const decoded = [];
  for (let i = 0; i < images.length; i += 1) {
    const result = decodeImagePayload(images[i]);
    if (result.error) {
      return { error: `Image ${i + 1}: ${result.error}` };
    }
    decoded.push(result);
  }

  return {
    value: {
      issueType,
      description,
      claims,
      images: decoded
    }
  };
}

export function publicErrorMessage(err) {
  const raw = err?.message || String(err || 'Unknown error');
  const lower = raw.toLowerCase();
  if (lower.includes('api key') || lower.includes('unauthenticated') || lower.includes('401')) {
    return { status: 503, error: 'The analysis service is not configured. Set GEMINI_API_KEY on the server.' };
  }
  if (lower.includes('429') || lower.includes('resource exhausted') || lower.includes('quota')) {
    return { status: 429, error: 'The analysis service is busy. Wait a moment and retry.' };
  }
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('deadline')) {
    return { status: 504, error: 'The analysis timed out. Retry with a smaller image or fewer claims.' };
  }
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('econn')) {
    return { status: 502, error: 'Could not reach the analysis service. Check connectivity and retry.' };
  }
  if (lower.includes('404') || lower.includes('not found')) {
    return { status: 502, error: 'The configured model is unavailable. Check GEMINI_MODEL and try again.' };
  }
  return { status: 502, error: 'The analysis service returned an unexpected result. Retry the request.' };
}
