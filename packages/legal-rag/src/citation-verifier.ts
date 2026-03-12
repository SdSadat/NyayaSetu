// =============================================================================
// Citation Verifier -- Anti-Hallucination Layer
// =============================================================================
// After the LLM generates a legal response, this module cross-references
// every section number mentioned in the output against the sections that
// actually exist in the retrieved source chunks.
//
// Any section cited in the generated text that does NOT appear in the
// retrieved sources is flagged as "unverified", preventing hallucinated
// citations from reaching the user.
//
// This is the critical anti-hallucination safeguard of the RAG pipeline.
// =============================================================================

import type { LegalChunk, VerificationResult } from '@nyayasetu/shared-types';

// ---------------------------------------------------------------------------
// Section extraction
// ---------------------------------------------------------------------------

/**
 * Regex to extract section references from generated text.
 * Matches patterns like:
 *   "Section 302"   |  "section 302A"  |  "S. 302"  |  "s. 302"
 *   "Sec. 302"      |  "sec. 302"      |  "Sec 302"
 *   "u/s 302"       |  "U/S 302"       (under section shorthand)
 *
 * Captures the section number (including optional letter suffix).
 */
const SECTION_REF_RE =
  /(?:Section|section|SECTION|Sec\.?|sec\.?|S\.|s\.|[Uu]\/[Ss])\s*(\d+[A-Za-z]*)/g;

/**
 * Extract all unique section numbers mentioned in a block of text.
 */
export function extractSectionReferences(text: string): string[] {
  const refs = new Set<string>();
  let match: RegExpExecArray | null;

  SECTION_REF_RE.lastIndex = 0;
  while ((match = SECTION_REF_RE.exec(text)) !== null) {
    refs.add(match[1]);
  }

  return Array.from(refs);
}

// ---------------------------------------------------------------------------
// Advisory language detection
// ---------------------------------------------------------------------------

/**
 * Phrases that indicate the system is giving directive legal advice rather
 * than informing the user of the law. The system should inform, not advise.
 */
const ADVISORY_PHRASES: readonly string[] = [
  'you should',
  'you must',
  'i advise',
  'i recommend',
  'my advice',
  'i suggest',
  'you need to',
  'you are required to',
  'you ought to',
  'it is advisable',
  'we recommend',
  'we advise',
];

/**
 * Detect advisory / directive language in generated text.
 */
function detectAdvisoryLanguage(text: string): string[] {
  const lower = text.toLowerCase();
  return ADVISORY_PHRASES.filter((phrase) => lower.includes(phrase));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Verify that every legal section cited in the generated text is backed by
 * a chunk from the retrieved sources.
 *
 * @param generatedText    - The LLM-generated legal response text.
 * @param retrievedChunks  - The source chunks that were fed to the LLM.
 * @returns A {@link VerificationResult} indicating verification status.
 */
export function verifyCitations(
  generatedText: string,
  retrievedChunks: LegalChunk[],
): VerificationResult {
  // Build a set of section numbers present in the retrieved sources
  const sourceSections = new Set<string>(
    retrievedChunks.map((chunk) => chunk.section),
  );

  // Extract section numbers mentioned in the generated output
  const mentionedSections = extractSectionReferences(generatedText);

  const verifiedSections: string[] = [];
  const unverifiedSections: string[] = [];

  for (const section of mentionedSections) {
    if (sourceSections.has(section)) {
      verifiedSections.push(section);
    } else {
      unverifiedSections.push(section);
    }
  }

  // Check for advisory language
  const advisoryPhrases = detectAdvisoryLanguage(generatedText);

  return {
    isVerified: unverifiedSections.length === 0 && advisoryPhrases.length === 0,
    verifiedSections,
    unverifiedSections,
    containsAdvisoryLanguage: advisoryPhrases.length > 0,
    advisoryPhrases,
  };
}
