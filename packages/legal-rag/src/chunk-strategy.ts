// =============================================================================
// Legal Document Chunking Strategy
// =============================================================================
// Splits raw legal text (bare acts, statutes) into discrete, metadata-rich
// chunks suitable for embedding and vector storage. Each chunk preserves full
// traceability back to its source section and jurisdiction.
// =============================================================================

import { z } from 'zod';
import type { Jurisdiction, LegalChunk, LegalSourceType } from '@nyayasetu/shared-types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface ChunkingConfig {
  /** Maximum character length of a single chunk. */
  maxChunkSize: number;
  /** Number of overlapping characters between consecutive chunks. */
  overlapSize: number;
}

export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  maxChunkSize: 1500,
  overlapSize: 200,
};

export const ChunkingConfigSchema = z.object({
  maxChunkSize: z.number().int().positive(),
  overlapSize: z.number().int().nonnegative(),
}).refine(
  (cfg) => cfg.overlapSize < cfg.maxChunkSize,
  { message: 'overlapSize must be less than maxChunkSize' },
);

// ---------------------------------------------------------------------------
// Section-splitting regex
// ---------------------------------------------------------------------------

/**
 * Matches common section header patterns found in Indian bare acts:
 *   "Section 102."  |  "Section 102 -"  |  "S. 102."
 *   "102."  (bare numbered section at start of line)
 *   "SECTION 102"   (uppercase variant)
 *
 * The regex captures the section number so we can tag each chunk.
 */
const SECTION_HEADER_RE =
  /(?:^|\n)(?:(?:Section|SECTION|S\.)\s*(\d+[A-Za-z]*)[\s.:\-]+|(\d+[A-Za-z]*)\.[\s]+)/g;

// ---------------------------------------------------------------------------
// Chunking helpers
// ---------------------------------------------------------------------------

interface RawSection {
  sectionNumber: string;
  text: string;
}

/**
 * Split raw text into sections based on section header patterns.
 * If no section headers are found the entire text is returned as a single
 * section with sectionNumber "preamble".
 */
function splitSections(rawText: string): RawSection[] {
  const matches: { index: number; sectionNumber: string }[] = [];

  let match: RegExpExecArray | null;
  // Reset the regex state
  SECTION_HEADER_RE.lastIndex = 0;

  while ((match = SECTION_HEADER_RE.exec(rawText)) !== null) {
    const sectionNumber = match[1] ?? match[2] ?? 'unknown';
    matches.push({ index: match.index, sectionNumber });
  }

  if (matches.length === 0) {
    return [{ sectionNumber: 'preamble', text: rawText.trim() }];
  }

  const sections: RawSection[] = [];

  // Text before the first section header is the preamble
  const preambleText = rawText.slice(0, matches[0].index).trim();
  if (preambleText.length > 0) {
    sections.push({ sectionNumber: 'preamble', text: preambleText });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : rawText.length;
    const text = rawText.slice(start, end).trim();
    if (text.length > 0) {
      sections.push({ sectionNumber: matches[i].sectionNumber, text });
    }
  }

  return sections;
}

/**
 * If a section's text exceeds the configured maxChunkSize it is split into
 * smaller pieces with the configured overlap. Each sub-chunk retains the
 * same section number (with a part suffix).
 */
function splitLargeSection(
  text: string,
  config: ChunkingConfig,
): string[] {
  if (text.length <= config.maxChunkSize) {
    return [text];
  }

  const parts: string[] = [];
  const step = config.maxChunkSize - config.overlapSize;
  if (step <= 0) {
    throw new Error('overlapSize must be smaller than maxChunkSize');
  }

  for (let start = 0; start < text.length; start += step) {
    const end = Math.min(start + config.maxChunkSize, text.length);
    parts.push(text.slice(start, end));
    if (end === text.length) break;
  }

  return parts;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface BareActMetadata {
  act: string;
  jurisdiction: Jurisdiction;
  sourceUrl: string;
}

/** Generalized metadata for any legal document type. */
export interface LegalDocumentMetadata {
  /** Title of the document (act name, case title, rule name). */
  title: string;
  jurisdiction: Jurisdiction;
  sourceType: LegalSourceType;
  sourceUrl: string;
}

/**
 * Chunk a bare act document into discrete {@link LegalChunk} records.
 *
 * Each chunk carries the full metadata required for traceability: act name,
 * section number, jurisdiction, source URL, and verification timestamp.
 *
 * @param rawText     - The full plain-text of the bare act.
 * @param metadata    - Contextual metadata to stamp on every chunk.
 * @param config      - Optional chunking configuration overrides.
 * @returns An array of {@link LegalChunk} records ready for embedding.
 */
export function chunkBareAct(
  rawText: string,
  metadata: BareActMetadata,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG,
): LegalChunk[] {
  const validatedConfig = ChunkingConfigSchema.parse(config);

  const sections = splitSections(rawText);
  const chunks: LegalChunk[] = [];

  for (const section of sections) {
    const parts = splitLargeSection(section.text, validatedConfig);

    for (let partIndex = 0; partIndex < parts.length; partIndex++) {
      const partSuffix = parts.length > 1 ? `-part${partIndex + 1}` : '';
      const chunkId = `${metadata.act}::${section.sectionNumber}${partSuffix}`
        .toLowerCase()
        .replace(/\s+/g, '-');

      chunks.push({
        id: chunkId,
        text: parts[partIndex],
        act: metadata.act,
        section: section.sectionNumber,
        jurisdiction: metadata.jurisdiction,
        sourceType: 'bare-act',
        sourceUrl: metadata.sourceUrl,
        verifiedAt: new Date().toISOString(),
      });
    }
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Generic legal document chunking
// ---------------------------------------------------------------------------

/**
 * Split text into paragraphs (double-newline boundaries).
 * Used for judgments and other non-section-based documents.
 */
function splitParagraphs(rawText: string): RawSection[] {
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) {
    return [{ sectionNumber: 'full', text: rawText.trim() }];
  }

  return paragraphs.map((text, i) => ({
    sectionNumber: `para-${i + 1}`,
    text,
  }));
}

/**
 * Chunk any legal document into discrete {@link LegalChunk} records.
 *
 * Delegates to section-based splitting for bare acts and state rules
 * (which have numbered sections), and paragraph-based splitting for
 * court judgments.
 *
 * @param rawText   - The full plain-text of the document.
 * @param metadata  - Document metadata (title, jurisdiction, type, URL).
 * @param config    - Optional chunking configuration overrides.
 * @returns An array of {@link LegalChunk} records ready for embedding.
 */
export function chunkLegalDocument(
  rawText: string,
  metadata: LegalDocumentMetadata,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG,
): LegalChunk[] {
  const validatedConfig = ChunkingConfigSchema.parse(config);

  // Bare acts and state rules have numbered sections
  const useSectionSplit =
    metadata.sourceType === 'bare-act' || metadata.sourceType === 'state-rule';

  const sections = useSectionSplit
    ? splitSections(rawText)
    : splitParagraphs(rawText);

  const chunks: LegalChunk[] = [];

  for (const section of sections) {
    const parts = splitLargeSection(section.text, validatedConfig);

    for (let partIndex = 0; partIndex < parts.length; partIndex++) {
      const partSuffix = parts.length > 1 ? `-part${partIndex + 1}` : '';
      const chunkId = `${metadata.title}::${section.sectionNumber}${partSuffix}`
        .toLowerCase()
        .replace(/\s+/g, '-');

      chunks.push({
        id: chunkId,
        text: parts[partIndex],
        act: metadata.title,
        section: section.sectionNumber,
        jurisdiction: metadata.jurisdiction,
        sourceType: metadata.sourceType,
        sourceUrl: metadata.sourceUrl,
        verifiedAt: new Date().toISOString(),
      });
    }
  }

  return chunks;
}
