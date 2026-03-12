// =============================================================================
// @nyayasetu/safety-layer — public API
// =============================================================================

export {
  checkForAdvisoryLanguage,
  toVerificationFields,
  type AdvisoryLanguageResult,
} from './language-checker.js';

export {
  applyGuardrails,
  calculateCertaintyLevel,
  stripAdvisoryLanguage,
  type GuardrailInput,
  type GuardrailOutput,
} from './guardrails.js';

export {
  refuseNoSources,
  refuseLowCertainty,
  refuseConflictingSources,
  refuseUnknownJurisdiction,
  refuseOutOfScope,
  STANDARD_DISCLAIMER,
} from './refusal.js';
