// =============================================================================
// Extractor Registry
// =============================================================================
// Factory for creating the default extractor registry, mapping content types
// to their respective extractor implementations.
// =============================================================================

import type { Extractor } from '../types.js';
import { StrategyRegistry } from '../types.js';
import { PdfExtractor } from './pdf-extractor.js';
import { TxtExtractor } from './txt-extractor.js';
import { HtmlExtractor } from './html-extractor.js';

/**
 * Creates the default extractor registry keyed by MIME content type:
 * - `application/pdf` → PdfExtractor
 * - `text/plain`      → TxtExtractor
 * - `text/html`       → HtmlExtractor
 */
export function createDefaultExtractorRegistry(): StrategyRegistry<Extractor> {
  const registry = new StrategyRegistry<Extractor>();

  registry.register('application/pdf', new PdfExtractor());
  registry.register('text/plain', new TxtExtractor());
  registry.register('text/html', new HtmlExtractor());

  return registry;
}

export { PdfExtractor } from './pdf-extractor.js';
export { TxtExtractor } from './txt-extractor.js';
export { HtmlExtractor } from './html-extractor.js';
