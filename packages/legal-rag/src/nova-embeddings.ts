// =============================================================================
// Amazon Nova Multimodal Embedding Provider
// =============================================================================
// Implements the EmbeddingProvider interface using Amazon Nova's multimodal
// embedding model via AWS Bedrock.
//
// Model: amazon.nova-embed-multimodal-v1:0 (available in us-east-1)
// Dimensions: 1024 (configurable: 256, 384, 1024, 3072)
// =============================================================================

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import type { EmbeddingProvider } from './embeddings.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface NovaEmbedderConfig {
  /** AWS region (must be us-east-1 for Nova embeddings). */
  region: string;
  /** Embedding dimension: 256, 384, 1024, or 3072. */
  dimension?: number;
  /** AWS credentials (optional — uses default credential chain if omitted). */
  accessKeyId?: string;
  secretAccessKey?: string;
  /** Model ID override. */
  modelId?: string;
  /** Number of texts to embed per batch (to avoid timeouts). */
  batchSize?: number;
}

// ---------------------------------------------------------------------------
// Nova embedding API request/response shapes
// ---------------------------------------------------------------------------

interface NovaEmbedRequest {
  schemaVersion: 'nova-multimodal-embed-v1';
  taskType: 'SINGLE_EMBEDDING';
  singleEmbeddingParams: {
    embeddingPurpose: string;
    embeddingDimension: number;
    text: {
      truncationMode: 'END';
      value: string;
    };
  };
}

interface NovaEmbedResponse {
  embeddings: Array<{
    embeddingType: string;
    embedding: number[];
    truncatedCharLength?: number;
  }>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an {@link EmbeddingProvider} backed by Amazon Nova Multimodal Embeddings
 * via AWS Bedrock.
 *
 * @example
 * ```ts
 * const embedder = createNovaEmbedder({
 *   region: 'us-east-1',
 *   dimension: 1024,
 * });
 * const vectors = await embedder.embed(['Section 302 of IPC...']);
 * ```
 */
export function createNovaEmbedder(config: NovaEmbedderConfig): EmbeddingProvider {
  const dimension = config.dimension ?? 1024;
  const modelId = config.modelId ?? 'amazon.nova-embed-multimodal-v1:0';
  const batchSize = config.batchSize ?? 10;

  const client = new BedrockRuntimeClient({
    region: config.region,
    ...(config.accessKeyId && config.secretAccessKey
      ? {
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
        }
      : {}),
  });

  async function embedSingle(text: string): Promise<number[]> {
    const body: NovaEmbedRequest = {
      schemaVersion: 'nova-multimodal-embed-v1',
      taskType: 'SINGLE_EMBEDDING',
      singleEmbeddingParams: {
        embeddingPurpose: 'GENERIC_INDEX',
        embeddingDimension: dimension,
        text: {
          truncationMode: 'END',
          value: text,
        },
      },
    };

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(
      new TextDecoder().decode(response.body),
    ) as NovaEmbedResponse;

    if (!responseBody.embeddings || responseBody.embeddings.length === 0) {
      throw new Error('Nova embedding returned no embeddings.');
    }

    return responseBody.embeddings[0].embedding;
  }

  return {
    async embed(texts: string[]): Promise<number[][]> {
      if (texts.length === 0) return [];

      const allEmbeddings: number[][] = [];

      // Process in batches to avoid overwhelming the API
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        if (texts.length > batchSize) {
          console.log(
            `[nova-embed] Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} texts)`,
          );
        }

        // Nova embedding API processes one text at a time
        const batchResults = await Promise.all(
          batch.map((text) => embedSingle(text)),
        );
        allEmbeddings.push(...batchResults);
      }

      return allEmbeddings;
    },
  };
}
