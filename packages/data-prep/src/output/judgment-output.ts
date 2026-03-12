// =============================================================================
// Judgment Output Formatter
// =============================================================================
// Formats a PreparedDocument into a structure suitable for ingesting
// Supreme Court and High Court judgments.
// =============================================================================

import type { Jurisdiction, LegalSourceType } from '@nyayasetu/shared-types';
import type { OutputFormatter, PreparedDocument } from '../types.js';

/**
 * Output structure for court judgments (Supreme Court and High Court).
 */
export interface JudgmentOutput {
  /** The cleaned text content of the judgment. */
  text: string;
  /** Case title (e.g., "State of Kerala v. Joseph"). */
  title: string;
  /** Short name for the case. */
  shortName: string;
  /** Full case citation (e.g., "(1999) 5 SCC 607"). */
  caseCitation: string;
  /** Court name. */
  court: string;
  /** Date of judgment in YYYY-MM-DD format. */
  dateOfJudgment?: string;
  /** Source type: "supreme-court" or "high-court". */
  sourceType: LegalSourceType;
  /** Jurisdiction metadata. */
  jurisdiction: Jurisdiction;
  /** Source URL for citation traceability. */
  sourceUrl: string;
}

/**
 * Formats a PreparedDocument classified as a court judgment into
 * the structure expected by the judgment ingestion pipeline.
 */
export class JudgmentFormatter implements OutputFormatter<JudgmentOutput> {
  readonly targetType = 'judgment';

  format(doc: PreparedDocument): JudgmentOutput {
    return {
      text: doc.text,
      title: doc.metadata.title,
      shortName: doc.metadata.shortName,
      caseCitation: doc.metadata.caseCitation ?? '',
      court: doc.metadata.court ?? '',
      dateOfJudgment: doc.metadata.dateOfJudgment,
      sourceType: doc.documentType,
      jurisdiction: doc.metadata.jurisdiction,
      sourceUrl: doc.metadata.sourceUrl,
    };
  }
}
