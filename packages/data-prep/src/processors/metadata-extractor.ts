// =============================================================================
// Metadata Extraction Processors
// =============================================================================
// Two implementations of the MetadataExtractorStrategy:
// 1. LLMMetadataExtractor — Ollama-powered metadata extraction with validation
// 2. HintMetadataExtractor — Uses user-provided hints (offline mode)
// =============================================================================

import type {
  MetadataExtractorStrategy,
  ClassifiedDocument,
  ExtractedMetadata,
  InputHints,
  LLMProvider,
} from '../types.js';
import { ExtractedMetadataSchema, ValidationError } from '../types.js';
import {
  METADATA_EXTRACTION_SYSTEM,
  buildMetadataPrompt,
} from '../ollama/prompts.js';

/**
 * LLM-powered metadata extractor. Sends a text sample to Ollama and
 * parses the JSON response. Validates the output with Zod and retries
 * once on validation failure.
 */
export class LLMMetadataExtractor implements MetadataExtractorStrategy {
  readonly name = 'llm-metadata-extractor';

  constructor(private readonly llm: LLMProvider) {}

  async extract(
    doc: ClassifiedDocument,
    hints?: InputHints,
  ): Promise<ExtractedMetadata> {
    const response = await this.llm.generate({
      prompt: buildMetadataPrompt(doc.text, doc.documentType),
      system: METADATA_EXTRACTION_SYSTEM,
      format: 'json',
      options: { temperature: 0.1 },
    });

    let parsed = tryParseMetadata(response.text, hints);

    if (!parsed) {
      // Retry once with explicit error feedback
      const retryResponse = await this.llm.generate({
        prompt:
          `The previous response was not valid JSON or failed validation. ` +
          `Please try again.\n\n` +
          buildMetadataPrompt(doc.text, doc.documentType),
        system: METADATA_EXTRACTION_SYSTEM,
        format: 'json',
        options: { temperature: 0.05 },
      });

      parsed = tryParseMetadata(retryResponse.text, hints);
    }

    if (!parsed) {
      throw new ValidationError(
        `LLM failed to produce valid metadata after 2 attempts for "${doc.sourceLocation}"`,
      );
    }

    return parsed;
  }
}

/**
 * Hint-based metadata extractor for offline mode. Constructs metadata
 * entirely from user-provided hints. Requires at minimum: actName,
 * jurisdiction, and sourceUrl.
 */
export class HintMetadataExtractor implements MetadataExtractorStrategy {
  readonly name = 'hint-metadata-extractor';

  async extract(
    _doc: ClassifiedDocument,
    hints?: InputHints,
  ): Promise<ExtractedMetadata> {
    if (!hints?.actName || !hints?.jurisdiction) {
      throw new ValidationError(
        'Offline mode requires at least --act and --jurisdiction hints for metadata extraction.',
      );
    }

    const metadata: ExtractedMetadata = {
      title: hints.actName,
      shortName: deriveShortName(hints.actName),
      jurisdiction: hints.jurisdiction,
      sourceUrl: hints.sourceUrl ?? '',
    };

    // Try to extract year from title
    const yearMatch = hints.actName.match(/\b(1[89]\d{2}|20\d{2})\b/);
    if (yearMatch) {
      metadata.year = parseInt(yearMatch[1], 10);
    }

    // Validate with Zod
    const result = ExtractedMetadataSchema.safeParse(metadata);
    if (!result.success) {
      throw new ValidationError(
        `Hint metadata failed validation: ${result.error.message}`,
        result.error,
      );
    }

    return result.data as ExtractedMetadata;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Attempts to parse LLM output into ExtractedMetadata, merging hints.
 */
function tryParseMetadata(
  raw: string,
  hints?: InputHints,
): ExtractedMetadata | null {
  try {
    const jsonStr = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    // Merge hints over LLM output (hints take priority)
    if (hints?.actName && !parsed.title) parsed.title = hints.actName;
    if (hints?.jurisdiction) parsed.jurisdiction = hints.jurisdiction;
    if (hints?.sourceUrl) parsed.sourceUrl = hints.sourceUrl;

    // Ensure sourceUrl exists
    if (!parsed.sourceUrl) parsed.sourceUrl = '';

    const result = ExtractedMetadataSchema.safeParse(parsed);
    if (!result.success) return null;

    return result.data as ExtractedMetadata;
  } catch {
    return null;
  }
}

/**
 * Derives a short name from a full act title.
 * E.g. "The Indian Penal Code, 1860" → "IPC"
 * Falls back to first significant word if no acronym pattern found.
 */
function deriveShortName(title: string): string {
  // Remove "The " prefix and year suffix
  const cleaned = title
    .replace(/^The\s+/i, '')
    .replace(/,?\s*\d{4}$/, '')
    .trim();

  // Common known short names
  const KNOWN: Record<string, string> = {
    'Indian Penal Code': 'IPC',
    'Bharatiya Nyaya Sanhita': 'BNS',
    'Code of Criminal Procedure': 'CrPC',
    'Bharatiya Nagarik Suraksha Sanhita': 'BNSS',
    'Code of Civil Procedure': 'CPC',
    'Indian Evidence Act': 'IEA',
    'Bharatiya Sakshya Adhiniyam': 'BSA',
    'Information Technology Act': 'IT Act',
    'Motor Vehicles Act': 'MV Act',
    'Constitution of India': 'Constitution',
  };

  for (const [full, short] of Object.entries(KNOWN)) {
    if (cleaned.toLowerCase().includes(full.toLowerCase())) {
      return short;
    }
  }

  // Generate acronym from capitalized words
  const words = cleaned.split(/\s+/).filter((w) => w[0] === w[0].toUpperCase());
  if (words.length >= 2) {
    return words.map((w) => w[0]).join('');
  }

  return cleaned;
}
