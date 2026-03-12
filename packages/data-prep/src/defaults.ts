// =============================================================================
// Composition Root — Default Dependency Wiring
// =============================================================================
// This is the ONLY file that imports concrete strategy implementations and
// wires them together into a PipelineDependencies object.
//
// To swap any component:
//   1. Create your new implementation (e.g., OpenAIProvider)
//   2. Either modify this file, or construct PipelineDependencies yourself
//   3. The pipeline never needs to change
// =============================================================================

import type { PipelineDependencies, DataPrepConfig, InputHints } from './types.js';
import { loadConfig } from './config.js';
import { createOllamaProvider } from './ollama/client.js';
import { createDefaultAcquirerRegistry } from './acquirers/index.js';
import { createDefaultExtractorRegistry } from './extractors/index.js';
import { LLMTextCleaner, PassthroughTextCleaner } from './processors/text-cleaner.js';
import {
  LLMDocumentClassifier,
  HintDocumentClassifier,
} from './processors/document-classifier.js';
import {
  LLMMetadataExtractor,
  HintMetadataExtractor,
} from './processors/metadata-extractor.js';
import { DataPrepPipeline } from './pipeline.js';

/**
 * Creates the default set of pipeline dependencies.
 *
 * In offline mode or when hints are provided, LLM-based processors
 * are replaced with passthrough / hint-based alternatives.
 *
 * @param configOverrides - Optional config overrides (from CLI flags, etc.)
 * @param hints - Optional input hints for offline classifiers
 */
export function createDefaultDependencies(
  configOverrides?: Partial<DataPrepConfig>,
  hints?: InputHints,
): PipelineDependencies {
  const config = loadConfig(configOverrides);
  const llmProvider = createOllamaProvider(config);

  const acquirers = createDefaultAcquirerRegistry();
  const extractors = createDefaultExtractorRegistry();

  // Choose processors based on offline mode
  const textProcessor = config.offlineMode
    ? new PassthroughTextCleaner()
    : new LLMTextCleaner(llmProvider);

  const documentClassifier = config.offlineMode
    ? new HintDocumentClassifier(hints ?? {})
    : new LLMDocumentClassifier(llmProvider);

  const metadataExtractor = config.offlineMode
    ? new HintMetadataExtractor()
    : new LLMMetadataExtractor(llmProvider);

  return {
    acquirers,
    extractors,
    textProcessor,
    documentClassifier,
    metadataExtractor,
    llmProvider,
    config,
  };
}

/**
 * Creates a fully wired pipeline with default dependencies.
 * Convenience function for the common case.
 */
export function createDefaultPipeline(
  configOverrides?: Partial<DataPrepConfig>,
  hints?: InputHints,
): DataPrepPipeline {
  const deps = createDefaultDependencies(configOverrides, hints);
  return new DataPrepPipeline(deps);
}
