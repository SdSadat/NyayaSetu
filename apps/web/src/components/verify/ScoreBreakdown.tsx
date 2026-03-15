import { useState } from 'react';
import type {
  AuthenticityIssue,
  AuthenticityIssueCategory,
  AuthenticityScoreBreakdown,
} from '@nyayasetu/shared-types';

interface Props {
  breakdown: AuthenticityScoreBreakdown;
  issues: AuthenticityIssue[];
  onIssueClick?: (issue: AuthenticityIssue) => void;
}

const CATEGORY_META: Record<
  AuthenticityIssueCategory,
  { icon: string; label: string; key: keyof AuthenticityScoreBreakdown }
> = {
  'formatting': { icon: '📐', label: 'Formatting', key: 'formatting' },
  'language': { icon: '✏️', label: 'Language', key: 'language' },
  'dates': { icon: '📅', label: 'Dates', key: 'dates' },
  'signatures': { icon: '🖊️', label: 'Signatures', key: 'signatures' },
  'legal-references': { icon: '⚖️', label: 'Legal References', key: 'legalReferences' },
  'metadata': { icon: '🏛️', label: 'Metadata', key: 'metadata' },
  'consistency': { icon: '🔗', label: 'Consistency', key: 'consistency' },
};

const CATEGORIES = Object.keys(CATEGORY_META) as AuthenticityIssueCategory[];

function scoreColor(score: number): string {
  if (score >= 75) return '#34d399';
  if (score >= 40) return '#fbbf24';
  return '#f87171';
}

const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  info: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400' },
};

export function ScoreBreakdown({ breakdown, issues, onIssueClick }: Props) {
  const [expanded, setExpanded] = useState<AuthenticityIssueCategory | null>(null);

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Category Breakdown
      </h4>

      {CATEGORIES.map((cat) => {
        const meta = CATEGORY_META[cat];
        const score = breakdown[meta.key];
        const catIssues = issues.filter((i) => i.category === cat);
        const isExpanded = expanded === cat;
        const color = scoreColor(score);

        return (
          <div key={cat}>
            {/* Category bar */}
            <button
              onClick={() => setExpanded(isExpanded ? null : cat)}
              className="w-full flex items-center gap-2 rounded-lg px-2 py-2.5 sm:py-1.5 hover:bg-white/[0.04] transition-colors active:bg-white/[0.06]"
            >
              <span className="text-base sm:text-sm">{meta.icon}</span>
              <span className="text-sm sm:text-xs text-slate-300 flex-1 text-left">{meta.label}</span>
              {catIssues.length > 0 && (
                <span className="text-[10px] text-slate-500 mr-1">{catIssues.length} issue{catIssues.length > 1 ? 's' : ''}</span>
              )}
              <span className="text-sm sm:text-xs font-semibold w-7 text-right" style={{ color }}>
                {score}
              </span>
              <div className="w-16 sm:w-20 h-2 sm:h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${score}%`, background: color }}
                />
              </div>
              {catIssues.length > 0 && (
                <span className="text-[10px] text-slate-500 ml-1">
                  {isExpanded ? '▲' : '▼'}
                </span>
              )}
            </button>

            {/* Expanded issues */}
            {isExpanded && catIssues.length > 0 && (
              <div className="ml-7 mt-1 mb-2 space-y-1.5">
                {catIssues.map((issue) => {
                  const sev = SEVERITY_COLORS[issue.severity];
                  return (
                    <button
                      key={issue.id}
                      onClick={() => onIssueClick?.(issue)}
                      className={`w-full text-left rounded-lg border px-3 py-2 transition-colors hover:bg-white/[0.03] ${sev.bg} ${sev.border}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${sev.dot}`} />
                        <div className="min-w-0">
                          <p className={`text-xs font-medium ${sev.text}`}>{issue.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                            {issue.description}
                          </p>
                          {issue.flaggedText && (
                            <p className="text-[10px] text-slate-500 mt-1 font-mono truncate">
                              &ldquo;{issue.flaggedText}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
