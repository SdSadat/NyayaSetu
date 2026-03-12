// =============================================================================
// Vector Store Singletons
// =============================================================================
// Lazy-initialized singletons for the retriever and embedding provider.
//
// When BEDROCK_KB_ID is set, uses Bedrock Knowledge Bases (AWS-native).
// Otherwise falls back to ChromaDB + Nova embeddings for local development.
// =============================================================================

import {
  createNovaEmbedder,
  ChromaVectorStore,
  createChromaRetriever,
  createBedrockKBRetriever,
} from '@nyayasetu/legal-rag';
import type { EmbeddingProvider, Retriever } from '@nyayasetu/legal-rag';
import { config } from '../config/index.js';

// ---------------------------------------------------------------------------
// Singleton instances (lazy)
// ---------------------------------------------------------------------------

let _embedder: EmbeddingProvider | null = null;
let _vectorStore: ChromaVectorStore | null = null;
let _retriever: Retriever | null = null;

// ---------------------------------------------------------------------------
// Embedder (used by ChromaDB path and ingestion)
// ---------------------------------------------------------------------------

export function getEmbedder(): EmbeddingProvider {
  if (!_embedder) {
    _embedder = createNovaEmbedder({
      region: config.aws.novaEmbeddingRegion,
      dimension: config.aws.novaEmbeddingDimension,
      modelId: config.aws.novaEmbeddingModelId,
      accessKeyId: config.aws.accessKeyId || undefined,
      secretAccessKey: config.aws.secretAccessKey || undefined,
    });
    console.log('[vector-store] Using Amazon Nova embeddings (Bedrock)');
  }
  return _embedder;
}

// ---------------------------------------------------------------------------
// Vector Store (ChromaDB — local development fallback)
// ---------------------------------------------------------------------------

let _storeInitPromise: Promise<void> | null = null;

export async function getVectorStore(): Promise<ChromaVectorStore> {
  if (!_vectorStore) {
    _vectorStore = new ChromaVectorStore({
      chromaUrl: config.chroma.url,
      collectionName: config.chroma.collectionName,
      tenant: config.chroma.tenant,
      database: config.chroma.database,
    });
    _storeInitPromise = _vectorStore.initialize();
  }

  await _storeInitPromise;
  return _vectorStore;
}

// ---------------------------------------------------------------------------
// Retriever — Bedrock KB (primary) or ChromaDB (fallback)
// ---------------------------------------------------------------------------

export async function getRetriever(): Promise<Retriever> {
  if (!_retriever) {
    if (config.knowledgeBase.knowledgeBaseId) {
      // AWS-native: Bedrock Knowledge Bases
      _retriever = createBedrockKBRetriever({
        knowledgeBaseId: config.knowledgeBase.knowledgeBaseId,
        region: config.aws.region,
        maxResults: config.safety.maxRetrievalResults,
        accessKeyId: config.aws.accessKeyId || undefined,
        secretAccessKey: config.aws.secretAccessKey || undefined,
      });
      console.log('[vector-store] Using Bedrock Knowledge Bases retriever');
    } else {
      // Local dev fallback: ChromaDB + Nova embeddings
      const store = await getVectorStore();
      const embedder = getEmbedder();
      _retriever = createChromaRetriever(
        store,
        embedder,
        config.safety.maxRetrievalResults,
      );
      console.log('[vector-store] Using ChromaDB retriever (local fallback)');
    }
  }
  return _retriever;
}
