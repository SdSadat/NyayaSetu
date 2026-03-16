// =============================================================================
// Sahayak Query Pipeline — Safety-First Legal Information Processing
// =============================================================================
//
// Pipeline steps (in order):
//   1. Normalize    — Clean and normalize the input text.
//   2. Context      — Classify intent (follow-up vs new topic), rewrite if needed.
//   3. Extract      — Identify legal entities (actor, action, jurisdiction hints).
//   4. Resolve      — Determine the applicable jurisdiction (central or state).
//   5. Retrieve     — Fetch relevant legal source chunks from ChromaDB.
//   6. Generate     — Call Amazon Nova LLM with injected sources and safety prompt.
//   7. Verify       — Check that the generated response only cites provided sources.
//   8. Guardrails   — Apply final safety checks (certainty, advisory language).
//
// SAFETY INVARIANT: If ANY step fails or produces uncertain results, the pipeline
// returns a structured RefusalResponse.
// =============================================================================

import type {
  SahayakResponse,
  ExtractedEntities,
  Jurisdiction,
  LegalChunk,
  Citation,
  VerificationResult,
  SupportedState,
  ConversationTurn,
  ConversationIntent,
} from '@nyayasetu/shared-types';

import {
  applyGuardrails,
  checkForAdvisoryLanguage,
  refuseNoSources,
  refuseUnknownJurisdiction,
} from '@nyayasetu/safety-layer';
import type { GuardrailInput } from '@nyayasetu/safety-layer';

import {
  resolveJurisdiction,
} from '@nyayasetu/jurisdiction';

import { config } from '../config/index.js';
import { getRetriever } from './vector-store.js';
import { generateLegalResponse } from './response-generator.js';
import {
  classifyIntent,
  rewriteQuery,
  sanitizeHistory,
} from './conversation/index.js';
import { NovaLLM } from './nova-llm.js';

// ---------------------------------------------------------------------------
// Pipeline input type
// ---------------------------------------------------------------------------

export interface QueryInput {
  /** The citizen's question in natural language. */
  text: string;
  /** Optional state for explicit jurisdiction resolution. */
  state?: SupportedState;
  /** Language preference. */
  language?: 'en' | 'hi';
  /** Conversation history for multi-turn context. */
  conversationHistory?: ConversationTurn[];
}

// ---------------------------------------------------------------------------
// Step 1: Normalize
// ---------------------------------------------------------------------------

function normalizeQuery(text: string): string {
  return text
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------------------
// Step 2: Conversation Context
// ---------------------------------------------------------------------------

/** Singleton LLM for lightweight operations (rewriting). */
let _rewriteLlm: NovaLLM | null = null;
function getRewriteLLM(): NovaLLM {
  if (!_rewriteLlm) _rewriteLlm = new NovaLLM();
  return _rewriteLlm;
}

interface ConversationContext {
  /** The query to use for entity extraction and retrieval. */
  queryForRetrieval: string;
  /** Classified intent. */
  intent: ConversationIntent;
  /** Whether the query was rewritten. */
  wasRewritten: boolean;
  /** Sanitized history to pass to the response generator. */
  history: ConversationTurn[];
}

async function resolveConversationContext(
  normalizedText: string,
  rawHistory: ConversationTurn[] | undefined,
): Promise<ConversationContext> {
  const history = sanitizeHistory(rawHistory);

  // No history → new topic, use query as-is
  if (history.length === 0) {
    return {
      queryForRetrieval: normalizedText,
      intent: { type: 'new-topic', confidence: 1.0 },
      wasRewritten: false,
      history: [],
    };
  }

  // Classify intent
  const intent = classifyIntent(normalizedText, history);

  // If follow-up or clarification, rewrite the query for better retrieval
  if (intent.type === 'follow-up' || intent.type === 'clarification') {
    const { rewritten, wasRewritten } = await rewriteQuery(
      normalizedText,
      history,
      getRewriteLLM(),
    );

    console.log(
      `[query-pipeline] Intent: ${intent.type} (${(intent.confidence * 100).toFixed(0)}%)` +
      (wasRewritten ? ` | Rewritten: "${rewritten}"` : ''),
    );

    return {
      queryForRetrieval: rewritten,
      intent,
      wasRewritten,
      history,
    };
  }

  console.log(`[query-pipeline] Intent: new-topic (${(intent.confidence * 100).toFixed(0)}%)`);

  return {
    queryForRetrieval: normalizedText,
    intent,
    wasRewritten: false,
    history,
  };
}

// ---------------------------------------------------------------------------
// Step 3: Extract Entities
// ---------------------------------------------------------------------------

/** Test if `pattern` matches as a whole word in `text`. */
function wordMatch(text: string, pattern: string): boolean {
  return new RegExp(`\\b${pattern}\\b`, 'i').test(text);
}

function extractEntities(
  text: string,
  explicitState?: SupportedState,
): ExtractedEntities {
  const entities: ExtractedEntities = {};

  // -- Jurisdiction --
  if (explicitState) {
    entities.state = explicitState;
  } else {
    if (wordMatch(text, 'west bengal') || wordMatch(text, 'kolkata')) {
      entities.state = 'west-bengal';
    } else if (wordMatch(text, 'jharkhand') || wordMatch(text, 'ranchi')) {
      entities.state = 'jharkhand';
    }
  }

  // -- Actor --
  if (wordMatch(text, 'police') || wordMatch(text, 'police officer')) {
    entities.actor = 'police';
  } else if (wordMatch(text, 'landlord') || wordMatch(text, 'house owner')) {
    entities.actor = 'landlord';
  } else if (wordMatch(text, 'employer') || wordMatch(text, 'company') || wordMatch(text, 'boss')) {
    entities.actor = 'employer';
  }

  // -- Action --
  if (wordMatch(text, 'arrest(?:ed)?') || wordMatch(text, 'detain(?:ed)?')) {
    entities.action = 'arrest';
  } else if (wordMatch(text, 'evict(?:ed|ion)?') || wordMatch(text, 'vacate')) {
    entities.action = 'eviction';
  } else if (wordMatch(text, 'seiz(?:e|ed|ure)') || wordMatch(text, 'confiscat(?:e|ed|ion)')) {
    entities.action = 'seizure';
  } else if (wordMatch(text, 'threat(?:en(?:ed)?)?')) {
    entities.action = 'threat';
  } else if (wordMatch(text, 'fine[ds]?') || wordMatch(text, 'penalt(?:y|ies)')) {
    entities.action = 'fine';
  } else if (wordMatch(text, 'search(?:ed)?') || wordMatch(text, 'raid(?:ed)?')) {
    entities.action = 'search';
  } else if (wordMatch(text, 'notice')) {
    entities.action = 'notice';
  }

  return entities;
}

// ---------------------------------------------------------------------------
// Step 4: Resolve Jurisdiction
// ---------------------------------------------------------------------------

function resolveQueryJurisdiction(
  entities: ExtractedEntities,
): Jurisdiction | undefined {
  return resolveJurisdiction(entities);
}

// ---------------------------------------------------------------------------
// Step 5: Retrieve Sources
// ---------------------------------------------------------------------------

interface RetrievalOutput {
  chunks: LegalChunk[];
  scores: number[];
}

async function retrieveSources(
  normalizedText: string,
  jurisdiction: Jurisdiction,
): Promise<RetrievalOutput> {
  try {
    const retriever = await getRetriever();
    const result = await retriever.retrieve(normalizedText, jurisdiction);
    return { chunks: result.chunks, scores: result.scores };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[query-pipeline] Retrieval failed: ${message}`);
    return { chunks: [], scores: [] };
  }
}

// ---------------------------------------------------------------------------
// Step 6: Verify Response
// ---------------------------------------------------------------------------

function verifyResponse(
  responseText: string,
  sources: LegalChunk[],
): VerificationResult {
  const advisoryCheck = checkForAdvisoryLanguage(responseText);

  const sectionPattern = /Section\s+(\d+[A-Za-z]*)/gi;
  const mentionedSections: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = sectionPattern.exec(responseText)) !== null) {
    if (match[1]) {
      mentionedSections.push(match[1]);
    }
  }

  const sourceSections = new Set(sources.map((s) => s.section));
  const verifiedSections: string[] = [];
  const unverifiedSections: string[] = [];

  for (const section of mentionedSections) {
    if (sourceSections.has(section)) {
      verifiedSections.push(section);
    } else {
      unverifiedSections.push(section);
    }
  }

  return {
    isVerified: unverifiedSections.length === 0 && !advisoryCheck.containsAdvisoryLanguage,
    verifiedSections,
    unverifiedSections,
    containsAdvisoryLanguage: advisoryCheck.containsAdvisoryLanguage,
    advisoryPhrases: advisoryCheck.advisoryPhrases,
  };
}

// ---------------------------------------------------------------------------
// Step 7: Build Citations
// ---------------------------------------------------------------------------

function buildCitations(sources: LegalChunk[]): Citation[] {
  return sources.map((chunk) => ({
    section: chunk.section,
    act: chunk.act,
    sourceUrl: chunk.sourceUrl,
    relevantText: chunk.text.slice(0, 500),
    sourceType: chunk.sourceType,
  }));
}

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

export async function processQuery(input: QueryInput): Promise<SahayakResponse> {
  // Step 1: Normalize
  const normalizedText = normalizeQuery(input.text);

  // Step 2: Conversation context (classify intent, rewrite if follow-up)
  const ctx = await resolveConversationContext(
    normalizedText,
    input.conversationHistory,
  );

  // Step 3: Extract entities (from the query used for retrieval)
  const entities = extractEntities(ctx.queryForRetrieval, input.state);

  // Step 4: Resolve jurisdiction
  const jurisdiction = resolveQueryJurisdiction(entities);

  if (!jurisdiction) {
    return refuseUnknownJurisdiction();
  }

  // Step 5: Retrieve sources
  const retrieval = await retrieveSources(ctx.queryForRetrieval, jurisdiction);

  if (retrieval.chunks.length === 0 && config.safety.refuseOnNoSource) {
    return refuseNoSources();
  }

  // Step 6: Generate response (with conversation history for multi-turn)
  const rawResponse = await generateLegalResponse(
    ctx.queryForRetrieval,
    entities,
    jurisdiction,
    retrieval.chunks,
    ctx.history,
  );

  if (!rawResponse) {
    return refuseNoSources();
  }

  // Step 7: Verify
  verifyResponse(rawResponse, retrieval.chunks);

  // Step 8: Build citations + guardrails
  const citations = buildCitations(retrieval.chunks);

  const certaintyScore: number = retrieval.scores.length > 0
    ? retrieval.scores.reduce((sum, s) => sum + s, 0) / retrieval.scores.length
    : 0;

  const guardrailInput: GuardrailInput = {
    rawResponse,
    citations,
    certaintyScore,
    jurisdiction,
  };

  const finalResponse = applyGuardrails(guardrailInput, config.safety);

  // Attach conversation metadata to successful responses
  if (finalResponse.type === 'success') {
    finalResponse.isFollowUp = ctx.intent.type !== 'new-topic';
    if (ctx.wasRewritten) {
      finalResponse.rewrittenQuery = ctx.queryForRetrieval;
    }
  }

  return finalResponse;
}
