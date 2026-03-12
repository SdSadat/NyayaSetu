// =============================================================================
// Amazon Bedrock Knowledge Bases Retriever
// =============================================================================
// Implements the Retriever interface using Amazon Bedrock Knowledge Bases for
// fully managed vector search. Replaces self-hosted ChromaDB with AWS-native
// serverless retrieval.
//
// Documents are stored in S3 and indexed by Bedrock Knowledge Bases with Nova
// embeddings. This retriever calls the Retrieve API at query time.
//
// Jurisdiction handling:
//   - State queries retrieve BOTH state-specific AND central chunks (central
//     law always applies alongside state law in India).
//   - Central queries retrieve only central chunks.
// =============================================================================

import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import type {
  RetrievalFilter,
  KnowledgeBaseRetrievalResult,
} from '@aws-sdk/client-bedrock-agent-runtime';

import type { Jurisdiction, LegalChunk, LegalSourceType } from '@nyayasetu/shared-types';
import type { Retriever, RetrievalResult } from './retriever.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface BedrockKBRetrieverConfig {
  /** The Bedrock Knowledge Base ID. */
  knowledgeBaseId: string;
  /** AWS region for the Knowledge Base. */
  region: string;
  /** Maximum number of results to return per query. */
  maxResults?: number;
  /** AWS credentials (optional — uses default credential chain if omitted). */
  accessKeyId?: string;
  secretAccessKey?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a Bedrock KB retrieval result to our LegalChunk type.
 *
 * Expects document metadata to include: act, section, jurisdiction_scope,
 * jurisdiction_state, source_type, source_url, verified_at.
 * These are set when uploading documents to S3 with metadata.
 */
function toChunk(result: KnowledgeBaseRetrievalResult, index: number): LegalChunk {
  const meta = result.metadata ?? {};
  const getString = (key: string, fallback: string = ''): string => {
    const val = meta[key];
    if (val === undefined || val === null) return fallback;
    if (typeof val === 'object' && 'value' in val) return String(val.value);
    return String(val);
  };

  const scope = getString('jurisdiction_scope', 'central') as 'central' | 'state';
  const state = getString('jurisdiction_state');

  const jurisdiction: Jurisdiction = {
    scope,
    ...(scope === 'state' && state ? { state: state as Jurisdiction['state'] } : {}),
  };

  // Build a stable ID from metadata or fall back to index-based
  const section = getString('section', 'unknown');
  const act = getString('act', 'Unknown Act');
  const id = getString('chunk_id', `kb-${act}-${section}-${index}`);

  return {
    id,
    text: result.content?.text ?? '',
    act,
    section,
    subSection: getString('sub_section') || undefined,
    jurisdiction,
    sourceType: (getString('source_type', 'bare-act') as LegalSourceType),
    sourceUrl: getString('source_url', result.location?.s3Location?.uri ?? ''),
    verifiedAt: getString('verified_at', new Date().toISOString()),
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a {@link Retriever} backed by Amazon Bedrock Knowledge Bases.
 *
 * @example
 * ```ts
 * const retriever = createBedrockKBRetriever({
 *   knowledgeBaseId: 'ABCDEF1234',
 *   region: 'us-east-1',
 *   maxResults: 10,
 * });
 * const result = await retriever.retrieve('What is Section 302?', { scope: 'central' });
 * ```
 */
export function createBedrockKBRetriever(
  cfg: BedrockKBRetrieverConfig,
): Retriever {
  const maxResults = cfg.maxResults ?? 10;

  const client = new BedrockAgentRuntimeClient({
    region: cfg.region,
    ...(cfg.accessKeyId && cfg.secretAccessKey
      ? {
          credentials: {
            accessKeyId: cfg.accessKeyId,
            secretAccessKey: cfg.secretAccessKey,
          },
        }
      : {}),
  });

  async function retrieve(
    query: string,
    filter?: RetrievalFilter,
    topK: number = maxResults,
  ): Promise<{ chunks: LegalChunk[]; scores: number[] }> {
    const command = new RetrieveCommand({
      knowledgeBaseId: cfg.knowledgeBaseId,
      retrievalQuery: { text: query },
      retrievalConfiguration: {
        vectorSearchConfiguration: {
          numberOfResults: topK,
          ...(filter ? { filter } : {}),
        },
      },
    });

    const response = await client.send(command);
    const results = response.retrievalResults ?? [];

    const chunks = results.map((r, i) => toChunk(r, i));
    const scores = results.map((r) => r.score ?? 0);

    return { chunks, scores };
  }

  return {
    async retrieve(
      query: string,
      jurisdiction: Jurisdiction,
    ): Promise<RetrievalResult> {
      try {
        if (jurisdiction.scope === 'state' && jurisdiction.state) {
          // State queries: retrieve BOTH state-specific AND central chunks
          const stateFilter: RetrievalFilter = {
            andAll: [
              { equals: { key: 'jurisdiction_scope', value: 'state' } },
              { equals: { key: 'jurisdiction_state', value: jurisdiction.state } },
            ],
          };

          const centralFilter: RetrievalFilter = {
            equals: { key: 'jurisdiction_scope', value: 'central' },
          };

          const [stateResult, centralResult] = await Promise.all([
            retrieve(query, stateFilter, maxResults),
            retrieve(query, centralFilter, maxResults),
          ]);

          // Merge, deduplicate, sort by score, take top-k
          const merged = [
            ...stateResult.chunks.map((c, i) => ({ chunk: c, score: stateResult.scores[i]! })),
            ...centralResult.chunks.map((c, i) => ({ chunk: c, score: centralResult.scores[i]! })),
          ];

          const seen = new Set<string>();
          const unique = merged.filter((item) => {
            if (seen.has(item.chunk.id)) return false;
            seen.add(item.chunk.id);
            return true;
          });

          unique.sort((a, b) => b.score - a.score);
          const topK = unique.slice(0, maxResults);

          return {
            chunks: topK.map((item) => item.chunk),
            scores: topK.map((item) => item.score),
          };
        }

        // Central-only query
        const centralFilter: RetrievalFilter = {
          equals: { key: 'jurisdiction_scope', value: 'central' },
        };

        return await retrieve(query, centralFilter, maxResults);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[bedrock-kb] Retrieval failed: ${message}`);
        return { chunks: [], scores: [] };
      }
    },
  };
}
