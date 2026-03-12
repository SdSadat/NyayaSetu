// =============================================================================
// Data Preparation Pipeline — Configuration
// =============================================================================

import {
  type DataPrepConfig,
  DEFAULT_DATA_PREP_CONFIG,
  DataPrepConfigSchema,
} from './types.js';

/**
 * Build a {@link DataPrepConfig} from environment variables, falling back
 * to sensible defaults. Override individual fields with the `overrides`
 * parameter (typically from CLI flags).
 */
export function loadConfig(
  overrides?: Partial<DataPrepConfig>,
): DataPrepConfig {
  const raw: DataPrepConfig = {
    ollamaBaseUrl:
      overrides?.ollamaBaseUrl ??
      process.env['OLLAMA_BASE_URL'] ??
      DEFAULT_DATA_PREP_CONFIG.ollamaBaseUrl,

    ollamaModel:
      overrides?.ollamaModel ??
      process.env['OLLAMA_MODEL'] ??
      DEFAULT_DATA_PREP_CONFIG.ollamaModel,

    ollamaTimeoutMs:
      overrides?.ollamaTimeoutMs ??
      (process.env['OLLAMA_TIMEOUT_MS']
        ? Number(process.env['OLLAMA_TIMEOUT_MS'])
        : DEFAULT_DATA_PREP_CONFIG.ollamaTimeoutMs),

    maxDocumentSize:
      overrides?.maxDocumentSize ??
      (process.env['MAX_DOCUMENT_SIZE']
        ? Number(process.env['MAX_DOCUMENT_SIZE'])
        : DEFAULT_DATA_PREP_CONFIG.maxDocumentSize),

    offlineMode:
      overrides?.offlineMode ??
      (process.env['OFFLINE_MODE'] !== undefined
        ? process.env['OFFLINE_MODE'] === 'true'
        : DEFAULT_DATA_PREP_CONFIG.offlineMode),
  };

  return DataPrepConfigSchema.parse(raw);
}
