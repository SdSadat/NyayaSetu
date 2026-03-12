// =============================================================================
// Document Authenticity Verification Pipeline
// =============================================================================
// 8-stage pipeline that analyzes legal documents for signs of forgery:
//   1. Validate input (file type, size)
//   2. Extract text from PDF/DOCX/TXT
//   3. Split text into indexed paragraphs
//   4. Text analysis via Nova LLM (language, dates, legal refs, consistency)
//   5. Visual analysis via Nova multimodal (stamps, seals, signatures)
//   6. Cross-reference legal citations against vector DB
//   7. Merge issues & calculate scores
//   8. Assemble final response
// =============================================================================

import type {
  AuthenticityIssue,
  AuthenticityIssueCategory,
  AuthenticityScoreBreakdown,
  AuthenticityVerdict,
  DocumentVerifyResult,
} from '@nyayasetu/shared-types';

import {
  DOCUMENT_VERIFY_SYSTEM_PROMPT,
  DOCUMENT_VERIFY_VISUAL_SYSTEM_PROMPT,
  buildDocumentVerifyPrompt,
} from '@nyayasetu/prompts';

import { extractText } from './doc-extractor.js';
import { NovaLLM } from './nova-llm.js';
import { getRetriever } from './vector-store.js';

// ---------------------------------------------------------------------------
// Singleton LLM
// ---------------------------------------------------------------------------

let _llm: NovaLLM | null = null;

function getLLM(): NovaLLM {
  if (!_llm) {
    _llm = new NovaLLM();
    console.log('[verify-pipeline] Using Amazon Nova LLM provider (Bedrock)');
  }
  return _llm;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_TEXT_LENGTH = 50;

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);
const TEXT_EXTENSIONS = new Set(['pdf', 'docx', 'txt']);

const SCORE_WEIGHTS: Record<AuthenticityIssueCategory, number> = {
  'legal-references': 0.25,
  'consistency': 0.20,
  'dates': 0.15,
  'metadata': 0.15,
  'language': 0.10,
  'formatting': 0.10,
  'signatures': 0.05,
};

const SEVERITY_DEDUCTIONS = {
  critical: 35,
  warning: 15,
  info: 5,
} as const;

/** If ANY critical issue exists, overall score is capped at this value. */
const CRITICAL_ISSUE_SCORE_CAP = 55;

/** If critical issues exist in 3+ categories, apply this additional multiplier. */
const MULTI_CATEGORY_CRITICAL_MULTIPLIER = 0.6;

const DISCLAIMER =
  'This analysis is AI-generated and for informational purposes only. ' +
  'It does not constitute a legal opinion on the authenticity of this document. ' +
  'For definitive verification, consult a qualified legal professional.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getExtension(filename: string): string {
  return filename.toLowerCase().split('.').pop() ?? '';
}

function isImageFile(ext: string): boolean {
  return IMAGE_EXTENSIONS.has(ext);
}

function getImageFormat(ext: string): 'png' | 'jpeg' | 'gif' | 'webp' {
  if (ext === 'jpg') return 'jpeg';
  return ext as 'png' | 'jpeg' | 'gif' | 'webp';
}

/** Split text into paragraphs on double-newlines or blank lines. */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Strip markdown fences from LLM output. */
function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

/** Extract Act/Section references from text using common patterns. */
function extractLegalReferences(text: string): string[] {
  const patterns = [
    /Section\s+(\d+[A-Za-z]*)\s+(?:of\s+)?(?:the\s+)?([A-Z][A-Za-z\s,]+(?:Act|Code|Rules|Order)(?:,?\s*\d{4})?)/gi,
    /(?:Article|Art\.?)\s+(\d+[A-Za-z]*)/gi,
    /(?:Rule|Order)\s+(\d+[A-Za-z]*)\s+(?:of\s+)?(?:the\s+)?([A-Z][A-Za-z\s]+)/gi,
  ];

  const refs: string[] = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      refs.push(match[0].trim());
    }
  }
  return [...new Set(refs)];
}

// ---------------------------------------------------------------------------
// LLM response parsing
// ---------------------------------------------------------------------------

interface LLMVerifyOutput {
  documentType: string;
  documentSummary: string;
  issues: AuthenticityIssue[];
  categoryScores: AuthenticityScoreBreakdown;
}

function parseLLMResponse(raw: string): LLMVerifyOutput | null {
  try {
    const cleaned = stripFences(raw);
    const parsed = JSON.parse(cleaned) as Partial<LLMVerifyOutput>;

    if (!parsed.issues || !Array.isArray(parsed.issues)) {
      return null;
    }

    return {
      documentType: parsed.documentType ?? 'Unknown',
      documentSummary: parsed.documentSummary ?? '',
      issues: parsed.issues.map((issue, i) => ({
        id: issue.id ?? `issue-${i + 1}`,
        category: issue.category ?? 'consistency',
        severity: issue.severity ?? 'warning',
        title: issue.title ?? 'Untitled Issue',
        description: issue.description ?? '',
        paragraphIndex: issue.paragraphIndex ?? -1,
        charStart: issue.charStart ?? -1,
        charEnd: issue.charEnd ?? -1,
        flaggedText: issue.flaggedText ?? '',
        expectedBehavior: issue.expectedBehavior ?? '',
      })),
      categoryScores: {
        formatting: parsed.categoryScores?.formatting ?? 100,
        language: parsed.categoryScores?.language ?? 100,
        dates: parsed.categoryScores?.dates ?? 100,
        signatures: parsed.categoryScores?.signatures ?? 100,
        legalReferences: parsed.categoryScores?.legalReferences ?? 100,
        metadata: parsed.categoryScores?.metadata ?? 100,
        consistency: parsed.categoryScores?.consistency ?? 100,
      },
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Score calculation
// ---------------------------------------------------------------------------

function categoryKey(cat: AuthenticityIssueCategory): keyof AuthenticityScoreBreakdown {
  return cat === 'legal-references' ? 'legalReferences' : cat as keyof AuthenticityScoreBreakdown;
}

/**
 * Calculate per-category score from issues, optionally incorporating
 * the LLM's own category score (take the lower of the two).
 */
function calculateCategoryScore(
  issues: AuthenticityIssue[],
  category: AuthenticityIssueCategory,
  llmScore?: number,
): number {
  const categoryIssues = issues.filter((i) => i.category === category);
  let score = 100;
  for (const issue of categoryIssues) {
    score -= SEVERITY_DEDUCTIONS[issue.severity];
  }
  score = Math.max(0, score);

  // Use the lower of our calculated score and the LLM's own assessment
  if (llmScore !== undefined && llmScore >= 0) {
    score = Math.min(score, llmScore);
  }

  return score;
}

/**
 * Calculate overall score with critical issue caps and
 * multi-category penalty.
 */
function calculateOverallScore(
  breakdown: AuthenticityScoreBreakdown,
  issues: AuthenticityIssue[],
): number {
  // Weighted average
  let score = 0;
  const categories = Object.keys(SCORE_WEIGHTS) as AuthenticityIssueCategory[];
  for (const cat of categories) {
    const key = categoryKey(cat);
    score += (breakdown[key] ?? 100) * SCORE_WEIGHTS[cat];
  }
  score = Math.round(score);

  // Cap if any critical issues exist
  const hasCritical = issues.some((i) => i.severity === 'critical');
  if (hasCritical) {
    score = Math.min(score, CRITICAL_ISSUE_SCORE_CAP);
  }

  // Additional penalty if critical issues span 3+ categories
  const criticalCategories = new Set(
    issues.filter((i) => i.severity === 'critical').map((i) => i.category),
  );
  if (criticalCategories.size >= 3) {
    score = Math.round(score * MULTI_CATEGORY_CRITICAL_MULTIPLIER);
  }

  // Volume penalty: many issues compound the suspicion
  const totalIssues = issues.length;
  if (totalIssues >= 5) {
    score = Math.round(score * 0.85);
  } else if (totalIssues >= 8) {
    score = Math.round(score * 0.7);
  }

  return Math.max(0, Math.min(100, score));
}

function getVerdict(score: number): AuthenticityVerdict {
  if (score >= 70) return 'likely-authentic';
  if (score >= 35) return 'suspicious';
  return 'likely-fraudulent';
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export async function runVerifyPipeline(
  buffer: Buffer,
  filename: string,
  mimetype: string,
): Promise<DocumentVerifyResult> {
  const ext = getExtension(filename);

  // ── Stage 1: Validate ───────────────────────────────────────────────────
  const isImage = isImageFile(ext);
  const isText = TEXT_EXTENSIONS.has(ext) || mimetype.startsWith('text/');

  if (!isImage && !isText) {
    return {
      type: 'refusal',
      reason: 'unsupported-format',
      message: `Unsupported file type ".${ext}". Please upload a PDF, DOCX, TXT, PNG, JPG, or JPEG file.`,
    };
  }

  // ── Stage 2: Extract text (for text-based documents) ────────────────────
  let extractedText = '';
  if (isText) {
    const result = await extractText(buffer, filename, mimetype);
    if (!result.ok) {
      return {
        type: 'refusal',
        reason: 'unsupported-format',
        message: result.error,
      };
    }
    extractedText = result.text;

    if (extractedText.length < MIN_TEXT_LENGTH) {
      return {
        type: 'refusal',
        reason: 'too-short',
        message: 'The document is too short to analyze. Please upload a complete legal document.',
      };
    }
  }

  // ── Stage 3: Split into paragraphs ──────────────────────────────────────
  const paragraphs = extractedText ? splitParagraphs(extractedText) : [];

  const llm = getLLM();
  let textResult: LLMVerifyOutput | null = null;
  let visualResult: LLMVerifyOutput | null = null;

  // ── Stage 4: Text analysis (for text-extractable documents) ─────────────
  if (paragraphs.length > 0) {
    try {
      const userPrompt = buildDocumentVerifyPrompt({
        paragraphs,
        isImage: false,
      });
      const raw = await llm.generateJSON(DOCUMENT_VERIFY_SYSTEM_PROMPT, userPrompt);
      textResult = parseLLMResponse(raw);
      if (!textResult) {
        console.error('[verify-pipeline] Text analysis JSON parse failed. Raw:', raw.slice(0, 500));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[verify-pipeline] Text analysis LLM call failed: ${message}`);
    }
  }

  // ── Stage 5: Visual analysis (for images and PDFs) ──────────────────────
  if (isImage) {
    // Direct image upload → send to Nova multimodal
    try {
      const userPrompt = buildDocumentVerifyPrompt({ isImage: true });
      const raw = await llm.generateJSONWithImage(
        DOCUMENT_VERIFY_VISUAL_SYSTEM_PROMPT,
        userPrompt,
        buffer,
        getImageFormat(ext),
      );
      visualResult = parseLLMResponse(raw);
      if (!visualResult) {
        console.error('[verify-pipeline] Visual analysis JSON parse failed. Raw:', raw.slice(0, 500));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[verify-pipeline] Visual analysis LLM call failed: ${message}`);
    }
  } else if (ext === 'pdf') {
    // PDF → attempt visual analysis by sending raw PDF bytes as image
    // Nova may support PDF input directly; if not, we skip visual pass
    try {
      const userPrompt = buildDocumentVerifyPrompt({ isImage: true });
      const raw = await llm.generateJSONWithImage(
        DOCUMENT_VERIFY_VISUAL_SYSTEM_PROMPT,
        userPrompt,
        buffer,
        'png', // Nova will interpret the bytes
      );
      visualResult = parseLLMResponse(raw);
    } catch (err) {
      // Visual pass is best-effort for PDFs — text analysis is primary
      console.warn('[verify-pipeline] PDF visual analysis skipped:', (err as Error).message);
    }
  }

  // If both analyses failed, return error
  if (!textResult && !visualResult) {
    return {
      type: 'refusal',
      reason: 'llm-error',
      message: 'The analysis engine could not process this document. Please try again.',
    };
  }

  // ── Stage 6: Cross-reference legal citations ────────────────────────────
  let legalReferencesChecked = 0;
  let legalReferencesVerified = 0;

  if (extractedText) {
    const refs = extractLegalReferences(extractedText);
    legalReferencesChecked = refs.length;

    if (refs.length > 0) {
      try {
        const retriever = await getRetriever();
        for (const ref of refs.slice(0, 10)) { // limit to 10 lookups
          const result = await retriever.retrieve(ref, { scope: 'central' });
          if (result.chunks.length > 0 && result.scores[0] > 0.5) {
            legalReferencesVerified++;
          }
        }
      } catch (err) {
        console.warn('[verify-pipeline] Cross-ref skipped:', (err as Error).message);
      }
    }
  }

  // ── Stage 7: Merge issues & calculate scores ───────────────────────────
  const allIssues: AuthenticityIssue[] = [];
  const seenIds = new Set<string>();

  // Add text issues
  if (textResult) {
    for (const issue of textResult.issues) {
      seenIds.add(issue.id);
      allIssues.push(issue);
    }
  }

  // Add visual issues (with prefixed IDs to avoid collision)
  if (visualResult) {
    for (const issue of visualResult.issues) {
      const id = seenIds.has(issue.id) ? `v-${issue.id}` : issue.id;
      seenIds.add(id);
      allIssues.push({
        ...issue,
        id,
        paragraphIndex: -1, // visual issues are always document-level
      });
    }
  }

  // Add unverified legal reference issues
  if (legalReferencesChecked > 0) {
    const unverifiedCount = legalReferencesChecked - legalReferencesVerified;
    if (unverifiedCount > 0) {
      allIssues.push({
        id: 'cross-ref-unverified',
        category: 'legal-references',
        severity: unverifiedCount >= 3 ? 'critical' : 'warning',
        title: `${unverifiedCount} legal reference(s) could not be verified`,
        description: `Out of ${legalReferencesChecked} legal references found in the document, ${unverifiedCount} could not be verified against our legal database. This may indicate fabricated or incorrect legal citations.`,
        paragraphIndex: -1,
        charStart: -1,
        charEnd: -1,
        flaggedText: '',
        expectedBehavior: 'All cited legal provisions should correspond to real, existing laws.',
      });
    }
  }

  // Merge LLM category scores (take lowest from any analysis pass)
  const llmScores: Partial<AuthenticityScoreBreakdown> = {};
  for (const result of [textResult, visualResult]) {
    if (!result) continue;
    const cs = result.categoryScores;
    for (const [k, v] of Object.entries(cs)) {
      const key = k as keyof AuthenticityScoreBreakdown;
      llmScores[key] = Math.min(llmScores[key] ?? 100, v);
    }
  }

  // Calculate final scores: issue-based deductions merged with LLM scores
  const ALL_CATEGORIES: AuthenticityIssueCategory[] = [
    'formatting', 'language', 'dates', 'signatures',
    'legal-references', 'metadata', 'consistency',
  ];

  const scoreBreakdown: AuthenticityScoreBreakdown = {
    formatting: calculateCategoryScore(allIssues, 'formatting', llmScores.formatting),
    language: calculateCategoryScore(allIssues, 'language', llmScores.language),
    dates: calculateCategoryScore(allIssues, 'dates', llmScores.dates),
    signatures: calculateCategoryScore(allIssues, 'signatures', llmScores.signatures),
    legalReferences: calculateCategoryScore(allIssues, 'legal-references', llmScores.legalReferences),
    metadata: calculateCategoryScore(allIssues, 'metadata', llmScores.metadata),
    consistency: calculateCategoryScore(allIssues, 'consistency', llmScores.consistency),
  };

  const overallScore = calculateOverallScore(scoreBreakdown, allIssues);
  const verdict = getVerdict(overallScore);

  // Use document info from whichever analysis succeeded
  const documentType = textResult?.documentType ?? visualResult?.documentType ?? 'Unknown';
  const documentSummary = textResult?.documentSummary ?? visualResult?.documentSummary ?? '';

  // ── Stage 8: Assemble response ─────────────────────────────────────────
  return {
    type: 'success',
    overallScore,
    verdict,
    scoreBreakdown,
    issues: allIssues,
    paragraphs,
    documentSummary,
    documentType,
    legalReferencesChecked,
    legalReferencesVerified,
    ...(isImage
      ? {
          imageData: buffer.toString('base64'),
          imageMime: mimetype,
        }
      : {}),
    analysisTimestamp: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };
}
