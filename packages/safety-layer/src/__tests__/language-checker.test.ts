import { describe, it, expect } from 'vitest';
import { checkForAdvisoryLanguage } from '../language-checker.js';

// =============================================================================
// Language Checker — Unit Tests
// =============================================================================

describe('checkForAdvisoryLanguage', () => {
  // -------------------------------------------------------------------------
  // Safe texts — should NOT be flagged
  // -------------------------------------------------------------------------
  describe('safe texts (no advisory language)', () => {
    it('returns false for purely informational text', () => {
      const text =
        'Section 498A of the Indian Penal Code deals with cruelty by a husband or his relatives towards a married woman.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(false);
      expect(result.advisoryPhrases).toHaveLength(0);
    });

    it('returns false for text describing legal provisions', () => {
      const text =
        'Under the Right to Information Act, 2005, any citizen of India may request information from a public authority. ' +
        'The authority is obligated to respond within 30 days.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(false);
      expect(result.advisoryPhrases).toHaveLength(0);
    });

    it('returns false for text with neutral procedural description', () => {
      const text =
        'A First Information Report (FIR) is a document prepared by the police when they receive information about the commission ' +
        'of a cognizable offence. It is filed under Section 154 of the Code of Criminal Procedure.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(false);
      expect(result.advisoryPhrases).toHaveLength(0);
    });

    it('returns false for empty text', () => {
      const result = checkForAdvisoryLanguage('');

      expect(result.containsAdvisoryLanguage).toBe(false);
      expect(result.advisoryPhrases).toHaveLength(0);
    });

    it('returns false for text that mentions "court" without a directive', () => {
      const text =
        'The Supreme Court of India held in this landmark case that fundamental rights cannot be waived.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(false);
      expect(result.advisoryPhrases).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Unsafe texts — MUST be flagged
  // -------------------------------------------------------------------------
  describe('unsafe texts (contains advisory language)', () => {
    it('detects "you should"', () => {
      const text = 'You should file a complaint with the consumer forum.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(true);
      expect(result.advisoryPhrases).toContain('you should');
      expect(result.advisoryPhrases).toContain('file a complaint');
    });

    it('detects "you must"', () => {
      const text = 'You must report this to the police immediately.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(true);
      expect(result.advisoryPhrases).toContain('you must');
    });

    it('detects "hire a lawyer"', () => {
      const text = 'In this situation, it would be best to hire a lawyer who specializes in property law.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(true);
      expect(result.advisoryPhrases).toContain('hire a lawyer');
    });

    it('detects "go to court"', () => {
      const text = 'If the landlord does not comply, go to court and file a civil suit.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(true);
      expect(result.advisoryPhrases).toContain('go to court');
    });

    it('detects "file a complaint"', () => {
      const text = 'File a complaint under the Consumer Protection Act, 2019.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(true);
      expect(result.advisoryPhrases).toContain('file a complaint');
    });

    it('detects "take legal action"', () => {
      const text = 'You can take legal action against the employer for wrongful termination.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(true);
      expect(result.advisoryPhrases).toContain('take legal action');
    });

    it('detects "i recommend"', () => {
      const text = 'Based on the facts, I recommend pursuing a writ petition under Article 226.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(true);
      expect(result.advisoryPhrases).toContain('i recommend');
    });

    it('detects "send a legal notice"', () => {
      const text = 'The first step would be to send a legal notice to the builder demanding a refund.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(true);
      expect(result.advisoryPhrases).toContain('send a legal notice');
    });

    it('detects "approach the court"', () => {
      const text = 'If your fundamental rights are being violated, approach the court under Article 32.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(true);
      expect(result.advisoryPhrases).toContain('approach the court');
    });

    it('detects "it is advisable"', () => {
      const text = 'It is advisable to keep copies of all documents.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(true);
      expect(result.advisoryPhrases).toContain('it is advisable');
    });
  });

  // -------------------------------------------------------------------------
  // Case-insensitivity
  // -------------------------------------------------------------------------
  describe('case-insensitive matching', () => {
    it('detects advisory phrases regardless of casing', () => {
      const text = 'YOU SHOULD immediately contact the authorities.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(true);
      expect(result.advisoryPhrases).toContain('you should');
    });

    it('detects mixed-case phrases', () => {
      const text = 'Hire A Lawyer who specializes in criminal defense.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(true);
      expect(result.advisoryPhrases).toContain('hire a lawyer');
    });
  });

  // -------------------------------------------------------------------------
  // Multiple detections
  // -------------------------------------------------------------------------
  describe('multiple advisory phrases in a single text', () => {
    it('detects all advisory phrases present', () => {
      const text =
        'You should hire a lawyer and file a complaint. I recommend you take legal action immediately.';
      const result = checkForAdvisoryLanguage(text);

      expect(result.containsAdvisoryLanguage).toBe(true);
      expect(result.advisoryPhrases).toContain('you should');
      expect(result.advisoryPhrases).toContain('hire a lawyer');
      expect(result.advisoryPhrases).toContain('file a complaint');
      expect(result.advisoryPhrases).toContain('i recommend');
      expect(result.advisoryPhrases).toContain('take legal action');
      expect(result.advisoryPhrases.length).toBeGreaterThanOrEqual(5);
    });
  });
});
