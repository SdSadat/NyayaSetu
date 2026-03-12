// =============================================================================
// Refusal Helpers
// =============================================================================
// Generate structured RefusalResponse objects for each refusal scenario.
// Every refusal suggests consulting a qualified human lawyer.
// =============================================================================

import type { RefusalResponse } from '@nyayasetu/shared-types';

/** Standard legal disclaimer appended to every successful response. */
export const STANDARD_DISCLAIMER =
  'This information is for educational purposes only and does not constitute legal advice. Please consult a qualified legal professional for advice specific to your situation.';

/**
 * Refuse because no legal sources were retrieved for the query.
 */
export function refuseNoSources(): RefusalResponse {
  return {
    type: 'refusal',
    reason: 'no-sources-retrieved',
    message:
      'I could not find any verified legal sources relevant to your question. ' +
      'Without reliable sources I cannot provide information. ' +
      'Please consult a qualified legal professional for assistance.',
    suggestHumanLawyer: true,
  };
}

/**
 * Refuse because the certainty score is below the configured threshold.
 */
export function refuseLowCertainty(score: number): RefusalResponse {
  return {
    type: 'refusal',
    reason: 'low-certainty',
    message:
      `The certainty of the retrieved information is too low (score: ${score.toFixed(2)}) ` +
      'to provide a reliable answer. ' +
      'Please consult a qualified legal professional who can review your specific situation.',
    suggestHumanLawyer: true,
  };
}

/**
 * Refuse because the retrieved sources contain conflicting legal positions.
 */
export function refuseConflictingSources(): RefusalResponse {
  return {
    type: 'refusal',
    reason: 'conflicting-sources',
    message:
      'The legal sources retrieved contain conflicting information. ' +
      'I cannot safely present a single answer when authoritative sources disagree. ' +
      'Please consult a qualified legal professional who can analyze the nuances.',
    suggestHumanLawyer: true,
  };
}

/**
 * Refuse because the jurisdiction could not be determined.
 */
export function refuseUnknownJurisdiction(): RefusalResponse {
  return {
    type: 'refusal',
    reason: 'jurisdiction-unknown',
    message:
      'I was unable to determine the applicable jurisdiction for your question. ' +
      'Legal provisions vary significantly between jurisdictions, so I cannot provide information ' +
      'without knowing which state or central law applies. ' +
      'Please specify your jurisdiction or consult a local legal professional.',
    suggestHumanLawyer: true,
  };
}

/**
 * Refuse because the query falls outside the scope of legal information the system covers.
 */
export function refuseOutOfScope(): RefusalResponse {
  return {
    type: 'refusal',
    reason: 'out-of-scope',
    message:
      'Your question falls outside the scope of legal topics I can assist with. ' +
      'I am designed to provide information on specific areas of Indian law. ' +
      'Please consult a qualified legal professional for guidance on this matter.',
    suggestHumanLawyer: true,
  };
}
