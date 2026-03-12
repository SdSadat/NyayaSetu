// =============================================================================
// Embedding Provider Interface
// =============================================================================
// Abstract interface for embedding providers. Implemented by Nova embeddings.
// =============================================================================

/** Default embedding dimension used across the pipeline. */
export const EMBEDDING_DIMENSION = 1024;

/**
 * A provider that can convert text into vector embeddings.
 */
export interface EmbeddingProvider {
  /**
   * Generate embeddings for a list of texts.
   * @returns A 2D array where each inner array is an embedding vector.
   */
  embed(texts: string[]): Promise<number[][]>;
}
