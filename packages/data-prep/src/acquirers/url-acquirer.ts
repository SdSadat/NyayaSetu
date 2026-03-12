// =============================================================================
// URL Acquirer — HTTP-based content fetching
// =============================================================================
// Implements the Acquirer strategy for fetching content from URLs.
// Includes site-specific handling for Indian legal websites.
// =============================================================================

import type { Acquirer, AcquiredContent } from '../types.js';
import { AcquisitionError } from '../types.js';

/** Default timeout for HTTP requests (30 seconds). */
const DEFAULT_TIMEOUT_MS = 30_000;

/** User-Agent string for HTTP requests. */
const USER_AGENT =
  'NyayaSetu-DataPrep/1.0 (+https://github.com/nyayasetu)';

/**
 * Maps response Content-Type headers to our internal content types.
 */
function resolveContentType(
  header: string | null,
): AcquiredContent['contentType'] {
  if (!header) return 'text/html';
  const lower = header.toLowerCase();
  if (lower.includes('application/pdf')) return 'application/pdf';
  if (lower.includes('text/plain')) return 'text/plain';
  return 'text/html';
}

/**
 * Acquirer for remote URLs. Fetches content via HTTP and infers
 * the content type from the response headers.
 */
export class UrlAcquirer implements Acquirer {
  readonly name = 'url-acquirer';

  private readonly timeoutMs: number;

  constructor(timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }

  async acquire(location: string): Promise<AcquiredContent> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(location, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/pdf,text/plain,*/*',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AcquisitionError(
          `Request to "${location}" timed out after ${this.timeoutMs}ms`,
        );
      }

      throw new AcquisitionError(
        `Network error fetching "${location}": ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined,
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new AcquisitionError(
        `HTTP ${response.status} fetching "${location}": ${response.statusText}`,
      );
    }

    const contentType = resolveContentType(
      response.headers.get('content-type'),
    );

    let rawContent: Buffer | string;
    try {
      if (contentType === 'application/pdf') {
        const arrayBuffer = await response.arrayBuffer();
        rawContent = Buffer.from(arrayBuffer);
      } else {
        rawContent = await response.text();
      }
    } catch (error) {
      throw new AcquisitionError(
        `Failed to read response body from "${location}": ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined,
      );
    }

    return {
      rawContent,
      contentType,
      sourceLocation: location,
      resolvedUrl: response.url !== location ? response.url : undefined,
    };
  }
}
