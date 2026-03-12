// =============================================================================
// Acquirer Registry
// =============================================================================
// Factory for creating the default acquirer registry with all built-in
// acquirers registered. Extend by registering additional acquirers.
// =============================================================================

import type { Acquirer } from '../types.js';
import { StrategyRegistry } from '../types.js';
import { FileAcquirer } from './file-acquirer.js';
import { UrlAcquirer } from './url-acquirer.js';

/**
 * Creates the default acquirer registry with built-in acquirers:
 * - `pdf` → FileAcquirer
 * - `txt` → FileAcquirer
 * - `url` → UrlAcquirer
 */
export function createDefaultAcquirerRegistry(): StrategyRegistry<Acquirer> {
  const registry = new StrategyRegistry<Acquirer>();
  const fileAcquirer = new FileAcquirer();

  registry.register('pdf', fileAcquirer);
  registry.register('txt', fileAcquirer);
  registry.register('url', new UrlAcquirer());

  return registry;
}

export { FileAcquirer } from './file-acquirer.js';
export { UrlAcquirer } from './url-acquirer.js';
