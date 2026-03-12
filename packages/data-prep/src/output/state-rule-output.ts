// =============================================================================
// State Rule Output Formatter
// =============================================================================
// Formats a PreparedDocument into a structure suitable for ingesting
// state rules, regulations, notifications, and circulars.
// =============================================================================

import type { Jurisdiction } from '@nyayasetu/shared-types';
import type { OutputFormatter, PreparedDocument } from '../types.js';

/**
 * Output structure for state rules and subordinate legislation.
 */
export interface StateRuleOutput {
  /** The cleaned text content of the rule. */
  text: string;
  /** Full title of the rule/notification. */
  title: string;
  /** Short name / abbreviation. */
  shortName: string;
  /** Jurisdiction metadata (should be state-scoped). */
  jurisdiction: Jurisdiction;
  /** Source URL for citation traceability. */
  sourceUrl: string;
  /** Year of issuance, if known. */
  year?: number;
}

/**
 * Formats a PreparedDocument classified as a state rule into
 * the structure expected by the state rule ingestion pipeline.
 */
export class StateRuleFormatter implements OutputFormatter<StateRuleOutput> {
  readonly targetType = 'state-rule';

  format(doc: PreparedDocument): StateRuleOutput {
    return {
      text: doc.text,
      title: doc.metadata.title,
      shortName: doc.metadata.shortName,
      jurisdiction: doc.metadata.jurisdiction,
      sourceUrl: doc.metadata.sourceUrl,
      year: doc.metadata.year,
    };
  }
}
