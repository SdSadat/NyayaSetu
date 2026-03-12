import type { DrishtiSectionMention } from '@nyayasetu/shared-types';

interface Props {
  sections: DrishtiSectionMention[];
}

const ROLE_COLORS: Record<string, string> = {
  holding:    '#4ade80',
  ratio:      '#22d3ee',
  obiter:     '#a78bfa',
  background: '#fb923c',
};

const BAR_PADDING = { top: 16, bottom: 16, left: 190, right: 72 };
const ROW_H = 44;
const BAR_H = 20;

export default function DrishtiSectionHeatmap({ sections }: Props) {
  if (sections.length === 0) {
    return (
      <div className="glass-card py-10 text-center text-sm text-gray-500">
        No statute sections extracted.
      </div>
    );
  }

  const sorted = [...sections].sort((a, b) => b.centralityScore - a.centralityScore);
  const maxMentions = Math.max(...sorted.map((s) => s.mentionCount), 1);
  const svgH = BAR_PADDING.top + sorted.length * ROW_H + BAR_PADDING.bottom;
  const svgW = 640;
  const barMaxW = svgW - BAR_PADDING.left - BAR_PADDING.right;

  return (
    <div className="glass-card">
      {/* Header + legend */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Section Centrality Heatmap
        </h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(ROLE_COLORS).map(([role, color]) => (
            <span key={role} className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color,
                boxShadow: `0 0 4px ${color}80` }} />
              <span className="capitalize">{role}</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes growBar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .heatmap-bar {
          transform-origin: left center;
          animation: growBar 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>

      <div className="overflow-x-auto">
        <svg

          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%"
          style={{ minWidth: 420, height: svgH }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {Object.entries(ROLE_COLORS).map(([role, color]) => (
              <linearGradient key={role} id={`barGrad-${role}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.4" />
              </linearGradient>
            ))}
          </defs>

          {sorted.map((s, i) => {
            const y = BAR_PADDING.top + i * ROW_H;
            const barY = y + (ROW_H - BAR_H) / 2;
            const color = ROLE_COLORS[s.role] ?? '#9ca3af';
            const centralityW = Math.max(2, s.centralityScore * barMaxW);
            const mentionW = Math.max(2, (s.mentionCount / maxMentions) * barMaxW);
            const delay = `${i * 0.06}s`;

            return (
              <g key={i}>
                {/* Subtle row separator */}
                {i > 0 && (
                  <line
                    x1={BAR_PADDING.left} y1={y}
                    x2={svgW - BAR_PADDING.right} y2={y}
                    stroke="rgba(255,255,255,0.03)" strokeWidth={1}
                  />
                )}

                {/* Section label */}
                <text
                  x={BAR_PADDING.left - 10}
                  y={barY + BAR_H / 2 + 1}
                  textAnchor="end"
                  fill="#9ca3af"
                  fontSize={11}
                  fontFamily="ui-monospace, monospace"
                  dominantBaseline="middle"
                >
                  {s.act.length > 18 ? s.act.slice(0, 16) + '…' : s.act}
                </text>
                <text
                  x={BAR_PADDING.left - 10}
                  y={barY + BAR_H / 2 + 1}
                  textAnchor="end"
                  fill={color}
                  fontSize={11}
                  fontFamily="ui-monospace, monospace"
                  dominantBaseline="middle"
                  dx={0}
                  dy={13}
                >
                  § {s.section}
                </text>

                {/* Background track */}
                <rect
                  x={BAR_PADDING.left}
                  y={barY}
                  width={barMaxW}
                  height={BAR_H}
                  fill="rgba(255,255,255,0.03)"
                  rx={4}
                />

                {/* Centrality bar (animated) */}
                <rect
                  className="heatmap-bar"
                  x={BAR_PADDING.left}
                  y={barY}
                  width={centralityW}
                  height={BAR_H}
                  fill={`url(#barGrad-${s.role})`}
                  rx={4}
                  style={{ animationDelay: delay }}
                />

                {/* Mention count underline (thin) */}
                <rect
                  x={BAR_PADDING.left}
                  y={barY + BAR_H + 2}
                  width={mentionW}
                  height={3}
                  fill={color}
                  fillOpacity={0.35}
                  rx={2}
                />

                {/* Role badge */}
                <rect
                  x={BAR_PADDING.left + centralityW + 6}
                  y={barY + 2}
                  width={36}
                  height={BAR_H - 4}
                  fill={`${color}20`}
                  rx={3}
                />
                <text
                  x={BAR_PADDING.left + centralityW + 24}
                  y={barY + BAR_H / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={color}
                  fontSize={9}
                  fontWeight="600"
                  letterSpacing="0.5"
                >
                  {s.role.toUpperCase().slice(0, 4)}
                </text>

                {/* Centrality % label (right) */}
                <text
                  x={svgW - BAR_PADDING.right + 8}
                  y={barY + BAR_H / 2 + 1}
                  dominantBaseline="middle"
                  fill={color}
                  fontSize={11}
                  fontWeight="600"
                  fontFamily="ui-monospace, monospace"
                >
                  {Math.round(s.centralityScore * 100)}%
                </text>

                {/* Mention count */}
                <text
                  x={svgW - BAR_PADDING.right + 8}
                  y={barY + BAR_H / 2 + 14}
                  dominantBaseline="middle"
                  fill="#6b7280"
                  fontSize={9}
                  fontFamily="ui-monospace, monospace"
                >
                  {s.mentionCount}×
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex gap-4 border-t border-white/[0.05] pt-3 text-[11px] text-gray-600">
        <span>Bar width = centrality score</span>
        <span>·</span>
        <span>Underline = mention frequency</span>
        <span>·</span>
        <span>{sorted.length} sections analysed</span>
      </div>
    </div>
  );
}
