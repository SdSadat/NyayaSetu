import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { RightsCard, RightsCardCategory, RightsCardVariant } from '@nyayasetu/shared-types';
import { getRightsCards } from '../lib/api';
import { CARD_CATEGORY_COLORS, VARIANT_LABELS, VARIANT_ICONS } from '../components/cards/CardRenderer';

// ---------------------------------------------------------------------------
// Category meta
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<RightsCardCategory, { label: string; icon: string }> = {
  'fundamental-rights': { label: 'Fundamental Rights',   icon: '⚖️' },
  'police-powers':      { label: 'Police Powers',        icon: '🚔' },
  'traffic-laws':       { label: 'Traffic Laws',         icon: '🛣️' },
  'tenancy':            { label: 'Tenancy & Housing',    icon: '🏠' },
  'consumer-rights':    { label: 'Consumer Rights',      icon: '🛒' },
  'workplace-rights':   { label: 'Workplace Rights',     icon: '💼' },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as RightsCardCategory[];
const ALL_VARIANTS = Object.keys(VARIANT_LABELS) as RightsCardVariant[];

// ---------------------------------------------------------------------------
// Card tile (browse grid)
// ---------------------------------------------------------------------------

function CardTile({ card }: { card: RightsCard }) {
  const colors = CARD_CATEGORY_COLORS[card.category] ?? { accent: '#94a3b8', bg: '#475569', glow: 'rgba(71,85,105,0.35)' };
  const catMeta = CATEGORY_META[card.category];

  return (
    <Link
      to={`/cards/${card.id}`}
      className="group relative flex flex-col rounded-2xl border border-white/8 overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      {/* Glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${colors.glow}, transparent 70%)` }}
      />

      {/* Top accent */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${colors.accent}88, ${colors.accent}22)` }} />

      {/* Content */}
      <div className="relative flex flex-col gap-3 p-5">
        {/* Variant badge + category */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
            style={{ background: colors.accent + '18', color: colors.accent }}
          >
            {VARIANT_ICONS[card.variant]} {VARIANT_LABELS[card.variant]}
          </span>
          <span className="text-base" title={catMeta?.label}>{catMeta?.icon}</span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base font-semibold text-white/95 leading-snug group-hover:text-white transition-colors">
            {card.title}
          </h3>
          <p className="text-xs text-white/45 mt-1 leading-relaxed line-clamp-2">{card.subtitle}</p>
        </div>

        {/* Legal ref */}
        <p className="text-[10px] font-mono text-white/25 line-clamp-1">{card.legalRef}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-auto pt-1">
          {card.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded text-white/35"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Arrow */}
      <div className="absolute bottom-4 right-4 text-white/20 group-hover:text-white/50 transition-colors text-sm">
        →
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Sidebar item
// ---------------------------------------------------------------------------

function SidebarItem({
  label,
  icon,
  active,
  count,
  color,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  count?: number;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 text-sm ${
        active
          ? 'text-white font-medium'
          : 'text-white/50 hover:text-white/80 hover:bg-white/4'
      }`}
      style={active ? { background: (color ?? '#94a3b8') + '18', borderLeft: `3px solid ${color ?? '#94a3b8'}` } : {}}
    >
      <span className="text-base flex-none">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] text-white/30 font-mono">{count}</span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Cards() {
  const [cards, setCards] = useState<RightsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<RightsCardCategory | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<RightsCardVariant | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getRightsCards()
      .then(setCards)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = cards;
    if (selectedCategory) result = result.filter((c) => c.category === selectedCategory);
    if (selectedVariant) result = result.filter((c) => c.variant === selectedVariant);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [cards, selectedCategory, selectedVariant, search]);

  const countFor = (cat: RightsCardCategory) => cards.filter((c) => c.category === cat).length;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/6 pb-10 pt-12 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 50% -10%, rgba(167,139,250,0.18), transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-400/25 bg-violet-400/8 text-violet-300 text-xs font-medium mb-4">
            <span>📋</span> Know Your Rights
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Rights Cards
          </h1>
          <p className="text-white/50 text-base max-w-lg mx-auto leading-relaxed">
            Concise, legally accurate cards covering your rights in everyday Indian legal situations.
          </p>

          {/* Search */}
          <div className="mt-6 max-w-md mx-auto relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search cards…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-400/40 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col gap-1 w-52 flex-none lg:sticky lg:top-20 lg:self-start">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-3 mb-2">
              Category
            </p>
            <SidebarItem
              label="All"
              icon="📂"
              active={selectedCategory === null}
              count={cards.length}
              color="#94a3b8"
              onClick={() => setSelectedCategory(null)}
            />
            {ALL_CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const colors = CARD_CATEGORY_COLORS[cat];
              return (
                <SidebarItem
                  key={cat}
                  label={meta.label}
                  icon={meta.icon}
                  active={selectedCategory === cat}
                  count={countFor(cat)}
                  color={colors?.accent}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                />
              );
            })}

            <div className="h-px bg-white/8 my-3" />

            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-3 mb-2">
              Variant
            </p>
            <SidebarItem
              label="All types"
              icon="✦"
              active={selectedVariant === null}
              color="#94a3b8"
              onClick={() => setSelectedVariant(null)}
            />
            {ALL_VARIANTS.map((v) => (
              <SidebarItem
                key={v}
                label={VARIANT_LABELS[v]}
                icon={VARIANT_ICONS[v]}
                active={selectedVariant === v}
                color="#94a3b8"
                onClick={() => setSelectedVariant(selectedVariant === v ? null : v)}
              />
            ))}
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile pills */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedCategory === null
                    ? 'bg-white/15 border-white/20 text-white'
                    : 'border-white/10 text-white/50 hover:text-white/70'
                }`}
              >
                All
              </button>
              {ALL_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const colors = CARD_CATEGORY_COLORS[cat];
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(active ? null : cat)}
                    className="flex-none px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                    style={
                      active
                        ? { background: colors.accent + '25', borderColor: colors.accent + '55', color: colors.accent }
                        : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
                    }
                  >
                    {meta.icon} {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Count */}
            {!loading && !error && (
              <p className="text-sm text-white/30 mb-4">
                {filtered.length} card{filtered.length !== 1 ? 's' : ''}
                {selectedCategory ? ` in ${CATEGORY_META[selectedCategory].label}` : ''}
                {search ? ` matching "${search}"` : ''}
              </p>
            )}

            {/* States */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-44 rounded-2xl bg-white/4 animate-pulse" />
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/25 bg-red-500/8 p-6 text-center text-sm text-red-300">
                {error}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-white/50 text-sm">No cards match your filters.</p>
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((card) => (
                  <CardTile key={card.id} card={card} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
