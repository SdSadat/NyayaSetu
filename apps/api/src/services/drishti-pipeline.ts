// =============================================================================
// Drishti Pipeline
// =============================================================================
// Orchestrates the end-to-end Drishti analysis flow:
//   1. Validate input
//   2. Call Amazon Nova LLM in JSON mode via Bedrock
//   3. Parse and validate the JSON response
//   4. Return a typed DrishtiAnalysis
// =============================================================================

import type { DrishtiAnalysis } from '@nyayasetu/shared-types';
import {
  DRISHTI_SYSTEM_PROMPT,
  buildDrishtiPrompt,
} from '@nyayasetu/prompts';

import type { LLMProvider } from './llm-provider.js';
import { NovaLLM } from './nova-llm.js';

// ---------------------------------------------------------------------------
// Singleton LLM
// ---------------------------------------------------------------------------

let _llm: LLMProvider | null = null;

function getLLM(): LLMProvider {
  if (!_llm) {
    _llm = new NovaLLM();
    console.log('[drishti-pipeline] Using Amazon Nova LLM provider (Bedrock)');
  }
  return _llm;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface DrishtiRefusal {
  type: 'refusal';
  reason: 'insufficient-document' | 'parse-error' | 'llm-error';
  message: string;
}

export type DrishtiPipelineResult =
  | ({ type: 'success' } & DrishtiAnalysis)
  | DrishtiRefusal;

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

const MIN_DOCUMENT_LENGTH = 200; // chars

export async function runDrishtiPipeline(
  documentText: string,
): Promise<DrishtiPipelineResult> {
  // 1. Pre-flight: reject obviously empty inputs
  if (!documentText || documentText.trim().length < MIN_DOCUMENT_LENGTH) {
    return {
      type: 'refusal',
      reason: 'insufficient-document',
      message: 'The provided document is too short to analyse. Please provide the full text of the legal document.',
    };
  }

  // 2. Build prompts
  const userPrompt = buildDrishtiPrompt({ documentText: documentText.trim() });

  // 3. Call LLM in JSON mode
  let rawJson: string;
  try {
    const llm = getLLM();
    rawJson = await llm.generateJSON(DRISHTI_SYSTEM_PROMPT, userPrompt);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[drishti-pipeline] LLM call failed: ${message}`);
    return {
      type: 'refusal',
      reason: 'llm-error',
      message: `Analysis service unavailable: ${message}`,
    };
  }

  // 4. Parse JSON
  let parsed: unknown;
  try {
    // Strip markdown fences if the model wrapped the JSON anyway
    const cleaned = rawJson
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('[drishti-pipeline] JSON parse failed. Raw:', rawJson.slice(0, 500));
    return {
      type: 'refusal',
      reason: 'parse-error',
      message: 'The analysis engine returned an unexpected format. Please try again.',
    };
  }

  // 5. Check for LLM-level refusal
  const maybeError = parsed as { error?: string; message?: string };
  if (maybeError?.error === 'INSUFFICIENT_DOCUMENT') {
    return {
      type: 'refusal',
      reason: 'insufficient-document',
      message: maybeError.message ?? 'Document does not contain sufficient legal content.',
    };
  }

  // 6. Validate minimum required fields
  const analysis = parsed as Partial<DrishtiAnalysis>;
  if (!analysis.caseTitle && !analysis.documentType) {
    return {
      type: 'refusal',
      reason: 'parse-error',
      message: 'Analysis output was missing required fields. Please try again.',
    };
  }

  // 7. Normalise optional arrays to empty arrays if absent
  const safe: DrishtiAnalysis = {
    documentType: analysis.documentType ?? 'other',
    caseTitle: analysis.caseTitle ?? 'Unknown',
    citation: analysis.citation ?? '',
    court: analysis.court ?? '',
    bench: analysis.bench ?? '',
    dateOfJudgment: analysis.dateOfJudgment ?? 'Unknown',
    petitioner: analysis.petitioner ?? '',
    respondent: analysis.respondent ?? '',
    factsInBrief: analysis.factsInBrief ?? '',
    decisionInOneLine: analysis.decisionInOneLine ?? '',
    outcome: analysis.outcome ?? 'other',
    caveats: analysis.caveats ?? [],
    timeline: analysis.timeline ?? [],
    issueTree: analysis.issueTree ?? [],
    precedents: analysis.precedents ?? [],
    sectionHeatmap: analysis.sectionHeatmap ?? [],
    argumentDuel: analysis.argumentDuel ?? {
      petitionerName: analysis.petitioner ?? 'Petitioner',
      respondentName: analysis.respondent ?? 'Respondent',
      petitioner: [],
      respondent: [],
    },
    reliefDirections: analysis.reliefDirections ?? [],
    taggedParagraphs: analysis.taggedParagraphs ?? [],
    explainModes: analysis.explainModes ?? {
      teen: '',
      student: '',
      practitioner: '',
    },
    legalDoctrines: analysis.legalDoctrines ?? [],
  };

  return { type: 'success', ...safe };
}
