export const PNG_1x1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export const JPEG_1x1_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAAEAAQMBIgACEQEDEQH/xAAXAAADAQAAAAAAAAAAAAAAAAABAgME/8QAGhAAAgMBAQAAAAAAAAAAAAAAAAECAxESIf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGlAf/EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8Af//Z';

export function sampleFinding(status = 'supported_by_visible_evidence') {
  return {
    claim: 'There is broken pavement in the photo',
    status,
    explanation: 'The image shows fractured asphalt.',
    supporting_observation_or_limitation: 'Cracks are visible near the lower third of the frame.',
    recommended_next_evidence: 'Photograph a ruler beside the defect from a sidewalk.'
  };
}

export function sampleAnalysis(overrides = {}) {
  return {
    observations: ['Broken asphalt is visible in the lower portion of the image.'],
    findings: [sampleFinding()],
    evidence_gaps: ['No scale object is present.'],
    cannot_establish: ['Exact depth cannot be measured from this photo.'],
    next_steps: ['Add a second photo with a coin or shoe for scale, taken from a sidewalk.'],
    complaint_draft:
      'I am reporting a visible pavement defect shown in the attached photograph. Exact depth, ownership, and cause are not established by the image. Please verify this draft before filing.',
    uncertainty_notes: ['Single angle; standing water may hide the cavity floor.'],
    image_quality: 'limited',
    ...overrides
  };
}
