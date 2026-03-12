// =============================================================================
// @nyayasetu/data-prep — Public API
// =============================================================================
// Re-exports everything consumers of this package need.
// =============================================================================

// Pipeline
export { DataPrepPipeline } from './pipeline.js';
export { createDefaultDependencies, createDefaultPipeline } from './defaults.js';
export { loadConfig } from './config.js';

// Types & schemas
export type {
  // Input
  InputSourceType,
  RawInput,
  InputHints,
  // Stage outputs
  AcquiredContent,
  ExtractedText,
  CleanedText,
  ClassifiedDocument,
  ExtractedMetadata,
  // Final output
  PreparedDocument,
  ProcessingReport,
  // Config
  DataPrepConfig,
  // Strategy interfaces
  LLMProvider,
  LLMRequest,
  LLMResponse,
  Acquirer,
  Extractor,
  TextProcessor,
  DocumentClassifier,
  MetadataExtractorStrategy,
  OutputFormatter,
  // DI
  PipelineDependencies,
  // Batch
  BatchOptions,
  BatchResult,
} from './types.js';

export {
  // Zod schemas
  RawInputSchema,
  ExtractedMetadataSchema,
  DataPrepConfigSchema,
  JurisdictionSchema,
  // Registry
  StrategyRegistry,
  // Errors
  DataPrepError,
  AcquisitionError,
  ExtractionError,
  OllamaError,
  ValidationError,
  // Defaults
  DEFAULT_DATA_PREP_CONFIG,
} from './types.js';

// Acquirers
export { FileAcquirer } from './acquirers/file-acquirer.js';
export { UrlAcquirer } from './acquirers/url-acquirer.js';
export { createDefaultAcquirerRegistry } from './acquirers/index.js';

// Extractors
export { PdfExtractor } from './extractors/pdf-extractor.js';
export { TxtExtractor } from './extractors/txt-extractor.js';
export { HtmlExtractor } from './extractors/html-extractor.js';
export { createDefaultExtractorRegistry } from './extractors/index.js';

// Processors
export { LLMTextCleaner, PassthroughTextCleaner } from './processors/text-cleaner.js';
export { LLMDocumentClassifier, HintDocumentClassifier } from './processors/document-classifier.js';
export { LLMMetadataExtractor, HintMetadataExtractor } from './processors/metadata-extractor.js';

// Validators
export { validateMetadata, validateSections, assertMetadataValid } from './validators/metadata-validator.js';
export type { ValidationResult } from './validators/metadata-validator.js';

// Output formatters
export { BareActFormatter } from './output/bare-act-output.js';
export type { BareActOutput } from './output/bare-act-output.js';
export { JudgmentFormatter } from './output/judgment-output.js';
export type { JudgmentOutput } from './output/judgment-output.js';
export { StateRuleFormatter } from './output/state-rule-output.js';
export type { StateRuleOutput } from './output/state-rule-output.js';

// Ollama
export { OllamaProvider, createOllamaProvider } from './ollama/client.js';
