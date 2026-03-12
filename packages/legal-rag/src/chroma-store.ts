// =============================================================================
// ChromaDB Vector Store
// =============================================================================
// Provides storage and querying of legal text chunks with embeddings via the
// official Chroma SDK. Metadata is still reduced to flat strings, so jurisdiction
// scope/state is split into separate fields.
// =============================================================================

import { z } from 'zod';
import {
  ChromaClient,
  type ChromaClientArgs,
  type Collection,
  type QueryResult,
  type Where,
} from 'chromadb';
import type { LegalChunk, Jurisdiction, LegalSourceType } from '@nyayasetu/shared-types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface ChromaStoreConfig {
  /** URL of the ChromaDB server (e.g. http://localhost:8000). */
  chromaUrl: string;
  /** Name of the ChromaDB collection to use. */
  collectionName: string;
  /** Tenant name for the Chroma deployment. */
  tenant: string;
  /** Database name within the tenant. */
  database: string;
}

export const ChromaStoreConfigSchema = z.object({
  chromaUrl: z.string().url('chromaUrl must be a valid URL'),
  collectionName: z.string().min(1, 'collectionName is required'),
  tenant: z.string().min(1, 'tenant is required'),
  database: z.string().min(1, 'database is required'),
});

// ---------------------------------------------------------------------------
// Query result
// ---------------------------------------------------------------------------

export interface ChromaQueryResult {
  chunks: LegalChunk[];
  scores: number[];
}

// ---------------------------------------------------------------------------
// Metadata stored in Chroma (flat strings only)
// ---------------------------------------------------------------------------

type ChromaChunkMetadata = {
  act: string;
  section: string;
  subSection: string;
  sourceType: string;
  jurisdiction_scope: string;
  jurisdiction_state: string;
  sourceUrl: string;
  verifiedAt: string;
};

// ---------------------------------------------------------------------------
// Jurisdiction helpers
// ---------------------------------------------------------------------------

function flattenJurisdiction(jurisdiction: Jurisdiction) {
  return {
    jurisdiction_scope: jurisdiction.scope,
    jurisdiction_state: jurisdiction.scope === 'state' && jurisdiction.state ? jurisdiction.state : '',
  };
}

function unflattenJurisdiction(scope: string, state: string): Jurisdiction {
  if (scope === 'state' && state) {
    return { scope: 'state', state: state as Jurisdiction['state'] };
  }
  return { scope: 'central' };
}

// ---------------------------------------------------------------------------
// Chroma vector store implementation
// ---------------------------------------------------------------------------

export class ChromaVectorStore {
  private readonly collectionName: string;
  private readonly client: ChromaClient;
  private readonly loggerPrefix = '[ChromaStore]';
  private collection?: Collection;
  private collectionPromise?: Promise<Collection>;

  constructor(config: ChromaStoreConfig) {
    const validated = ChromaStoreConfigSchema.parse(config);
    this.collectionName = validated.collectionName;
    this.client = new ChromaClient({
      ...this.buildClientArgs(validated.chromaUrl),
      tenant: validated.tenant,
      database: validated.database,
    });
  }

  private buildClientArgs(url: string): Partial<ChromaClientArgs> {
    const parsed = new URL(url);
    const isSecure = parsed.protocol === 'https:';
    const hasCustomPath = parsed.pathname && parsed.pathname !== '/';
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : isSecure ? 443 : 8000,
      ssl: isSecure,
      ...(hasCustomPath ? { path: parsed.pathname.replace(/\/+$/, '') } : {}),
    };
  }

  private log(message: string, details?: unknown): void {
    console.debug(`${this.loggerPrefix} ${message}`, details ?? '');
  }

  async initialize(): Promise<void> {
    await this.ensureCollection();
  }

  async store(chunks: LegalChunk[], embeddings: number[][]): Promise<void> {
    if (chunks.length === 0) return;
    if (chunks.length !== embeddings.length) {
      throw new Error(
        `Chunk count (${chunks.length}) does not match embedding count (${embeddings.length}).`,
      );
    }

    const collection = await this.ensureCollection();
    // Chroma requires batch IDs to be unique, so deduplicate by keeping the last occurrence.
    const uniqueRecords = new Map<string, { chunk: LegalChunk; embedding: number[] }>();

    for (let index = 0; index < chunks.length; index += 1) {
      const id = chunks[index].id;
      if (uniqueRecords.has(id)) {
        uniqueRecords.delete(id);
      }
      uniqueRecords.set(id, { chunk: chunks[index], embedding: embeddings[index] });
    }

    const ids: string[] = [];
    const documents: string[] = [];
    const metadatas: ChromaChunkMetadata[] = [];
    const uniqueEmbeddings: number[][] = [];

    uniqueRecords.forEach(({ chunk, embedding }) => {
      ids.push(chunk.id);
      documents.push(chunk.text);
      metadatas.push(this.buildMetadata(chunk));
      uniqueEmbeddings.push(embedding);
    });

    this.log('Upserting chunks', { count: ids.length, duplicatesRemoved: chunks.length - ids.length });
    await collection.upsert({
      ids,
      documents,
      embeddings: uniqueEmbeddings,
      metadatas,
    });
  }

  async query(
    embedding: number[],
    filter?: { jurisdiction?: Jurisdiction; sourceType?: LegalSourceType },
    topK: number = 10,
  ): Promise<ChromaQueryResult> {
    const collection = await this.ensureCollection();
    const where = this.buildWhere(filter);

    this.log('Querying collection', { topK, filter });
    const result = await collection.query<ChromaChunkMetadata>({
      queryEmbeddings: [embedding],
      nResults: topK,
      include: ['documents', 'metadatas', 'distances'],
      ...(where ? { where } : {}),
    });

    return this.buildQueryResult(result);
  }

  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const collection = await this.ensureCollection();
    this.log('Deleting chunks', { ids });
    await collection.delete({ ids });
  }

  async count(): Promise<number> {
    const collection = await this.ensureCollection();
    return collection.count();
  }

  private async ensureCollection(): Promise<Collection> {
    if (this.collection) return this.collection;
    if (!this.collectionPromise) {
      this.log('Creating or fetching collection', { name: this.collectionName });
      this.collectionPromise = this.client.getOrCreateCollection({
        name: this.collectionName,
        configuration: {
          hnsw: { space: 'cosine' },
        },
      });
    }

    const collection = await this.collectionPromise;
    this.collection = collection;
    this.collectionPromise = undefined;
    return collection;
  }

  private buildMetadata(chunk: LegalChunk): ChromaChunkMetadata {
    return {
      act: chunk.act,
      section: chunk.section,
      subSection: chunk.subSection ?? '',
      sourceType: chunk.sourceType,
      ...flattenJurisdiction(chunk.jurisdiction),
      sourceUrl: chunk.sourceUrl,
      verifiedAt: chunk.verifiedAt,
    };
  }

  private buildWhere(
    filter?: { jurisdiction?: Jurisdiction; sourceType?: LegalSourceType },
  ): Where | undefined {
    if (!filter) return undefined;

    const conditions: Where[] = [];

    if (filter.jurisdiction) {
      conditions.push({ jurisdiction_scope: filter.jurisdiction.scope });
      if (filter.jurisdiction.scope === 'state' && filter.jurisdiction.state) {
        conditions.push({ jurisdiction_state: filter.jurisdiction.state });
      }
    }

    if (filter.sourceType) {
      conditions.push({ sourceType: filter.sourceType });
    }

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return { $and: conditions };
  }

  private buildQueryResult(result: QueryResult<ChromaChunkMetadata>): ChromaQueryResult {
    const bucketIndex = 0;
    const ids = result.ids[bucketIndex] ?? [];
    const documents = result.documents[bucketIndex] ?? [];
    const metadatas = result.metadatas[bucketIndex] ?? [];
    const distances = result.distances[bucketIndex] ?? [];

    const chunks: LegalChunk[] = ids.map((id, index) => {
      const raw = metadatas[index] ?? ({} as ChromaChunkMetadata);
      return {
        id,
        text: documents[index] ?? '',
        act: raw.act ?? '',
        section: raw.section ?? '',
        subSection: raw.subSection || undefined,
        jurisdiction: unflattenJurisdiction(
          raw.jurisdiction_scope ?? 'central',
          raw.jurisdiction_state ?? '',
        ),
        sourceType: (raw.sourceType ?? 'bare-act') as LegalSourceType,
        sourceUrl: raw.sourceUrl ?? '',
        verifiedAt: raw.verifiedAt ?? new Date().toISOString(),
      };
    });

    return {
      chunks,
      scores: ids.map((_, index) => {
        const distance = distances[index];
        if (distance == null) {
          return 0;
        }
        return 1 - distance;
      }),
    };
  }
}
