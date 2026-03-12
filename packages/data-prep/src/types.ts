// =============================================================================
// Data Preparation Pipeline — Types
// =============================================================================
// All types and Zod schemas for the data preparation pipeline. These define
// the contracts between pipeline stages.
// =============================================================================

import { z } from 'zod';
import type { Jurisdiction, LegalSourceType } from '@nyayasetu/shared-types';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

/** Supported raw input formats. */
export type InputSourceType = 'pdf' | 'txt' | 'url';

/** A raw input to the pipeline. */
export interface RawInput {
  sourceType: InputSourceType;
  /** File path (for pdf/txt) or URL (for url). */
  location: string;
  /** Optional hints to skip LLM-based detection stages. */
  hints?: InputHints;
}

/** User-provided metadata hints that bypass Ollama-based extraction. */
export interface InputHints {
  actName?: string;
  jurisdiction?: Jurisdiction;
  documentType?: LegalSourceType;
  sourceUrl?: string;
}

export const JurisdictionSchema = z.object({
  scope: z.enum(['central', 'state']),
  state: z.enum(['west-bengal', 'jharkhand']).optional(),
});

export const RawInputSchema = z.object({
  sourceType: z.enum(['pdf', 'txt', 'url']),
  location: z.string().min(1, 'location is required'),
  hints: z
    .object({
      actName: z.string().optional(),
      jurisdiction: JurisdictionSchema.optional(),
      documentType: z
        .enum(['bare-act', 'supreme-court', 'high-court', 'state-rule'])
        .optional(),
      sourceUrl: z.string().url().optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Stage output types
// ---------------------------------------------------------------------------

/** Stage 1 output: raw content loaded from source. */
export interface AcquiredContent {
  rawContent: Buffer | string;
  contentType: 'application/pdf' | 'text/plain' | 'text/html';
  sourceLocation: string;
  /** For URLs: the final resolved URL after redirects. */
  resolvedUrl?: string;
}

/** Stage 2 output: plain text extracted from raw content. */
export interface ExtractedText {
  text: string;
  pageCount?: number;
  sourceLocation: string;
  resolvedUrl?: string;
}

/** Stage 3 output: text with noise removed. */
export interface CleanedText {
  text: string;
  /** Human-readable description of what was cleaned. */
  cleaningReport: string[];
  sourceLocation: string;
}

/** Stage 4 output: classified document. */
export interface ClassifiedDocument {
  text: string;
  documentType: LegalSourceType;
  confidence: number;
  sourceLocation: string;
}

/** Stage 5 output: structured metadata. */
export interface ExtractedMetadata {
  title: string;
  shortName: string;
  jurisdiction: Jurisdiction;
  sourceUrl: string;
  /** For judgments: case citation (e.g. "(1999) 5 SCC 607"). */
  caseCitation?: string;
  /** For judgments: court name. */
  court?: string;
  /** For judgments: date in YYYY-MM-DD. */
  dateOfJudgment?: string;
  /** Year of the act/rule (e.g. 1988). */
  year?: number;
}

export const ExtractedMetadataSchema = z.object({
  title: z.string().min(1),
  shortName: z.string().min(1),
  jurisdiction: JurisdictionSchema,
  sourceUrl: z.string().min(1),
  caseCitation: z.string().optional(),
  court: z.string().optional(),
  dateOfJudgment: z.string().optional(),
  year: z.number().int().optional(),
});

// ---------------------------------------------------------------------------
// Final output
// ---------------------------------------------------------------------------

/** A fully prepared document ready for ingestion. */
export interface PreparedDocument {
  text: string;
  metadata: ExtractedMetadata;
  documentType: LegalSourceType;
  processingReport: ProcessingReport;
}

/** Audit trail of how the document was processed. */
export interface ProcessingReport {
  input: RawInput;
  stagesExecuted: string[];
  timings: Record<string, number>;
  warnings: string[];
  ollamaUsed: boolean;
  ollamaModel?: string;
}

// ---------------------------------------------------------------------------
// Pipeline configuration
// ---------------------------------------------------------------------------

export interface DataPrepConfig {
  /** Ollama API base URL. */
  ollamaBaseUrl: string;
  /** Ollama model for text tasks. */
  ollamaModel: string;
  /** Request timeout for Ollama calls (ms). */
  ollamaTimeoutMs: number;
  /** Maximum document size in characters before warning. */
  maxDocumentSize: number;
  /** Skip Ollama entirely; require manual hints for all metadata. */
  offlineMode: boolean;
}

export const DEFAULT_DATA_PREP_CONFIG: DataPrepConfig = {
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'mistral',
  ollamaTimeoutMs: 120_000,
  maxDocumentSize: 500_000,
  offlineMode: false,
};

export const DataPrepConfigSchema = z.object({
  ollamaBaseUrl: z.string().url(),
  ollamaModel: z.string().min(1),
  ollamaTimeoutMs: z.number().int().positive(),
  maxDocumentSize: z.number().int().positive(),
  offlineMode: z.boolean(),
});

// ---------------------------------------------------------------------------
// Strategy Interfaces — The swappable "blocks"
// ---------------------------------------------------------------------------
// Every stage of the pipeline is defined by an interface. Implementations
// can be swapped without touching the pipeline orchestrator. This enables:
//   - Replacing Ollama with OpenAI/Vertex AI/Anthropic
//   - Adding new source types (DOCX, OCR images)
//   - Plugging in custom extractors for specific legal websites
//   - Testing with mock implementations

/** Abstracts the LLM backend. Swap Ollama for any other provider. */
export interface LLMProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
  isAvailable(): Promise<boolean>;
  readonly modelName: string;
}

export interface LLMRequest {
  prompt: string;
  system?: string;
  /** Request JSON-formatted output. */
  format?: 'json';
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export interface LLMResponse {
  text: string;
  durationMs: number;
}

/** Stage 1 strategy: loads raw content from a source location. */
export interface Acquirer {
  acquire(location: string): Promise<AcquiredContent>;
  /** Human-readable name for logging/reports. */
  readonly name: string;
}

/** Stage 2 strategy: converts raw content into plain text. */
export interface Extractor {
  extract(content: AcquiredContent): Promise<ExtractedText>;
  /** Human-readable name for logging/reports. */
  readonly name: string;
}

/** Stage 3 strategy: cleans noisy text (headers, footers, column artifacts). */
export interface TextProcessor {
  process(text: ExtractedText): Promise<CleanedText>;
  readonly name: string;
}

/** Stage 4 strategy: classifies a document by type. */
export interface DocumentClassifier {
  classify(text: CleanedText): Promise<ClassifiedDocument>;
  readonly name: string;
}

/** Stage 5 strategy: extracts structured metadata from document text. */
export interface MetadataExtractorStrategy {
  extract(
    doc: ClassifiedDocument,
    hints?: InputHints,
  ): Promise<ExtractedMetadata>;
  readonly name: string;
}

/** Stage 7 strategy: formats a PreparedDocument for a specific ingestion target. */
export interface OutputFormatter<T> {
  format(doc: PreparedDocument): T;
  readonly targetType: string;
}

// ---------------------------------------------------------------------------
// Registry — plug-in system for strategies
// ---------------------------------------------------------------------------

/**
 * A typed registry for mapping keys to strategy implementations.
 * Used by the pipeline to look up acquirers, extractors, etc.
 */
export class StrategyRegistry<T> {
  private readonly strategies = new Map<string, T>();

  register(key: string, strategy: T): void {
    this.strategies.set(key, strategy);
  }

  get(key: string): T | undefined {
    return this.strategies.get(key);
  }

  getOrThrow(key: string, label: string): T {
    const strategy = this.strategies.get(key);
    if (!strategy) {
      throw new DataPrepError(
        `No ${label} registered for key "${key}". ` +
          `Available: [${[...this.strategies.keys()].join(', ')}]`,
        'registry',
      );
    }
    return strategy;
  }

  keys(): string[] {
    return [...this.strategies.keys()];
  }
}

// ---------------------------------------------------------------------------
// Pipeline dependencies — injected into the orchestrator
// ---------------------------------------------------------------------------

/**
 * All swappable dependencies the pipeline needs. Pass this to the
 * pipeline constructor to wire up your chosen implementations.
 */
export interface PipelineDependencies {
  acquirers: StrategyRegistry<Acquirer>;
  extractors: StrategyRegistry<Extractor>;
  textProcessor: TextProcessor;
  documentClassifier: DocumentClassifier;
  metadataExtractor: MetadataExtractorStrategy;
  llmProvider: LLMProvider;
  config: DataPrepConfig;
}

// ---------------------------------------------------------------------------
// Batch processing
// ---------------------------------------------------------------------------

export interface BatchOptions {
  /** Max concurrent documents to process. Default: 1 (serial). */
  concurrency: number;
  /** Continue processing remaining documents if one fails. */
  continueOnError: boolean;
}

export interface BatchResult {
  input: RawInput;
  result: PreparedDocument | null;
  error: string | null;
  timingMs: number;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class DataPrepError extends Error {
  constructor(
    message: string,
    public readonly stage: string,
    public readonly cause?: Error,
  ) {
    super(`[data-prep:${stage}] ${message}`);
    this.name = 'DataPrepError';
  }
}

export class AcquisitionError extends DataPrepError {
  constructor(message: string, cause?: Error) {
    super(message, 'acquire', cause);
  }
}

export class ExtractionError extends DataPrepError {
  constructor(message: string, cause?: Error) {
    super(message, 'extract', cause);
  }
}

export class OllamaError extends DataPrepError {
  constructor(message: string, stage: string, cause?: Error) {
    super(message, stage, cause);
  }
}

export class ValidationError extends DataPrepError {
  constructor(
    message: string,
    public readonly zodErrors?: z.ZodError,
  ) {
    super(message, 'validate');
  }
}
