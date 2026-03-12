import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { QuizQuestion } from '@nyayasetu/shared-types';
import { getQuiz } from '@/lib/api';
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

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function getScoreMessage(score: number, total: number) {
  const p = total > 0 ? score / total : 0;
  if (p === 1)   return { emoji: '🏆', title: 'Perfect Score!',   sub: 'You know your rights inside out.' };
  if (p >= 0.7)  return { emoji: '🌟', title: 'Great Job!',        sub: 'Solid understanding. Review the ones you missed.' };
  if (p >= 0.4)  return { emoji: '💪', title: 'Good Effort!',      sub: 'Re-read the lesson and try again.' };
  return           { emoji: '📖', title: 'Keep Learning!',         sub: 'Go through the lesson again — knowledge is power.' };
}

// ---------------------------------------------------------------------------
// Step-dot tracker
// ---------------------------------------------------------------------------

function StepDots({
  total, current, answers, correctIndices, accentColor,
}: {
  total: number; current: number;
  answers: (number | null)[]; correctIndices: number[];
  accentColor: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const answered   = answers[i] !== null;
        const isCurrent  = i === current;
        const wasCorrect = answered && answers[i] === correctIndices[i];

        let bg: string;
        if (answered)        bg = wasCorrect ? '#10b981' : '#ef4444';
        else if (isCurrent)  bg = accentColor;
        else                 bg = 'rgba(255,255,255,0.08)';

        return (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: bg, opacity: isCurrent && !answered ? 1 : answered ? 0.85 : 0.35 }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Quiz() {
  const { id } = useParams<{ id: string }>();
  const [questions,       setQuestions]       = useState<QuizQuestion[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [currentIndex,    setCurrentIndex]    = useState(0);
  const [selectedOption,  setSelectedOption]  = useState<number | null>(null);
  const [answered,        setAnswered]        = useState(false);
  const [score,           setScore]           = useState(0);
  const [finished,        setFinished]        = useState(false);
  const [answers,         setAnswers]         = useState<(number | null)[]>([]);

  const { recordQuiz, markComplete, getQuizResult } = useJagrutProgress();
  const prevBestRef = useRef<number | null>(null);

  const catFromId = id?.split('-')[0] ?? '';
  const catMap: Record<string, string> = {
    fr: 'fundamental-rights', pp: 'police-powers', tl: 'traffic-laws',
    tn: 'tenancy',            cr: 'consumer-rights', wr: 'workplace-rights',
  };
  const colors = CATEGORY_COLORS[catMap[catFromId] ?? ''] ?? DEFAULT_COLOR;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true); setError(null);
    getQuiz(id)
      .then((data) => {
        if (!cancelled) {
          setQuestions(data);
          setAnswers(new Array(data.length).fill(null));
          prevBestRef.current = getQuizResult(id)?.score ?? null;
        }
      })
      .catch(() => { if (!cancelled) setError('Could not load quiz questions.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleSelect = useCallback((i: number) => { if (!answered) setSelectedOption(i); }, [answered]);

  const handleConfirm = useCallback(() => {
    if (selectedOption === null || answered) return;
    setAnswered(true);
    if (selectedOption === questions[currentIndex].correctIndex) setScore((s) => s + 1);
    setAnswers((prev) => { const n = [...prev]; n[currentIndex] = selectedOption; return n; });
  }, [selectedOption, answered, questions, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) { setFinished(true); }
    else { setCurrentIndex((i) => i + 1); setSelectedOption(null); setAnswered(false); }
  }, [currentIndex, questions.length]);

  useEffect(() => {
    if (finished && id) { recordQuiz(id, score, questions.length); markComplete(id); }
  }, [finished, id, score, questions.length, recordQuiz, markComplete]);

  const handleRetry = useCallback(() => {
    setCurrentIndex(0); setSelectedOption(null); setAnswered(false);
    setScore(0); setFinished(false);
    setAnswers(new Array(questions.length).fill(null));
  }, [questions.length]);

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (finished) return;
      if (e.key >= '1' && e.key <= '4') {
        const i = parseInt(e.key) - 1;
        if (i < (questions[currentIndex]?.options.length ?? 0)) handleSelect(i);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const n = questions[currentIndex]?.options.length ?? 0;
        setSelectedOption((p) => (answered || p === null) ? (answered ? p : 0) : Math.min(p + 1, n - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedOption((p) => (answered || p === null) ? p : Math.max(p - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!answered) handleConfirm(); else handleNext();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, currentIndex, finished, handleConfirm, handleNext, handleSelect, questions]);

  // ── Loading / Error ──
  if (loading) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24">
        <div className="flex justify-center"><div className="typing-indicator"><span /><span /><span /></div></div>
      </main>
    );
  }
  if (error || questions.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-10 text-center">
          <p className="text-gray-400">{error ?? 'No quiz questions available for this lesson.'}</p>
          <Link to={`/learn/${id}`} className="mt-4 inline-block text-sm font-medium text-neon-gold hover:underline">Back to lesson</Link>
        </div>
      </main>
    );
  }

  // ── Score Screen ──
  if (finished) {
    const msg       = getScoreMessage(score, questions.length);
    const isPerfect = score === questions.length;
    const isNewBest = prevBestRef.current === null || score > prevBestRef.current;

    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <Link to={`/learn/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-300">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to lesson
        </Link>

        {/* Score hero */}
        <div
          className="relative mb-8 overflow-hidden rounded-2xl border px-6 py-8 text-center"
          style={{
            borderColor: isPerfect ? 'rgba(16,185,129,0.3)' : colors.border,
            background:  isPerfect
              ? 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.1), transparent 70%)'
              : `radial-gradient(ellipse 80% 50% at 50% 0%, ${colors.glow}, transparent 70%)`,
          }}
        >
          <div className="mb-3 text-5xl">{msg.emoji}</div>
          <h1 className="text-2xl font-bold text-white">{msg.title}</h1>
          <p className="mt-1.5 text-sm text-gray-400">{msg.sub}</p>

          {isNewBest && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-neon-gold/25 bg-neon-gold/8 px-3 py-0.5 text-[11px] font-semibold text-neon-gold">
              ★ New Best
            </span>
          )}

          {/* Score ring */}
          <div className="mx-auto mt-6 flex h-28 w-28 items-center justify-center">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={isPerfect ? '#10b981' : colors.text}
                  strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / questions.length)}`}
                  style={{ transition: 'stroke-dashoffset 0.9s ease-out' }}
                />
              </svg>
              <div className="text-center">
                <span className="text-2xl font-bold text-white">{score}</span>
                <span className="text-sm text-gray-500">/{questions.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Answer review */}
        <div className="mb-8 space-y-2">
          {questions.map((q, i) => {
            const ua        = answers[i];
            const isCorrect = ua === q.correctIndex;
            return (
              <div key={q.id} className="rounded-xl border px-4 py-3"
                style={{
                  borderColor: isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                  background:  isCorrect ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)',
                }}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full text-[9px] font-bold"
                    style={{
                      background: isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: isCorrect ? '#10b981' : '#ef4444',
                      minWidth: '1.1rem', height: '1.1rem',
                    }}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="text-[10px] text-gray-500">Q{i + 1}</span>
                </div>
                <p className="text-xs text-gray-300">{q.scenario}</p>
                <div className="mt-2 space-y-0.5 text-[11px]">
                  <p className="text-gray-500">
                    Your answer: <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>{q.options[ua ?? 0]}</span>
                  </p>
                  {!isCorrect && <p className="text-gray-500">Correct: <span className="text-emerald-400">{q.options[q.correctIndex]}</span></p>}
                  {!isCorrect && <p className="mt-1 leading-relaxed text-gray-600">{q.explanation}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-10">
          <button type="button" onClick={handleRetry}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] py-2.5 text-sm font-medium text-gray-300 transition-all hover:border-white/[0.12] hover:text-white">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Try Again
          </button>
          <Link to="/learn"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] py-2.5 text-sm font-medium text-gray-300 transition-all hover:border-white/[0.12] hover:text-white">
            All Lessons
          </Link>
        </div>
      </main>
    );
  }

  // ── Active question ──
  const q = questions[currentIndex];
  const correctIndices = questions.map((qu) => qu.correctIndex);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">

      {/* Back */}
      <Link to={`/learn/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-300">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        Back to lesson
      </Link>

      {/* Step dots */}
      <div className="mb-2">
        <StepDots
          total={questions.length} current={currentIndex}
          answers={answers} correctIndices={correctIndices}
          accentColor={colors.text}
        />
      </div>
      <div className="mb-6 flex items-center justify-between text-[11px] text-gray-600">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <span>{score} correct</span>
      </div>

      {/* Scenario card */}
      <div className="relative mb-5 overflow-hidden rounded-2xl border px-5 py-5"
        style={{ borderColor: colors.border, background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${colors.glow}, transparent 70%)` }}>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold"
            style={{ background: colors.bg, color: colors.text }}>?</div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Scenario</span>
        </div>
        <p className="text-sm leading-relaxed text-gray-100">{q.scenario}</p>
      </div>

      {/* Options */}
      <div className="mb-5 space-y-2">
        {q.options.map((option, i) => {
          // Visual state
          let borderCol = 'rgba(255,255,255,0.07)';
          let bgCol     = 'rgba(255,255,255,0.015)';
          let textCol   = '#9ca3af';
          let letterBg  = 'rgba(255,255,255,0.05)';
          let letterCol = '#6b7280';

          if (answered) {
            if (i === q.correctIndex) {
              borderCol = 'rgba(16,185,129,0.35)'; bgCol = 'rgba(16,185,129,0.07)';
              textCol = '#d1fae5'; letterBg = 'rgba(16,185,129,0.2)'; letterCol = '#10b981';
            } else if (i === selectedOption) {
              borderCol = 'rgba(239,68,68,0.35)'; bgCol = 'rgba(239,68,68,0.07)';
              textCol = '#fecaca'; letterBg = 'rgba(239,68,68,0.2)'; letterCol = '#ef4444';
            } else {
              textCol = '#4b5563';
            }
          } else if (i === selectedOption) {
            borderCol = colors.border; bgCol = colors.bg;
            textCol = '#f3f4f6'; letterBg = `${colors.text}22`; letterCol = colors.text;
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              disabled={answered}
              className="flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-150"
              style={{ borderColor: borderCol, background: bgCol, cursor: answered ? 'default' : 'pointer' }}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors"
                style={{ background: letterBg, color: letterCol }}>
                {OPTION_LETTERS[i]}
              </span>
              <span className="flex-1 text-sm leading-snug transition-colors" style={{ color: textCol }}>
                {option}
              </span>
              {answered && i === q.correctIndex && (
                <svg className="h-4 w-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
              {answered && i === selectedOption && i !== q.correctIndex && (
                <svg className="h-4 w-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <div className="mb-5 animate-slide-up rounded-xl border px-4 py-3"
          style={{
            borderColor: selectedOption === q.correctIndex ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
            background:  selectedOption === q.correctIndex ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)',
          }}>
          <p className="mb-1 text-[11px] font-semibold"
            style={{ color: selectedOption === q.correctIndex ? '#10b981' : '#ef4444' }}>
            {selectedOption === q.correctIndex ? '✓ Correct!' : '✗ Not quite'}
          </p>
          <p className="text-xs leading-relaxed text-gray-400">{q.explanation}</p>
        </div>
      )}

      {/* Footer: hint + button */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-700">1–4 · ↑↓ · Enter</span>

        {!answered ? (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedOption === null}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-30"
            style={{
              background:  selectedOption !== null ? `linear-gradient(135deg,${colors.text}dd,${colors.text}88)` : 'rgba(255,255,255,0.06)',
              boxShadow:   selectedOption !== null ? `0 4px 18px ${colors.text}22` : 'none',
            }}
          >
            Check
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="group inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all duration-150"
            style={{
              background: `linear-gradient(135deg,${colors.text}dd,${colors.text}88)`,
              boxShadow:  `0 4px 18px ${colors.text}22`,
            }}
          >
            {currentIndex + 1 >= questions.length ? 'See Results' : 'Next'}
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        )}
      </div>
    </main>
  );
}
