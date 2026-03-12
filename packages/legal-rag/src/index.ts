// =============================================================================
// @nyayasetu/legal-rag
// =============================================================================
// Retrieval-Augmented Generation pipeline for legal text.
// Handles chunking, embedding, retrieval, and citation verification.
// =============================================================================

// Chunking
export {
  chunkBareAct,
  chunkLegalDocument,
  DEFAULT_CHUNKING_CONFIG,
  ChunkingConfigSchema,
} from './chunk-strategy.js';
export type { ChunkingConfig, BareActMetadata, LegalDocumentMetadata } from './chunk-strategy.js';

// Embeddings — provider interface
export { EMBEDDING_DIMENSION } from './embeddings.js';
export type { EmbeddingProvider } from './embeddings.js';

// Amazon Nova embeddings (AWS Bedrock — production)
export { createNovaEmbedder } from './nova-embeddings.js';
export type { NovaEmbedderConfig } from './nova-embeddings.js';

// Retrieval
export type {
  RetrievalResult,
  Retriever,
} from './retriever.js';

// ChromaDB vector store
export { ChromaVectorStore, ChromaStoreConfigSchema } from './chroma-store.js';
export type { ChromaStoreConfig, ChromaQueryResult } from './chroma-store.js';

// ChromaDB retriever (local development)
export { createChromaRetriever } from './chroma-retriever.js';

// Bedrock Knowledge Bases retriever (AWS-native production)
export { createBedrockKBRetriever } from './bedrock-kb-retriever.js';
export type { BedrockKBRetrieverConfig } from './bedrock-kb-retriever.js';

// Citation verification
export {
  verifyCitations,
  extractSectionReferences,
} from './citation-verifier.js';
