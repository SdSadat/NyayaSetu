import { useState, useRef, useEffect, type FormEvent } from 'react';
import type { DrishtiAnalysis } from '@nyayasetu/shared-types';
import { analyzeDocument, getDrishtiHistory, deleteDrishtiHistoryItem, extractDocument } from '@/lib/api';
import { getUsername } from '@/lib/auth';
import AIProgressLoader from '@/components/AIProgressLoader';
import DrishtiOverview from '@/components/drishti/DrishtiOverview';
import DrishtiTimeline from '@/components/drishti/DrishtiTimeline';
import DrishtiIssueTree from '@/components/drishti/DrishtiIssueTree';
import DrishtiArgumentDuel from '@/components/drishti/DrishtiArgumentDuel';
import DrishtiPrecedents from '@/components/drishti/DrishtiPrecedents';
import DrishtiSectionHeatmap from '@/components/drishti/DrishtiSectionHeatmap';
import DrishtiReliefTracker from '@/components/drishti/DrishtiReliefTracker';
import DrishtiRatioObiter from '@/components/drishti/DrishtiRatioObiter';
import ShareModal from '@/components/drishti/ShareModal';

// ---------------------------------------------------------------------------
// Persistence — array-based history (up to 15 items)
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'nyayasetu-drishti-v2';
const SESSION_KEY = 'nyayasetu-drishti-session';
const MAX_HISTORY = 15;

interface DrishtiHistoryItem {
  id: string;
  analysis: DrishtiAnalysis;
  documentText: string;
  savedAt: string; // ISO
  /** Server-side ID — present when DynamoDB persistence is enabled. */
  serverId?: string;
}

function loadHistory(): DrishtiHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DrishtiHistoryItem[]) : [];
  } catch { return []; }
}

function persistHistory(items: DrishtiHistoryItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY))); }
  catch { /* storage quota — ignore */ }
}

/** Returns the username if logged in, otherwise a stable per-browser session ID. */
function getSessionId(): string {
  const user = getUsername();
  if (user) return user;

  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Tabs
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

const OUTCOME_COLORS: Record<string, string> = {
  allowed: '#4ade80', dismissed: '#f87171', remanded: '#facc15',
  settled: '#60a5fa', other: '#a78bfa',
};

// ---------------------------------------------------------------------------
// Small shared SVG icon helper
// ---------------------------------------------------------------------------

function Ico({ d, cls = 'h-3.5 w-3.5' }: { d: string; cls?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sidebar history item
// ---------------------------------------------------------------------------

function HistoryItem({
  item, isActive, onClick, onDelete,
}: {
  item: DrishtiHistoryItem;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const dot = OUTCOME_COLORS[item.analysis.outcome] ?? OUTCOME_COLORS.other;
  return (
    <div
      className={`group relative mx-2 mb-0.5 cursor-pointer rounded-xl px-3 py-2.5 transition-all ${
        isActive
          ? 'border border-neon-purple/30 bg-neon-purple/12 shadow-[inset_0_0_12px_rgba(168,85,247,0.06)]'
          : 'border border-transparent hover:bg-white/[0.04]'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5 pr-5">
        {/* Outcome dot */}
        <span
          className="mt-1 h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: dot, boxShadow: `0 0 6px ${dot}70` }}
        />
        <div className="min-w-0 flex-1">
          <p className={`line-clamp-2 text-[12px] font-medium leading-tight ${
            isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'
          }`}>
            {item.analysis.caseTitle || 'Untitled Document'}
          </p>
          <p className="mt-1 text-[10px] text-gray-600">{timeAgo(item.savedAt)}</p>
        </div>
      </div>
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute right-2 top-2 hidden h-5 w-5 items-center justify-center rounded-md text-gray-600 transition hover:bg-red-500/10 hover:text-red-400 group-hover:flex"
        aria-label="Delete"
      >
        <Ico d="M18 6L6 18M6 6l12 12" cls="h-3 w-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Drishti() {
  // ── Initialise from localStorage (single loadHistory call per render chain) ──
  const [history, setHistory]   = useState<DrishtiHistoryItem[]>(() => loadHistory());
  const [activeId, setActiveId] = useState<string | null>(history[0]?.id ?? null);
  const [documentText, setDocumentText] = useState<string>(history[0]?.documentText ?? '');

  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [activeTab, setActiveTab]           = useState<TabId>('overview');
  const [explainMode, setExplainMode]       = useState<'teen' | 'student' | 'practitioner'>('student');
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [inputExpanded, setInputExpanded]   = useState(history.length === 0);
  const [showShareModal, setShowShareModal] = useState(false);

  const tabBarRef   = useRef<HTMLDivElement>(null);
  const contentRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeItem = history.find(h => h.id === activeId) ?? null;
  const analysis   = activeItem?.analysis ?? null;
  const charCount  = documentText.length;

  // Scroll content to top when switching analyses
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeId]);

  // ── On mount: try to hydrate history from MongoDB (non-blocking) ──
  useEffect(() => {
    const sid = getSessionId();
    getDrishtiHistory(sid).then((remote) => {
      if (remote.length === 0) return;
      setHistory((prev) => {
        // Merge: prefer remote items that aren't already in local history
        const localIds = new Set(prev.map((h) => h.serverId).filter(Boolean));
        const newRemote: DrishtiHistoryItem[] = remote
          .filter((r) => !localIds.has(r.id))
          .map((r) => ({
            id: genId(),
            serverId: r.id,
            analysis: { caseTitle: r.caseTitle, outcome: r.outcome } as DrishtiAnalysis,
            documentText: r.preview,
            savedAt: r.savedAt,
          }));
        if (newRemote.length === 0) return prev;
        const merged = [...prev, ...newRemote]
          .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
          .slice(0, MAX_HISTORY);
        persistHistory(merged);
        return merged;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sidebar item selection ──
  function selectItem(item: DrishtiHistoryItem) {
    setActiveId(item.id);
    setDocumentText(item.documentText);
    setActiveTab('overview');
    setError(null);
    setInputExpanded(false);
    setSidebarOpen(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function deleteItem(id: string) {
    const item = history.find(h => h.id === id);
    const next = history.filter(h => h.id !== id);
    setHistory(next);
    persistHistory(next);
    if (activeId === id) {
      const fallback = next[0] ?? null;
      setActiveId(fallback?.id ?? null);
      setDocumentText(fallback?.documentText ?? '');
      if (!fallback) setInputExpanded(true);
    }
    // Mirror deletion to MongoDB if this item was persisted server-side
    if (item?.serverId) {
      void deleteDrishtiHistoryItem(item.serverId, getSessionId());
    }
  }

  function handleNew() {
    setActiveId(null);
    setDocumentText('');
    setError(null);
    setActiveTab('overview');
    setInputExpanded(true);
    setSidebarOpen(false);
    setTimeout(() => {
      textareaRef.current?.focus();
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }, 50);
  }

  // ── Textarea auto-grow ──
  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDocumentText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  // ── Called by InputForm after server-side file extraction ──
  function handleExtractedText(text: string) {
    setDocumentText(text);
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
      }
    }, 0);
  }

  // ── Submit ──
  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!documentText.trim() || charCount < 200) return;
    setLoading(true);
    setError(null);
    setActiveTab('overview');

    try {
      const sessionId = getSessionId();
      const result = await analyzeDocument({ documentText: documentText.trim(), sessionId });
      if (result.type === 'success') {
        const item: DrishtiHistoryItem = {
          id: genId(),
          serverId: result.historyId,
          analysis: result.analysis,
          documentText: documentText.trim(),
          savedAt: new Date().toISOString(),
        };
        const next = [item, ...history];
        setHistory(next);
        persistHistory(next);
        setActiveId(item.id);
        setInputExpanded(false);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function handleTabChange(id: TabId) {
    setActiveTab(id);
    const el = tabBarRef.current?.querySelector(`[data-tab="${id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  const charColor =
    charCount === 0 ? 'text-gray-600'
    : charCount < 200 ? 'text-yellow-500'
    : charCount < 5000 ? 'text-cyan-400'
    : 'text-green-400';

  // ---------------------------------------------------------------------------
  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 sm:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════ SIDEBAR ══════════════════════ */}
      <aside className={`
        absolute sm:relative inset-y-0 left-0 z-30 sm:z-auto
        flex w-[240px] shrink-0 flex-col
        border-r border-white/[0.06]
        bg-[rgba(3,7,18,0.96)] backdrop-blur-xl
        sm:bg-transparent sm:backdrop-blur-none
        transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
      `}>

        {/* Logo + New button */}
        <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-3.5">
          <img src="/logos/drishti-removebg-preview.png" alt="" className="h-7 w-7 object-contain" />
          <span className="text-sm font-bold tracking-tight text-neon-purple">Drishti</span>
          <button
            onClick={handleNew}
            className="ml-auto flex items-center gap-1 rounded-lg border border-neon-purple/25 bg-neon-purple/10 px-2.5 py-1.5 text-[11px] font-semibold text-neon-purple transition hover:bg-neon-purple/20 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New
          </button>
        </div>

        {/* Section label */}
        <div className="px-4 pb-1 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-700">
            Recent Analyses
          </p>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto py-1 no-scrollbar">
          {history.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.04] bg-white/[0.02]">
                <Ico d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" cls="h-5 w-5 text-gray-700" />
              </div>
              <p className="text-[11px] text-gray-600">No analyses yet</p>
              <p className="mt-0.5 text-[10px] text-gray-700">Paste a document to begin</p>
            </div>
          ) : (
            history.map(item => (
              <HistoryItem
                key={item.id}
                item={item}
                isActive={activeId === item.id}
                onClick={() => selectItem(item)}
                onDelete={() => deleteItem(item.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.04] px-4 py-3">
          <p className="text-[10px] text-gray-700">
            {history.length}/{MAX_HISTORY} analyses stored
          </p>
        </div>
      </aside>

      {/* ══════════════════════ MAIN ══════════════════════ */}
      <div className="relative flex min-w-0 flex-1 flex-col">

        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-white/[0.05] px-3 py-2.5 sm:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] text-gray-500 hover:text-gray-300 active:bg-white/[0.06]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="3" y1="7" x2="21" y2="7" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="17" x2="21" y2="17" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-neon-purple">Drishti</span>
          {analysis && (
            <span className="min-w-0 flex-1 truncate text-xs text-gray-500">
              {analysis.caseTitle}
            </span>
          )}
        </div>

        {/* ── Scrollable content ── */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-6">

            {/* Loading */}
            {loading && (
              <div className="glass-card mt-4">
                <AIProgressLoader maxWidth={560}
                  message="Extracting facts, issues, legal reasoning and precedents…" />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400">Unable to process document</p>
                  <p className="mt-1 text-sm text-red-300/70">{error}</p>
                </div>
                <button onClick={() => setError(null)}
                  className="ml-auto flex h-6 w-6 items-center justify-center rounded-lg text-red-500/50 hover:text-red-400">
                  <Ico d="M18 6L6 18M6 6l12 12" cls="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* ── Analysis view ── */}
            {analysis && !loading && (
              <>
                {/* Share button — floating top-right */}
                {activeItem?.serverId && (
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="flex items-center gap-2 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 px-4 py-2 text-sm font-medium text-neon-cyan transition-all hover:bg-neon-cyan/10 hover:border-neon-cyan/30 hover:shadow-[0_0_16px_rgba(6,182,212,0.15)]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                      Share Report
                    </button>
                  </div>
                )}

                {/* Sticky tab bar */}
                <div className="sticky top-0 z-20 -mx-4 px-2 sm:px-4 pb-0 pt-2">
                  <div
                    ref={tabBarRef}
                    className="flex gap-0.5 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[rgba(3,7,18,0.82)] p-1 sm:p-1.5 backdrop-blur-xl no-scrollbar"
                  >
                    {TABS.map(tab => {
                      const count = tab.count?.(analysis);
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          data-tab={tab.id}
                          onClick={() => handleTabChange(tab.id)}
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
                    <div className="flex flex-wrap gap-2">
                      {analysis.legalDoctrines.map((d, i) => (
                        <div key={i}
                          className="group relative cursor-default rounded-xl border border-neon-purple/20 bg-neon-purple/5 px-3 py-2">
                          <p className="text-xs font-semibold text-neon-purple">{d.name}</p>
                          <div className="absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded-xl border border-white/[0.1] bg-dark-900/95 p-3 text-xs text-gray-300 shadow-xl backdrop-blur-xl group-hover:block">
                            <p className="font-semibold text-white">{d.name}</p>
                            <p className="mt-1 text-gray-400">{d.description}</p>
                            {d.howApplied && <p className="mt-1 italic text-gray-500">{d.howApplied}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="h-4" />
              </>
            )}

            {/* ── Empty state ── */}
            {!analysis && !loading && !error && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative mx-auto mb-6">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02]">
                    <img src="/logos/drishti-removebg-preview.png" alt="Drishti"
                      className="h-full w-full object-contain opacity-60" />
                  </div>
                  <div className="pointer-events-none absolute -inset-4 rounded-full opacity-40"
                    style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)' }} />
                </div>
                <h2 className="text-base font-semibold text-gray-400">
                  {history.length > 0 ? 'Select an analysis or start a new one' : 'Analyse a legal document'}
                </h2>
                <p className="mt-2 max-w-sm text-sm text-gray-600">
                  Paste a court judgment, order, or legal document in the input below.
                </p>
                <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 max-w-md">
                  {[
                    { label: 'Timeline',       desc: 'Chronological events',      color: 'cyan'   },
                    { label: 'Issue Tree',      desc: 'Hierarchical questions',    color: 'purple' },
                    { label: 'Argument Duel',   desc: 'Petitioner vs respondent',  color: 'blue'   },
                    { label: 'Precedent Graph', desc: 'Radial citation network',   color: 'gold'   },
                    { label: 'Section Heatmap', desc: 'Statute centrality',        color: 'cyan'   },
                    { label: 'Ratio / Obiter',  desc: 'Tagged paragraphs',         color: 'purple' },
                  ].map(f => (
                    <div key={f.label}
                      className={`rounded-xl border border-neon-${f.color}/10 bg-neon-${f.color}/5 p-3 text-left`}>
                      <p className={`text-xs font-semibold text-neon-${f.color}`}>{f.label}</p>
                      <p className="mt-0.5 text-[11px] text-gray-600">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ MODE A: Analysis loaded + input collapsed → thin trigger strip ══ */}
        {analysis && !inputExpanded && (
          <div
            className="shrink-0 border-t border-white/[0.04]"
            style={{ background: 'rgba(3,7,18,0.8)', backdropFilter: 'blur(16px)' }}
          >
            <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-2">
              <button
                onClick={() => { setInputExpanded(true); setTimeout(() => textareaRef.current?.focus(), 40); }}
                disabled={loading}
                className="flex flex-1 items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-2 text-left text-sm text-gray-600 transition hover:border-white/[0.09] hover:text-gray-400 disabled:pointer-events-none"
              >
                <Ico d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" cls="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">
                  {loading ? 'Analysing…' : 'Paste a new document to analyse…'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ══ MODE B: No analysis → regular inline textarea ══ */}
        {!analysis && (
          <div
            className="shrink-0 border-t border-white/[0.05]"
            style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(24px)' }}
          >
            <InputForm
              textareaRef={textareaRef}
              documentText={documentText}
              charCount={charCount}
              charColor={charColor}
              loading={loading}
              onTextChange={handleTextChange}
              onSubmit={handleSubmit}
              onCollapse={null}
              onExtractedText={handleExtractedText}
            />
          </div>
        )}

        {/* ══ MODE C: Analysis loaded + input expanded → floating overlay ══ */}
        {analysis && inputExpanded && (
          <>
            {/* Dim backdrop over content */}
            <div
              className="absolute inset-0 z-20"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
              onClick={() => setInputExpanded(false)}
            />
            {/* Slide-up panel */}
            <div
              className="absolute bottom-0 left-0 right-0 z-30 border-t border-white/[0.1]"
              style={{
                background: 'rgba(3,7,18,0.97)',
                backdropFilter: 'blur(28px)',
                animation: 'slideUpPanel 0.22s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <style>{`
                @keyframes slideUpPanel {
                  from { transform: translateY(100%); }
                  to   { transform: translateY(0); }
                }
              `}</style>
              <InputForm
                textareaRef={textareaRef}
                documentText={documentText}
                charCount={charCount}
                charColor={charColor}
                loading={loading}
                onTextChange={handleTextChange}
                onSubmit={handleSubmit}
                onCollapse={() => setInputExpanded(false)}
                onExtractedText={handleExtractedText}
              />
            </div>
          </>
        )}
      </div>

      {/* Share modal */}
      {showShareModal && activeItem?.serverId && (
        <ShareModal
          historyId={activeItem.serverId}
          caseTitle={analysis?.caseTitle ?? 'Untitled Analysis'}
          sessionId={getSessionId()}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared input form used in both inline and overlay modes
// ---------------------------------------------------------------------------

function InputForm({
  textareaRef,
  documentText,
  charCount,
  charColor,
  loading,
  onTextChange,
  onSubmit,
  onCollapse,
  onExtractedText,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  documentText: string;
  charCount: number;
  charColor: string;
  loading: boolean;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onCollapse: (() => void) | null;
  onExtractedText: (text: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting]         = useState(false);
  const [extractError, setExtractError]     = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging]         = useState(false);

  async function handleFile(file: File) {
    setExtractError(null);
    setExtracting(true);
    try {
      const result = await extractDocument(file);
      setAttachedFileName(result.filename);
      onExtractedText(result.text);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Extraction failed.');
    } finally {
      setExtracting(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the container entirely
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  function clearAttachment() {
    setAttachedFileName(null);
    setExtractError(null);
    onExtractedText('');
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl px-4 py-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={handleFileInput}
      />

      <div
        className={`flex flex-col gap-2.5 rounded-2xl border p-3 shadow-[0_0_0_1px_rgba(168,85,247,0.08)] transition-all duration-150 ${
          isDragging
            ? 'border-neon-purple/50 bg-neon-purple/10 shadow-[0_0_0_1px_rgba(168,85,247,0.3)]'
            : 'border-white/[0.1] bg-white/[0.04]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag-over overlay message */}
        {isDragging && (
          <div className="pointer-events-none flex items-center justify-center gap-2 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neon-purple" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="text-sm font-medium text-neon-purple">Drop to extract text</span>
          </div>
        )}

        {/* Attached file badge */}
        {attachedFileName && !isDragging && (
          <div className="flex items-center gap-2 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0 text-neon-cyan" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="flex-1 truncate text-xs text-neon-cyan">{attachedFileName}</span>
            <button
              type="button"
              onClick={clearAttachment}
              className="flex h-4 w-4 items-center justify-center rounded text-neon-cyan/50 hover:text-neon-cyan transition"
              aria-label="Remove file"
            >
              <Ico d="M18 6L6 18M6 6l12 12" cls="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={3}
          value={documentText}
          onChange={onTextChange}
          placeholder={isDragging ? '' : 'Paste a document, or drag & drop a PDF / DOCX / TXT file…'}
          disabled={loading || extracting}
          autoFocus
          className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-300 placeholder-gray-600 outline-none"
          style={{ minHeight: 80, maxHeight: 200, overflow: 'auto' }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              onSubmit();
            }
            if (e.key === 'Escape' && onCollapse) onCollapse();
          }}
        />

        {/* Extract error */}
        {extractError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5">
            <Ico d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" cls="h-3.5 w-3.5 shrink-0 text-red-400" />
            <span className="flex-1 text-xs text-red-400">{extractError}</span>
            <button type="button" onClick={() => setExtractError(null)}
              className="flex h-4 w-4 items-center justify-center text-red-500/50 hover:text-red-400">
              <Ico d="M18 6L6 18M6 6l12 12" cls="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: char stats + attach button */}
          <div className="flex items-center gap-2">
            <div className="h-1 w-16 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (charCount / 200) * 100)}%`,
                  background: charCount < 200
                    ? 'rgba(234,179,8,0.7)'
                    : 'linear-gradient(90deg, rgba(168,85,247,0.8), rgba(34,211,238,0.8))',
                }}
              />
            </div>
            <span className={`text-[11px] tabular-nums ${charColor}`}>
              {charCount.toLocaleString()} chars
            </span>
            {charCount > 0 && charCount < 200 && (
              <span className="text-[10px] text-yellow-600">({200 - charCount} more needed)</span>
            )}

            {/* Attach file button */}
            <button
              type="button"
              disabled={loading || extracting}
              onClick={() => fileInputRef.current?.click()}
              title="Attach PDF, DOCX, or TXT"
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white/[0.06] hover:text-gray-300 disabled:opacity-40"
            >
              {extracting ? (
                <div className="typing-indicator scale-75"><span /><span /><span /></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              )}
            </button>
          </div>

          {/* Right: Cancel + Analyse */}
          <div className="flex items-center gap-2">
            {onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                className="rounded-lg px-2.5 py-1.5 text-[11px] text-gray-600 transition hover:text-gray-400"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || extracting || charCount < 200}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95 ${
                charCount >= 200 && !loading && !extracting
                  ? 'bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                  : 'cursor-not-allowed bg-white/[0.04] text-gray-600'
              }`}
            >
              {loading ? (
                <div className="typing-indicator"><span /><span /><span /></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
              {!loading && <span className="hidden sm:inline">Analyse</span>}
            </button>
          </div>
        </div>

        {charCount > 0 && (
          <p className="text-center text-[10px] text-gray-700">
            <kbd className="rounded border border-white/[0.06] px-1 font-mono">Ctrl</kbd>
            {' + '}
            <kbd className="rounded border border-white/[0.06] px-1 font-mono">↵</kbd>
            {' to analyse · '}
            {onCollapse && <><kbd className="rounded border border-white/[0.06] px-1 font-mono">Esc</kbd>{' to close · '}</>}
            <span className="text-gray-700">or attach PDF / DOCX / TXT</span>
          </p>
        )}
      </div>
    </form>
  );
}
