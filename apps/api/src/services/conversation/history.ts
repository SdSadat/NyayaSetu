// =============================================================================
// Conversation History Utilities
// =============================================================================
// Sanitization, truncation, and message-building helpers for multi-turn
// Sahayak conversations. Keeps the conversation module cleanly separated
// from the pipeline and LLM layers.
// =============================================================================

import type { ConversationTurn } from '@nyayasetu/shared-types';
import type { LLMMessage } from '../llm-provider.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of conversation turns (user + assistant) to send to the LLM. */
export const MAX_HISTORY_TURNS = 8; // 4 exchanges

/** Maximum character length for a single turn's content. */
const MAX_TURN_LENGTH = 3000;

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

/**
 * Validate and sanitize conversation history received from the client.
 * Truncates to the most recent turns, strips excessively long content,
 * and ensures proper alternation of user/assistant roles.
 */
export function sanitizeHistory(
  raw: ConversationTurn[] | undefined,
): ConversationTurn[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return [];
  }

  return raw
    .filter((turn) => {
      // Must have valid role and non-empty content
      return (
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.content === 'string' &&
        turn.content.trim().length > 0
      );
    })
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({
      role: turn.role,
      content: turn.content.slice(0, MAX_TURN_LENGTH),
      timestamp: turn.timestamp ?? new Date().toISOString(),
      sources: turn.role === 'assistant' ? turn.sources : undefined,
      jurisdiction: turn.role === 'assistant' ? turn.jurisdiction : undefined,
    }));
}

// ---------------------------------------------------------------------------
// Message building
// ---------------------------------------------------------------------------

/**
 * Build the LLM messages array from conversation history + current user prompt.
 * The history becomes user/assistant message pairs, and the current query
 * (with injected sources) becomes the final user message.
 *
 * @param history         Sanitized conversation turns.
 * @param currentPrompt   The fully-built user prompt for the current query
 *                        (includes sources, entities, jurisdiction).
 * @returns               Messages array ready for `llm.generateWithMessages()`.
 */
export function buildConversationMessages(
  history: ConversationTurn[],
  currentPrompt: string,
): LLMMessage[] {
  const messages: LLMMessage[] = [];

  // Add history turns as alternating user/assistant messages
  for (const turn of history) {
    messages.push({
      role: turn.role,
      content: turn.content,
    });
  }

  // Add the current query with full context (sources, entities, etc.)
  messages.push({
    role: 'user',
    content: currentPrompt,
  });

  return messages;
}

// ---------------------------------------------------------------------------
// Source carryover
// ---------------------------------------------------------------------------

/**
 * Extract section references from previous assistant turns for source carryover.
 * Returns the unique section identifiers that were cited in recent responses,
 * so the retrieval step can prioritize continuity.
 */
export function extractCarryoverSources(
  history: ConversationTurn[],
): string[] {
  const sections = new Set<string>();

  // Only look at the most recent assistant turn
  const lastAssistant = history
    .filter((t) => t.role === 'assistant')
    .at(-1);

  if (lastAssistant?.sources) {
    for (const source of lastAssistant.sources) {
      sections.add(source);
    }
  }

  return Array.from(sections);
}
