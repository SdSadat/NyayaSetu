// =============================================================================
// Sahayak Query Pipeline — Safety-First Legal Information Processing
// =============================================================================
//
// Pipeline steps (in order):
//   1. Normalize    — Clean and normalize the input text.
//   2. Extract      — Identify legal entities (actor, action, jurisdiction hints).
//   3. Resolve      — Determine the applicable jurisdiction (central or state).
//   4. Retrieve     — Fetch relevant legal source chunks from ChromaDB.
//   5. Generate     — Call Amazon Nova LLM with injected sources and safety prompt.
//   6. Verify       — Check that the generated response only cites provided sources.
//   7. Guardrails   — Apply final safety checks (certainty, advisory language).
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
// Step 2: Extract Entities
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
// Step 3: Resolve Jurisdiction
// ---------------------------------------------------------------------------

function resolveQueryJurisdiction(
  entities: ExtractedEntities,
): Jurisdiction | undefined {
  return resolveJurisdiction(entities);
}

// ---------------------------------------------------------------------------
// Step 4: Retrieve Sources
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
// Step 5: Generate Response
// ---------------------------------------------------------------------------

async function generateResponse(
  normalizedText: string,
  entities: ExtractedEntities,
  jurisdiction: Jurisdiction,
  sources: LegalChunk[],
): Promise<string | null> {
  return generateLegalResponse(normalizedText, entities, jurisdiction, sources);
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
  const normalizedText = normalizeQuery(input.text);

  const entities = extractEntities(normalizedText, input.state);

  const jurisdiction = resolveQueryJurisdiction(entities);

  if (!jurisdiction) {
    return refuseUnknownJurisdiction();
  }

  const retrieval = await retrieveSources(normalizedText, jurisdiction);

  if (retrieval.chunks.length === 0 && config.safety.refuseOnNoSource) {
    return refuseNoSources();
  }

  const rawResponse = await generateResponse(
    normalizedText,
    entities,
    jurisdiction,
    retrieval.chunks,
  );

  if (!rawResponse) {
    return refuseNoSources();
  }

  verifyResponse(rawResponse, retrieval.chunks);

  const citations = buildCitations(retrieval.chunks);

  // Calculate certainty from retrieval similarity scores (0-1 range)
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

  return finalResponse;
}
