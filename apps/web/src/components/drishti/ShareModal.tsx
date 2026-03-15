import { useState } from 'react';
import type { ShareAccessLevel, ShareExpiry } from '@nyayasetu/shared-types';
import { createShareLink, revokeShareLink } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShareModalProps {
  historyId: string;
  caseTitle: string;
  sessionId: string;
  onClose: () => void;
}

type ExpiryOption = { label: string; value: ShareExpiry };

const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: 'Never', value: null },
  { label: '24 hours', value: '24h' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ShareModal({
  historyId,
  caseTitle,
  sessionId,
  onClose,
}: ShareModalProps) {
  // Form state
  const [accessLevel, setAccessLevel] = useState<ShareAccessLevel>('public');
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState<ShareExpiry>('7d');
  const [includeDocument, setIncludeDocument] = useState(false);

  // Result state
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const handleCreate = async () => {
    if (accessLevel === 'password' && !password.trim()) {
      setError('Please enter a password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createShareLink({
        historyId,
        sessionId,
        accessLevel,
        password: accessLevel === 'password' ? password : undefined,
        expiresIn,
        includeDocument,
      });
      setShareUrl(result.shareUrl);
      setShareId(result.shareId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = async () => {
    if (!shareId) return;
    setRevoking(true);
    try {
      await revokeShareLink(shareId, sessionId);
      setShareUrl(null);
      setShareId(null);
    } catch {
      // ignore
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-dark-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-sm font-bold text-white">Share Analysis</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Case title preview */}
          <p className="text-xs text-gray-500 line-clamp-1">
            &ldquo;{caseTitle}&rdquo;
          </p>

          {/* === Success state === */}
          {shareUrl ? (
            <div className="space-y-4">
              {/* Link display */}
              <div className="flex items-center gap-2 rounded-xl border border-neon-purple/20 bg-neon-purple/5 p-3">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-xs text-neon-purple outline-none font-mono truncate"
                />
                <button
                  onClick={handleCopy}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    copied
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Share info */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  {accessLevel === 'password' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Password protected
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      Public
                    </>
                  )}
                </span>
                <span>&middot;</span>
                <span>
                  {expiresIn
                    ? `Expires in ${EXPIRY_OPTIONS.find(o => o.value === expiresIn)?.label}`
                    : 'No expiry'}
                </span>
              </div>

              {/* Revoke */}
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="w-full rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              >
                {revoking ? 'Revoking...' : 'Revoke Share Link'}
              </button>
            </div>
          ) : (
            /* === Create form === */
            <>
              {/* Access level */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Access Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['public', 'password'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setAccessLevel(level)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                        accessLevel === level
                          ? 'border-neon-purple/40 bg-neon-purple/10 text-neon-purple'
                          : 'border-white/[0.08] bg-white/[0.02] text-gray-400 hover:bg-white/[0.04]'
                      }`}
                    >
                      {level === 'public' ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                          Public
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          Password
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password input (conditional) */}
              {accessLevel === 'password' && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a password"
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-neon-purple/40 focus:bg-white/[0.06]"
                  />
                </div>
              )}

              {/* Expiry */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Expires
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setExpiresIn(opt.value)}
                      className={`rounded-lg px-2 py-2 text-[11px] font-medium transition-all ${
                        expiresIn === opt.value
                          ? 'border border-neon-purple/40 bg-neon-purple/10 text-neon-purple'
                          : 'border border-white/[0.08] bg-white/[0.02] text-gray-400 hover:bg-white/[0.04]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Include document toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    includeDocument ? 'bg-neon-purple' : 'bg-white/[0.12]'
                  }`}
                  onClick={() => setIncludeDocument(!includeDocument)}
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      includeDocument ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                    Include source document
                  </p>
                  <p className="text-[10px] text-gray-600">
                    Viewers can read the original text
                  </p>
                </div>
              </label>

              {/* Error */}
              {error && <p className="text-xs text-red-400">{error}</p>}

              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full rounded-xl bg-neon-purple/20 px-4 py-3 text-sm font-semibold text-neon-purple transition-all hover:bg-neon-purple/30 disabled:opacity-50 disabled:cursor-not-allowed border border-neon-purple/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neon-purple/30 border-t-neon-purple" />
                    Creating...
                  </span>
                ) : (
                  'Create Share Link'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
