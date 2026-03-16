// =============================================================================
// Conversation Module — Multi-turn Sahayak conversation support
// =============================================================================

export { classifyIntent } from './intent-classifier.js';
export { rewriteQuery, type RewriteResult } from './query-rewriter.js';
export {
  sanitizeHistory,
  buildConversationMessages,
  extractCarryoverSources,
  MAX_HISTORY_TURNS,
} from './history.js';
