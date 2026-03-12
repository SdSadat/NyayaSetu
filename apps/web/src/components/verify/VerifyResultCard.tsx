import { useState } from 'react';
import type { DocumentVerifyResponse, AuthenticityIssue } from '@nyayasetu/shared-types';
import { AuthenticityScore } from './AuthenticityScore';
import { ScoreBreakdown } from './ScoreBreakdown';
import { DocumentHighlighter } from './DocumentHighlighter';

interface Props {
  result: DocumentVerifyResponse;
}

type Tab = 'document' | 'breakdown';

export function VerifyResultCard({ result }: Props) {
  const [tab, setTab] = useState<Tab>('document');

  const handleIssueClick = (issue: AuthenticityIssue) => {
    // If clicking from breakdown, switch to document tab to see highlight
    if (tab === 'breakdown' && issue.paragraphIndex >= 0) {
      setTab('document');
    }
  };

  const criticalCount = result.issues.filter((i) => i.severity === 'critical').length;
  const warningCount = result.issues.filter((i) => i.severity === 'warning').length;
  const infoCount = result.issues.filter((i) => i.severity === 'info').length;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
      {/* Header: Score + Doc Info */}
      <div className="flex flex-col sm:flex-row items-center gap-5 p-5 border-b border-white/[0.06]">
        <AuthenticityScore score={result.overallScore} verdict={result.verdict} />

        <div className="flex-1 text-center sm:text-left">
          {/* Document type badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-slate-400 mb-2">
            <span>📋</span>
            <span>{result.documentType}</span>
          </div>

          {result.documentSummary && (
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              {result.documentSummary}
            </p>
          )}

          {/* Issue counts */}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[11px] text-red-400">
                🔴 {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] text-amber-400">
                🟡 {warningCount} warning{warningCount > 1 ? 's' : ''}
              </span>
            )}
            {infoCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[11px] text-blue-400">
                🔵 {infoCount} info
              </span>
            )}
            {result.issues.length === 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-400">
                ✅ No issues found
              </span>
            )}
          </div>

          {/* Legal references cross-check */}
          {result.legalReferencesChecked > 0 && (
            <p className="text-[11px] text-slate-500 mt-2">
              ⚖️ {result.legalReferencesVerified}/{result.legalReferencesChecked} legal references verified against database
            </p>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-white/[0.06]">
        <button
          onClick={() => setTab('document')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            tab === 'document'
              ? 'text-white border-b-2 border-amber-400'
              : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          📄 Document View
        </button>
        <button
          onClick={() => setTab('breakdown')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            tab === 'breakdown'
              ? 'text-white border-b-2 border-amber-400'
              : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          📊 Score Breakdown
        </button>
      </div>

      {/* Tab content */}
      <div className="p-4">
        {tab === 'document' ? (
          <DocumentHighlighter
            paragraphs={result.paragraphs}
            issues={result.issues}
            imageData={result.imageData}
            imageMime={result.imageMime}
            onIssueClick={handleIssueClick}
          />
        ) : (
          <ScoreBreakdown
            breakdown={result.scoreBreakdown}
            issues={result.issues}
            onIssueClick={handleIssueClick}
          />
        )}
      </div>

      {/* Footer: Disclaimer + Timestamp */}
      <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.01]">
        <p className="text-[10px] text-slate-600 leading-relaxed">
          {result.disclaimer}
        </p>
        <p className="text-[10px] text-slate-600 mt-1">
          Analyzed at {new Date(result.analysisTimestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
