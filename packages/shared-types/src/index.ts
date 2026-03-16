// =============================================================================
// NyayaSetu Shared Types
// =============================================================================
// Core domain types used across all packages and applications.
// These types encode the safety and jurisdictional constraints of the system.
// =============================================================================

// ---------------------------------------------------------------------------
// Jurisdiction
// ---------------------------------------------------------------------------

/** Indian states supported by the system. Expand as coverage grows. */
export type SupportedState = 'west-bengal' | 'jharkhand';

/** Jurisdiction scope: central law applies nationally, state law is local. */
export type JurisdictionScope = 'central' | 'state';

export interface Jurisdiction {
  scope: JurisdictionScope;
  state?: SupportedState;
}

// ---------------------------------------------------------------------------
// Legal Sources & Citations
// ---------------------------------------------------------------------------

/** Categories of legal source material. */
export type LegalSourceType = 'bare-act' | 'supreme-court' | 'high-court' | 'state-rule';

/** A single legal source chunk stored in the vector database. */
export interface LegalChunk {
  id: string;
  text: string;
  act: string;
  section: string;
  subSection?: string;
  jurisdiction: Jurisdiction;
  sourceType: LegalSourceType;
  sourceUrl: string;
  /** ISO date of last verification */
  verifiedAt: string;
}

/** A citation attached to a generated response. */
export interface Citation {
  section: string;
  act: string;
  sourceUrl: string;
  relevantText: string;
  sourceType: LegalSourceType;
}

// ---------------------------------------------------------------------------
// Certainty & Safety
// ---------------------------------------------------------------------------

/** Legal certainty level for a response. */
export type CertaintyLevel = 'high' | 'medium' | 'low';

/** Numeric certainty score between 0 and 1. */
export type CertaintyScore = number;

/** Why the system refused to answer. */
export type RefusalReason =
  | 'no-sources-retrieved'
  | 'low-certainty'
  | 'conflicting-sources'
  | 'jurisdiction-unknown'
  | 'advisory-language-detected'
  | 'out-of-scope';

export interface SafetyNote {
  text: string;
  isDeescalation: boolean;
}

// ---------------------------------------------------------------------------
// Entity Extraction (Sahayak)
// ---------------------------------------------------------------------------

export type ActorType = 'police' | 'landlord' | 'employer' | 'citizen' | 'authority' | 'other';
export type ActionType =
  | 'seizure'
  | 'threat'
  | 'eviction'
  | 'fine'
  | 'arrest'
  | 'search'
  | 'notice'
  | 'other';

export interface ExtractedEntities {
  actor?: ActorType;
  action?: ActionType;
  object?: string;
  context?: string;
  fromState?: SupportedState;
  toState?: SupportedState;
  state?: SupportedState;
}

// ---------------------------------------------------------------------------
// Conversation (Sahayak Multi-turn)
// ---------------------------------------------------------------------------

/** A single turn in a Sahayak conversation (user question or assistant answer). */
export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  /** Section references cited in this turn (assistant turns only). */
  sources?: string[];
  /** Jurisdiction determined for this turn (assistant turns only). */
  jurisdiction?: Jurisdiction;
}

/** Whether the current query is a follow-up or a new topic. */
export type ConversationIntentType = 'follow-up' | 'new-topic' | 'clarification';

export interface ConversationIntent {
  type: ConversationIntentType;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Query & Response (Sahayak Pipeline)
// ---------------------------------------------------------------------------

export type QueryIntent = 'scenario' | 'information' | 'unclear';

export interface ParsedQuery {
  originalText: string;
  intent: QueryIntent;
  entities: ExtractedEntities;
  jurisdiction: Jurisdiction;
  language: 'en' | 'hi';
}

/** A successful legal response with citations. */
export interface LegalResponse {
  type: 'success';
  legalBasis: string;
  citations: Citation[];
  safetyNote: SafetyNote;
  certaintyScore: CertaintyScore;
  certaintyLevel: CertaintyLevel;
  jurisdiction: Jurisdiction;
  disclaimer: string;
  /** Whether this response was treated as a follow-up to a previous query. */
  isFollowUp?: boolean;
  /** The expanded query used for retrieval (if the original was rewritten). */
  rewrittenQuery?: string;
}

/** A refusal response when the system cannot safely answer. */
export interface RefusalResponse {
  type: 'refusal';
  reason: RefusalReason;
  message: string;
  suggestHumanLawyer: boolean;
}

export type SahayakResponse = LegalResponse | RefusalResponse;

// ---------------------------------------------------------------------------
// Jagrut (Learning Engine)
// ---------------------------------------------------------------------------

export type LessonCategory =
  | 'fundamental-rights'
  | 'police-powers'
  | 'traffic-laws'
  | 'tenancy'
  | 'consumer-rights'
  | 'workplace-rights';

export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LessonCard {
  id: string;
  act: string;
  section: string;
  title: string;
  plainLanguageExplanation: string;
  /** Full lesson body in markdown-like format */
  content: string;
  /** Key takeaways shown at the end of the lesson */
  keyTakeaways: string[];
  category: LessonCategory;
  difficulty: LessonDifficulty;
  /** Sort order within category */
  order: number;
  jurisdiction: Jurisdiction;
  /** Estimated reading time in seconds */
  readingTimeSeconds: number;
}

export interface QuizQuestion {
  id: string;
  lessonId: string;
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  jurisdiction: Jurisdiction;
}

export interface UserProgress {
  userId: string;
  lessonId: string;
  /** SM-2 algorithm fields for spaced repetition */
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
}

// ---------------------------------------------------------------------------
// Drishti (Professional Case Analyser)
// ---------------------------------------------------------------------------

export type DrishtiDocumentType = 'judgment' | 'order' | 'notice' | 'agreement' | 'other';

// --- Timeline ---
export type DrishtiEventType =
  | 'filing'
  | 'hearing'
  | 'order'
  | 'judgment'
  | 'stay'
  | 'remand'
  | 'appeal'
  | 'other';

export interface DrishtiTimelineEvent {
  date: string;           // ISO date or descriptive if unknown
  court: string;
  eventType: DrishtiEventType;
  description: string;
  isKeyEvent: boolean;
}

// --- Issue Tree ---
export interface DrishtiIssueNode {
  id: string;
  parentId: string | null; // null for root issues
  question: string;
  petitionerArgument: string;
  respondentArgument: string;
  courtFinding: string;
  appliedLaw: string[];   // e.g. ["Article 21", "Section 154 CrPC"]
}

// --- Precedents ---
export type PrecedentRelation =
  | 'relied-on'
  | 'distinguished'
  | 'overruled'
  | 'followed'
  | 'referred';

export interface DrishtiPrecedentCase {
  name: string;
  citation: string;
  year: number | null;
  relation: PrecedentRelation;
  relevanceNote: string;
}

// --- Section Heatmap ---
export type SectionRole = 'holding' | 'ratio' | 'obiter' | 'background';

export interface DrishtiSectionMention {
  act: string;
  section: string;
  mentionCount: number;
  role: SectionRole;
  /** 0–1 score: how central this section is to the outcome */
  centralityScore: number;
}

// --- Argument Duel ---
export interface DrishtiPartyArgument {
  point: string;
  citedLaw: string[];
  accepted: 'yes' | 'no' | 'partial';
}

export interface DrishtiArgumentDuel {
  petitionerName: string;
  respondentName: string;
  petitioner: DrishtiPartyArgument[];
  respondent: DrishtiPartyArgument[];
}

// --- Relief & Compliance ---
export type ReliefComplianceType = 'mandatory' | 'discretionary' | 'procedural';

export interface DrishtiReliefItem {
  direction: string;
  authority: string;       // who must comply
  deadline: string | null; // e.g. "4 weeks" or null
  complianceType: ReliefComplianceType;
}

// --- Tagged Paragraphs (Ratio / Obiter) ---
export type ParagraphType = 'ratio' | 'obiter' | 'background' | 'procedural' | 'conclusion';

export interface DrishtiTaggedParagraph {
  text: string;
  type: ParagraphType;
  citations: string[];
}

// --- Multi-level Explanations ---
export interface DrishtiExplainModes {
  teen: string;           // plain ~2-sentence explanation
  student: string;        // ~4-sentence explanation with key terms
  practitioner: string;   // precise legal language, ~6 sentences
}

// --- Legal Doctrines ---
export interface DrishtiLegalDoctrine {
  name: string;           // e.g. "Audi Alteram Partem"
  description: string;
  howApplied: string;
}

// --- Top-level DrishtiAnalysis ---
export interface DrishtiAnalysis {
  // Document metadata
  documentType: DrishtiDocumentType;
  caseTitle: string;
  citation: string;
  court: string;
  bench: string;          // judge names
  dateOfJudgment: string;
  petitioner: string;
  respondent: string;

  // Core summary
  factsInBrief: string;
  decisionInOneLine: string;

  // Rich analysis
  timeline: DrishtiTimelineEvent[];
  issueTree: DrishtiIssueNode[];
  precedents: DrishtiPrecedentCase[];
  sectionHeatmap: DrishtiSectionMention[];
  argumentDuel: DrishtiArgumentDuel;
  reliefDirections: DrishtiReliefItem[];
  taggedParagraphs: DrishtiTaggedParagraph[];
  explainModes: DrishtiExplainModes;
  legalDoctrines: DrishtiLegalDoctrine[];

  /** Overall outcome: allowed / dismissed / remanded / settled / other */
  outcome: string;
  /** Important caveats or limitations of this analysis */
  caveats: string[];
}

// ---------------------------------------------------------------------------
// Drishti Shareable Reports
// ---------------------------------------------------------------------------

export type ShareAccessLevel = 'public' | 'password';

export type ShareExpiry = '24h' | '7d' | '30d' | null;

export interface ShareRecord {
  shareId: string;
  ownerId: string;
  historyId: string;
  accessLevel: ShareAccessLevel;
  caseTitle: string;
  analysis: DrishtiAnalysis;
  documentText?: string;
  createdAt: string;
  expiresAt?: number;
  viewCount: number;
  revoked: boolean;
}

/** Lightweight share info returned when listing shares. */
export interface ShareListItem {
  shareId: string;
  caseTitle: string;
  accessLevel: ShareAccessLevel;
  viewCount: number;
  createdAt: string;
  expiresAt: number | null;
  revoked: boolean;
}

/** Response when viewing a public shared report. */
export interface SharedReportSuccess {
  type: 'success';
  caseTitle: string;
  analysis: DrishtiAnalysis;
  documentText?: string;
  sharedAt: string;
  expiresAt: string | null;
}

/** Response when a shared report requires a password. */
export interface SharedReportLocked {
  type: 'password-required';
  caseTitle: string;
}

/** Response when a shared report is expired, revoked, or not found. */
export interface SharedReportNotFound {
  type: 'not-found';
  message: string;
}

export type SharedReportResponse =
  | SharedReportSuccess
  | SharedReportLocked
  | SharedReportNotFound;

// Keep CaseBrief as a legacy alias so existing imports don't break
/** @deprecated Use DrishtiAnalysis instead */
export type CaseBrief = DrishtiAnalysis;

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export interface VerificationResult {
  isVerified: boolean;
  /** Sections mentioned in output that exist in retrieved sources */
  verifiedSections: string[];
  /** Sections mentioned in output that do NOT exist in retrieved sources */
  unverifiedSections: string[];
  /** Whether the output contains directive/advisory language */
  containsAdvisoryLanguage: boolean;
  /** Detected directive phrases */
  advisoryPhrases: string[];
}

// ---------------------------------------------------------------------------
// Document Authenticity Verification (Sahayak)
// ---------------------------------------------------------------------------

export type AuthenticityIssueCategory =
  | 'formatting'
  | 'language'
  | 'dates'
  | 'signatures'
  | 'legal-references'
  | 'metadata'
  | 'consistency';

export type AuthenticityIssueSeverity = 'critical' | 'warning' | 'info';

export interface AuthenticityIssue {
  id: string;
  category: AuthenticityIssueCategory;
  severity: AuthenticityIssueSeverity;
  title: string;
  description: string;
  /** Paragraph index (0-based) in the split document. -1 for visual-only issues. */
  paragraphIndex: number;
  /** Start char offset within the paragraph (-1 if whole paragraph or visual-only) */
  charStart: number;
  /** End char offset within the paragraph (-1 if whole paragraph or visual-only) */
  charEnd: number;
  /** The exact text snippet flagged (empty for visual-only issues) */
  flaggedText: string;
  /** What was expected or is standard */
  expectedBehavior: string;
}

export interface AuthenticityScoreBreakdown {
  formatting: number;
  language: number;
  dates: number;
  signatures: number;
  legalReferences: number;
  metadata: number;
  consistency: number;
}

export type AuthenticityVerdict = 'likely-authentic' | 'suspicious' | 'likely-fraudulent';

export interface DocumentVerifyResponse {
  type: 'success';
  overallScore: number;
  verdict: AuthenticityVerdict;
  scoreBreakdown: AuthenticityScoreBreakdown;
  issues: AuthenticityIssue[];
  /** Document split into paragraphs for highlight rendering */
  paragraphs: string[];
  documentSummary: string;
  documentType: string;
  legalReferencesChecked: number;
  legalReferencesVerified: number;
  /** Base64 image data if an image was uploaded (for display) */
  imageData?: string;
  /** Image MIME type */
  imageMime?: string;
  analysisTimestamp: string;
  disclaimer: string;
}

export type DocumentVerifyRefusalReason =
  | 'unsupported-format'
  | 'too-short'
  | 'not-legal'
  | 'llm-error'
  | 'parse-error';

export interface DocumentVerifyRefusal {
  type: 'refusal';
  reason: DocumentVerifyRefusalReason;
  message: string;
}

export type DocumentVerifyResult = DocumentVerifyResponse | DocumentVerifyRefusal;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface SafetyConfig {
  certaintyThreshold: CertaintyScore;
  maxRetrievalResults: number;
  refuseOnNoSource: boolean;
}

export const DEFAULT_SAFETY_CONFIG: SafetyConfig = {
  certaintyThreshold: 0.5,
  maxRetrievalResults: 10,
  refuseOnNoSource: true,
};

// ---------------------------------------------------------------------------
// Know Your Rights Cards
// ---------------------------------------------------------------------------

export type RightsCardCategory =
  | 'fundamental-rights'
  | 'police-powers'
  | 'traffic-laws'
  | 'tenancy'
  | 'consumer-rights'
  | 'workplace-rights';

export type RightsCardVariant = 'standard' | 'crisis' | 'myth-buster' | 'procedure' | 'quick-ref';

/** Shared fields for all card variants */
interface RightsCardBase {
  id: string;
  variant: RightsCardVariant;
  category: RightsCardCategory;
  title: string;
  subtitle: string;
  /** Applicable law or act reference shown on card */
  legalRef: string;
  jurisdiction: Jurisdiction;
  /** ISO date of last review */
  reviewedAt: string;
  /** Optional lesson this card is linked to */
  lessonId?: string;
  tags: string[];
}

/** Standard 3-2-1 card: 3 rights, 2 duties, 1 safety tip */
export interface RightsCardStandard extends RightsCardBase {
  variant: 'standard';
  rights: [string, string, string];
  duties: [string, string];
  safetyTip: string;
}

/** Crisis card: immediate action steps in an emergency scenario */
export interface RightsCardCrisis extends RightsCardBase {
  variant: 'crisis';
  /** One-line situation description on card header */
  situation: string;
  doNow: string[];       // immediate actions (max 4)
  doNotDo: string[];     // things to avoid (max 3)
  helplineNumber: string;
  helplineLabel: string;
}

/** Myth-buster card: corrects common legal misconceptions */
export interface RightsCardMythBuster extends RightsCardBase {
  variant: 'myth-buster';
  myths: Array<{
    myth: string;
    reality: string;
    legalBasis: string;
  }>;
}

/** Procedure card: step-by-step process map */
export interface RightsCardProcedure extends RightsCardBase {
  variant: 'procedure';
  scenario: string;
  steps: Array<{
    label: string;
    description: string;
    authority?: string;   // who to approach
    documents?: string[]; // documents to bring
  }>;
  commonFailurePoints: string[];
  timeframe: string;
}

/** Quick-reference card: compact key-value table */
export interface RightsCardQuickRef extends RightsCardBase {
  variant: 'quick-ref';
  rows: Array<{
    situation: string;
    yourRight: string;
    legalSource: string;
  }>;
  bottomNote: string;
}

/** Discriminated union of all card variants */
export type RightsCard =
  | RightsCardStandard
  | RightsCardCrisis
  | RightsCardMythBuster
  | RightsCardProcedure
  | RightsCardQuickRef;
