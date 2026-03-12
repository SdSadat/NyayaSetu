// =============================================================================
// NyayaSetu API — Configuration
// =============================================================================
// Reads environment variables and exports a strongly-typed configuration
// object. All infrastructure runs on AWS: Nova LLM + Embeddings via Bedrock,
// DynamoDB for persistence, ChromaDB for vector storage.
// =============================================================================

import { DEFAULT_SAFETY_CONFIG } from '@nyayasetu/shared-types';
import type { SafetyConfig } from '@nyayasetu/shared-types';
import { configDotenv } from 'dotenv';

configDotenv();

// ---------------------------------------------------------------------------
// Configuration interface
// ---------------------------------------------------------------------------

export interface AppConfig {
  /** Port the HTTP server listens on. */
  port: number;
  /** Host the HTTP server binds to. */
  host: string;
  /** Allowed CORS origin(s). */
  corsOrigin: string;
  /** Application version. */
  version: string;

  /** AWS settings for Bedrock (Nova LLM + embeddings) and DynamoDB. */
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    /** Nova LLM model ID on Bedrock. */
    novaModelId: string;
    /** Nova embedding model ID on Bedrock. */
    novaEmbeddingModelId: string;
    /** Embedding dimension (256, 384, 1024, or 3072). */
    novaEmbeddingDimension: number;
    /** Request timeout for Nova LLM calls. */
    novaTimeoutMs: number;
    /** AWS region for Nova embeddings (must be us-east-1). */
    novaEmbeddingRegion: string;
  };

  /** Bedrock Knowledge Base for vector retrieval (AWS-native). */
  knowledgeBase: {
    /** Knowledge Base ID. If set, uses Bedrock KB instead of ChromaDB. */
    knowledgeBaseId: string;
  };

  /** ChromaDB settings for local development fallback. */
  chroma: {
    url: string;
    collectionName: string;
    tenant: string;
    database: string;
  };

  /** DynamoDB settings for persistence. */
  dynamodb: {
    /** Drishti history table name. If empty, DynamoDB is disabled. */
    tableName: string;
    /** Users table name. */
    usersTableName: string;
    /** User progress table name. */
    progressTableName: string;
    /** Days before a history record is automatically deleted (TTL). */
    historyTtlDays: number;
  };

  /** JWT authentication settings. */
  jwt: {
    secret: string;
    expiresIn: string;
  };

  /** Safety thresholds for the query pipeline. */
  safety: SafetyConfig;
}

// ---------------------------------------------------------------------------
// Environment variable helpers
// ---------------------------------------------------------------------------

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function envNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function envBoolean(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  return raw === 'true' || raw === '1';
}

// ---------------------------------------------------------------------------
// Exported configuration
// ---------------------------------------------------------------------------

export const config: AppConfig = {
  port: envNumber('API_PORT', 3001),
  host: envString('API_HOST', '0.0.0.0'),
  corsOrigin: envString('CORS_ORIGIN', '*'),
  version: envString('APP_VERSION', '0.1.0'),

  aws: {
    region: envString('AWS_REGION', 'us-east-1'),
    accessKeyId: envString('AWS_ACCESS_KEY_ID', ''),
    secretAccessKey: envString('AWS_SECRET_ACCESS_KEY', ''),
    novaModelId: envString('AWS_NOVA_MODEL_ID', 'us.amazon.nova-lite-v1:0'),
    novaEmbeddingModelId: envString('AWS_NOVA_EMBEDDING_MODEL_ID', 'amazon.nova-embed-multimodal-v1:0'),
    novaEmbeddingDimension: envNumber('AWS_NOVA_EMBEDDING_DIMENSION', 1024),
    novaTimeoutMs: envNumber('AWS_NOVA_TIMEOUT_MS', 240_000),
    novaEmbeddingRegion: envString('AWS_NOVA_EMBEDDING_REGION', 'us-east-1'),
  },

  knowledgeBase: {
    knowledgeBaseId: envString('BEDROCK_KB_ID', ''),
  },

  chroma: {
    url: envString('CHROMA_URL', 'http://localhost:8000'),
    collectionName: envString('CHROMA_COLLECTION', 'legal_chunks'),
    tenant: envString('CHROMA_TENANT', 'default_tenant'),
    database: envString('CHROMA_DATABASE', 'default_database'),
  },

  dynamodb: {
    tableName: envString('DYNAMODB_TABLE_NAME', 'NyayaSetu-DrishtiHistory'),
    usersTableName: envString('DYNAMODB_USERS_TABLE', 'NyayaSetu-Users'),
    progressTableName: envString('DYNAMODB_PROGRESS_TABLE', 'NyayaSetu-UserProgress'),
    historyTtlDays: envNumber('DYNAMODB_HISTORY_TTL_DAYS', 30),
  },

  jwt: {
    secret: envString('JWT_SECRET', 'nyayasetu-dev-secret-change-me'),
    expiresIn: envString('JWT_EXPIRES_IN', '7d'),
  },

  safety: {
    certaintyThreshold: envNumber(
      'SAFETY_CERTAINTY_THRESHOLD',
      DEFAULT_SAFETY_CONFIG.certaintyThreshold,
    ),
    maxRetrievalResults: envNumber(
      'SAFETY_MAX_RETRIEVAL_RESULTS',
      DEFAULT_SAFETY_CONFIG.maxRetrievalResults,
    ),
    refuseOnNoSource: envBoolean(
      'SAFETY_REFUSE_ON_NO_SOURCE',
      DEFAULT_SAFETY_CONFIG.refuseOnNoSource,
    ),
  },
};
