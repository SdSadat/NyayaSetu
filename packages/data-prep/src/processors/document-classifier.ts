// =============================================================================
// Document Classification Processors
// =============================================================================
// Two implementations of the DocumentClassifier strategy:
// 1. LLMDocumentClassifier — Ollama-powered classification
// 2. HintDocumentClassifier — Uses user-provided hints (offline mode)
// =============================================================================

import type {
  DocumentClassifier,
  CleanedText,
  ClassifiedDocument,
  LLMProvider,
  InputHints,
} from '../types.js';
import type { LegalSourceType } from '@nyayasetu/shared-types';
import {
  CLASSIFICATION_SYSTEM,
  buildClassificationPrompt,
} from '../ollama/prompts.js';

/** Valid document types we accept. */
const VALID_TYPES: LegalSourceType[] = [
  'bare-act',
  'supreme-court',
  'high-court',
  'state-rule',
];

/**
 * LLM-powered document classifier. Sends a text sample to Ollama
 * and parses the JSON response. Falls back to regex-based heuristics
 * if the LLM returns malformed JSON.
 */
export class LLMDocumentClassifier implements DocumentClassifier {
  readonly name = 'llm-document-classifier';

  constructor(private readonly llm: LLMProvider) {}

  async classify(text: CleanedText): Promise<ClassifiedDocument> {
    const response = await this.llm.generate({
      prompt: buildClassificationPrompt(text.text),
      system: CLASSIFICATION_SYSTEM,
      format: 'json',
      options: { temperature: 0.1 },
    });

    // Try to parse LLM JSON response
    const parsed = tryParseClassification(response.text);
    if (parsed) {
      return {
        text: text.text,
        documentType: parsed.documentType,
        confidence: parsed.confidence,
        sourceLocation: text.sourceLocation,
      };
    }

    // Fallback: regex-based heuristic classification
    const fallback = heuristicClassify(text.text);
    return {
      text: text.text,
      documentType: fallback.documentType,
      confidence: fallback.confidence * 0.7, // Penalize heuristic confidence
      sourceLocation: text.sourceLocation,
    };
  }
}

/**
 * Hint-based classifier for offline mode. Requires `documentType`
 * to be provided in the input hints.
 */
export class HintDocumentClassifier implements DocumentClassifier {
  readonly name = 'hint-document-classifier';

  private readonly hints: InputHints;

  constructor(hints: InputHints) {
    this.hints = hints;
  }

  async classify(text: CleanedText): Promise<ClassifiedDocument> {
    if (!this.hints.documentType) {
      // No hint provided — fall back to heuristic
      const fallback = heuristicClassify(text.text);
      return {
        text: text.text,
        documentType: fallback.documentType,
        confidence: fallback.confidence * 0.5,
        sourceLocation: text.sourceLocation,
      };
    }

    return {
      text: text.text,
      documentType: this.hints.documentType,
      confidence: 1.0,
      sourceLocation: text.sourceLocation,
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ClassificationResult {
  documentType: LegalSourceType;
  confidence: number;
}

function tryParseClassification(raw: string): ClassificationResult | null {
  try {
    // Extract JSON from potential markdown code blocks
    const jsonStr = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    const docType = parsed.documentType as string;
    if (!VALID_TYPES.includes(docType as LegalSourceType)) {
      return null;
    }

    const confidence = typeof parsed.confidence === 'number'
      ? Math.min(1, Math.max(0, parsed.confidence))
      : 0.7;

    return { documentType: docType as LegalSourceType, confidence };
  } catch {
    return null;
  }
}

/**
 * Simple regex-based heuristic classification for fallback scenarios.
 */
function heuristicClassify(text: string): ClassificationResult {
  const sample = text.slice(0, 5000).toLowerCase();

  // Check for Supreme Court indicators
  if (
    sample.includes('supreme court of india') ||
    sample.includes('in the supreme court')
  ) {
    return { documentType: 'supreme-court', confidence: 0.8 };
  }

  // Check for High Court indicators
  if (
    sample.includes('high court of') ||
    sample.includes('in the high court')
  ) {
    return { documentType: 'high-court', confidence: 0.8 };
  }

  // Check for state rule indicators
  if (
    sample.includes('in exercise of the powers conferred') ||
    sample.includes('notification') ||
    sample.includes('the following rules')
  ) {
    return { documentType: 'state-rule', confidence: 0.6 };
  }

  // Check for bare act indicators
  if (
    sample.includes('an act to') ||
    sample.includes('be it enacted') ||
    sample.includes('short title and commencement')
  ) {
    return { documentType: 'bare-act', confidence: 0.7 };
  }

  // Default to bare-act with low confidence
  return { documentType: 'bare-act', confidence: 0.3 };
}
