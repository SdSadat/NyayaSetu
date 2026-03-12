// =============================================================================
// Rules Registry
// =============================================================================
// Collects all state-specific rules and provides lookup functions.
// =============================================================================

import type { SupportedState } from '@nyayasetu/shared-types';
import type { JurisdictionRule } from '../resolver.js';
import { westBengalRules } from './west-bengal.js';
import { jharkhandRules } from './jharkhand.js';

/** Map of state identifiers to their rule sets. */
const rulesByState: Record<SupportedState, JurisdictionRule[]> = {
  'west-bengal': westBengalRules,
  jharkhand: jharkhandRules,
};

/** Returns every rule across all supported states. */
export function getAllRules(): JurisdictionRule[] {
  return Object.values(rulesByState).flat();
}

/** Returns the rules specific to a given state. */
export function getRulesForState(state: SupportedState): JurisdictionRule[] {
  return rulesByState[state] ?? [];
}
