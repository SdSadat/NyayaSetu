// =============================================================================
// Document Text Extractor
// =============================================================================
// Extracts plain text from PDF, DOCX, and TXT buffers.
// Used by the POST /api/v1/drishti/extract route.
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-require-imports
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export type ExtractResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

const MAX_TEXT_CHARS = 200_000;

/**
 * Extract plain text from a file buffer.
 * @param buffer   Raw file bytes
 * @param filename Original filename (used for extension fallback)
 * @param mimetype MIME type reported by the client
 */
export async function extractText(
  buffer: Buffer,
  filename: string,
  mimetype: string,
): Promise<ExtractResult> {
  const ext = filename.toLowerCase().split('.').pop() ?? '';

  try {
    // ── PDF ────────────────────────────────────────────────────────────────
    if (ext === 'pdf' || mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      const text = data.text.trim();
      if (!text) {
        return {
          ok: false,
          error: 'No text found in PDF. It may be a scanned image — please use a text-layer PDF.',
        };
      }
      return { ok: true, text: text.slice(0, MAX_TEXT_CHARS) };
    }

    // ── DOCX ───────────────────────────────────────────────────────────────
    if (
      ext === 'docx' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      if (!text) {
        return { ok: false, error: 'No text content found in the Word document.' };
      }
      return { ok: true, text: text.slice(0, MAX_TEXT_CHARS) };
    }

    // ── TXT / plain text ──────────────────────────────────────────────────
    if (ext === 'txt' || mimetype.startsWith('text/')) {
      const text = buffer.toString('utf-8').trim();
      if (!text) {
        return { ok: false, error: 'The text file appears to be empty.' };
      }
      return { ok: true, text: text.slice(0, MAX_TEXT_CHARS) };
    }

    return {
      ok: false,
      error: `Unsupported file type ".${ext}". Please upload a PDF, DOCX, or TXT file.`,
    };
  } catch (err) {
    return { ok: false, error: `Could not extract text: ${(err as Error).message}` };
  }
}
