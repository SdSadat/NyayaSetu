import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { LessonCard } from '@nyayasetu/shared-types';
import { getLesson, getLessons } from '@/lib/api';
import { useJagrutProgress } from '@/lib/jagrut-progress';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  'fundamental-rights': { text: '#06d6dd', bg: 'rgba(6,214,221,0.07)',  border: 'rgba(6,214,221,0.2)',  glow: 'rgba(6,214,221,0.12)'  },
  'police-powers':      { text: '#ef4444', bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)',  glow: 'rgba(239,68,68,0.12)'  },
  'traffic-laws':       { text: '#3b82f6', bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.2)', glow: 'rgba(59,130,246,0.12)' },
  'tenancy':            { text: '#a855f7', bg: 'rgba(168,85,247,0.07)', border: 'rgba(168,85,247,0.2)', glow: 'rgba(168,85,247,0.12)' },
  'consumer-rights':    { text: '#10b981', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.2)', glow: 'rgba(16,185,129,0.12)' },
  'workplace-rights':   { text: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)', glow: 'rgba(245,158,11,0.12)' },
};

const DEFAULT_COLOR = { text: '#9ca3af', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', glow: 'rgba(255,255,255,0.05)' };

const CATEGORY_LABELS: Record<string, string> = {
  'fundamental-rights': 'Fundamental Rights',
  'police-powers':      'Police & Arrests',
  'traffic-laws':       'Traffic & Vehicles',
  'tenancy':            'Rent & Tenancy',
  'consumer-rights':    'Consumer Rights',
  'workplace-rights':   'Workplace Rights',
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  beginner:     { label: 'Beginner',     color: '#10b981' },
  intermediate: { label: 'Intermediate', color: '#f59e0b' },
  advanced:     { label: 'Advanced',     color: '#ef4444' },
};

function formatTime(s: number) { return `${Math.ceil(s / 60)} min read`; }

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------

function renderContent(text: string, accentColor: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  function flushList() {
    if (listItems.length > 0) {
      elements.push(<ul key={`list-${listKey++}`} className="space-y-2 pl-1">{listItems}</ul>);
      listItems = [];
    }
  }

  function renderInline(line: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let last = 0, match: RegExpExecArray | null, k = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > last) parts.push(<span key={`t-${k++}`}>{line.slice(last, match.index)}</span>);
      parts.push(<strong key={`b-${k++}`} className="font-semibold text-white">{match[1]}</strong>);
      last = regex.lastIndex;
    }
    if (last < line.length) parts.push(<span key={`t-${k++}`}>{line.slice(last)}</span>);
    return parts;
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], trimmed = raw.trim();
    if (trimmed === '') { flushList(); continue; }

    const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (numbered) {
      listItems.push(
        <li key={`li-${i}`} className="flex gap-3 text-sm leading-relaxed text-gray-300">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
            style={{ background: `${accentColor}15`, color: accentColor }}>{numbered[1]}</span>
          <span className="flex-1">{renderInline(numbered[2])}</span>
        </li>,
      );
      continue;
    }

    const bullet = trimmed.match(/^[-•]\s+(.+)/);
    if (bullet) {
      listItems.push(
        <li key={`li-${i}`} className="flex gap-3 text-sm leading-relaxed text-gray-300">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accentColor }} />
          <span className="flex-1">{renderInline(bullet[1])}</span>
        </li>,
      );
      continue;
    }

    const subBullet = raw.match(/^\s{2,}[-•]\s+(.+)/);
    if (subBullet) {
      listItems.push(
        <li key={`li-${i}`} className="ml-6 flex gap-3 text-sm leading-relaxed text-gray-400">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-600" />
          <span className="flex-1">{renderInline(subBullet[1])}</span>
        </li>,
      );
      continue;
    }

    flushList();

    if (/^\*\*.+\*\*[:.]?\s*$/.test(trimmed)) {
      const header = trimmed.replace(/^\*\*/, '').replace(/\*\*[:.]?\s*$/, '');
      elements.push(
        <div key={`h-${i}`} className="mt-3 flex items-center gap-2 rounded-lg border-l-[3px] px-3 py-2"
          style={{ borderColor: accentColor, background: `${accentColor}08` }}>
          <h3 className="text-sm font-bold text-white">{header}</h3>
        </div>,
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-gray-300">{renderInline(trimmed)}</p>,
    );
  }
  flushList();
  return elements;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LessonView() {
  const { id } = useParams<{ id: string }>();
  const [lesson,      setLesson]      = useState<LessonCard | null>(null);
  const [nextLesson,  setNextLesson]  = useState<LessonCard | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [readProgress, setReadProgress] = useState(0);

  const { markComplete, isComplete, getQuizResult } = useJagrutProgress();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true); setError(null); setReadProgress(0);

    Promise.all([getLesson(id), getLessons()])
      .then(([data, all]) => {
        if (cancelled) return;
        setLesson(data);
        const sibs = all.filter((l) => l.category === data.category).sort((a, b) => a.order - b.order);
        const idx  = sibs.findIndex((l) => l.id === data.id);
        setNextLesson(idx >= 0 && idx + 1 < sibs.length ? sibs[idx + 1] : null);
      })
      .catch(() => { if (!cancelled) setError('Could not load this lesson.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const sh = el.scrollHeight - el.clientHeight;
      if (sh > 0) setReadProgress(Math.min(1, el.scrollTop / sh));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (readProgress >= 0.9 && id) markComplete(id);
  }, [readProgress, id, markComplete]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24">
        <div className="flex justify-center"><div className="typing-indicator"><span /><span /><span /></div></div>
      </main>
    );
  }

  if (error || !lesson) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-10 text-center">
          <p className="text-gray-400">{error ?? 'Lesson not found.'}</p>
          <Link to="/learn" className="mt-4 inline-block text-sm font-medium text-neon-gold hover:underline">Back to lessons</Link>
        </div>
      </main>
    );
  }

  const colors        = CATEGORY_COLORS[lesson.category] ?? DEFAULT_COLOR;
  const catLabel      = CATEGORY_LABELS[lesson.category] ?? lesson.category;
  const diff          = DIFFICULTY_CONFIG[lesson.difficulty] ?? DIFFICULTY_CONFIG.beginner;
  const alreadyDone   = isComplete(lesson.id);
  const quizResult    = getQuizResult(lesson.id);

  return (
    <>
      {/* Reading progress bar */}
      <div className="fixed left-0 top-16 z-50 h-[2px] w-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div
          className="h-full transition-[width] duration-75"
          style={{ width: `${readProgress * 100}%`, background: `linear-gradient(90deg,${colors.text},${colors.text}88)` }}
        />
      </div>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-8">

        {/* Back */}
        <Link to="/learn" className="mb-8 inline-flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-300">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to lessons
        </Link>

        {/* ── Hero section ── */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border px-6 py-7"
          style={{ borderColor: colors.border, background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${colors.glow}, transparent 70%)` }}>

          {/* Meta row */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
              {catLabel}
            </span>
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: diff.color, background: `${diff.color}12`, border: `1px solid ${diff.color}25` }}>
              {diff.label}
            </span>
            <span className="text-[11px] text-gray-500">{formatTime(lesson.readingTimeSeconds)}</span>
            {alreadyDone && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400"
                style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Read
              </span>
            )}
            {quizResult && (
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                style={{
                  color:      quizResult.score === quizResult.total ? '#10b981' : '#f59e0b',
                  background: quizResult.score === quizResult.total ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  border:     `1px solid ${quizResult.score === quizResult.total ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                }}>
                Quiz {quizResult.score}/{quizResult.total}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold leading-snug text-white sm:text-3xl">{lesson.title}</h1>

          {/* Act · Section */}
          <p className="mt-3 text-xs font-mono text-gray-500">{lesson.act} · {lesson.section}</p>

          {/* Summary */}
          <p className="mt-4 text-sm leading-relaxed text-gray-400">{lesson.plainLanguageExplanation}</p>
        </div>

        {/* ── Lesson content ── */}
        <article className="mb-8 space-y-4 rounded-2xl border border-white/[0.05] bg-white/[0.015] px-6 py-7">
          {renderContent(lesson.content, colors.text)}
        </article>

        {/* ── Key Takeaways ── */}
        <div className="mb-8 rounded-2xl border px-6 py-6" style={{ borderColor: colors.border, background: colors.bg }}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: `${colors.text}20` }}>
              <svg className="h-3.5 w-3.5" style={{ color: colors.text }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.text }}>Key Takeaways</h2>
          </div>
          <ul className="space-y-3">
            {lesson.keyTakeaways.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: `${colors.text}18`, color: colors.text }}>
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-gray-300">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Bottom actions ── */}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/learn"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-5 py-2.5 text-sm font-medium text-gray-300 transition-all hover:border-white/[0.12] hover:text-white">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            All Lessons
          </Link>

          <div className="flex items-center gap-2">
            {nextLesson && (
              <Link to={`/learn/${nextLesson.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-sm font-medium text-gray-300 transition-all hover:border-white/[0.12] hover:text-white">
                Next
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            )}

            <Link
              to={`/learn/${lesson.id}/quiz`}
              onClick={() => markComplete(lesson.id)}
              className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 sm:flex-none"
              style={{
                background: `linear-gradient(135deg, ${colors.text}dd, ${colors.text}88)`,
                boxShadow:  `0 4px 20px ${colors.text}25`,
              }}
            >
              {quizResult ? 'Retake Quiz' : 'Test Your Knowledge'}
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
