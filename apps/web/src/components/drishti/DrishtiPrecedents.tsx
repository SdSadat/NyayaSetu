import { useState } from 'react';
import type { DrishtiPrecedentCase } from '@nyayasetu/shared-types';

interface Props {
  precedents: DrishtiPrecedentCase[];
  caseName?: string;
}

const RELATION_META: Record<string, { color: string; glow: string; label: string; desc: string }> = {
  'relied-on':     { color: '#4ade80', glow: 'rgba(74,222,128,0.5)',   label: 'Relied On',     desc: 'Court based its decision on this case' },
  'followed':      { color: '#22d3ee', glow: 'rgba(34,211,238,0.5)',   label: 'Followed',      desc: 'Court adopted the reasoning' },
  'distinguished': { color: '#facc15', glow: 'rgba(250,204,21,0.5)',   label: 'Distinguished',  desc: 'Court set it apart on facts' },
  'referred':      { color: '#60a5fa', glow: 'rgba(96,165,250,0.5)',   label: 'Referred',      desc: 'Mentioned for context' },
  'overruled':     { color: '#f87171', glow: 'rgba(248,113,113,0.5)',  label: 'Overruled',     desc: 'Court expressly overruled this case' },
};

const SVG_W = 560;
const SVG_H = 380;
const CX = 280;
const CY = 190;
const INNER_R = 110;
const OUTER_R = 170;

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export default function DrishtiPrecedents({ precedents }: Props) {
  const [selected, setSelected] = useState<DrishtiPrecedentCase | null>(null);

  if (precedents.length === 0) {
    return (
      <div className="glass-card py-10 text-center text-sm text-gray-500">
        No precedents cited in this document.
      </div>
    );
  }

  const n = precedents.length;
  const useDouble = n > 7;
  const innerCount = useDouble ? Math.ceil(n / 2) : n;
  const inner = precedents.slice(0, innerCount);
  const outer = useDouble ? precedents.slice(innerCount) : [];

  function nodePos(idx: number, total: number, r: number) {
    const angle = (2 * Math.PI * idx) / total - Math.PI / 2;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  }

  const allNodes = [
    ...inner.map((p, i) => ({ p, ...nodePos(i, inner.length, INNER_R) })),
    ...outer.map((p, i) => ({ p, ...nodePos(i, outer.length, OUTER_R) })),
  ];

  const selectedMeta = selected
    ? (RELATION_META[selected.relation] ?? RELATION_META['referred'])
    : null;

  return (
    <div className="glass-card overflow-hidden p-0">
      <style>{`
        @keyframes edgeDash {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -20; }
        }
        .prec-edge { animation: edgeDash 2s linear infinite; }
      `}</style>

      {/* ── Two-column layout ── */}
      <div className="flex flex-col lg:flex-row">

        {/* ══ LEFT: Graph ══ */}
        <div className="flex flex-col gap-3 p-5 lg:w-[54%]">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Precedent Network
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-600">
                Click a node to inspect
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-600">{n} cases cited</span>
              {selected && (
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-gray-400 transition hover:text-gray-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* SVG — auto-height via viewBox */}
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            width="100%"
            style={{ display: 'block' }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="prec-centerGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#a855f7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.05" />
              </radialGradient>
              <filter id="prec-nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Orbit rings */}
            <circle cx={CX} cy={CY} r={INNER_R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            {useDouble && (
              <circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
            )}

            {/* Edges */}
            {allNodes.map(({ p, x, y }, i) => {
              const meta = RELATION_META[p.relation] ?? RELATION_META['referred'];
              const isSel = selected === p;
              return (
                <line
                  key={`edge-${i}`}
                  x1={CX} y1={CY} x2={x} y2={y}
                  stroke={meta.color}
                  strokeWidth={isSel ? 1.5 : 0.8}
                  strokeOpacity={isSel ? 0.75 : 0.22}
                  strokeDasharray="4 3"
                  className={isSel ? '' : 'prec-edge'}
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              );
            })}

            {/* Center node */}
            <circle cx={CX} cy={CY} r={34} fill="url(#prec-centerGrad)" />
            <circle cx={CX} cy={CY} r={26} fill="rgba(168,85,247,0.15)"
              stroke="rgba(168,85,247,0.5)" strokeWidth={1.5} />
            <text x={CX} y={CY - 5} textAnchor="middle" dominantBaseline="middle"
              fill="#c084fc" fontSize={8} fontWeight="700" letterSpacing="0.5">THIS</text>
            <text x={CX} y={CY + 7} textAnchor="middle" dominantBaseline="middle"
              fill="#c084fc" fontSize={8} fontWeight="700" letterSpacing="0.5">CASE</text>

            {/* Precedent nodes */}
            {allNodes.map(({ p, x, y }, i) => {
              const meta = RELATION_META[p.relation] ?? RELATION_META['referred'];
              const isSel = selected === p;
              const nr = isSel ? 20 : 16;
              const name = truncate(p.name.split(' v.')[0] ?? p.name, 14);
              return (
                <g
                  key={`node-${i}`}
                  className="cursor-pointer"
                  onClick={() => setSelected(selected === p ? null : p)}
                  filter="url(#prec-nodeGlow)"
                >
                  <circle cx={x} cy={y} r={nr + 6} fill={meta.color} fillOpacity={isSel ? 0.15 : 0.06} />
                  <circle cx={x} cy={y} r={nr}
                    fill={isSel ? `${meta.color}30` : 'rgba(10,10,20,0.8)'}
                    stroke={meta.color} strokeWidth={isSel ? 2 : 1.2}
                    style={{ transition: 'all 0.2s' }}
                  />
                  {p.year && (
                    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                      fill={meta.color} fontSize={9} fontWeight="600"
                      fontFamily="ui-monospace, monospace">
                      {String(p.year).slice(2)}
                    </text>
                  )}
                  <text x={x} y={y + nr + 11} textAnchor="middle"
                    fill={isSel ? meta.color : '#9ca3af'} fontSize={9.5}
                    fontWeight={isSel ? '600' : '400'}
                    style={{ transition: 'fill 0.2s' }}>
                    {name}
                  </text>
                  <circle cx={x + nr - 4} cy={y - nr + 4} r={4}
                    fill={meta.color} stroke="rgba(3,7,18,0.8)" strokeWidth={1.5}
                    style={{ filter: `drop-shadow(0 0 3px ${meta.glow})` }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 border-t border-white/[0.05] pt-3">
            {Object.entries(RELATION_META).map(([rel, m]) => (
              <span key={rel} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: m.color, boxShadow: `0 0 4px ${m.glow}` }} />
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Vertical divider */}
        <div className="hidden w-px bg-white/[0.05] lg:block" />
        {/* Horizontal divider (mobile) */}
        <div className="h-px bg-white/[0.05] lg:hidden" />

        {/* ══ RIGHT: Selected detail + list ══ */}
        <div className="flex flex-1 flex-col p-5">

          {/* Selected detail — slides in when a node is chosen */}
          {selected && selectedMeta && (
            <div
              className="mb-4 rounded-xl border p-4"
              style={{
                borderColor: `${selectedMeta.color}30`,
                backgroundColor: `${selectedMeta.color}08`,
              }}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-gray-100">{selected.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-gray-500">{selected.citation}</p>
                </div>
                <span
                  className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize"
                  style={{
                    color: selectedMeta.color,
                    borderColor: `${selectedMeta.color}40`,
                    backgroundColor: `${selectedMeta.color}15`,
                  }}
                >
                  {selectedMeta.label}
                </span>
              </div>
              {selected.relevanceNote && (
                <p className="text-xs leading-relaxed text-gray-400">{selected.relevanceNote}</p>
              )}
              <p className="mt-1.5 text-[11px] italic text-gray-600">{selectedMeta.desc}</p>
            </div>
          )}

          {/* List header */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              All Citations
            </h3>
            <span className="text-[10px] text-gray-700">{n} cases</span>
          </div>

          {/* Scrollable list */}
          <div className="flex flex-col gap-1.5 overflow-y-auto no-scrollbar" style={{ maxHeight: 340 }}>
            {precedents.map((p, i) => {
              const meta = RELATION_META[p.relation] ?? RELATION_META['referred'];
              const isSel = selected === p;
              return (
                <div
                  key={i}
                  onClick={() => setSelected(isSel ? null : p)}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-all duration-150"
                  style={{
                    borderColor: isSel ? `${meta.color}35` : 'rgba(255,255,255,0.05)',
                    backgroundColor: isSel ? `${meta.color}08` : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: meta.color, boxShadow: isSel ? `0 0 6px ${meta.glow}` : undefined }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-1">
                      <p className={`text-sm font-medium leading-snug ${isSel ? 'text-white' : 'text-gray-300'}`}>
                        {p.name}
                      </p>
                      <span className="shrink-0 text-[11px] font-semibold" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-gray-600">
                      {p.citation}{p.year ? ` · ${p.year}` : ''}
                    </p>
                    {isSel && p.relevanceNote && (
                      <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{p.relevanceNote}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
