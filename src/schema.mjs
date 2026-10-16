import { EVIDENCE_STATUSES } from './config.mjs';

export const ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    observations: {
      type: 'array',
      items: { type: 'string' }
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claim: { type: 'string' },
          status: { type: 'string', enum: EVIDENCE_STATUSES },
          explanation: { type: 'string' },
          supporting_observation_or_limitation: { type: 'string' },
          recommended_next_evidence: { type: 'string' }
        },
        required: [
          'claim',
          'status',
          'explanation',
          'supporting_observation_or_limitation',
          'recommended_next_evidence'
        ]
      }
    },
    evidence_gaps: { type: 'array', items: { type: 'string' } },
    cannot_establish: { type: 'array', items: { type: 'string' } },
    next_steps: { type: 'array', items: { type: 'string' } },
    complaint_draft: { type: 'string' },
    uncertainty_notes: { type: 'array', items: { type: 'string' } },
    image_quality: {
      type: 'string',
      enum: ['adequate', 'limited', 'insufficient']
    }
  },
  required: [
    'observations',
    'findings',
    'evidence_gaps',
    'cannot_establish',
    'next_steps',
    'complaint_draft',
    'uncertainty_notes',
    'image_quality'
  ]
};

export function extractJsonFromText(text) {
  if (!text || typeof text !== 'string') return null;

  try {
    return JSON.parse(text);
  } catch {
    /* continue */
  }

  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch {
      /* continue */
    }
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }

  return null;
}

function asStringArray(value) {
  if (!Array.isArray(value)) return null;
  const out = [];
  for (const item of value) {
    if (typeof item !== 'string') return null;
    const trimmed = item.trim();
    if (trimmed) out.push(trimmed);
  }
  return out;
}

export function validateAnalysisPayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'Output is not a valid JSON object' };
  }

  const observations = asStringArray(data.observations);
  if (!observations) {
    return { valid: false, error: "Field 'observations' is expected to be an array of strings" };
  }

  if (!Array.isArray(data.findings)) {
    return { valid: false, error: "Field 'findings' is expected to be an array" };
  }

  const findings = [];
  for (let i = 0; i < data.findings.length; i += 1) {
    const finding = data.findings[i];
    if (!finding || typeof finding !== 'object' || Array.isArray(finding)) {
      return { valid: false, error: `Finding ${i + 1} is not an object` };
    }
    const claim = typeof finding.claim === 'string' ? finding.claim.trim() : '';
    const status = typeof finding.status === 'string' ? finding.status.trim() : '';
    const explanation = typeof finding.explanation === 'string' ? finding.explanation.trim() : '';
    const support =
      typeof finding.supporting_observation_or_limitation === 'string'
        ? finding.supporting_observation_or_limitation.trim()
        : '';
    let next = finding.recommended_next_evidence;
    if (next == null) next = '';
    if (typeof next !== 'string') {
      return { valid: false, error: `Finding ${i + 1} recommended_next_evidence must be a string` };
    }
    next = next.trim();
    if (!claim || !explanation || !support) {
      return { valid: false, error: `Finding ${i + 1} is missing required text fields` };
    }
    if (!EVIDENCE_STATUSES.includes(status)) {
      return { valid: false, error: `Finding ${i + 1} has invalid status` };
    }
    findings.push({
      claim,
      status,
      explanation,
      supporting_observation_or_limitation: support,
      recommended_next_evidence: next
    });
  }

  const evidence_gaps = asStringArray(data.evidence_gaps);
  const cannot_establish = asStringArray(data.cannot_establish);
  const next_steps = asStringArray(data.next_steps);
  const uncertainty_notes = asStringArray(data.uncertainty_notes);
  if (!evidence_gaps) return { valid: false, error: "Field 'evidence_gaps' is expected to be an array of strings" };
  if (!cannot_establish) {
    return { valid: false, error: "Field 'cannot_establish' is expected to be an array of strings" };
  }
  if (!next_steps) return { valid: false, error: "Field 'next_steps' is expected to be an array of strings" };
  if (!uncertainty_notes) {
    return { valid: false, error: "Field 'uncertainty_notes' is expected to be an array of strings" };
  }

  if (typeof data.complaint_draft !== 'string' || !data.complaint_draft.trim()) {
    return { valid: false, error: "Field 'complaint_draft' must be a non-empty string" };
  }

  const image_quality = typeof data.image_quality === 'string' ? data.image_quality.trim() : '';
  if (!['adequate', 'limited', 'insufficient'].includes(image_quality)) {
    return { valid: false, error: "Field 'image_quality' is invalid" };
  }

  return {
    valid: true,
    data: {
      observations,
      findings,
      evidence_gaps,
      cannot_establish,
      next_steps,
      complaint_draft: data.complaint_draft.trim(),
      uncertainty_notes,
      image_quality
    }
  };
}

export function normalizeLegacyEvidence(data) {
  return {
    observations: asStringArray(data?.observations) || [],
    supported_claims: asStringArray(data?.supported_claims) || [],
    claims_needing_evidence: asStringArray(data?.claims_needing_evidence) || [],
    not_verifiable: asStringArray(data?.not_verifiable) || [],
    recommended_next_evidence: asStringArray(data?.recommended_next_evidence) || [],
    limitations: asStringArray(data?.limitations) || []
  };
}
