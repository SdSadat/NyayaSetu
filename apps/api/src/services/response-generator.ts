// =============================================================================
// Response Generator
// =============================================================================
// Combines the LLM client with the Sahayak prompt templates to produce
// legal information responses from retrieved sources.
//
// Supports both single-shot and multi-turn conversation modes.
// Uses Amazon Nova on AWS Bedrock as the LLM provider.
// =============================================================================

import type {
  ConversationTurn,
  ExtractedEntities,
  Jurisdiction,
  LegalChunk,
} from '@nyayasetu/shared-types';

import {
  SAHAYAK_SYSTEM_PROMPT,
  buildSahayakPrompt,
} from '@nyayasetu/prompts';

import type { LLMProvider } from './llm-provider.js';
import { NovaLLM } from './nova-llm.js';
import { buildConversationMessages } from './conversation/index.js';

// ---------------------------------------------------------------------------
// Singleton LLM instance
// ---------------------------------------------------------------------------

let _llm: LLMProvider | null = null;

function getLLM(): LLMProvider {
  if (!_llm) {
    _llm = new NovaLLM();
    console.log('[response-generator] Using Amazon Nova LLM provider (Bedrock)');
  }
  return _llm;
}

// ---------------------------------------------------------------------------
// Response generation
// ---------------------------------------------------------------------------

/**
 * Generate a legal response. Supports both single-shot and multi-turn modes:
 * - If `history` is empty or undefined, uses single-shot `llm.generate()`.
 * - If `history` has turns, builds a multi-turn messages array and uses
 *   `llm.generateWithMessages()` for context-aware responses.
 */
export async function generateLegalResponse(
  query: string,
  entities: ExtractedEntities,
  jurisdiction: Jurisdiction,
  sources: LegalChunk[],
  history?: ConversationTurn[],
): Promise<string | null> {
  const userPrompt = buildSahayakPrompt({
    query,
    entities,
    jurisdiction,
    sources: sources.map((s) => ({
      text: s.text,
      section: s.section,
      act: s.act,
    })),
  });

  try {
    const llm = getLLM();

    // Multi-turn: build conversation messages and use generateWithMessages
    if (history && history.length > 0) {
      const messages = buildConversationMessages(history, userPrompt);
      const response = await llm.generateWithMessages(
        SAHAYAK_SYSTEM_PROMPT,
        messages,
      );
      return response || null;
    }

    // Single-shot: standard generate
    const response = await llm.generate(SAHAYAK_SYSTEM_PROMPT, userPrompt);
    return response || null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[response-generator] LLM generation failed: ${message}`);
    return null;
  }
}
