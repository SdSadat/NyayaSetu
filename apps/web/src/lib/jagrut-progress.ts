import { useState, useCallback, useEffect, useRef } from 'react';
import { isLoggedIn } from './auth';
import { getProgress, syncProgress } from './api';

const STORAGE_KEY = 'nyayasetu-jagrut-v1';

export interface QuizResult {
  score: number;
  total: number;
  completedAt: string;
}

export interface JagrutProgress {
  completedLessons: Record<string, string>; // lessonId -> ISO completedAt
  quizResults: Record<string, QuizResult>;  // lessonId -> best result
}

function loadProgress(): JagrutProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as JagrutProgress;
  } catch {
    // ignore
  }
  return { completedLessons: {}, quizResults: {} };
}

function saveProgress(p: JagrutProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

/** Merge remote progress into local, keeping earliest completions and highest scores. */
function mergeProgress(local: JagrutProgress, remote: JagrutProgress): JagrutProgress {
  const completedLessons = { ...local.completedLessons };
  for (const [id, remoteAt] of Object.entries(remote.completedLessons)) {
    if (!completedLessons[id] || remoteAt < completedLessons[id]) {
      completedLessons[id] = remoteAt;
    }
  }

  const quizResults = { ...local.quizResults };
  for (const [id, remoteQuiz] of Object.entries(remote.quizResults)) {
    const existing = quizResults[id];
    if (!existing || remoteQuiz.score > existing.score) {
      quizResults[id] = remoteQuiz;
    }
  }

  return { completedLessons, quizResults };
}

export function useJagrutProgress() {
  const [progress, setProgress] = useState<JagrutProgress>(loadProgress);
  const hasSynced = useRef(false);

  // On mount, if logged in, fetch remote progress and merge
  useEffect(() => {
    if (!isLoggedIn() || hasSynced.current) return;
    hasSynced.current = true;

    getProgress().then((remote) => {
      if (!remote) return;
      setProgress((local) => {
        const merged = mergeProgress(local, remote);
        saveProgress(merged);
        // Push merged state back to server
        syncProgress(merged);
        return merged;
      });
    });
  }, []);

  /** Persist to localStorage and (if logged in) sync to DynamoDB. */
  const persistAndSync = useCallback((next: JagrutProgress) => {
    saveProgress(next);
    if (isLoggedIn()) {
      syncProgress(next);
    }
  }, []);

  /** Mark a lesson as read (idempotent — won't overwrite earlier timestamp). */
  const markComplete = useCallback((lessonId: string) => {
    setProgress((prev) => {
      if (prev.completedLessons[lessonId]) return prev;
      const next: JagrutProgress = {
        ...prev,
        completedLessons: {
          ...prev.completedLessons,
          [lessonId]: new Date().toISOString(),
        },
      };
      persistAndSync(next);
      return next;
    });
  }, [persistAndSync]);

  /** Record a quiz score; only persists if higher than the previous best. */
  const recordQuiz = useCallback((lessonId: string, score: number, total: number) => {
    setProgress((prev) => {
      const existing = prev.quizResults[lessonId];
      if (existing && existing.score >= score) return prev;
      const next: JagrutProgress = {
        ...prev,
        quizResults: {
          ...prev.quizResults,
          [lessonId]: { score, total, completedAt: new Date().toISOString() },
        },
      };
      persistAndSync(next);
      return next;
    });
  }, [persistAndSync]);

  const isComplete = useCallback(
    (lessonId: string) => Boolean(progress.completedLessons[lessonId]),
    [progress],
  );

  const getQuizResult = useCallback(
    (lessonId: string): QuizResult | null => progress.quizResults[lessonId] ?? null,
    [progress],
  );

  const completedCount = Object.keys(progress.completedLessons).length;
  const quizCount = Object.keys(progress.quizResults).length;

  return { progress, markComplete, recordQuiz, isComplete, getQuizResult, completedCount, quizCount };
}
