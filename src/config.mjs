export const DEFAULT_MODEL = 'gemma-4-26b-a4b-it';
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
export const MAX_IMAGES = 2;
export const MAX_JSON_BODY_BYTES = 14 * 1024 * 1024;
export const MAX_DESCRIPTION_CHARS = 4000;
export const MIN_DESCRIPTION_CHARS = 8;
export const MAX_CLAIM_CHARS = 500;
export const MIN_CLAIM_CHARS = 4;
export const MAX_CLAIMS = 12;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_MAX = 12;
export const DEFAULT_TIMEOUT_MS = 90_000;

export const ALLOWED_MIME = {
  'image/jpeg': { ext: ['.jpg', '.jpeg'], magic: 'jpeg' },
  'image/png': { ext: ['.png'], magic: 'png' },
  'image/webp': { ext: ['.webp'], magic: 'webp' }
};

export const ISSUE_TYPES = ['road_damage', 'garbage'];

export const EVIDENCE_STATUSES = [
  'supported_by_visible_evidence',
  'consistent_but_not_measurable',
  'not_visible_in_image',
  'appears_inconsistent_with_image',
  'requires_external_evidence',
  'insufficient_information'
];

export function getApiKey() {
  const raw = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  const key = raw.trim();
  if (!key || key === 'your_api_key_here') return null;
  return key;
}

export function getModel() {
  return (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
}

export function getPort() {
  const n = Number(process.env.PORT);
  return Number.isFinite(n) && n > 0 ? n : 3000;
}

export function getCorsOrigin() {
  return (process.env.CORS_ORIGIN || '').trim();
}

export function getTimeoutMs() {
  const n = Number(process.env.ANALYZE_TIMEOUT_MS);
  return Number.isFinite(n) && n >= 5000 ? n : DEFAULT_TIMEOUT_MS;
}
