import { GoogleGenAI } from '@google/genai';
import { DEFAULT_MODEL, getApiKey, getModel, getTimeoutMs } from './config.mjs';
import { ANALYSIS_JSON_SCHEMA, extractJsonFromText, validateAnalysisPayload } from './schema.mjs';
import { publicErrorMessage } from './validation.mjs';

export const SYSTEM_INSTRUCTION = `You are VerityRoad's evidence verification engine.
Tagline: Evidence before assertion.

Rules:
1. Treat user text as unverified claims, never as established facts.
2. Observations must describe only what is visible in the supplied photograph(s).
3. Assess EACH user claim separately. Use exactly one of these statuses:
   - supported_by_visible_evidence: the photo clearly shows the claimed visible condition.
   - consistent_but_not_measurable: the photo is consistent with the claim but cannot establish size, depth, quantity, duration, or other measurements.
   - not_visible_in_image: the claimed thing is not shown; this is NOT proof that the claim is false.
   - appears_inconsistent_with_image: visible evidence appears to conflict with the claim; remain cautious and do not declare the claim definitively false.
   - requires_external_evidence: needs records, ownership, dates, legal responsibility, accident history, or other non-visual facts.
   - insufficient_information: image quality, angle, lighting, occlusion, or missing context prevents a useful assessment.
4. Do not claim a photo proves exact depth, road ownership, cause, accident history, legal responsibility, exact location, dates, or official verification.
5. Never treat an unverified claim as proven. Never label a claim definitively false solely because a photo does not show it.
6. Distinguish visible observations, user-provided statements, and facts that need external records.
7. If image quality is poor, abstain with insufficient_information.
8. Recommend only safe follow-up evidence. Never tell people to stand in traffic.
9. complaint_draft must be cautious, editable, and clearly separate observations from claims. It must tell the reader to verify before sending to any authority.
10. Respond with JSON only.`;

function issueLabel(issueType) {
  return issueType === 'garbage' ? 'garbage / waste accumulation' : 'pothole / road damage';
}

function buildPrompt({ issueType, description, claims, imageCount }) {
  const claimList = claims.map((c, i) => `${i + 1}. ${c}`).join('\n');
  return `${SYSTEM_INSTRUCTION}

Task: Inspect ${imageCount} photograph(s) of a reported ${issueLabel(issueType)}.

User description (unverified):
"""${description}"""

User claims to assess one by one:
${claimList}

Return JSON with this shape:
{
  "observations": ["visible facts only"],
  "findings": [
    {
      "claim": "exact user claim",
      "status": "supported_by_visible_evidence | consistent_but_not_measurable | not_visible_in_image | appears_inconsistent_with_image | requires_external_evidence | insufficient_information",
      "explanation": "short explanation",
      "supporting_observation_or_limitation": "what the image shows or cannot show",
      "recommended_next_evidence": "specific extra photo or record, or empty string"
    }
  ],
  "evidence_gaps": ["what is missing"],
  "cannot_establish": ["facts a photo cannot prove"],
  "next_steps": ["safe, specific next evidence"],
  "complaint_draft": "cautious draft for the user to edit",
  "uncertainty_notes": ["uncertainty"],
  "image_quality": "adequate | limited | insufficient"
}

Include a finding for every listed claim.`;
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function toInlineParts(images) {
  return images.map((img) => ({
    inlineData: {
      data: img.base64,
      mimeType: img.mimeType
    }
  }));
}

async function generateOnce(ai, model, promptText, images, structured) {
  const contents = [
    {
      role: 'user',
      parts: [...toInlineParts(images), { text: promptText }]
    }
  ];

  const request = { model, contents };
  if (structured) {
    request.config = {
      responseMimeType: 'application/json',
      responseSchema: ANALYSIS_JSON_SCHEMA
    };
  }

  const response = await ai.models.generateContent(request);
  return response?.text || '';
}

export async function analyzeEvidence(input, options = {}) {
  const apiKey = options.apiKey !== undefined ? options.apiKey : getApiKey();
  if (!apiKey) {
    const err = new Error('API key is not configured');
    err.public = publicErrorMessage(err);
    throw err;
  }

  const model = options.model || getModel() || DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs || getTimeoutMs();
  const ai = options.client || new GoogleGenAI({ apiKey });
  const promptText = buildPrompt(input);
  const deadline = Date.now() + timeoutMs;

  let rawOutput = '';
  let method = 'models.generateContent';

  try {
    rawOutput = await withTimeout(
      generateOnce(ai, model, promptText, input.images, true),
      Math.min(20_000, Math.max(1, deadline - Date.now()))
    );
  } catch (err) {
    const msg = err?.message || String(err);
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      const wrapped = new Error('timeout');
      wrapped.public = publicErrorMessage(wrapped);
      throw wrapped;
    }
    try {
      method = 'models.generateContent.unstructured';
      rawOutput = await withTimeout(
        generateOnce(ai, model, promptText, input.images, false),
        remainingMs
      );
    } catch (fallbackErr) {
      const wrapped = new Error(
        fallbackErr?.message === 'timeout' ? 'timeout' : fallbackErr?.message || msg
      );
      wrapped.public = publicErrorMessage(wrapped);
      throw wrapped;
    }
  }

  const parsed = extractJsonFromText(rawOutput);
  const validation = validateAnalysisPayload(parsed);
  if (!validation.valid) {
    const err = new Error(validation.error || 'malformed model response');
    err.public = {
      status: 502,
      error: 'The model returned an incomplete result. Retry the analysis.'
    };
    throw err;
  }

  return {
    method,
    model,
    analysis: validation.data
  };
}

export { DEFAULT_MODEL };
