// =============================================================================
// Bare Act Output Formatter
// =============================================================================
// Formats a PreparedDocument into a structure compatible with the
// ingestion pipeline's ingestBareAct() function.
// =============================================================================

import type { Jurisdiction } from '@nyayasetu/shared-types';
import type { OutputFormatter, PreparedDocument } from '../types.js';

/**
 * Output structure matching IngestBareActParams from the API ingestion service.
 * Can be saved as JSON and fed directly to the ingestion CLI.
 */
export interface BareActOutput {
  /** The cleaned text content of the bare act. */
  text: string;
  /** Full title of the act. */
  act: string;
  /** Short name / abbreviation. */
  shortName: string;
  /** Jurisdiction metadata. */
  jurisdiction: Jurisdiction;
  /** Source URL for citation traceability. */
  sourceUrl: string;
  /** Year of enactment, if known. */
  year?: number;
}

/**
 * Formats a PreparedDocument classified as a bare act into the
 * structure expected by the ingestion pipeline.
 */
export class BareActFormatter implements OutputFormatter<BareActOutput> {
  readonly targetType = 'bare-act';

  format(doc: PreparedDocument): BareActOutput {
    return {
      text: doc.text,
      act: doc.metadata.title,
      shortName: doc.metadata.shortName,
      jurisdiction: doc.metadata.jurisdiction,
      sourceUrl: doc.metadata.sourceUrl,
      year: doc.metadata.year,
    };
  }
}
