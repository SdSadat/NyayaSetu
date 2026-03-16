import { useState, useCallback, useMemo, type ReactNode } from 'react';
import type { LegalResponse, Citation } from '@nyayasetu/shared-types';
import SafetyNote from './SafetyNote';
import CertaintyBadge from './CertaintyBadge';
import JurisdictionTag from './JurisdictionTag';

interface Props {
  response: LegalResponse;
}

/* ─── Helpers ───────────────────────────────────────────── */

/** Group citations by act name. */
function groupByAct(citations: Citation[]): Map<string, Citation[]> {
  const map = new Map<string, Citation[]>();
  for (const c of citations) {
    const existing = map.get(c.act);
    if (existing) existing.push(c);
    else map.set(c.act, [c]);
  }
  return map;
}

/**
 * Build a citation index: maps normalised "section X" strings to their
 * 1-based index in the citations array so we can render superscript markers
 * inside the legal-basis text.
 */
function buildSectionIndex(citations: Citation[]): Map<string, number[]> {
  const idx = new Map<string, number[]>();
  citations.forEach((c, i) => {
    // e.g. "Section 102" → "section 102", "Section 41A" → "section 41a"
    const key = c.section.toLowerCase().trim();
    const existing = idx.get(key);
    if (existing) existing.push(i);
    else idx.set(key, [i]);
  });
  return idx;
}

/* ─── Section-header colour mapping ─────────────────────── */

const HEADER_STYLES: Record<string, { border: string; text: string; bg: string; icon: string }> = {
  'legal position': {
    border: 'rgba(6, 214, 221, 0.25)',
    text: '#06d6dd',
    bg: 'rgba(6, 214, 221, 0.06)',
    icon: '\u00a7', // §
  },
  'safety': {
    border: 'rgba(245, 158, 11, 0.25)',
    text: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.06)',
    icon: '\u26a0', // ⚠
  },
  'jurisdiction': {
    border: 'rgba(168, 85, 247, 0.25)',
    text: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.06)',
    icon: '\u2696', // ⚖
  },
};

const DEFAULT_HEADER_STYLE = {
  border: 'rgba(255,255,255,0.1)',
  text: '#e5e7eb',
  bg: 'rgba(255,255,255,0.04)',
  icon: '\u25cf', // ●
};

function getHeaderStyle(label: string) {
  const lower = label.toLowerCase();
  for (const [key, style] of Object.entries(HEADER_STYLES)) {
    if (lower.includes(key)) return style;
  }
  return DEFAULT_HEADER_STYLE;
}

/* ─── Inline tokeniser ──────────────────────────────────── */

/**
 * Tokenise a line of text, rendering:
 *  - **bold** → <strong>
 *  - Section 102 / Section 41A(1) → highlighted + citation marker buttons
 *  - plain text → as-is
 */
function tokeniseInline(
  line: string,
  sectionIndex: Map<string, number[]>,
  onCitationClick: (idx: number) => void,
  keyPrefix: string,
): ReactNode[] {
  // Combined pattern: capture **bold** OR Section references
  const pattern = /(\*\*(.+?)\*\*)|(\bSection\s+\d+[A-Za-z]*(?:\([a-zA-Z0-9]+\))?)/gi;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // **bold** match — match[2] is the inner text
      parts.push(
        <strong key={`${keyPrefix}-b-${match.index}`} className="font-semibold text-white">
          {match[2]}
        </strong>,
      );
      lastIndex = match.index + match[1].length;
    } else if (match[3]) {
      // Section reference match
      const raw = match[3];
      const key = raw.toLowerCase().trim();
      const citationIndices = sectionIndex.get(key);

      if (citationIndices && citationIndices.length > 0) {
        const displayNums = citationIndices.map((i) => i + 1);
        parts.push(
          <span key={`${keyPrefix}-s-${match.index}`}>
            <span className="font-medium text-neon-cyan">{raw}</span>
            {displayNums.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onCitationClick(n - 1)}
                className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200"
                style={{
                  background: 'rgba(6, 214, 221, 0.15)',
                  color: '#06d6dd',
                  verticalAlign: 'super',
                  lineHeight: 1,
                  padding: '0 4px',
                }}
                title={`Jump to source #${n}`}
              >
                {n}
              </button>
            ))}
          </span>,
        );
      } else {
        parts.push(
          <span key={`${keyPrefix}-s-${match.index}`} className="font-medium text-gray-200">
            {raw}
          </span>,
        );
      }
      lastIndex = match.index + raw.length;
    }
  }

  // Remaining text
  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts;
}

/* ─── Main text renderer ────────────────────────────────── */

/**
 * Parse the legal-basis text into structured blocks:
 *  - Lines matching **Header** or **Header**: become styled section dividers
 *  - Consecutive non-header lines become paragraphs with inline annotation
 */
function renderAnnotatedText(
  text: string,
  sectionIndex: Map<string, number[]>,
  onCitationClick: (idx: number) => void,
): ReactNode[] {
  const lines = text.split(/\n/);
  const elements: ReactNode[] = [];
  let paraBuffer: string[] = [];
  let key = 0;

  function flushParagraph() {
    if (paraBuffer.length === 0) return;
    const joined = paraBuffer.join(' ').trim();
    if (joined) {
      elements.push(
        <p key={`p-${key++}`} className="text-sm leading-[1.85] text-gray-300">
          {tokeniseInline(joined, sectionIndex, onCitationClick, `p${key}`)}
        </p>,
      );
    }
    paraBuffer = [];
  }

  const headerPattern = /^\*\*(.+?)\*\*:?\s*$/;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Empty line → flush paragraph
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Check for section header: **Legal Position** or **Safety Considerations**:
    const hMatch = trimmed.match(headerPattern);
    if (hMatch) {
      flushParagraph();
      const label = hMatch[1];
      const style = getHeaderStyle(label);
      elements.push(
        <div
          key={`h-${key++}`}
          className="mt-4 mb-3 flex items-center gap-2.5 rounded-lg px-3 py-2 first:mt-0"
          style={{
            background: style.bg,
            borderLeft: `3px solid ${style.border}`,
          }}
        >
          <span className="text-base" style={{ color: style.text }}>
            {style.icon}
          </span>
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: style.text }}
          >
            {label}
          </span>
        </div>,
      );
      continue;
    }

    // Regular text → accumulate into paragraph
    paraBuffer.push(trimmed);
  }

  // Flush remaining
  flushParagraph();

  return elements;
}

/* ─── Sub-components ────────────────────────────────────── */

function PipelineSteps() {
  const steps = [
    { label: 'Entities', icon: '{}' },
    { label: 'Retrieved', icon: 'db' },
    { label: 'Generated', icon: 'AI' },
    { label: 'Verified', icon: '\u2713' },
  ];

  return (
    <div className="flex items-center justify-start gap-1 overflow-x-auto no-scrollbar">
      {steps.map((step, i) => (
        <div key={step.label} className="flex shrink-0 items-center gap-1">
          <div
            className="flex h-6 sm:h-7 items-center gap-1 sm:gap-1.5 rounded-full border px-2 sm:px-2.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider"
            style={{
              borderColor: 'rgba(6, 214, 221, 0.2)',
              background: 'rgba(6, 214, 221, 0.06)',
              color: '#06d6dd',
            }}
          >
            <span className="font-mono text-[10px] sm:text-[11px]">{step.icon}</span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <svg
              className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-all hover:border-white/[0.15] hover:text-white"
      title="Copy response"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function ExpandableCitation({
  citation,
  index,
  isActive,
  onToggle,
}: {
  citation: Citation;
  index: number;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      id={`citation-${index}`}
      className={`rounded-xl border transition-all duration-300 ${
        isActive
          ? 'border-neon-cyan/30 bg-neon-cyan/[0.04]'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        {/* Number badge */}
        <span
          className="mt-0.5 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          style={{
            background: isActive ? 'rgba(6, 214, 221, 0.2)' : 'rgba(255,255,255,0.08)',
            color: isActive ? '#06d6dd' : '#9ca3af',
          }}
        >
          {index + 1}
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${isActive ? 'text-neon-cyan' : 'text-gray-200'}`}>
            {citation.section}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {citation.act}
          </p>
        </div>

        {/* Expand arrow */}
        <svg
          className={`mt-1 h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform duration-200 ${
            isActive ? 'rotate-180' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded content */}
      {isActive && (
        <div className="animate-fade-in border-t border-white/[0.06] px-3 pb-3 pt-2">
          {citation.relevantText && (
            <blockquote
              className="mb-3 border-l-2 pl-3 text-xs italic leading-relaxed text-gray-400"
              style={{ borderColor: 'rgba(168, 85, 247, 0.4)' }}
            >
              &ldquo;{citation.relevantText}&rdquo;
            </blockquote>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {citation.sourceType.replace('-', ' ')}
            </span>
            {citation.sourceUrl && (
              <a
                href={citation.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-neon-cyan transition-colors hover:underline"
              >
                View source
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────── */

export default function LegalResponseCard({ response }: Props) {
  const [expandedCitations, setExpandedCitations] = useState<Set<number>>(
    new Set(),
  );
  const [showAllSources, setShowAllSources] = useState(false);

  const sectionIndex = useMemo(
    () => buildSectionIndex(response.citations),
    [response.citations],
  );

  const groupedCitations = useMemo(
    () => groupByAct(response.citations),
    [response.citations],
  );

  const toggleCitation = useCallback((idx: number) => {
    setExpandedCitations((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const scrollToCitation = useCallback(
    (idx: number) => {
      setExpandedCitations((prev) => new Set(prev).add(idx));
      setShowAllSources(true);
      // Small delay to let the DOM update
      requestAnimationFrame(() => {
        const el = document.getElementById(`citation-${idx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          // Flash effect
          el.classList.add('ring-1', 'ring-neon-cyan/40');
          setTimeout(() => el.classList.remove('ring-1', 'ring-neon-cyan/40'), 1500);
        }
      });
    },
    [],
  );

  const annotatedText = useMemo(
    () => renderAnnotatedText(response.legalBasis, sectionIndex, scrollToCitation),
    [response.legalBasis, sectionIndex, scrollToCitation],
  );

  const flatCitations = response.citations;

  /** Shared sources list used in both desktop panel and mobile accordion */
  const sourcesList = (
    <div className="space-y-4">
      {Array.from(groupedCitations.entries()).map(([act, citations]) => {
        const globalIndices = citations.map((c) => flatCitations.indexOf(c));
        return (
          <div key={act}>
            <p className="mb-2 truncate text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              {act}
            </p>
            <div className="space-y-2">
              {globalIndices.map((gi) => (
                <ExpandableCitation
                  key={gi}
                  citation={flatCitations[gi]}
                  index={gi}
                  isActive={expandedCitations.has(gi)}
                  onToggle={() => toggleCitation(gi)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Pipeline Steps */}
      <PipelineSteps />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <CertaintyBadge
            level={response.certaintyLevel}
            score={response.certaintyScore}
          />
          <JurisdictionTag jurisdiction={response.jurisdiction} />
        </div>
        <CopyButton text={response.legalBasis} />
      </div>

      {/* Two-column on lg+, single column on mobile */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">

        {/* LEFT: Legal Analysis */}
        <div className="glass-card min-w-0">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neon-cyan">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Legal Analysis
          </h2>
          <div className="space-y-3">
            {annotatedText}
          </div>
        </div>

        {/* RIGHT: Cited Sources — always visible on lg+, max-height scrollable */}
        {flatCitations.length > 0 && (
          <div className="hidden lg:flex lg:flex-col glass-card overflow-hidden">
            <h2 className="mb-3 flex shrink-0 items-center justify-between text-xs font-semibold uppercase tracking-widest text-gray-400">
              <span className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                Cited Sources
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                style={{ background: 'rgba(6, 214, 221, 0.1)', color: '#06d6dd' }}
              >
                {flatCitations.length}
              </span>
            </h2>
            <div className="min-h-0 flex-1 overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
              {sourcesList}
            </div>
          </div>
        )}
      </div>

      {/* Mobile: collapsible sources accordion (hidden on lg+) */}
      {flatCitations.length > 0 && (
        <div className="lg:hidden overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <button
            type="button"
            onClick={() => setShowAllSources((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
          >
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Cited Sources
            </span>
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                style={{ background: 'rgba(6, 214, 221, 0.1)', color: '#06d6dd' }}
              >
                {flatCitations.length}
              </span>
              <svg
                className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${showAllSources ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>
          {showAllSources && (
            <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
              {sourcesList}
            </div>
          )}
        </div>
      )}

      {/* Safety Note */}
      <SafetyNote note={response.safetyNote} />

      {/* Disclaimer */}
      <p className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-gray-500">
        {response.disclaimer}
      </p>
    </div>
  );
}
