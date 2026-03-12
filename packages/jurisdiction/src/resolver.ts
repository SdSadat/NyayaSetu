// =============================================================================
// Jurisdiction Resolver
// =============================================================================
// Determines which jurisdiction (central vs. state) applies based on extracted
// entities and returns applicable symbolic rules for a given topic.
// =============================================================================

import type {
  ExtractedEntities,
  Jurisdiction,
  SupportedState,
} from '@nyayasetu/shared-types';
import { getAllRules, getRulesForState } from './rules/index.js';

// ---------------------------------------------------------------------------
// JurisdictionRule interface
// ---------------------------------------------------------------------------

/** A symbolic rule encoding a state-specific legal position. */
export interface JurisdictionRule {
  /** Unique identifier for the rule (e.g. "wb-rent-001"). */
  id: string;
  /** The state this rule applies to. */
  state: SupportedState;
  /** Legal topic this rule addresses (e.g. "rent", "alcohol", "vehicle"). */
  topic: string;
  /** Human-readable condition under which the rule applies. */
  condition: string;
  /** Plain-language description of the legal position. */
  legalPosition: string;
  /** The act from which this rule derives. */
  act: string;
  /** Relevant section of the act. */
  section: string;
}

// ---------------------------------------------------------------------------
// Jurisdiction resolution
// ---------------------------------------------------------------------------

/**
 * Result of jurisdiction resolution, extending `Jurisdiction` with an optional
 * flag indicating that multiple jurisdictions may apply (e.g. inter-state
 * scenarios).
 */
export interface ResolvedJurisdiction extends Jurisdiction {
  /** When true, the scenario involves more than one state. */
  multipleJurisdictions?: boolean;
  /** If multiple jurisdictions apply, the additional states involved. */
  involvedStates?: SupportedState[];
}

/**
 * Determines the applicable jurisdiction from extracted entities.
 *
 * Logic:
 * 1. If `state` is provided explicitly, scope is "state" for that state.
 * 2. If `fromState` and `toState` are provided and differ, scope is "state"
 *    for `fromState` but the result is flagged as multi-jurisdiction.
 * 3. If `fromState` and `toState` are the same, treat as a single state.
 * 4. Default to "central" scope when no state information is available.
 */
export function resolveJurisdiction(
  entities: ExtractedEntities,
): ResolvedJurisdiction {
  // Explicit single state
  if (entities.state) {
    return {
      scope: 'state',
      state: entities.state,
    };
  }

  // Inter-state scenario
  if (entities.fromState && entities.toState) {
    if (entities.fromState !== entities.toState) {
      return {
        scope: 'state',
        state: entities.fromState,
        multipleJurisdictions: true,
        involvedStates: [entities.fromState, entities.toState],
      };
    }
    // Same state for both
    return {
      scope: 'state',
      state: entities.fromState,
    };
  }

  // Single directional state
  if (entities.fromState) {
    return {
      scope: 'state',
      state: entities.fromState,
    };
  }

  if (entities.toState) {
    return {
      scope: 'state',
      state: entities.toState,
    };
  }

  // No state information -- fall back to central
  return {
    scope: 'central',
  };
}

// ---------------------------------------------------------------------------
// Rule lookup
// ---------------------------------------------------------------------------

/**
 * Returns all rules that match a given jurisdiction and topic.
 *
 * - For "state" scope with a specific state: returns that state's rules
 *   filtered by topic.
 * - For "central" scope or when no state is set: returns all rules matching
 *   the topic across every state.
 */
export function getApplicableRules(
  jurisdiction: Jurisdiction,
  topic: string,
): JurisdictionRule[] {
  const normalizedTopic = topic.toLowerCase();

  if (jurisdiction.scope === 'state' && jurisdiction.state) {
    return getRulesForState(jurisdiction.state).filter(
      (rule) => rule.topic.toLowerCase() === normalizedTopic,
    );
  }

  // Central or unspecified -- return all matching rules
  return getAllRules().filter(
    (rule) => rule.topic.toLowerCase() === normalizedTopic,
  );
}
