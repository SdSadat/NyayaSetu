// =============================================================================
// ChromaDB Retriever
// =============================================================================
// Implements the Retriever interface using ChromaDB for vector search and
// an EmbeddingProvider for query embedding. For local development use.
//
// Jurisdiction filtering:
//   - State queries retrieve BOTH state-specific AND central chunks (central
//     law always applies alongside state law in India).
//   - Central queries retrieve only central chunks.
// =============================================================================

import type { Jurisdiction } from '@nyayasetu/shared-types';
import type { EmbeddingProvider } from './embeddings.js';
import type { Retriever, RetrievalResult } from './retriever.js';
import type { ChromaVectorStore } from './chroma-store.js';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a {@link Retriever} backed by ChromaDB.
 *
 * @param store     - An initialized ChromaVectorStore instance.
 * @param embedder  - An EmbeddingProvider to vectorise the query text.
 * @param maxResults - Maximum number of results to return (default: 10).
 *
 * @example
 * ```ts
 * const retriever = createChromaRetriever(store, embedder, 10);
 * const result = await retriever.retrieve('What is Section 302?', { scope: 'central' });
 * console.log(result.chunks);
 * ```
 */
export function createChromaRetriever(
  store: ChromaVectorStore,
  embedder: EmbeddingProvider,
  maxResults: number = 10,
): Retriever {
  return {
    async retrieve(
      query: string,
      jurisdiction: Jurisdiction,
    ): Promise<RetrievalResult> {
      // 1. Embed the query
      const [queryEmbedding] = await embedder.embed([query]);

      if (!queryEmbedding) {
        throw new Error('Failed to generate embedding for query.');
      }

      // 2. For state queries, retrieve both state-specific and central chunks.
      //    Central law always applies in India regardless of state.
      if (jurisdiction.scope === 'state') {
        // Get state-specific chunks
        const stateResult = await store.query(
          queryEmbedding,
          { jurisdiction },
          maxResults,
        );

        // Get central chunks too
        const centralResult = await store.query(
          queryEmbedding,
          { jurisdiction: { scope: 'central' } },
          maxResults,
        );

        // Merge, sort by score descending, and take top-k
        const merged = [
          ...stateResult.chunks.map((c, i) => ({ chunk: c, score: stateResult.scores[i]! })),
          ...centralResult.chunks.map((c, i) => ({ chunk: c, score: centralResult.scores[i]! })),
        ];

        // Deduplicate by ID
        const seen = new Set<string>();
        const unique = merged.filter((item) => {
          if (seen.has(item.chunk.id)) return false;
          seen.add(item.chunk.id);
          return true;
        });

        // Sort by descending score and take maxResults
        unique.sort((a, b) => b.score - a.score);
        const topK = unique.slice(0, maxResults);

        return {
          chunks: topK.map((item) => item.chunk),
          scores: topK.map((item) => item.score),
        };
      }

      // 3. Central-only query — straightforward
      const result = await store.query(
        queryEmbedding,
        { jurisdiction },
        maxResults,
      );

      return {
        chunks: result.chunks,
        scores: result.scores,
      };
    },
  };
}
