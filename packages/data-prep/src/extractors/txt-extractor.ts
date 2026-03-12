// =============================================================================
// TXT Extractor — Converts plain text buffers to ExtractedText
// =============================================================================

import type { Extractor, AcquiredContent, ExtractedText } from '../types.js';
import { ExtractionError } from '../types.js';

/** BOM character at start of UTF-8 files. */
const UTF8_BOM = '\uFEFF';

/**
 * Extracts text from plain text files. Handles BOM stripping
 * and CRLF normalization.
 */
export class TxtExtractor implements Extractor {
  readonly name = 'txt-extractor';

  async extract(content: AcquiredContent): Promise<ExtractedText> {
    if (content.contentType !== 'text/plain') {
      throw new ExtractionError(
        `TxtExtractor expects text/plain but got "${content.contentType}"`,
      );
    }

    let text: string;
    if (content.rawContent instanceof Buffer) {
      text = content.rawContent.toString('utf-8');
    } else {
      text = content.rawContent as string;
    }

    // Strip BOM if present
    if (text.startsWith(UTF8_BOM)) {
      text = text.slice(1);
    }

    // Normalize line endings
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    if (text.trim().length === 0) {
      throw new ExtractionError(
        `File "${content.sourceLocation}" is empty or contains only whitespace.`,
      );
    }

    return {
      text,
      sourceLocation: content.sourceLocation,
      resolvedUrl: content.resolvedUrl,
    };
  }
}
