// =============================================================================
// Response Generator
// =============================================================================
// Combines the LLM client with the Sahayak prompt templates to produce
// legal information responses from retrieved sources.
//
// Uses Amazon Nova on AWS Bedrock as the LLM provider.
// =============================================================================

import type {
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

export async function generateLegalResponse(
  query: string,
  entities: ExtractedEntities,
  jurisdiction: Jurisdiction,
  sources: LegalChunk[],
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
    const response = await llm.generate(SAHAYAK_SYSTEM_PROMPT, userPrompt);
    return response || null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[response-generator] LLM generation failed: ${message}`);
    return null;
  }
}
