import type { SahayakResponse, LessonCard, QuizQuestion, DrishtiAnalysis, RightsCard, RightsCardCategory, RightsCardVariant, DocumentVerifyResult, ShareAccessLevel, ShareExpiry, ShareListItem, SharedReportResponse } from '@nyayasetu/shared-types';
import { getToken } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: authHeaders(),
      ...options,
    });
  } catch {
    throw new Error('Unable to connect. Please check your internet connection.');
  }

  if (!response.ok) {
    // Try to extract a user-friendly message from the JSON body first
    try {
      const body = await response.json() as Record<string, unknown>;
      if (typeof body?.message === 'string' && body.message) {
        throw new Error(body.message);
      }
    } catch (inner) {
      // Re-throw if it's already our cleaned-up error
      if (inner instanceof Error && !inner.message.startsWith('{') && inner.message !== '') {
        throw inner;
      }
    }
    // Fallback: friendly status-based message
    const friendly: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Unauthorised. Please refresh and try again.',
      403: 'Access denied.',
      404: 'Resource not found.',
      422: 'The document could not be processed.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'Server error. Please try again shortly.',
      502: 'Server unavailable. Please try again shortly.',
      503: 'Service temporarily unavailable. Please try again shortly.',
    };
    throw new Error(friendly[response.status] ?? `Something went wrong (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Sahayak
// ---------------------------------------------------------------------------

export interface QueryLawParams {
  text: string;
  state?: string;
}

export function queryLaw(params: QueryLawParams): Promise<SahayakResponse> {
  return request<SahayakResponse>('/api/v1/sahayak/query', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** Upload a document for authenticity verification. */
export async function verifyDocument(file: File): Promise<DocumentVerifyResult> {
  const url = `${BASE_URL}/api/v1/sahayak/verify`;
  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    const uploadHeaders: Record<string, string> = {};
    const token = getToken();
    if (token) uploadHeaders['Authorization'] = `Bearer ${token}`;
    response = await fetch(url, { method: 'POST', body: formData, headers: uploadHeaders });
  } catch {
    throw new Error('Unable to connect. Please check your internet connection.');
  }

  if (!response.ok) {
    try {
      const body = await response.json() as Record<string, unknown>;
      if (typeof body?.message === 'string' && body.message) {
        throw new Error(body.message);
      }
    } catch (inner) {
      if (inner instanceof Error) throw inner;
    }
    throw new Error(`Document verification failed (${response.status}).`);
  }

  return response.json() as Promise<DocumentVerifyResult>;
}

// ---------------------------------------------------------------------------
// Jagrut
// ---------------------------------------------------------------------------

export interface CategoryMeta {
  id: string;
  label: string;
  description: string;
  lessonCount: number;
}

export function getCategories(): Promise<CategoryMeta[]> {
  return request<CategoryMeta[]>('/api/v1/jagrut/categories');
}

export function getLessons(category?: string): Promise<LessonCard[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return request<LessonCard[]>(`/api/v1/jagrut/lessons${qs}`);
}

export function getLesson(id: string): Promise<LessonCard> {
  return request<LessonCard>(`/api/v1/jagrut/lessons/${encodeURIComponent(id)}`);
}

export function getQuiz(lessonId: string): Promise<QuizQuestion[]> {
  return request<QuizQuestion[]>(`/api/v1/jagrut/quiz/${encodeURIComponent(lessonId)}`);
}

export function getRightsCards(opts?: {
  category?: RightsCardCategory;
  variant?: RightsCardVariant;
}): Promise<RightsCard[]> {
  const params = new URLSearchParams();
  if (opts?.category) params.set('category', opts.category);
  if (opts?.variant) params.set('variant', opts.variant);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request<RightsCard[]>(`/api/v1/jagrut/cards${qs}`);
}

export function getRightsCard(id: string): Promise<RightsCard> {
  return request<RightsCard>(`/api/v1/jagrut/cards/${encodeURIComponent(id)}`);
}

// ---------------------------------------------------------------------------
// Drishti
// ---------------------------------------------------------------------------

export interface AnalyzeDocumentParams {
  documentText: string;
  /** Session ID for DynamoDB-backed history. */
  sessionId?: string;
}

export type DrishtiResponse =
  | { type: 'success'; analysis: DrishtiAnalysis; historyId?: string }
  | { type: 'refusal'; reason: string; message: string }
  | { type: 'error'; message: string };

export function analyzeDocument(params: AnalyzeDocumentParams): Promise<DrishtiResponse> {
  return request<DrishtiResponse>('/api/v1/drishti/analyze', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export interface ExtractDocumentResult {
  type: 'success';
  text: string;
  filename: string;
}

/** Upload a file to the server and get back the extracted plain text. */
export async function extractDocument(file: File): Promise<ExtractDocumentResult> {
  const url = `${BASE_URL}/api/v1/drishti/extract`;
  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    const uploadHeaders: Record<string, string> = {};
    const token = getToken();
    if (token) uploadHeaders['Authorization'] = `Bearer ${token}`;
    response = await fetch(url, { method: 'POST', body: formData, headers: uploadHeaders });
  } catch {
    throw new Error('Unable to connect. Please check your internet connection.');
  }

  if (!response.ok) {
    try {
      const body = await response.json() as Record<string, unknown>;
      if (typeof body?.message === 'string' && body.message) {
        throw new Error(body.message as string);
      }
    } catch (inner) {
      if (inner instanceof Error) throw inner;
    }
    throw new Error(`File extraction failed (${response.status}).`);
  }

  return response.json() as Promise<ExtractDocumentResult>;
}

/** @deprecated use analyzeDocument */
export function summarizeDocument(params: AnalyzeDocumentParams): Promise<DrishtiResponse> {
  return analyzeDocument(params);
}

// ---------------------------------------------------------------------------
// User Progress (Jagrut — DynamoDB-backed)
// ---------------------------------------------------------------------------

export interface ProgressData {
  completedLessons: Record<string, string>;
  quizResults: Record<string, { score: number; total: number; completedAt: string }>;
}

export async function getProgress(): Promise<ProgressData | null> {
  try {
    return await request<ProgressData>('/api/v1/progress');
  } catch {
    return null;
  }
}

export async function syncProgress(data: ProgressData): Promise<void> {
  try {
    await request<{ success: boolean }>('/api/v1/progress/sync', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch {
    // Non-fatal — localStorage still has the data
  }
}

// Drishti history (DynamoDB-backed — returns empty array / silently fails if
// DynamoDB is not configured on the server).

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthResponse {
  token: string;
  username: string;
}

export function login(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function register(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export interface DrishtiHistoryListItem {
  id: string;
  sessionId: string;
  preview: string;
  caseTitle: string;
  outcome: string;
  savedAt: string;
}

export interface DrishtiHistoryFull {
  id: string;
  sessionId: string;
  documentText: string;
  analysis: DrishtiAnalysis;
  savedAt: string;
}

export async function getDrishtiHistory(sessionId: string): Promise<DrishtiHistoryListItem[]> {
  try {
    return await request<DrishtiHistoryListItem[]>(
      `/api/v1/drishti/history?sessionId=${encodeURIComponent(sessionId)}`,
    );
  } catch {
    return [];
  }
}

export async function getDrishtiHistoryItem(id: string): Promise<DrishtiHistoryFull | null> {
  try {
    return await request<DrishtiHistoryFull>(`/api/v1/drishti/history/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function deleteDrishtiHistoryItem(id: string, sessionId: string): Promise<void> {
  try {
    await request<{ success: boolean }>(
      `/api/v1/drishti/history/${encodeURIComponent(id)}?sessionId=${encodeURIComponent(sessionId)}`,
      { method: 'DELETE' },
    );
  } catch {
    // Non-fatal — local state is already updated by the caller
  }
}

// ---------------------------------------------------------------------------
// Drishti — Shareable Reports
// ---------------------------------------------------------------------------

export interface CreateShareParams {
  historyId: string;
  sessionId: string;
  accessLevel: ShareAccessLevel;
  password?: string;
  expiresIn?: ShareExpiry;
  includeDocument?: boolean;
}

export interface CreateShareResult {
  shareId: string;
  shareUrl: string;
}

export function createShareLink(params: CreateShareParams): Promise<CreateShareResult> {
  return request<CreateShareResult>('/api/v1/drishti/share', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function getSharedReport(shareId: string): Promise<SharedReportResponse> {
  return request<SharedReportResponse>(
    `/api/v1/drishti/shared/${encodeURIComponent(shareId)}`,
  );
}

export function unlockSharedReport(
  shareId: string,
  password: string,
): Promise<SharedReportResponse> {
  return request<SharedReportResponse>(
    `/api/v1/drishti/shared/${encodeURIComponent(shareId)}/unlock`,
    { method: 'POST', body: JSON.stringify({ password }) },
  );
}

export async function listMyShares(
  sessionId: string,
): Promise<ShareListItem[]> {
  try {
    const res = await request<{ shares: ShareListItem[] }>(
      `/api/v1/drishti/shares?sessionId=${encodeURIComponent(sessionId)}`,
    );
    return res.shares;
  } catch {
    return [];
  }
}

export async function revokeShareLink(
  shareId: string,
  sessionId: string,
): Promise<void> {
  await request<{ success: boolean }>(
    `/api/v1/drishti/share/${encodeURIComponent(shareId)}?sessionId=${encodeURIComponent(sessionId)}`,
    { method: 'DELETE' },
  );
}
