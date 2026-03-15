import { useEffect, useState, useMemo } from 'react';
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

export const CATEGORY_COLORS: Record<string, { border: string; text: string; bg: string; glow: string }> = {
  'fundamental-rights': { border: 'rgba(6,214,221,0.3)',   text: '#06d6dd', bg: 'rgba(6,214,221,0.06)',   glow: 'rgba(6,214,221,0.15)'   },
  'police-powers':      { border: 'rgba(239,68,68,0.3)',   text: '#ef4444', bg: 'rgba(239,68,68,0.06)',   glow: 'rgba(239,68,68,0.15)'   },
  'traffic-laws':       { border: 'rgba(59,130,246,0.3)',  text: '#3b82f6', bg: 'rgba(59,130,246,0.06)',  glow: 'rgba(59,130,246,0.15)'  },
  'tenancy':            { border: 'rgba(168,85,247,0.3)',  text: '#a855f7', bg: 'rgba(168,85,247,0.06)',  glow: 'rgba(168,85,247,0.15)'  },
  'consumer-rights':    { border: 'rgba(16,185,129,0.3)',  text: '#10b981', bg: 'rgba(16,185,129,0.06)',  glow: 'rgba(16,185,129,0.15)'  },
  'workplace-rights':   { border: 'rgba(245,158,11,0.3)',  text: '#f59e0b', bg: 'rgba(245,158,11,0.06)',  glow: 'rgba(245,158,11,0.15)'  },
};

export const DEFAULT_COLOR = { border: 'rgba(255,255,255,0.1)', text: '#9ca3af', bg: 'rgba(255,255,255,0.04)', glow: 'rgba(255,255,255,0.08)' };

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
// Mini progress ring (SVG)
// ---------------------------------------------------------------------------

function ProgressRing({ done, total, color, size = 28 }: { done: number; total: number; color: string; size?: number }) {
  const r = (size - 4) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={2.5} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={2.5} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <span
        className="absolute text-[8px] font-bold tabular-nums"
        style={{ color: pct > 0 ? color : 'rgba(255,255,255,0.25)' }}
      >
        {done}
      </span>
    </div>
  );
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
      className="group relative w-full rounded-xl px-3 py-2.5 text-left transition-all duration-200"
      style={{
        background: isActive ? colors.bg : 'transparent',
        borderLeft: isActive ? `3px solid ${colors.text}` : '3px solid transparent',
      }}
    >
      <span className="flex items-center gap-2.5">
        <span className="text-base leading-none">{icon}</span>
        <span
          className="flex-1 truncate text-sm font-medium transition-colors"
          style={{ color: isActive ? colors.text : '#d1d5db' }}
        >
          {label}
        </span>
        <ProgressRing done={done} total={count} color={colors.text} />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Lesson row (enhanced)
// ---------------------------------------------------------------------------

function LessonRow({
  lesson, completed, quizScore,
}: {
  lesson: LessonCardType;
  completed: boolean; quizScore: { score: number; total: number } | null;
}) {
  const colors    = CATEGORY_COLORS[lesson.category] ?? DEFAULT_COLOR;
  const diffColor = DIFF_COLOR[lesson.difficulty as Exclude<Difficulty, 'all'>] ?? '#9ca3af';
  const diffLabel = lesson.difficulty === 'beginner' ? 'Beginner'
    : lesson.difficulty === 'intermediate' ? 'Intermediate' : 'Advanced';
  const catIcon = CATEGORY_ICONS[lesson.category] ?? '●';

  return (
    <Link
      to={`/learn/${lesson.id}`}
      className="group relative flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04] hover:-translate-y-px"
      style={{ borderLeftWidth: 3, borderLeftColor: completed ? '#10b981' : colors.text }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 70% 80% at 20% 50%, ${colors.glow}, transparent 70%)` }}
      />

      {/* Order / check */}
      <div
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-all duration-200"
        style={{
          background: completed ? 'rgba(16,185,129,0.12)' : colors.bg,
          color: completed ? '#10b981' : colors.text,
          boxShadow: completed ? '0 0 12px rgba(16,185,129,0.15)' : 'none',
        }}
      >
        {completed
          ? <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          : lesson.order}
      </div>

      {/* Content */}
      <div className="relative min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-100 group-hover:text-white transition-colors leading-snug">
          {lesson.title}
        </p>
        <p className="mt-1 text-xs text-white/40 leading-relaxed line-clamp-1">
          {lesson.plainLanguageExplanation}
        </p>

        {/* Meta row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {/* Category chip */}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
          >
            {catIcon} {lesson.section}
          </span>

          {/* Difficulty */}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: diffColor + '15', color: diffColor }}
          >
            {diffLabel}
          </span>

          {/* Reading time */}
          <span className="text-[10px] text-white/30">
            {formatTime(lesson.readingTimeSeconds)}
          </span>

          {/* Quiz score pill */}
          {quizScore && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{
                background: quizScore.score === quizScore.total ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                color: quizScore.score === quizScore.total ? '#10b981' : '#f59e0b',
              }}
            >
              Quiz {quizScore.score}/{quizScore.total}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <svg
        className="relative mt-1 h-4 w-4 shrink-0 text-white/15 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white/40"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Category section header
// ---------------------------------------------------------------------------

function CategoryHeader({ cat, done, total }: { cat: CategoryMeta; done: number; total: number }) {
  const colors = CATEGORY_COLORS[cat.id] ?? DEFAULT_COLOR;
  const icon = CATEGORY_ICONS[cat.id] ?? '●';
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 pt-2 pb-3">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
        style={{ background: colors.bg }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold" style={{ color: colors.text }}>{cat.label}</h3>
        <p className="text-[10px] text-white/30">{cat.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1 w-16 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: colors.text }}
          />
        </div>
        <span className="text-[10px] tabular-nums" style={{ color: colors.text }}>{done}/{total}</span>
      </div>
    </div>
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

  const filtered = useMemo(() => {
    return lessons.filter((l) => {
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
  }, [lessons, activeCategory, difficulty, search]);

  // Group filtered lessons by category (for "All Topics" view)
  const groupedByCategory = useMemo(() => {
    if (activeCategory) return null; // not needed when filtering by category
    const groups: { cat: CategoryMeta; lessons: LessonCardType[] }[] = [];
    for (const cat of categories) {
      const catLessons = filtered.filter((l) => l.category === cat.id);
      if (catLessons.length > 0) {
        groups.push({ cat, lessons: catLessons });
      }
    }
    return groups;
  }, [categories, filtered, activeCategory]);

  const overallPct = lessons.length > 0 ? completedCount / lessons.length : 0;

  return (
    <div className="min-h-screen">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden border-b border-white/6 pb-6 sm:pb-8 pt-6 sm:pt-10 px-4 sm:px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 80% at 30% -10%, rgba(245,158,11,0.14), transparent 70%)' }}
        />
        <div className="relative max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-10">

            {/* Left: title + search */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 sm:gap-4 mb-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-2xl">
                  <img src="/logos/jagrut-removebg-preview.png" alt="Jagrut" className="h-full w-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">
                    <span className="text-neon-gold">Jagrut</span>
                    <span className="ml-2 text-xs sm:text-sm font-normal text-white/40">Legal Literacy Engine</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-white/40">Bite-sized lessons on your everyday legal rights.</p>
                </div>
              </div>

              {/* Search bar */}
              <div className="mt-4 max-w-md relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-sm">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search lessons…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-neon-gold/30 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/60"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Right: progress overview */}
            <div className="mt-5 lg:mt-0 flex items-start gap-4 sm:gap-6 lg:flex-none">

              {/* Large progress ring */}
              <div className="relative flex items-center justify-center flex-none">
                <svg className="w-[72px] h-[72px] sm:w-[100px] sm:h-[100px] -rotate-90" viewBox="0 0 100 100">
                  <circle cx={50} cy={50} r={42} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
                  <circle
                    cx={50} cy={50} r={42} fill="none"
                    stroke="url(#heroRingGrad)" strokeWidth={6} strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - overallPct)}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="heroRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg sm:text-2xl font-bold text-neon-gold">{Math.round(overallPct * 100)}%</span>
                  <span className="text-[8px] sm:text-[9px] text-white/30 uppercase tracking-wider">Complete</span>
                </div>
              </div>

              {/* Stats + category chips */}
              <div className="min-w-0 flex-1">
                {/* Quick stats */}
                <div className="flex gap-3 sm:gap-4 mb-3">
                  <div>
                    <p className="text-lg font-bold text-white">{completedCount}<span className="text-white/25">/{lessons.length}</span></p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Lessons</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">
                      {lessons.filter((l) => getQuizResult(l.id) !== null).length}
                    </p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Quizzes</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">
                      {categories.filter((c) => (completedPerCat[c.id] ?? 0) === c.lessonCount && c.lessonCount > 0).length}
                      <span className="text-white/25">/{categories.length}</span>
                    </p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Topics</p>
                  </div>
                </div>

                {/* Category mini chips */}
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => {
                    const colors = CATEGORY_COLORS[cat.id] ?? DEFAULT_COLOR;
                    const done = completedPerCat[cat.id] ?? 0;
                    const allDone = done === cat.lessonCount && cat.lessonCount > 0;
                    return (
                      <span
                        key={cat.id}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: allDone ? 'rgba(16,185,129,0.12)' : colors.bg,
                          color: allDone ? '#10b981' : colors.text,
                          border: `1px solid ${allDone ? 'rgba(16,185,129,0.25)' : colors.border}`,
                        }}
                      >
                        {allDone ? '✓' : (CATEGORY_ICONS[cat.id] ?? '●')} {done}/{cat.lessonCount}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-20 sm:pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="typing-indicator"><span /><span /><span /></div>
          </div>
        ) : (
          <div className="flex gap-6 items-start">

            {/* ── LEFT sidebar ── */}
            <aside className="hidden lg:flex flex-col gap-1 w-52 flex-none lg:sticky lg:top-20 lg:self-start">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Topics</p>

              {/* All */}
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="group w-full rounded-xl px-3 py-2.5 text-left transition-all duration-200"
                style={{
                  background: activeCategory === null ? 'rgba(245,158,11,0.07)' : 'transparent',
                  borderLeft: activeCategory === null ? '3px solid #f59e0b' : '3px solid transparent',
                }}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base">📚</span>
                  <span
                    className="flex-1 text-sm font-medium"
                    style={{ color: activeCategory === null ? '#f59e0b' : '#d1d5db' }}
                  >
                    All Topics
                  </span>
                  <span
                    className="text-[11px] tabular-nums font-mono"
                    style={{ color: activeCategory === null ? '#f59e0b' : 'rgba(255,255,255,0.25)' }}
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

              <div className="h-px bg-white/[0.06] my-3" />

              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Difficulty</p>
              {(['all', 'beginner', 'intermediate', 'advanced'] as Difficulty[]).map((d) => {
                const active = difficulty === d;
                const color = d === 'all' ? '#f59e0b' : (DIFF_COLOR[d as Exclude<Difficulty,'all'>] ?? '#f59e0b');
                const label = d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm transition-all duration-200"
                    style={{
                      background: active ? color + '12' : 'transparent',
                      color: active ? color : 'rgba(255,255,255,0.4)',
                      borderLeft: active ? `3px solid ${color}` : '3px solid transparent',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </aside>

            {/* ── RIGHT: lesson list ── */}
            <div className="flex-1 min-w-0">

              {/* Mobile pills */}
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activeCategory === null
                      ? 'bg-neon-gold/15 border-neon-gold/30 text-neon-gold'
                      : 'border-white/10 text-white/50 hover:text-white/70'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => {
                  const colors = CATEGORY_COLORS[cat.id] ?? DEFAULT_COLOR;
                  const active = activeCategory === cat.id;
                  const icon = CATEGORY_ICONS[cat.id] ?? '●';
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(active ? null : cat.id)}
                      className="flex-none px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                      style={
                        active
                          ? { background: colors.text + '20', borderColor: colors.text + '40', color: colors.text }
                          : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
                      }
                    >
                      {icon} {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Mobile difficulty pills */}
              <div className="lg:hidden flex gap-1.5 mb-4">
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
                      {d === 'all' ? 'All' : d}
                    </button>
                  );
                })}
              </div>

              {/* Count */}
              <p className="text-sm text-white/25 mb-4">
                {filtered.length} lesson{filtered.length !== 1 ? 's' : ''}
                {activeCategory && categories.find((c) => c.id === activeCategory)
                  ? ` in ${categories.find((c) => c.id === activeCategory)!.label}`
                  : ''}
                {search ? ` matching "${search}"` : ''}
              </p>

              {/* Lesson list */}
              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-3xl mb-3">📖</p>
                  <p className="text-white/40 text-sm">
                    {search ? `No lessons matching "${search}"` : 'No lessons in this category yet.'}
                  </p>
                </div>
              ) : groupedByCategory && !search ? (
                /* Grouped view (All Topics, no search) */
                <div className="space-y-6">
                  {groupedByCategory.map(({ cat, lessons: catLessons }) => (
                    <div key={cat.id}>
                      <CategoryHeader
                        cat={cat}
                        done={completedPerCat[cat.id] ?? 0}
                        total={cat.lessonCount}
                      />
                      <div className="space-y-2">
                        {catLessons.map((lesson) => (
                          <LessonRow
                            key={lesson.id}
                            lesson={lesson}
                            completed={isComplete(lesson.id)}
                            quizScore={getQuizResult(lesson.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Flat view (filtered by category or search) */
                <div className="space-y-2">
                  {filtered.map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      completed={isComplete(lesson.id)}
                      quizScore={getQuizResult(lesson.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
