// =============================================================================
// Query Rewriter — Expands follow-up queries into standalone questions
// =============================================================================
// When a user asks "What about my car?" after discussing phone searches,
// this module rewrites it to: "Can police search my car without a warrant?"
//
// Uses a lightweight LLM call with a minimal prompt. Only invoked for
// follow-up queries — new topics skip this step entirely.
// =============================================================================

import type { ConversationTurn } from '@nyayasetu/shared-types';
import type { LLMProvider } from '../llm-provider.js';

// ---------------------------------------------------------------------------
// Rewrite prompt
// ---------------------------------------------------------------------------

const REWRITE_SYSTEM_PROMPT = `You are a query rewriter for a legal Q&A system. Your job is to expand ambiguous follow-up questions into complete, standalone legal questions by incorporating context from the conversation history.

Rules:
- Output ONLY the rewritten question — no explanation, no preamble, no quotes.
- Preserve the user's original intent exactly.
- Resolve pronouns (they, it, that, this) using conversation context.
- Keep the rewritten question concise (under 100 words).
- If the query is already self-contained, return it unchanged.
- Maintain the same language (English or Hindi) as the input.`;

// ---------------------------------------------------------------------------
// Rewriter
// ---------------------------------------------------------------------------

export interface RewriteResult {
  /** The expanded standalone query. */
  rewritten: string;
  /** Whether the query was actually changed. */
  wasRewritten: boolean;
}

/**
 * Rewrite a follow-up query into a standalone question using conversation
 * context. Uses a lightweight LLM call (~50 input tokens, ~100 output tokens).
 *
 * @param currentQuery  The user's raw follow-up query.
 * @param history       Recent conversation turns for context.
 * @param llm           LLM provider instance.
 * @returns             The rewritten standalone query.
 */
export async function rewriteQuery(
  currentQuery: string,
  history: ConversationTurn[],
  llm: LLMProvider,
): Promise<RewriteResult> {
  // Build a compact conversation summary for the rewrite prompt
  const recentTurns = history.slice(-4);
  const conversationBlock = recentTurns
    .map((t) => {
      const label = t.role === 'user' ? 'User' : 'Assistant';
      // Trim assistant responses to keep the prompt small
      const content = t.role === 'assistant'
        ? t.content.slice(0, 300) + (t.content.length > 300 ? '...' : '')
        : t.content;
      return `${label}: ${content}`;
    })
    .join('\n');

  const userPrompt =
    `Conversation so far:\n${conversationBlock}\n\n` +
    `The user now asks: "${currentQuery}"\n\n` +
    `Rewrite this into a complete, standalone legal question:`;

  try {
    const rewritten = await llm.generate(REWRITE_SYSTEM_PROMPT, userPrompt);
    const cleaned = rewritten
      .trim()
      .replace(/^["']|["']$/g, '')  // Strip wrapping quotes
      .replace(/^Rewritten:?\s*/i, '');  // Strip "Rewritten:" prefix

    // If the LLM returned something substantially different, use it
    const wasRewritten = cleaned.toLowerCase() !== currentQuery.toLowerCase();

    return {
      rewritten: wasRewritten ? cleaned : currentQuery,
      wasRewritten,
    };
  } catch (err) {
    // If rewriting fails, fall back to the original query
    console.warn(
      '[query-rewriter] Rewrite failed, using original query:',
      err instanceof Error ? err.message : String(err),
    );
    return { rewritten: currentQuery, wasRewritten: false };
  }
}
