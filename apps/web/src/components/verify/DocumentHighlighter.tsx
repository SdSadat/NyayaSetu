import { useRef } from 'react';
import type { AuthenticityIssue } from '@nyayasetu/shared-types';

interface Props {
  paragraphs: string[];
  issues: AuthenticityIssue[];
  /** Base64 image data for image uploads */
  imageData?: string;
  imageMime?: string;
  onIssueClick?: (issue: AuthenticityIssue) => void;
}

const SEVERITY_MARK_COLORS = {
  critical: { bg: 'rgba(248,113,113,0.2)', border: 'rgba(248,113,113,0.5)' },
  warning: { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)' },
  info: { bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)' },
};

interface HighlightSpan {
  start: number;
  end: number;
  issue: AuthenticityIssue;
}

/**
 * Takes overlapping highlight ranges and produces non-overlapping segments,
 * each with the highest-priority (most severe) issue attached.
 */
function resolveOverlaps(spans: HighlightSpan[]): HighlightSpan[] {
  if (spans.length === 0) return [];

  const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 };
  const sorted = [...spans].sort((a, b) => a.start - b.start || a.end - b.end);

  const result: HighlightSpan[] = [];
  const points = new Set<number>();
  for (const s of sorted) {
    points.add(s.start);
    points.add(s.end);
  }
  const sortedPoints = [...points].sort((a, b) => a - b);

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const segStart = sortedPoints[i];
    const segEnd = sortedPoints[i + 1];

    // Find all spans covering this segment
    const covering = sorted.filter((s) => s.start <= segStart && s.end >= segEnd);
    if (covering.length === 0) continue;

    // Pick highest severity
    covering.sort((a, b) => SEVERITY_RANK[a.issue.severity] - SEVERITY_RANK[b.issue.severity]);
    result.push({ start: segStart, end: segEnd, issue: covering[0].issue });
  }

  return result;
}

function HighlightedParagraph({
  text,
  issues,
  paragraphIndex,
  onIssueClick,
}: {
  text: string;
  issues: AuthenticityIssue[];
  paragraphIndex: number;
  onIssueClick?: (issue: AuthenticityIssue) => void;
}) {
  const paraIssues = issues.filter(
    (i) => i.paragraphIndex === paragraphIndex && i.charStart >= 0 && i.charEnd >= 0,
  );

  if (paraIssues.length === 0) {
    return (
      <p className="text-sm text-slate-300 leading-relaxed mb-3 font-mono whitespace-pre-wrap">
        {text}
      </p>
    );
  }

  const spans: HighlightSpan[] = paraIssues.map((issue) => ({
    start: Math.max(0, issue.charStart),
    end: Math.min(text.length, issue.charEnd),
    issue,
  }));

  const resolved = resolveOverlaps(spans);

  // Build text segments: alternating normal text and highlighted spans
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  for (const span of resolved) {
    // Add normal text before this span
    if (span.start > cursor) {
      segments.push(
        <span key={`t-${cursor}`}>{text.slice(cursor, span.start)}</span>,
      );
    }

    const colors = SEVERITY_MARK_COLORS[span.issue.severity];
    segments.push(
      <mark
        key={`h-${span.start}-${span.end}`}
        onClick={() => onIssueClick?.(span.issue)}
        className="cursor-pointer rounded-sm px-0.5 relative group"
        style={{
          backgroundColor: colors.bg,
          borderBottom: `2px solid ${colors.border}`,
        }}
        title={`${span.issue.title}: ${span.issue.description}`}
      >
        {text.slice(span.start, span.end)}
        {/* Tooltip */}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 rounded-lg bg-slate-800 border border-white/10 shadow-xl z-50">
          <span className="block text-[11px] font-semibold text-white mb-0.5">
            {span.issue.title}
          </span>
          <span className="block text-[10px] text-slate-400 leading-tight">
            {span.issue.description}
          </span>
        </span>
      </mark>,
    );

    cursor = span.end;
  }

  // Add remaining text after last span
  if (cursor < text.length) {
    segments.push(<span key={`t-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return (
    <p className="text-sm text-slate-300 leading-relaxed mb-3 font-mono whitespace-pre-wrap">
      {segments}
    </p>
  );
}

export function DocumentHighlighter({
  paragraphs,
  issues,
  imageData,
  imageMime,
  onIssueClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Visual-only issues (paragraphIndex === -1)
  const visualIssues = issues.filter((i) => i.paragraphIndex === -1);

  return (
    <div ref={containerRef} className="space-y-0">
      {/* Image display for image uploads */}
      {imageData && imageMime && (
        <div className="mb-4 rounded-xl border border-white/10 overflow-hidden">
          <img
            src={`data:${imageMime};base64,${imageData}`}
            alt="Uploaded document"
            className="w-full max-h-[500px] object-contain bg-white/[0.02]"
          />
        </div>
      )}

      {/* Text paragraphs with inline highlights */}
      {paragraphs.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 max-h-[400px] overflow-y-auto scrollbar-thin">
          {paragraphs.map((text, i) => (
            <HighlightedParagraph
              key={i}
              text={text}
              issues={issues}
              paragraphIndex={i}
              onIssueClick={onIssueClick}
            />
          ))}
        </div>
      )}

      {/* Visual findings section */}
      {visualIssues.length > 0 && (
        <div className="mt-3">
          <h5 className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
            Visual Findings
          </h5>
          <div className="space-y-1.5">
            {visualIssues.map((issue) => {
              const sev = SEVERITY_MARK_COLORS[issue.severity];
              return (
                <button
                  key={issue.id}
                  onClick={() => onIssueClick?.(issue)}
                  className="w-full text-left flex items-start gap-2 rounded-lg px-3 py-2 border transition-colors hover:bg-white/[0.03]"
                  style={{
                    backgroundColor: sev.bg,
                    borderColor: sev.border,
                  }}
                >
                  <span className="text-xs mt-0.5">
                    {issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200">{issue.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{issue.description}</p>
                    {issue.expectedBehavior && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        Expected: {issue.expectedBehavior}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {paragraphs.length === 0 && !imageData && visualIssues.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-6">No document content to display.</p>
      )}
    </div>
  );
}
