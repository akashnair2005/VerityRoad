/**
 * VerityRoad - Schema & Evidence Rule Unit Tests
 *
 * Verifies that:
 * 1. Required 6 fields are strictly enforced.
 * 2. Invalid types or missing fields are caught with clear errors.
 * 3. Text-only complaints producing physical observations fail the audit.
 * 4. Text-only complaints with empty observations pass the audit.
 * 5. Robust JSON extraction works with markdown blocks, raw JSON, and bad syntax.
 */

import {
  validateEvidenceData,
  auditEvidenceClassification,
  extractJsonFromText
} from './test-gemma.mjs';

function runUnitTests() {
  console.log('====================================================');
  console.log('VERITYROAD UNIT & SCHEMA VALIDATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // Test 1: Complete valid data
  const validData = {
    observations: ['Cracked pavement visible on asphalt'],
    supported_claims: ['Asphalt cracking'],
    claims_needing_evidence: ['Depth is 2 inches'],
    not_verifiable: ['Accident occurred yesterday'],
    recommended_next_evidence: ['Take photo with ruler for scale'],
    limitations: ['Low lighting at bottom of crack']
  };
  const res1 = validateEvidenceData(validData);
  assert(res1.valid === true, 'Valid 6-field object passes validation');

  // Test 2: Missing field (e.g., 'limitations' missing)
  const missingField = { ...validData };
  delete missingField.limitations;
  const res2 = validateEvidenceData(missingField);
  assert(res2.valid === false && res2.error.includes('limitations'), 'Missing required field is rejected');

  // Test 3: Non-array field (e.g., observations is a string)
  const nonArray = { ...validData, observations: 'not an array' };
  const res3 = validateEvidenceData(nonArray);
  assert(res3.valid === false && res3.error.includes('expected to be an array'), 'Non-array field is rejected');

  // Test 4: Array with non-string elements
  const nonString = { ...validData, observations: [123, 456] };
  const res4 = validateEvidenceData(nonString);
  assert(res4.valid === false && res4.error.includes('non-string items'), 'Non-string array elements are rejected');

  // Test 5: Text-only audit violation (text-only producing physical observations)
  const badTextOnlyData = {
    observations: ['Observed deep pothole'],
    supported_claims: ['Pothole exists'],
    claims_needing_evidence: ['Depth is 2 feet'],
    not_verifiable: ['Occurred at 8:30 AM'],
    recommended_next_evidence: ['Take sidewalk photo'],
    limitations: ['No photos provided']
  };
  const auditRes1 = auditEvidenceClassification(badTextOnlyData, { isMultimodal: false });
  assert(auditRes1.passed === false && auditRes1.issues.length >= 2, 'Text-only producing observations/supported claims fails audit');

  // Test 6: Text-only compliant data (empty observations and supported claims)
  const goodTextOnlyData = {
    observations: [],
    supported_claims: [],
    claims_needing_evidence: ['Pothole exists', 'Depth is 2 feet', 'Asphalt crumbling'],
    not_verifiable: ['Occurred yesterday at 8:30 AM', '42 Maple Street address', 'Fatal accident prediction'],
    recommended_next_evidence: ['Photograph from sidewalk with scale object'],
    limitations: ['Text-only complaint with no corroborating photographic evidence']
  };
  const auditRes2 = auditEvidenceClassification(goodTextOnlyData, { isMultimodal: false });
  assert(auditRes2.passed === true, 'Compliant text-only data passes evidence audit');

  // Test 7: JSON extraction from Markdown code block
  const markdownText = 'Here is the response:\n```json\n{"observations":[]}\n```\nHope this helps!';
  const extracted1 = extractJsonFromText(markdownText);
  assert(extracted1 !== null && Array.isArray(extracted1.observations), 'extractJsonFromText handles markdown json blocks');

  // Test 8: JSON extraction from malformed non-JSON
  const malformedText = 'I could not process this request.';
  const extracted2 = extractJsonFromText(malformedText);
  assert(extracted2 === null, 'extractJsonFromText returns null for invalid non-JSON output');

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  return failed === 0;
}

if (!runUnitTests()) {
  process.exit(1);
}
