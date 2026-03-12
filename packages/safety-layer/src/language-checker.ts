// =============================================================================
// Language Checker
// =============================================================================
// Scans LLM output for directive / advisory language that a legal information
// platform must NEVER emit. The system provides information, not advice.
// =============================================================================

import type { VerificationResult } from '@nyayasetu/shared-types';

/**
 * Phrases that constitute advisory or directive language.
 *
 * Each entry is lowercased. Matching is performed case-insensitively against
 * the full output text. The list intentionally over-flags -- it is always
 * safer to refuse than to accidentally give legal advice.
 */
const ADVISORY_PHRASES: readonly string[] = [
  // Direct directives
  'you should',
  'you must',
  'you need to',
  'you ought to',
  'you have to',
  'you are required to',
  'you are advised to',
  'i advise you',
  'i recommend',
  'i suggest',
  'my advice',
  'my recommendation',

  // Imperative action phrases
  'file a complaint',
  'file an fir',
  'file a case',
  'file a petition',
  'go to court',
  'go to the police',
  'approach the court',
  'approach the police',
  'hire a lawyer',
  'get a lawyer',
  'consult a lawyer',
  'engage an advocate',
  'take legal action',
  'take this to court',
  'sue them',
  'press charges',
  'demand compensation',
  'send a legal notice',
  'seek an injunction',

  // Prescriptive language
  'the best course of action',
  'the right thing to do',
  'what you should do',
  'here is what to do',
  "here's what to do",
  'make sure to',
  'do not forget to',
  "don't forget to",
  'ensure that you',
  'it is advisable',
  'it is recommended',
  'it would be wise',
] as const;

/**
 * Result of an advisory-language scan.
 */
export interface AdvisoryLanguageResult {
  /** True if any advisory / directive phrase was detected. */
  containsAdvisoryLanguage: boolean;
  /** The specific phrases that were found (lowercased). */
  advisoryPhrases: string[];
}

/**
 * Scan `text` for directive or advisory phrases.
 *
 * Returns an object indicating whether advisory language was found and,
 * if so, which phrases were detected. The check is case-insensitive.
 */
export function checkForAdvisoryLanguage(text: string): AdvisoryLanguageResult {
  const detected: string[] = [];

  for (const phrase of ADVISORY_PHRASES) {
    // Use word boundaries so "you should not" doesn't false-positive on "you should"
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(text)) {
      detected.push(phrase);
    }
  }

  return {
    containsAdvisoryLanguage: detected.length > 0,
    advisoryPhrases: detected,
  };
}

/**
 * Build a partial {@link VerificationResult} from the advisory-language scan.
 *
 * This is a convenience helper so that callers can merge the advisory result
 * into a full `VerificationResult` without constructing it manually.
 */
export function toVerificationFields(
  result: AdvisoryLanguageResult,
): Pick<VerificationResult, 'containsAdvisoryLanguage' | 'advisoryPhrases'> {
  return {
    containsAdvisoryLanguage: result.containsAdvisoryLanguage,
    advisoryPhrases: result.advisoryPhrases,
  };
}
