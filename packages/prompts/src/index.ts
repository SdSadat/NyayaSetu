// =============================================================================
// @nyayasetu/prompts — Public API
// =============================================================================
// Versioned prompt templates for the NyayaSetu LLM pipelines.
// Prompts are safety-critical infrastructure. Every change must be versioned
// and reviewed.
// =============================================================================

export {
  SAHAYAK_SYSTEM_PROMPT,
  SAHAYAK_PROMPT_VERSION,
  buildSahayakPrompt,
} from './sahayak-prompt.js';

export type { SahayakPromptParams } from './sahayak-prompt.js';

export {
  DRISHTI_SYSTEM_PROMPT,
  DRISHTI_PROMPT_VERSION,
  buildDrishtiPrompt,
} from './drishti-prompt.js';

export type { DrishtiPromptParams } from './drishti-prompt.js';

export {
  VERIFICATION_SYSTEM_PROMPT,
  VERIFICATION_PROMPT_VERSION,
  buildVerificationPrompt,
} from './verification-prompt.js';

export type { VerificationPromptParams } from './verification-prompt.js';

export {
  DOCUMENT_VERIFY_SYSTEM_PROMPT,
  DOCUMENT_VERIFY_VISUAL_SYSTEM_PROMPT,
  DOCUMENT_VERIFY_PROMPT_VERSION,
  buildDocumentVerifyPrompt,
} from './document-verify-prompt.js';

export type { DocumentVerifyPromptParams } from './document-verify-prompt.js';
