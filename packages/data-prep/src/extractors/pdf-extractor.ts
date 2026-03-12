// =============================================================================
// PDF Extractor — Converts PDF buffers to plain text
// =============================================================================

import type { Extractor, AcquiredContent, ExtractedText } from '../types.js';
import { ExtractionError } from '../types.js';

/**
 * Extracts text from PDF documents using the pdf-parse library.
 * Uses dynamic import so the dependency is only loaded when actually needed.
 */
export class PdfExtractor implements Extractor {
  readonly name = 'pdf-extractor';

  async extract(content: AcquiredContent): Promise<ExtractedText> {
    if (content.contentType !== 'application/pdf') {
      throw new ExtractionError(
        `PdfExtractor expects application/pdf but got "${content.contentType}"`,
      );
    }

    const buffer =
      content.rawContent instanceof Buffer
        ? content.rawContent
        : Buffer.from(content.rawContent as string, 'utf-8');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pdfParse: any;
    try {
      pdfParse = await import('pdf-parse');
    } catch {
      throw new ExtractionError(
        'pdf-parse is not installed. Run: pnpm add pdf-parse',
      );
    }

    const parse = pdfParse.default ?? pdfParse;

    try {
      const result = await parse(buffer);

      if (!result.text || result.text.trim().length === 0) {
        throw new ExtractionError(
          `PDF "${content.sourceLocation}" produced no text. ` +
            'It may be a scanned image — OCR is not yet supported.',
        );
      }

      return {
        text: result.text,
        pageCount: result.numpages,
        sourceLocation: content.sourceLocation,
        resolvedUrl: content.resolvedUrl,
      };
    } catch (error) {
      if (error instanceof ExtractionError) throw error;

      throw new ExtractionError(
        `Failed to parse PDF "${content.sourceLocation}": ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined,
      );
    }
  }
}
