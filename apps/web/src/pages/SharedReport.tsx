import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { DrishtiAnalysis } from '@nyayasetu/shared-types';
import { getSharedReport, unlockSharedReport } from '@/lib/api';
import DrishtiOverview from '@/components/drishti/DrishtiOverview';
import DrishtiTimeline from '@/components/drishti/DrishtiTimeline';
import DrishtiIssueTree from '@/components/drishti/DrishtiIssueTree';
import DrishtiArgumentDuel from '@/components/drishti/DrishtiArgumentDuel';
import DrishtiPrecedents from '@/components/drishti/DrishtiPrecedents';
import DrishtiSectionHeatmap from '@/components/drishti/DrishtiSectionHeatmap';
import DrishtiReliefTracker from '@/components/drishti/DrishtiReliefTracker';
import DrishtiRatioObiter from '@/components/drishti/DrishtiRatioObiter';

// ---------------------------------------------------------------------------
// Tabs (same as main Drishti page)
// ---------------------------------------------------------------------------

type TabId =
  | 'overview' | 'timeline' | 'issues' | 'arguments'
  | 'precedents' | 'sections' | 'relief' | 'ratio';

interface TabDef {
  id: TabId;
  label: string;
  svgPath: string;
  count?: (a: DrishtiAnalysis) => number;
}

const TABS: TabDef[] = [
  { id: 'overview',   label: 'Overview',   svgPath: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { id: 'timeline',   label: 'Timeline',   svgPath: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l3 3',                count: a => a.timeline.length },
  { id: 'issues',     label: 'Issues',     svgPath: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',               count: a => a.issueTree.length },
  { id: 'arguments',  label: 'Arguments',  svgPath: 'M12 3L3 9v12h6v-7h6v7h6V9z',                                       count: a => a.argumentDuel.petitioner.length + a.argumentDuel.respondent.length },
  { id: 'precedents', label: 'Precedents', svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z', count: a => a.precedents.length },
  { id: 'sections',   label: 'Sections',   svgPath: 'M4 6h16M4 10h16M4 14h8M4 18h8',                                   count: a => a.sectionHeatmap.length },
  { id: 'relief',     label: 'Relief',     svgPath: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',              count: a => a.reliefDirections.length },
  { id: 'ratio',      label: 'Ratio',      svgPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8', count: a => a.taggedParagraphs.length },
];

function Ico({ d, cls = 'h-3.5 w-3.5' }: { d: string; cls?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Lock Screen
// ---------------------------------------------------------------------------

function LockScreen({
  caseTitle,
  onUnlock,
}: {
  caseTitle: string;
  onUnlock: (password: string) => Promise<string | null>;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError(null);
    const err = await onUnlock(password);
    if (err) {
      setError(err);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass-card text-center">
          {/* Lock icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-neon-purple/20 bg-neon-purple/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neon-purple" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 className="text-lg font-bold text-white">Protected Report</h1>
          <p className="mt-2 text-sm text-gray-400 line-clamp-2">
            &ldquo;{caseTitle}&rdquo;
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-neon-purple/40 focus:bg-white/[0.06]"
            />

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full rounded-xl bg-neon-purple/20 px-4 py-3 text-sm font-semibold text-neon-purple transition-all hover:bg-neon-purple/30 disabled:opacity-50 disabled:cursor-not-allowed border border-neon-purple/20"
            >
              {loading ? 'Unlocking...' : 'Unlock Report'}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-600">
            This report is password-protected. Contact the person who shared it.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not Found / Expired
// ---------------------------------------------------------------------------

function NotFoundScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="glass-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-400" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-white">Report Unavailable</h1>
          <p className="mt-2 text-sm text-gray-400">{message}</p>
          <Link
            to="/drishti"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-neon-purple/20 bg-neon-purple/10 px-5 py-2.5 text-sm font-medium text-neon-purple transition-colors hover:bg-neon-purple/20"
          >
            Analyze Your Own Document
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-neon-purple/20 border-t-neon-purple" />
        <p className="text-sm text-gray-500">Loading shared report...</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SharedReport() {
  const { shareId } = useParams<{ shareId: string }>();

  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'not-found'; message: string }
    | { status: 'locked'; caseTitle: string }
    | { status: 'ready'; analysis: DrishtiAnalysis; caseTitle: string; sharedAt: string }
  >({ status: 'loading' });

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [explainMode, setExplainMode] = useState<'teen' | 'student' | 'practitioner'>('student');

  // Fetch on mount
  useEffect(() => {
    if (!shareId) {
      setState({ status: 'not-found', message: 'Invalid share link.' });
      return;
    }

    getSharedReport(shareId)
      .then((res) => {
        if (res.type === 'success') {
          setState({
            status: 'ready',
            analysis: res.analysis,
            caseTitle: res.caseTitle,
            sharedAt: res.sharedAt,
          });
        } else if (res.type === 'password-required') {
          setState({ status: 'locked', caseTitle: res.caseTitle });
        } else {
          setState({ status: 'not-found', message: res.message });
        }
      })
      .catch((err) => {
        setState({
          status: 'not-found',
          message: err instanceof Error ? err.message : 'Failed to load report.',
        });
      });
  }, [shareId]);

  // Unlock handler
  const handleUnlock = async (password: string): Promise<string | null> => {
    if (!shareId) return 'Invalid share link.';
    try {
      const res = await unlockSharedReport(shareId, password);
      if (res.type === 'success') {
        setState({
          status: 'ready',
          analysis: res.analysis,
          caseTitle: res.caseTitle,
          sharedAt: res.sharedAt,
        });
        return null;
      }
      return 'Incorrect password.';
    } catch (err) {
      return err instanceof Error ? err.message : 'Failed to unlock.';
    }
  };

  // ── Render based on state ──

  if (state.status === 'loading') return <LoadingSkeleton />;
  if (state.status === 'not-found') return <NotFoundScreen message={state.message} />;
  if (state.status === 'locked') {
    return <LockScreen caseTitle={state.caseTitle} onUnlock={handleUnlock} />;
  }

  const { analysis, caseTitle, sharedAt } = state;

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-neon-purple" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <span>Shared Report</span>
          <span className="text-gray-700">&middot;</span>
          <span>{new Date(sharedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">{caseTitle}</h1>
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-20 pb-0 pt-2 -mx-3 sm:-mx-4 px-2 sm:px-4">
        <div className="flex gap-0.5 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[rgba(3,7,18,0.82)] p-1 sm:p-1.5 backdrop-blur-xl no-scrollbar">
          {TABS.map(tab => {
            const count = tab.count?.(analysis);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-xl px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-medium transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-neon-purple/20 text-neon-purple shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                    : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
                }`}
              >
                <span className={`hidden sm:inline ${isActive ? 'text-neon-purple' : 'text-gray-600'}`}>
                  <Ico d={tab.svgPath} />
                </span>
                <span>{tab.label}</span>
                {count !== undefined && count > 0 && (
                  <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${
                    isActive ? 'bg-neon-purple/30 text-neon-purple' : 'bg-white/[0.07] text-gray-500'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div key={activeTab} className="mt-4 animate-fade-in">
        {activeTab === 'overview'   && <DrishtiOverview analysis={analysis} explainMode={explainMode} onModeChange={setExplainMode} />}
        {activeTab === 'timeline'   && <DrishtiTimeline events={analysis.timeline} />}
        {activeTab === 'issues'     && <DrishtiIssueTree issues={analysis.issueTree} />}
        {activeTab === 'arguments'  && <DrishtiArgumentDuel duel={analysis.argumentDuel} />}
        {activeTab === 'precedents' && <DrishtiPrecedents precedents={analysis.precedents} caseName={analysis.caseTitle} />}
        {activeTab === 'sections'   && <DrishtiSectionHeatmap sections={analysis.sectionHeatmap} />}
        {activeTab === 'relief'     && <DrishtiReliefTracker items={analysis.reliefDirections} />}
        {activeTab === 'ratio'      && <DrishtiRatioObiter paragraphs={analysis.taggedParagraphs} />}
      </div>

      {/* Legal doctrines */}
      {analysis.legalDoctrines.length > 0 && (
        <div className="mt-5 glass-card">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Legal Doctrines Applied
          </h3>
          <div className="space-y-3">
            {analysis.legalDoctrines.map((d, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-sm font-semibold text-neon-gold">{d.name}</p>
                <p className="mt-1 text-xs text-gray-400">{d.description}</p>
                <p className="mt-1 text-xs text-gray-500 italic">{d.howApplied}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 border-t border-white/[0.06] pt-6 pb-8 text-center">
        <p className="text-xs text-gray-600">
          Shared via NyayaSetu Drishti &middot; For information only. Not legal advice.
        </p>
        <Link
          to="/drishti"
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-neon-purple transition-colors hover:text-neon-purple/80"
        >
          Analyze your own document
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
