// =============================================================================
// Text Cleaning Processors
// =============================================================================
// Two implementations of the TextProcessor strategy:
// 1. LLMTextCleaner — Ollama-powered cleanup of PDF/OCR artifacts
// 2. PassthroughTextCleaner — No-op for offline mode / pre-cleaned text
// =============================================================================

import type {
  TextProcessor,
  ExtractedText,
  CleanedText,
  LLMProvider,
} from '../types.js';
import { TEXT_CLEANUP_SYSTEM, buildCleanupPrompt } from '../ollama/prompts.js';

/** Max characters per chunk sent to the LLM. */
const CHUNK_SIZE = 4000;

/**
 * LLM-powered text cleaner. Sends text through Ollama in chunks to
 * remove PDF extraction artifacts (headers, footers, page numbers,
 * garbled characters) while preserving legal content.
 */
export class LLMTextCleaner implements TextProcessor {
  readonly name = 'llm-text-cleaner';

  constructor(private readonly llm: LLMProvider) {}

  async process(text: ExtractedText): Promise<CleanedText> {
    const rawText = text.text;
    const report: string[] = [];

    // Split into chunks to respect LLM context limits
    const chunks = splitIntoChunks(rawText, CHUNK_SIZE);
    report.push(`Split into ${chunks.length} chunk(s) for cleaning`);

    const cleanedChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const response = await this.llm.generate({
        prompt: buildCleanupPrompt(chunks[i]),
        system: TEXT_CLEANUP_SYSTEM,
        options: { temperature: 0.1 },
      });

      cleanedChunks.push(response.text.trim());
      report.push(
        `Chunk ${i + 1}/${chunks.length}: cleaned in ${response.durationMs}ms`,
      );
    }

    const cleaned = cleanedChunks.join('\n\n');
    const reductionPct =
      rawText.length > 0
        ? Math.round(((rawText.length - cleaned.length) / rawText.length) * 100)
        : 0;
    report.push(`Text reduced by ${reductionPct}% (${rawText.length} → ${cleaned.length} chars)`);

    return {
      text: cleaned,
      cleaningReport: report,
      sourceLocation: text.sourceLocation,
    };
  }
}

/**
 * No-op text cleaner for offline mode. Passes text through unchanged
 * with only basic whitespace normalization.
 */
export class PassthroughTextCleaner implements TextProcessor {
  readonly name = 'passthrough-text-cleaner';

  async process(text: ExtractedText): Promise<CleanedText> {
    // Basic normalization without LLM
    const normalized = text.text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ');

    return {
      text: normalized,
      cleaningReport: ['Passthrough mode: basic whitespace normalization only'],
      sourceLocation: text.sourceLocation,
    };
  }
}

/**
 * Split text into chunks at paragraph boundaries where possible.
 */
function splitIntoChunks(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxSize) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a paragraph boundary
    let splitAt = remaining.lastIndexOf('\n\n', maxSize);
    if (splitAt < maxSize * 0.5) {
      // Paragraph boundary too far back — split at last newline
      splitAt = remaining.lastIndexOf('\n', maxSize);
    }
    if (splitAt < maxSize * 0.5) {
      // No good boundary — hard split
      splitAt = maxSize;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  return chunks;
}
