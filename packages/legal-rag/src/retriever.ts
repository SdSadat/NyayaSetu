// =============================================================================
// Retriever Interface
// =============================================================================
// Abstract interface for source retrieval. Implemented by ChromaDB retriever.
// =============================================================================

import type { Jurisdiction, LegalChunk } from '@nyayasetu/shared-types';

/**
 * Result from a retrieval operation.
 */
export interface RetrievalResult {
  /** Retrieved legal chunks, ordered by relevance. */
  chunks: LegalChunk[];
  /** Corresponding relevance scores (higher = more relevant). */
  scores: number[];
}

/**
 * A provider that can retrieve relevant legal chunks for a query.
 */
export interface Retriever {
  /**
   * Retrieve relevant legal source chunks for a given query.
   */
  retrieve(query: string, jurisdiction: Jurisdiction): Promise<RetrievalResult>;
}
