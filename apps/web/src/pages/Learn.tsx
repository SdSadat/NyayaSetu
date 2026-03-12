import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LessonCard as LessonCardType } from '@nyayasetu/shared-types';
import { getLessons, getCategories, type CategoryMeta } from '@/lib/api';
import { useJagrutProgress } from '@/lib/jagrut-progress';

// ---------------------------------------------------------------------------
// Shared palette
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<string, string> = {
  'fundamental-rights': '⚖',
  'police-powers':      '🛡',
  'traffic-laws':       '🚗',
  'tenancy':            '🏠',
  'consumer-rights':    '🛍',
  'workplace-rights':   '💼',
};

export const CATEGORY_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  'fundamental-rights': { border: 'rgba(6,214,221,0.3)',   text: '#06d6dd', bg: 'rgba(6,214,221,0.06)'   },
  'police-powers':      { border: 'rgba(239,68,68,0.3)',   text: '#ef4444', bg: 'rgba(239,68,68,0.06)'   },
  'traffic-laws':       { border: 'rgba(59,130,246,0.3)',  text: '#3b82f6', bg: 'rgba(59,130,246,0.06)'  },
  'tenancy':            { border: 'rgba(168,85,247,0.3)',  text: '#a855f7', bg: 'rgba(168,85,247,0.06)'  },
  'consumer-rights':    { border: 'rgba(16,185,129,0.3)',  text: '#10b981', bg: 'rgba(16,185,129,0.06)'  },
  'workplace-rights':   { border: 'rgba(245,158,11,0.3)',  text: '#f59e0b', bg: 'rgba(245,158,11,0.06)'  },
};

export const DEFAULT_COLOR = { border: 'rgba(255,255,255,0.1)', text: '#9ca3af', bg: 'rgba(255,255,255,0.04)' };

type Difficulty = 'all' | 'beginner' | 'intermediate' | 'advanced';

const DIFF_COLOR: Record<Exclude<Difficulty, 'all'>, string> = {
  beginner:     '#10b981',
  intermediate: '#f59e0b',
  advanced:     '#ef4444',
};

function formatTime(s: number) {
  return `${Math.ceil(s / 60)} min`;
}

// ---------------------------------------------------------------------------
// Sidebar item
// ---------------------------------------------------------------------------

function SidebarItem({
  id, label, count, done, isActive, onClick,
}: {
  id: string; label: string; count: number; done: number;
  isActive: boolean; onClick: () => void;
}) {
  const colors = CATEGORY_COLORS[id] ?? DEFAULT_COLOR;
  const icon   = CATEGORY_ICONS[id] ?? '●';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full rounded-lg px-3 py-2.5 text-left transition-all duration-150"
      style={{ background: isActive ? colors.bg : 'transparent' }}
    >
      {/* active left accent */}
      <span
        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200"
        style={{ background: isActive ? colors.text : 'transparent' }}
      />
      <span className="flex items-center gap-2.5">
        <span className="text-base leading-none">{icon}</span>
        <span
          className="flex-1 truncate text-sm font-medium transition-colors"
          style={{ color: isActive ? colors.text : '#d1d5db' }}
        >
          {label}
        </span>
        <span
          className="shrink-0 text-[11px] tabular-nums"
          style={{ color: isActive ? colors.text : '#6b7280' }}
        >
          {done}/{count}
        </span>
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Lesson row
// ---------------------------------------------------------------------------

function LessonRow({
  lesson, index, completed, quizScore,
}: {
  lesson: LessonCardType; index: number;
  completed: boolean; quizScore: { score: number; total: number } | null;
}) {
  const colors    = CATEGORY_COLORS[lesson.category] ?? DEFAULT_COLOR;
  const diffColor = DIFF_COLOR[lesson.difficulty as Exclude<Difficulty, 'all'>] ?? '#9ca3af';
  const diffLabel = lesson.difficulty === 'beginner' ? 'Beginner'
    : lesson.difficulty === 'intermediate' ? 'Intermediate' : 'Advanced';

  const accentColor = completed ? '#10b981' : colors.text;

  return (
    <Link
      to={`/learn/${lesson.id}`}
      className="group flex items-center gap-4 rounded-xl border border-white/[0.04] bg-white/[0.015] px-4 py-4 transition-all duration-150 hover:border-white/[0.09] hover:bg-white/[0.03]"
      style={{ animationDelay: `${index * 50}ms`, borderLeft: `3px solid ${accentColor}` }}
    >
      {/* Order / check */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-all duration-200"
        style={{
          background: completed ? 'rgba(16,185,129,0.12)' : colors.bg,
          color: accentColor,
        }}
      >
        {completed
          ? <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          : lesson.order}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-100 group-hover:text-white">
          {lesson.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
          <span>{lesson.section}</span>
          <span>·</span>
          <span style={{ color: diffColor }}>{diffLabel}</span>
          <span>·</span>
          <span>{formatTime(lesson.readingTimeSeconds)}</span>
          {quizScore && (
            <>
              <span>·</span>
              <span
                className="font-semibold"
                style={{ color: quizScore.score === quizScore.total ? '#10b981' : '#f59e0b' }}
              >
                Quiz {quizScore.score}/{quizScore.total}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Arrow */}
      <svg
        className="h-4 w-4 shrink-0 text-gray-700 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-gray-400"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Learn() {
  const [categories,      setCategories]      = useState<CategoryMeta[]>([]);
  const [lessons,         setLessons]         = useState<LessonCardType[]>([]);
  const [activeCategory,  setActiveCategory]  = useState<string | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [difficulty,      setDifficulty]      = useState<Difficulty>('all');

  const { isComplete, getQuizResult, completedCount } = useJagrutProgress();

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCategories(), getLessons()])
      .then(([cats, allLessons]) => {
        if (cancelled) return;
        setCategories(cats);
        setLessons(allLessons);
      })
      .catch(() => { /* empty */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const completedPerCat: Record<string, number> = {};
  for (const cat of categories) {
    completedPerCat[cat.id] = lessons.filter((l) => l.category === cat.id && isComplete(l.id)).length;
  }

  const activeCatMeta = activeCategory ? categories.find((c) => c.id === activeCategory) : null;

  const filtered = lessons.filter((l) => {
    if (activeCategory && l.category !== activeCategory) return false;
    if (difficulty !== 'all' && l.difficulty !== difficulty) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return l.title.toLowerCase().includes(q)
          || l.plainLanguageExplanation.toLowerCase().includes(q)
          || l.section.toLowerCase().includes(q);
    }
    return true;
  });

  const overallPct = lessons.length > 0 ? completedCount / lessons.length : 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">

      {/* ── Page header ── */}
      <div className="mb-8 flex items-center gap-4">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl">
          <img src="/logos/jagrut-removebg-preview.png" alt="Jagrut" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-bold">
            <span className="text-neon-gold">Jagrut</span>
            <span className="ml-2 text-sm font-normal text-gray-500">Legal Literacy Engine</span>
          </h1>
          <p className="text-sm text-gray-500">Bite-sized lessons on your everyday legal rights.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="typing-indicator"><span /><span /><span /></div>
        </div>
      ) : (
        <>
          {/* ── Overall progress ── */}
          {completedCount > 0 && (
            <div className="mb-7 flex items-center gap-4 rounded-xl border border-neon-gold/10 bg-neon-gold/[0.04] px-5 py-3">
              <div className="flex-1">
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">{completedCount} of {lessons.length} lessons read</span>
                  <span className="font-semibold text-neon-gold">{Math.round(overallPct * 100)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${overallPct * 100}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[220px_1fr]">

            {/* ── LEFT sidebar ── */}
            <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto no-scrollbar">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Topics</p>

              {/* All */}
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="group relative w-full rounded-lg px-3 py-2.5 text-left transition-all duration-150"
                style={{ background: activeCategory === null ? 'rgba(245,158,11,0.07)' : 'transparent' }}
              >
                <span
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full transition-all"
                  style={{ background: activeCategory === null ? '#f59e0b' : 'transparent' }}
                />
                <span className="flex items-center gap-2.5">
                  <span className="text-base">📚</span>
                  <span
                    className="flex-1 text-sm font-medium"
                    style={{ color: activeCategory === null ? '#f59e0b' : '#d1d5db' }}
                  >
                    All Topics
                  </span>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ color: activeCategory === null ? '#f59e0b' : '#6b7280' }}
                  >
                    {lessons.length}
                  </span>
                </span>
              </button>

              <div className="mt-1 space-y-0.5">
                {categories.map((cat) => (
                  <SidebarItem
                    key={cat.id}
                    id={cat.id}
                    label={cat.label}
                    count={cat.lessonCount}
                    done={completedPerCat[cat.id] ?? 0}
                    isActive={activeCategory === cat.id}
                    onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  />
                ))}
              </div>
            </aside>

            {/* ── RIGHT: lesson list ── */}
            <div>
              {/* Category description */}
              {activeCatMeta && (
                <div className="mb-5">
                  <h2 className="text-base font-bold text-white">{activeCatMeta.label}</h2>
                  <p className="text-xs text-gray-500">{activeCatMeta.description}</p>
                </div>
              )}

              {/* Search + difficulty */}
              <div className="mb-5 space-y-2">
                <div className="relative">
                  <svg
                    className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search lessons…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] py-2.5 pl-10 pr-10 text-sm text-gray-200 placeholder-gray-600 outline-none transition focus:border-neon-gold/35 focus:bg-white/[0.04]"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 transition hover:text-gray-300"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Difficulty pills */}
                <div className="flex gap-1.5">
                  {(['all', 'beginner', 'intermediate', 'advanced'] as Difficulty[]).map((d) => {
                    const active = difficulty === d;
                    const color = d === 'all' ? '#f59e0b' : (DIFF_COLOR[d as Exclude<Difficulty,'all'>] ?? '#f59e0b');
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className="rounded-lg px-3 py-1 text-[11px] font-medium capitalize transition-all duration-150"
                        style={{
                          background: active ? `${color}15` : 'rgba(255,255,255,0.03)',
                          color:      active ? color : '#6b7280',
                          border:     `1px solid ${active ? `${color}30` : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lesson rows */}
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-6 py-10 text-center text-sm text-gray-500">
                  {search ? `No lessons matching "${search}"` : 'No lessons in this category yet.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((lesson, i) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      index={i}
                      completed={isComplete(lesson.id)}
                      quizScore={getQuizResult(lesson.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
