import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from 'react';
import type { SahayakResponse, DocumentVerifyResult } from '@nyayasetu/shared-types';
import { queryLaw, verifyDocument } from '@/lib/api';
import LegalResponseCard from '@/components/LegalResponse';
import RefusalCard from '@/components/RefusalCard';
import AIProgressLoader from '@/components/AIProgressLoader';
import { ModeToggle, type SahayakMode } from '@/components/verify/ModeToggle';
import { FileDropZone } from '@/components/verify/FileDropZone';
import { VerifyResultCard } from '@/components/verify/VerifyResultCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  type: 'user' | 'response' | 'error' | 'verify-result';
  text?: string;
  jurisdictionLabel?: string;
  response?: SahayakResponse;
  verifyResponse?: DocumentVerifyResult;
  errorText?: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'nyayasetu-chat-v1';
const MAX_STORED = 40;

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: ChatMessage[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(msgs.slice(-MAX_STORED)),
    );
  } catch { /* quota exceeded — ignore */ }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORTED_STATES = [
  { value: '', label: 'Auto-detect / Central' },
  { value: 'west-bengal', label: 'West Bengal' },
  { value: 'jharkhand', label: 'Jharkhand' },
] as const;

const EXAMPLE_QUERIES = [
  { q: 'Police seized my bike without a challan. Is this legal?',     icon: '🛵' },
  { q: 'My landlord demands 6 months advance rent. What does law say?', icon: '🏠' },
  { q: 'Can police search my phone without a warrant?',                icon: '📱' },
  { q: 'What are my rights if I get arrested?',                        icon: '⚖️' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------


function SahayakAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-xl border border-neon-cyan/20"
      style={{ width: size, height: size,
        background: 'radial-gradient(circle, rgba(6,214,221,0.12) 0%, rgba(3,7,18,0.8) 100%)',
        boxShadow: '0 0 10px rgba(6,214,221,0.15)' }}
    >
      <img src="/logos/sahayak-removebg-preview.png" alt="Sahayak"
        className="h-full w-full object-contain p-0.5" />
    </div>
  );
}

function UserBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] space-y-1">
        <div
          className="rounded-2xl rounded-br-sm px-4 py-3 text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(6,214,221,0.18) 0%, rgba(59,130,246,0.15) 100%)',
            border: '1px solid rgba(6,214,221,0.22)',
            boxShadow: '0 4px 20px rgba(6,214,221,0.08)',
          }}
        >
          {msg.text}
        </div>
        <div className="flex items-center justify-end gap-2 pr-1">
          {msg.jurisdictionLabel && msg.jurisdictionLabel !== 'Auto-detect / Central' && (
            <span className="rounded-full border border-neon-purple/20 bg-neon-purple/8 px-2 py-0.5 text-[10px] text-neon-purple">
              ⚖ {msg.jurisdictionLabel}
            </span>
          )}
          <span className="text-[10px] text-gray-600">{formatTime(msg.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

function ResponseBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex items-start gap-3">
      <SahayakAvatar size={32} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neon-cyan">Sahayak</span>
          <span className="text-[10px] text-gray-600">{formatTime(msg.timestamp)}</span>
        </div>
        {msg.response?.type === 'success' ? (
          <LegalResponseCard response={msg.response} />
        ) : msg.response?.type === 'refusal' ? (
          <RefusalCard response={msg.response} />
        ) : null}
      </div>
    </div>
  );
}

function ErrorBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex items-start gap-3">
      <SahayakAvatar size={32} />
      <div className="rounded-2xl rounded-tl-sm border border-red-500/20 bg-red-500/5 px-4 py-3">
        <p className="text-sm font-medium text-red-400">Unable to process your query</p>
        <p className="mt-1 text-xs text-red-300/70">{msg.errorText}</p>
      </div>
    </div>
  );
}

function VerifyResultBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex items-start gap-3">
      <SahayakAvatar size={32} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neon-cyan">Sahayak</span>
          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-400">VERIFY</span>
          <span className="text-[10px] text-gray-600">{formatTime(msg.timestamp)}</span>
        </div>
        {msg.verifyResponse?.type === 'success' ? (
          <VerifyResultCard result={msg.verifyResponse} />
        ) : msg.verifyResponse?.type === 'refusal' ? (
          <div className="rounded-2xl rounded-tl-sm border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-sm font-medium text-amber-400">Could not verify document</p>
            <p className="mt-1 text-xs text-amber-300/70">{msg.verifyResponse.message}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VerifyEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-10">
      <div className="mb-5 h-16 w-16 overflow-hidden rounded-2xl border border-amber-400/20"
        style={{ boxShadow: '0 0 24px rgba(245,158,11,0.15)' }}>
        <div className="h-full w-full flex items-center justify-center text-3xl bg-amber-500/[0.06]">
          🔍
        </div>
      </div>
      <h2 className="text-lg font-bold text-white">Verify a Document</h2>
      <p className="mt-1 max-w-xs text-center text-sm text-gray-500">
        Upload a legal document (PDF, image, or text) and get an AI-powered
        authenticity analysis with highlighted issues.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-4 max-w-sm">
        {[
          { icon: '📄', label: 'Court Orders' },
          { icon: '📋', label: 'Legal Notices' },
          { icon: '📝', label: 'FIRs & Agreements' },
        ].map(({ icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <span className="text-xl">{icon}</span>
            <span className="text-[10px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onExample }: { onExample: (q: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-10">
      <div className="mb-5 h-16 w-16 overflow-hidden rounded-2xl border border-neon-cyan/20"
        style={{ boxShadow: '0 0 24px rgba(6,214,221,0.15)' }}>
        <img src="/logos/sahayak-removebg-preview.png" alt="Sahayak"
          className="h-full w-full object-contain" />
      </div>
      <h2 className="text-lg font-bold text-white">Ask Sahayak</h2>
      <p className="mt-1 max-w-xs text-center text-sm text-gray-500">
        Describe a legal situation in plain language and get cited, verified
        information from Indian law.
      </p>

      <div className="mt-8 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
        {EXAMPLE_QUERIES.map(({ q, icon }) => (
          <button
            key={q}
            onClick={() => onExample(q)}
            className="group flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-left transition-all hover:border-neon-cyan/20 hover:bg-white/[0.06]"
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs leading-relaxed text-gray-400 group-hover:text-gray-200 transition-colors">
              {q}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Ask() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory());
  const [text, setText] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<SahayakMode>('chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change or loading changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Persist messages
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // Auto-grow textarea
  function handleTextInput(val: string) {
    setText(val);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  }

  function resetTextarea() {
    setText('');
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !loading) submitQuery();
    }
  }

  const submitQuery = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const stateLabel = SUPPORTED_STATES.find((s) => s.value === state)?.label ?? 'Auto-detect / Central';

    const userMsg: ChatMessage = {
      id: uid(),
      type: 'user',
      text: trimmed,
      jurisdictionLabel: stateLabel,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    resetTextarea();
    setLoading(true);

    try {
      const response = await queryLaw({
        text: trimmed,
        state: state || undefined,
      });

      const responseMsg: ChatMessage = {
        id: uid(),
        type: 'response',
        response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, responseMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: uid(),
        type: 'error',
        errorText: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [text, state, loading]);

  function clearChat() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  const handleVerifySubmit = useCallback(async (file: File) => {
    if (loading) return;

    const userMsg: ChatMessage = {
      id: uid(),
      type: 'user',
      text: `Verify document: ${file.name}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await verifyDocument(file);
      const resultMsg: ChatMessage = {
        id: uid(),
        type: 'verify-result',
        verifyResponse: result,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, resultMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: uid(),
        type: 'error',
        errorText: err instanceof Error ? err.message : 'Document verification failed. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const isEmpty = messages.length === 0 && !loading;

  return (
    <main className="mx-auto flex h-full max-w-5xl flex-col px-4">

      {/* ── Compact Header ── */}
      <div className="flex shrink-0 items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-neon-cyan/20"
            style={{ boxShadow: '0 0 12px rgba(6,214,221,0.12)' }}>
            <img src="/logos/sahayak-removebg-preview.png" alt="Sahayak"
              className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-neon-cyan leading-none">Sahayak</h1>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Indian legal information · AI-powered · Cited sources
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle mode={mode} onChange={setMode} />

        {!isEmpty && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-gray-500 transition-all hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            Clear
          </button>
        )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div
        ref={chatAreaRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
      >
        {isEmpty ? (
          mode === 'verify'
            ? <VerifyEmptyState />
            : <EmptyState onExample={(q) => { setText(q); textareaRef.current?.focus(); }} />
        ) : (
          <div className="space-y-6 pb-4 pt-2">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-fade-in">
                {msg.type === 'user'           && <UserBubble msg={msg} />}
                {msg.type === 'response'       && <ResponseBubble msg={msg} />}
                {msg.type === 'verify-result'  && <VerifyResultBubble msg={msg} />}
                {msg.type === 'error'          && <ErrorBubble msg={msg} />}
              </div>
            ))}

            {/* Loading graph */}
            {loading && (
              <div className="flex items-start gap-3 animate-fade-in">
                <SahayakAvatar size={32} />
                <div className="min-w-0 flex-1">
                  <AIProgressLoader maxWidth={420} message={mode === 'verify' ? "Analyzing document for authenticity…" : "Analyzing your query through the legal pipeline…"} />
                </div>
              </div>
            )}

            {/* Invisible anchor for scroll-to-bottom */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input Bar ── */}
      <div className="shrink-0 border-t border-white/[0.06] py-4">
        {mode === 'verify' ? (
          <div className="pb-2">
            <FileDropZone onSubmit={handleVerifySubmit} disabled={loading} />
            <p className="mt-2 text-center text-[10px] text-gray-700">
              Upload a legal document for AI-powered authenticity verification
            </p>
          </div>
        ) : (
        <>
        {/* Example chips - only when chat is non-empty but textarea is empty */}
        {messages.length > 0 && !text && !loading && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {EXAMPLE_QUERIES.slice(0, 2).map(({ q }) => (
              <button key={q} onClick={() => { setText(q); textareaRef.current?.focus(); }}
                className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[11px] text-gray-500 transition-all hover:border-neon-cyan/20 hover:text-neon-cyan">
                {q.length > 50 ? q.slice(0, 48) + '…' : q}
              </button>
            ))}
          </div>
        )}

        {/* Input card */}
        <div className="rounded-2xl border border-white/[0.1] bg-white/[0.04] backdrop-blur-xl transition-all focus-within:border-neon-cyan/30 focus-within:shadow-[0_0_0_3px_rgba(6,214,221,0.08)]">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => handleTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your legal situation… (Enter to send, Shift+Enter for new line)"
            disabled={loading}
            className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm text-white placeholder-gray-500 outline-none"
            style={{ minHeight: 44, maxHeight: 160 }}
          />

          <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2">
            {/* Jurisdiction selector */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-600" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M3 21h18M9 21V7l9-4v18M3 7l9-4" />
              </svg>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={loading}
                className="appearance-none bg-transparent text-xs text-gray-400 outline-none cursor-pointer hover:text-gray-200"
              >
                {SUPPORTED_STATES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-dark-900 text-gray-200">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Send button */}
            <button
              type="button"
              onClick={submitQuery}
              disabled={loading || !text.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl transition-all disabled:opacity-40"
              style={{
                background: text.trim() && !loading
                  ? 'linear-gradient(135deg, #06d6dd, #3b82f6)'
                  : 'rgba(255,255,255,0.06)',
                boxShadow: text.trim() && !loading ? '0 0 12px rgba(6,214,221,0.3)' : 'none',
              }}
              title="Send (Enter)"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <p className="mt-1.5 text-center text-[10px] text-gray-700">
          Sahayak provides legal information, not legal advice · Always consult a qualified lawyer
        </p>
        </>
        )}
      </div>
    </main>
  );
}
