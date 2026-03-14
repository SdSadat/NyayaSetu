import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { RightsCard } from '@nyayasetu/shared-types';
import { getRightsCard } from '../lib/api';
import { CardRenderer, CARD_CATEGORY_COLORS, VARIANT_LABELS, VARIANT_ICONS } from '../components/cards/CardRenderer';

// ---------------------------------------------------------------------------
// Category label map
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  'fundamental-rights': 'Fundamental Rights',
  'police-powers':      'Police Powers',
  'traffic-laws':       'Traffic Laws',
  'tenancy':            'Tenancy & Housing',
  'consumer-rights':    'Consumer Rights',
  'workplace-rights':   'Workplace Rights',
};

// ---------------------------------------------------------------------------
// Action button
// ---------------------------------------------------------------------------

function ActionButton({
  icon,
  label,
  sublabel,
  onClick,
  highlight,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 text-left group hover:-translate-y-px ${
        highlight
          ? 'border-violet-400/35 bg-violet-400/10 hover:bg-violet-400/15 hover:border-violet-400/50'
          : 'border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15'
      }`}
    >
      <span className="text-xl flex-none">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${highlight ? 'text-violet-200' : 'text-white/80'}`}>{label}</p>
        {sublabel && <p className="text-xs text-white/35 mt-0.5">{sublabel}</p>}
      </div>
      <span className="text-white/20 group-hover:text-white/50 transition-colors text-sm">→</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Share / copy helpers
// ---------------------------------------------------------------------------

async function shareCard(card: RightsCard) {
  const text = `${card.title} — ${card.subtitle}\n\nKnow Your Rights: ${window.location.href}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: card.title, text, url: window.location.href });
      return;
    } catch {
      // fall through to clipboard
    }
  }
  await navigator.clipboard.writeText(window.location.href);
}

// ---------------------------------------------------------------------------
// Print styles — injected once into <head>
// ---------------------------------------------------------------------------

const PRINT_STYLE_ID = 'nyaya-print-style';

function ensurePrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = PRINT_STYLE_ID;
  el.textContent = `
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      [data-print-hide] { display: none !important; }
      #card-print-area { border-radius: 0 !important; }
      #card-print-area .pointer-events-none { display: none !important; }
      @page { margin: 0.5cm; size: A4 portrait; }
    }
  `;
  document.head.appendChild(el);
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CardView() {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<RightsCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    getRightsCard(id)
      .then(setCard)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Loading card…</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-3">😕</p>
          <p className="text-white/60 text-sm mb-4">{error ?? 'Card not found.'}</p>
          <Link to="/cards" className="text-violet-400 text-sm hover:underline">← Back to Cards</Link>
        </div>
      </div>
    );
  }

  const colors = CARD_CATEGORY_COLORS[card.category] ?? { accent: '#94a3b8', bg: '#475569', glow: 'rgba(71,85,105,0.35)' };

  const handleShare = async () => {
    await shareCard(card);
    setShared(true);
    setTimeout(() => setShared(false), 2500);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    ensurePrintStyles();

    // Mark all sibling elements for hiding during print
    const cardEl = document.getElementById('card-print-area');
    if (!cardEl) return;

    const marked: Element[] = [];
    // Walk up from card to body, hiding siblings at each level
    let node = cardEl as HTMLElement | null;
    while (node && node !== document.body) {
      const parent: HTMLElement | null = node.parentElement;
      if (parent) {
        for (const sibling of Array.from(parent.children) as Element[]) {
          if (sibling !== node && !sibling.hasAttribute('data-print-hide')) {
            sibling.setAttribute('data-print-hide', '');
            marked.push(sibling);
          }
        }
      }
      node = parent;
    }

    window.print();

    // Clean up after print
    for (const el of marked) {
      el.removeAttribute('data-print-hide');
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Back breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-4">
        <Link
          to="/cards"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          ← Know Your Rights Cards
        </Link>
      </div>

      {/* Content grid */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Card preview (60%) */}
          <div className="lg:col-span-3">
            {/* Glow background */}
            <div className="relative">
              <div
                className="absolute -inset-4 rounded-3xl pointer-events-none"
                style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${colors.glow}, transparent 70%)` }}
              />

              {/* Card shell */}
              <div
                id="card-print-area"
                ref={cardRef}
                className="relative rounded-2xl overflow-hidden border border-white/10"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                {/* Top accent line */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}44)` }} />

                {/* Card header */}
                <div className="px-6 pt-5 pb-4 border-b border-white/6">
                  {/* Variant + category row */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                      style={{ background: colors.accent + '18', color: colors.accent }}
                    >
                      {VARIANT_ICONS[card.variant]} {VARIANT_LABELS[card.variant]}
                    </span>
                    <span
                      className="text-[10px] text-white/35 px-2.5 py-1 rounded-full border border-white/8"
                    >
                      {CATEGORY_LABELS[card.category] ?? card.category}
                    </span>
                  </div>

                  <h1 className="text-xl font-bold text-white leading-snug">{card.title}</h1>
                  <p className="text-sm text-white/55 mt-1.5 leading-relaxed">{card.subtitle}</p>

                  {/* Legal ref */}
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono text-white/30 bg-white/4 px-2.5 py-1 rounded-full border border-white/6">
                    <span>📜</span>
                    <span className="line-clamp-1">{card.legalRef}</span>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-6 py-5">
                  <CardRenderer card={card} />
                </div>

                {/* Card footer */}
                <div className="px-6 py-3 border-t border-white/6 flex items-center justify-between">
                  <p className="text-[10px] text-white/20">
                    Reviewed {new Date(card.reviewedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </p>
                  <div className="flex gap-1.5">
                    {card.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded text-white/25"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* NyayaSetu watermark */}
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/15">NyayaSetu · For information only. Not legal advice.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions panel (40%) */}
          <div className="lg:col-span-2 flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
            {/* Actions card */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Actions</p>
              <div className="flex flex-col gap-2">
                <ActionButton
                  icon={shared ? '✓' : '📤'}
                  label={shared ? 'Shared!' : 'Share Card'}
                  sublabel="Via app or copy link"
                  onClick={handleShare}
                  highlight
                />
                <ActionButton
                  icon={copied ? '✓' : '🔗'}
                  label={copied ? 'Copied!' : 'Copy Link'}
                  sublabel={window.location.href.slice(0, 35) + '…'}
                  onClick={handleCopyLink}
                />
                <ActionButton
                  icon="🖨️"
                  label="Print / Save as PDF"
                  sublabel="Opens print dialog"
                  onClick={handlePrint}
                />
              </div>
            </div>

            {/* Lesson link */}
            {card.lessonId && (
              <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">
                  Related Lesson
                </p>
                <Link
                  to={`/learn/${card.lessonId}`}
                  className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-none"
                    style={{ background: colors.accent + '18' }}
                  >
                    📖
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 font-medium">Dive deeper in Jagrut</p>
                    <p className="text-xs text-white/35 mt-0.5 truncate">{card.lessonId}</p>
                  </div>
                  <span className="text-white/25 group-hover:text-white/50 transition-colors">→</span>
                </Link>
              </div>
            )}

            {/* Disclaimer */}
            <div className="rounded-xl border border-white/6 bg-white/2 px-4 py-3.5">
              <p className="text-[10px] text-white/25 leading-relaxed">
                <span className="font-semibold text-white/35">Information only.</span> These cards explain the law in plain language but do not constitute legal advice. Laws may vary by state and change over time. For your specific situation, consult a qualified lawyer or your District Legal Services Authority (DLSA).
              </p>
            </div>

            {/* More cards */}
            <Link
              to="/cards"
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/8 text-sm text-white/40 hover:text-white/70 hover:bg-white/4 transition-all"
            >
              ← Browse all cards
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
