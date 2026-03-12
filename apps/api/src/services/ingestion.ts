// =============================================================================
// Data Ingestion Service
// =============================================================================
// Handles ingestion of legal documents (bare acts, court judgments, state rules)
// into the vector database for retrieval by the Sahayak pipeline.
//
// Ingestion pipeline:
//   1. Read the raw document file.
//   2. Chunk the document into section-level pieces using @nyayasetu/legal-rag.
//   3. Generate embeddings for each chunk using Amazon Nova (Bedrock).
//   4. Store the chunks with embeddings in the vector database.
//
// This service is designed to be called from a CLI tool or Cloud Function
// triggered by document uploads to Cloud Storage.
// =============================================================================

import { readFile } from 'node:fs/promises';
import type { Jurisdiction, LegalChunk, LegalSourceType } from '@nyayasetu/shared-types';
import { chunkBareAct, chunkLegalDocument } from '@nyayasetu/legal-rag';
import type { BareActMetadata, LegalDocumentMetadata } from '@nyayasetu/legal-rag';
import { getEmbedder, getVectorStore } from './vector-store.js';

// ---------------------------------------------------------------------------
// Ingestion parameters
// ---------------------------------------------------------------------------

export interface IngestBareActParams {
  /** Path to the raw text file containing the bare act. */
  filePath: string;
  /** Name of the act (e.g., "Indian Penal Code, 1860"). */
  act: string;
  /** Jurisdiction for this act. */
  jurisdiction: Jurisdiction;
  /** Optional source URL for citation traceability. */
  sourceUrl?: string;
}

// ---------------------------------------------------------------------------
// Ingestion result
// ---------------------------------------------------------------------------

export interface IngestionResult {
  /** Whether the ingestion completed successfully. */
  success: boolean;
  /** Number of chunks produced and stored. */
  chunksIngested: number;
  /** Any errors encountered during the process. */
  errors: string[];
}

// ---------------------------------------------------------------------------
// File reader
// ---------------------------------------------------------------------------

/**
 * Read the raw text content of a document file.
 *
 * Supports local filesystem paths. Production can add S3 support.
 */
async function readDocumentFile(filePath: string): Promise<string> {
  // TODO: Add S3 support for s3:// URIs in production.
  return readFile(filePath, 'utf-8');
}

// ---------------------------------------------------------------------------
// Vector database storage
// ---------------------------------------------------------------------------

/**
 * Store chunked legal text with embeddings in the vector database.
 * Uses ChromaDB for vector storage.
 */
async function storeInVectorDB(
  chunks: LegalChunk[],
  embeddings: number[][],
): Promise<void> {
  const store = await getVectorStore();
  await store.store(chunks, embeddings);
}

// ---------------------------------------------------------------------------
// Main ingestion function
// ---------------------------------------------------------------------------

/**
 * Ingest a bare act document into the vector database.
 *
 * This is the primary ingestion entry point. It reads the document file,
 * chunks it into section-level pieces with full metadata, generates
 * embeddings for each chunk, and stores the results in the vector database.
 *
 * @param params - The ingestion parameters including file path, act name,
 *                 and jurisdiction.
 *
 * @example
 * ```ts
 * await ingestBareAct({
 *   filePath: 'gs://nyayasetu-legal-docs/bare-acts/ipc-1860.txt',
 *   act: 'Indian Penal Code, 1860',
 *   jurisdiction: { scope: 'central' },
 *   sourceUrl: 'https://indiacode.nic.in/handle/123456789/2263',
 * });
 * ```
 */
export async function ingestBareAct(params: IngestBareActParams): Promise<IngestionResult> {
  const { filePath, act, jurisdiction, sourceUrl } = params;
  const errors: string[] = [];

  // -------------------------------------------------------------------------
  // Step 1: Read the raw document
  // -------------------------------------------------------------------------
  let rawText: string;
  try {
    rawText = await readDocumentFile(filePath);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      chunksIngested: 0,
      errors: [`Failed to read file "${filePath}": ${message}`],
    };
  }

  if (rawText.trim().length === 0) {
    return {
      success: false,
      chunksIngested: 0,
      errors: ['Document file is empty.'],
    };
  }

  // -------------------------------------------------------------------------
  // Step 2: Chunk the document
  // -------------------------------------------------------------------------
  const metadata: BareActMetadata = {
    act,
    jurisdiction,
    sourceUrl: sourceUrl ?? '',
  };

  let chunks: LegalChunk[];
  try {
    chunks = chunkBareAct(rawText, metadata);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      chunksIngested: 0,
      errors: [`Failed to chunk document: ${message}`],
    };
  }

  if (chunks.length === 0) {
    return {
      success: false,
      chunksIngested: 0,
      errors: ['Document produced zero chunks after processing.'],
    };
  }

  console.log(
    `[ingestion] Chunked "${act}" into ${chunks.length} pieces.`,
  );

  // -------------------------------------------------------------------------
  // Step 3: Generate embeddings
  // -------------------------------------------------------------------------
  const embedder = getEmbedder();

  let embeddings: number[][];
  try {
    const texts = chunks.map((c) => c.text);
    embeddings = await embedder.embed(texts);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      chunksIngested: 0,
      errors: [`Failed to generate embeddings: ${message}`],
    };
  }

  console.log(
    `[ingestion] Generated ${embeddings.length} embeddings for "${act}".`,
  );

  // -------------------------------------------------------------------------
  // Step 4: Store in vector database
  // -------------------------------------------------------------------------
  try {
    await storeInVectorDB(chunks, embeddings);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      chunksIngested: 0,
      errors: [`Failed to store in vector DB: ${message}`],
    };
  }

  console.log(
    `[ingestion] Successfully ingested ${chunks.length} chunks for "${act}".`,
  );

  return {
    success: errors.length === 0,
    chunksIngested: chunks.length,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Prepared document ingestion (data-prep → ingestion bridge)
// ---------------------------------------------------------------------------

/**
 * Parameters for ingesting a document that has already been processed
 * by the @nyayasetu/data-prep pipeline. Accepts text directly — no file
 * read step needed.
 */
export interface IngestPreparedDocumentParams {
  /** Cleaned text content (already extracted and processed by data-prep). */
  text: string;
  /** Document title (act name, case title, rule name). */
  title: string;
  /** Document type for chunking strategy selection. */
  sourceType: LegalSourceType;
  /** Jurisdiction metadata. */
  jurisdiction: Jurisdiction;
  /** Source URL for citation traceability. */
  sourceUrl: string;
}

/**
 * Ingest a prepared document into the vector database.
 *
 * This is the bridge between the data-prep pipeline and the vector store.
 * Unlike {@link ingestBareAct}, it accepts pre-processed text directly,
 * skipping the file-read step. It handles all 4 document types by
 * delegating to the appropriate chunking strategy.
 *
 * @param params - The prepared document parameters.
 *
 * @example
 * ```ts
 * import { createDefaultPipeline } from '@nyayasetu/data-prep';
 *
 * const pipeline = createDefaultPipeline();
 * const prepared = await pipeline.prepare({ sourceType: 'pdf', location: './ipc.pdf' });
 *
 * await ingestPreparedDocument({
 *   text: prepared.text,
 *   title: prepared.metadata.title,
 *   sourceType: prepared.documentType,
 *   jurisdiction: prepared.metadata.jurisdiction,
 *   sourceUrl: prepared.metadata.sourceUrl,
 * });
 * ```
 */
export async function ingestPreparedDocument(
  params: IngestPreparedDocumentParams,
): Promise<IngestionResult> {
  const { text, title, sourceType, jurisdiction, sourceUrl } = params;

  if (text.trim().length === 0) {
    return {
      success: false,
      chunksIngested: 0,
      errors: ['Prepared document text is empty.'],
    };
  }

  // -------------------------------------------------------------------------
  // Step 1: Chunk the document using type-appropriate strategy
  // -------------------------------------------------------------------------
  const docMetadata: LegalDocumentMetadata = {
    title,
    jurisdiction,
    sourceType,
    sourceUrl,
  };

  let chunks: LegalChunk[];
  try {
    chunks = chunkLegalDocument(text, docMetadata);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      chunksIngested: 0,
      errors: [`Failed to chunk document: ${message}`],
    };
  }

  if (chunks.length === 0) {
    return {
      success: false,
      chunksIngested: 0,
      errors: ['Document produced zero chunks after processing.'],
    };
  }

  console.log(
    `[ingestion] Chunked "${title}" (${sourceType}) into ${chunks.length} pieces.`,
  );

  // -------------------------------------------------------------------------
  // Step 2: Generate embeddings
  // -------------------------------------------------------------------------
  const embedder = getEmbedder();

  let embeddings: number[][];
  try {
    const texts = chunks.map((c) => c.text);
    embeddings = await embedder.embed(texts);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      chunksIngested: 0,
      errors: [`Failed to generate embeddings: ${message}`],
    };
  }

  console.log(
    `[ingestion] Generated ${embeddings.length} embeddings for "${title}".`,
  );

  // -------------------------------------------------------------------------
  // Step 3: Store in vector database
  // -------------------------------------------------------------------------
  try {
    await storeInVectorDB(chunks, embeddings);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      chunksIngested: 0,
      errors: [`Failed to store in vector DB: ${message}`],
    };
  }

  console.log(
    `[ingestion] Successfully ingested ${chunks.length} chunks for "${title}" (${sourceType}).`,
  );

  return {
    success: true,
    chunksIngested: chunks.length,
    errors: [],
  };
}
