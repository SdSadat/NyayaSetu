import type { DrishtiAnalysis } from '@nyayasetu/shared-types';

interface Props {
  analysis: DrishtiAnalysis;
  explainMode: 'teen' | 'student' | 'practitioner';
  onModeChange: (mode: 'teen' | 'student' | 'practitioner') => void;
}

const MODES: { value: Props['explainMode']; label: string }[] = [
  { value: 'teen',         label: 'Simple'  },
  { value: 'student',      label: 'Student' },
  { value: 'practitioner', label: 'Expert'  },
];

const MODE_HELP: Record<Props['explainMode'], string> = {
  teen: 'Plain-language summary with minimal legal jargon.',
  student: 'Balanced legal explanation with doctrine context.',
  practitioner: 'Dense legal framing focused on litigation utility.',
};

const OUTCOME_MAP: Record<string, { color: string; glow: string; icon: string }> = {
  allowed:   { color: '#4ade80', glow: 'rgba(74,222,128,0.25)',   icon: '✓' },
  dismissed: { color: '#f87171', glow: 'rgba(248,113,113,0.25)',  icon: '✕' },
  remanded:  { color: '#facc15', glow: 'rgba(250,204,21,0.25)',   icon: '↩' },
  settled:   { color: '#60a5fa', glow: 'rgba(96,165,250,0.25)',   icon: '⇌' },
  other:     { color: '#a78bfa', glow: 'rgba(167,139,250,0.25)',  icon: '◆' },
};

const DOC_TYPE_COLORS: Record<string, string> = {
  judgment:  'text-neon-purple border-neon-purple/25 bg-neon-purple/8',
  order:     'text-blue-400 border-blue-400/25 bg-blue-400/8',
  notice:    'text-yellow-400 border-yellow-400/25 bg-yellow-400/8',
  agreement: 'text-green-400 border-green-400/25 bg-green-400/8',
  other:     'text-gray-400 border-gray-400/25 bg-gray-400/8',
};

export default function DrishtiOverview({ analysis, explainMode, onModeChange }: Props) {
  const outcome = OUTCOME_MAP[analysis.outcome] ?? OUTCOME_MAP.other;
  const docTypeClass = DOC_TYPE_COLORS[analysis.documentType] ?? DOC_TYPE_COLORS.other;

  const stats = [
    { label: 'Events',     value: analysis.timeline.length,          color: '#22d3ee' },
    { label: 'Issues',     value: analysis.issueTree.length,          color: '#a78bfa' },
    { label: 'Precedents', value: analysis.precedents.length,         color: '#60a5fa' },
    { label: 'Sections',   value: analysis.sectionHeatmap.length,     color: '#f59e0b' },
    { label: 'Relief',     value: analysis.reliefDirections.length,   color: '#4ade80' },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      {stats.length > 0 && (
        <div className={`grid gap-2 ${stats.length <= 3 ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-5'}`}>
          {stats.map((s) => (
            <div key={s.label}
              className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-center">
              <p className="text-2xl font-bold tabular-nums"
                style={{ color: s.color, textShadow: `0 0 20px ${s.color}60` }}>
                {s.value}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Case header card */}
      <div className="glass-card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full"
          style={{ background: `radial-gradient(circle, ${outcome.color}10 0%, transparent 70%)` }} />

        <div className="relative space-y-3">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${docTypeClass}`}>
              {analysis.documentType}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
              style={{ color: outcome.color, borderColor: `${outcome.color}40`,
                backgroundColor: `${outcome.color}12`, boxShadow: `0 0 10px ${outcome.glow}` }}>
              {outcome.icon}&nbsp;{analysis.outcome.charAt(0).toUpperCase() + analysis.outcome.slice(1)}
            </span>
          </div>

          <h2 className="text-lg font-bold leading-snug text-white">{analysis.caseTitle}</h2>
          {analysis.citation && (
            <p className="font-mono text-sm text-neon-cyan">{analysis.citation}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
            {analysis.court && (
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 21h18M9 21V7l9-4v18M3 7l9-4" />
                </svg>
                {analysis.court}
              </span>
            )}
            {analysis.bench && (
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                </svg>
                {analysis.bench}
              </span>
            )}
            {analysis.dateOfJudgment && analysis.dateOfJudgment !== 'Unknown' && (
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {analysis.dateOfJudgment}
              </span>
            )}
          </div>

          {/* Parties */}
          {(analysis.petitioner || analysis.respondent) && (
            <div className="flex flex-wrap gap-2">
              {analysis.petitioner && (
                <span className="rounded-lg border border-blue-400/20 bg-blue-400/8 px-3 py-1 text-xs">
                  <span className="font-semibold text-blue-400">Petitioner  </span>
                  <span className="text-gray-300">{analysis.petitioner}</span>
                </span>
              )}
              {analysis.respondent && (
                <span className="rounded-lg border border-purple-400/20 bg-purple-400/8 px-3 py-1 text-xs">
                  <span className="font-semibold text-purple-400">Respondent  </span>
                  <span className="text-gray-300">{analysis.respondent}</span>
                </span>
              )}
            </div>
          )}

          {/* Decision strip */}
          {analysis.decisionInOneLine && (
            <div className="rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 px-4 py-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neon-cyan/50">
                Decision
              </p>
              <p className="text-sm leading-relaxed text-neon-cyan">{analysis.decisionInOneLine}</p>
            </div>
          )}
        </div>
      </div>

      {/* Explain mode */}
      <div className="glass-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Explanation</h3>
          <div className="flex gap-0.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            {MODES.map((m) => (
              <button key={m.value} onClick={() => onModeChange(m.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  explainMode === m.value
                    ? 'bg-neon-purple/20 text-neon-purple shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-2 text-[11px] text-gray-500">{MODE_HELP[explainMode]}</p>
        <p className="text-sm leading-relaxed text-gray-300">
          {analysis.explainModes[explainMode] || 'No explanation available.'}
        </p>
      </div>

      {/* Facts */}
      {analysis.factsInBrief && (
        <div className="glass-card">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Facts in Brief
          </h3>
          <p className="text-sm leading-relaxed text-gray-300">{analysis.factsInBrief}</p>
        </div>
      )}

      {/* Caveats */}
      {analysis.caveats.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-yellow-500">Caveats</p>
          <ul className="space-y-1">
            {analysis.caveats.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-yellow-300/80">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-yellow-500/50" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
