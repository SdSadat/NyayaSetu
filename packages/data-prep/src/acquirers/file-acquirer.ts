// =============================================================================
// File Acquirer — Local PDF / TXT file loading
// =============================================================================
// Implements the Acquirer strategy for reading local files from disk.
// =============================================================================

import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import type { Acquirer, AcquiredContent } from '../types.js';
import { AcquisitionError } from '../types.js';

/**
 * Maps file extensions to MIME content types.
 * Only PDF and plain text are supported; extend as needed.
 */
const EXTENSION_MAP: Record<string, AcquiredContent['contentType']> = {
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.text': 'text/plain',
};

/**
 * Acquirer for local files. Reads from disk and infers content type
 * from the file extension.
 */
export class FileAcquirer implements Acquirer {
  readonly name = 'file-acquirer';

  async acquire(location: string): Promise<AcquiredContent> {
    const ext = extname(location).toLowerCase();
    const contentType = EXTENSION_MAP[ext];

    if (!contentType) {
      throw new AcquisitionError(
        `Unsupported file extension "${ext}". Supported: ${Object.keys(EXTENSION_MAP).join(', ')}`,
      );
    }

    let rawContent: Buffer;
    try {
      rawContent = await readFile(location);
    } catch (error) {
      throw new AcquisitionError(
        `Failed to read file "${location}": ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined,
      );
    }

    return {
      rawContent,
      contentType,
      sourceLocation: location,
    };
  }
}
