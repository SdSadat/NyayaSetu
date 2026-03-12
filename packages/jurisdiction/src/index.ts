// =============================================================================
// @nyayasetu/jurisdiction
// =============================================================================
// Public API for the jurisdiction resolution package. Determines which state's
// laws apply and provides state-specific legal rules.
// =============================================================================

export {
  resolveJurisdiction,
  getApplicableRules,
} from './resolver.js';

export type {
  JurisdictionRule,
  ResolvedJurisdiction,
} from './resolver.js';

export { getAllRules, getRulesForState } from './rules/index.js';
export { westBengalRules } from './rules/west-bengal.js';
export { jharkhandRules } from './rules/jharkhand.js';
