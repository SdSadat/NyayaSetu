// =============================================================================
// Metadata Validator
// =============================================================================
// Post-extraction validation of metadata using Zod schemas and
// cross-field consistency checks.
// =============================================================================

import type { ExtractedMetadata, ClassifiedDocument } from '../types.js';
import { ExtractedMetadataSchema, ValidationError } from '../types.js';

/** Result of validation: errors that must be fixed, warnings that are informational. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates extracted metadata against the Zod schema and performs
 * cross-field consistency checks based on the document type.
 */
export function validateMetadata(
  metadata: ExtractedMetadata,
  doc: ClassifiedDocument,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Zod schema validation
  const zodResult = ExtractedMetadataSchema.safeParse(metadata);
  if (!zodResult.success) {
    for (const issue of zodResult.error.issues) {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    }
  }

  // 2. Cross-field checks based on document type
  switch (doc.documentType) {
    case 'bare-act':
      if (!metadata.year) {
        warnings.push('Bare act missing year — consider adding it');
      }
      if (metadata.caseCitation) {
        warnings.push('Bare act should not have caseCitation');
      }
      break;

    case 'supreme-court':
      if (!metadata.caseCitation) {
        warnings.push('Supreme Court judgment missing case citation');
      }
      if (metadata.court && !metadata.court.toLowerCase().includes('supreme')) {
        errors.push(
          `Court "${metadata.court}" does not match document type "supreme-court"`,
        );
      }
      if (
        metadata.jurisdiction.scope !== 'central'
      ) {
        warnings.push('Supreme Court judgments should have central jurisdiction');
      }
      break;

    case 'high-court':
      if (!metadata.caseCitation) {
        warnings.push('High Court judgment missing case citation');
      }
      if (!metadata.court) {
        warnings.push('High Court judgment missing court name');
      }
      if (
        metadata.jurisdiction.scope === 'state' &&
        !metadata.jurisdiction.state
      ) {
        errors.push('State-scoped jurisdiction requires a state');
      }
      break;

    case 'state-rule':
      if (metadata.jurisdiction.scope !== 'state') {
        warnings.push('State rule should have state jurisdiction scope');
      }
      if (
        metadata.jurisdiction.scope === 'state' &&
        !metadata.jurisdiction.state
      ) {
        errors.push('State-scoped jurisdiction requires a state');
      }
      break;
  }

  // 3. Section validation — check that the document text
  //    actually contains section-like patterns for bare acts
  if (doc.documentType === 'bare-act') {
    const sectionCheck = validateSections(doc.text);
    if (!sectionCheck.hasSections) {
      warnings.push(
        'No section headers found in bare act text — chunking may produce a single chunk',
      );
    }
  }

  // 4. Date format check for judgments
  if (metadata.dateOfJudgment) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.dateOfJudgment)) {
      errors.push(
        `dateOfJudgment "${metadata.dateOfJudgment}" must be in YYYY-MM-DD format`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks whether the document text contains recognizable section headers.
 * Uses the same regex pattern as legal-rag's chunk-strategy.
 */
export function validateSections(text: string): {
  hasSections: boolean;
  sectionCount: number;
} {
  const SECTION_HEADER_RE =
    /(?:^|\n)(?:(?:Section|SECTION|S\.)\s*(\d+[A-Za-z]*)[\s.:\-]+|(\d+[A-Za-z]*)\.[\s]+)/g;

  const matches = text.match(SECTION_HEADER_RE);
  return {
    hasSections: matches !== null && matches.length > 0,
    sectionCount: matches?.length ?? 0,
  };
}

/**
 * Throws a ValidationError if the metadata is invalid.
 * Convenience wrapper for pipeline use.
 */
export function assertMetadataValid(
  metadata: ExtractedMetadata,
  doc: ClassifiedDocument,
): void {
  const result = validateMetadata(metadata, doc);
  if (!result.valid) {
    throw new ValidationError(
      `Metadata validation failed:\n${result.errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}
