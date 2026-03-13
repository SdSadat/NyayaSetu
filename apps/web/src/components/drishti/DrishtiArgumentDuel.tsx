import type { DrishtiArgumentDuel as TArgumentDuel } from '@nyayasetu/shared-types';

interface Props {
  duel: TArgumentDuel;
}

const ACCEPTED_BADGE: Record<string, { cls: string; label: string }> = {
  yes:     { cls: 'text-green-400 border-green-400/30 bg-green-400/10',  label: 'Accepted' },
  no:      { cls: 'text-red-400 border-red-400/30 bg-red-400/10',        label: 'Rejected' },
  partial: { cls: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10', label: 'Partial' },
};

const CIRC = 2 * Math.PI * 28; // circumference for r=28

function ScoreArc({
  args,
  color,
  label,
}: {
  args: TArgumentDuel['petitioner'];
  color: string;
  label: string;
}) {
  if (args.length === 0) return null;

  const accepted = args.filter((a) => a.accepted === 'yes').length;
  const partial  = args.filter((a) => a.accepted === 'partial').length;
  const rejected = args.filter((a) => a.accepted === 'no').length;
  const total    = args.length;

  const accRatio  = accepted / total;
  const partRatio = partial / total;

  const accDash  = accRatio * CIRC;
  const partDash = partRatio * CIRC;

  // Offsets: start at top (-CIRC/4 offset), accepted first, then partial, then gap
  const accOffset  = -(CIRC / 4);
  const partOffset = accOffset - accDash;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={80} height={80} viewBox="0 0 80 80">
        {/* Track */}
        <circle cx={40} cy={40} r={28} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} />
        {/* Rejected arc (full minus accepted+partial) */}
        <circle cx={40} cy={40} r={28} fill="none"
          stroke="rgba(248,113,113,0.3)" strokeWidth={7}
          strokeDasharray={`${(1 - accRatio - partRatio) * CIRC} ${CIRC}`}
          strokeDashoffset={partOffset - partDash}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px' }}
        />
        {/* Partial arc */}
        {partial > 0 && (
          <circle cx={40} cy={40} r={28} fill="none"
            stroke="rgba(250,204,21,0.7)" strokeWidth={7}
            strokeDasharray={`${partDash} ${CIRC}`}
            strokeDashoffset={partOffset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px' }}
          />
        )}
        {/* Accepted arc */}
        {accepted > 0 && (
          <circle cx={40} cy={40} r={28} fill="none"
            stroke={color} strokeWidth={7}
            strokeDasharray={`${accDash} ${CIRC}`}
            strokeDashoffset={accOffset}
            strokeLinecap="round"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '40px 40px',
              filter: `drop-shadow(0 0 4px ${color}80)`,
            }}
          />
        )}
        {/* Center text */}
        <text x={40} y={37} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={15} fontWeight="700">
          {accepted}/{total}
        </text>
        <text x={40} y={52} textAnchor="middle" dominantBaseline="middle"
          fill="#6b7280" fontSize={8} fontWeight="500">
          ACCEPTED
        </text>
      </svg>
      <p className="text-xs font-semibold" style={{ color }}>{label}</p>
      <div className="flex gap-2 text-[10px] text-gray-600">
        <span className="text-green-400">{accepted} won</span>
        {partial > 0 && <span className="text-yellow-400">{partial} partial</span>}
        <span className="text-red-400">{rejected} lost</span>
      </div>
    </div>
  );
}

export default function DrishtiArgumentDuel({ duel }: Props) {
  const maxLen = Math.max(duel.petitioner.length, duel.respondent.length);

  if (maxLen === 0) {
    return (
      <div className="glass-card py-10 text-center text-sm text-gray-500">
        No arguments extracted.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score summary */}
      <div className="glass-card">
        <h3 className="mb-5 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
          Argument Scorecard
        </h3>
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="flex justify-center">
            <ScoreArc args={duel.petitioner} color="#60a5fa" label={duel.petitionerName} />
          </div>

          {/* VS badge */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/10 bg-white/[0.04]">
              <span className="text-lg font-black text-gray-400">VS</span>
              <span className="absolute -inset-1 rounded-full border border-white/[0.05]" />
            </div>
            <p className="text-[10px] text-gray-600">
              {duel.petitioner.length + duel.respondent.length} arguments
            </p>
          </div>

          <div className="flex justify-center">
            <ScoreArc args={duel.respondent} color="#a78bfa" label={duel.respondentName} />
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Petitioner</p>
          <p className="mt-0.5 truncate text-sm text-gray-200">{duel.petitionerName}</p>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/8 px-4 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">Respondent</p>
          <p className="mt-0.5 truncate text-sm text-gray-200">{duel.respondentName}</p>
        </div>
      </div>

      {/* Argument pairs */}
      {Array.from({ length: maxLen }).map((_, i) => {
        const pet = duel.petitioner[i];
        const res = duel.respondent[i];
        return (
          <div key={i} className="grid grid-cols-2 gap-3">
            {pet ? (
              <ArgumentCard arg={pet} side="petitioner" color="#60a5fa" />
            ) : <div className="rounded-xl border border-white/[0.04] bg-white/[0.01]" />}
            {res ? (
              <ArgumentCard arg={res} side="respondent" color="#a78bfa" />
            ) : <div className="rounded-xl border border-white/[0.04] bg-white/[0.01]" />}
          </div>
        );
      })}
    </div>
  );
}

function ArgumentCard({
  arg,
  color,
}: {
  arg: TArgumentDuel['petitioner'][0];
  side: 'petitioner' | 'respondent';
  color: string;
}) {
  const badge = ACCEPTED_BADGE[arg.accepted] ?? ACCEPTED_BADGE.no;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
      style={{ borderLeftWidth: 2, borderLeftColor: `${color}40` }}>
      <p className="text-xs leading-relaxed text-gray-300">{arg.point}</p>
      {(arg.citedLaw ?? []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {(arg.citedLaw ?? []).map((l, j) => (
            <span key={j}
              className="rounded-full border px-1.5 py-0.5 text-[10px]"
              style={{ color, borderColor: `${color}30`, backgroundColor: `${color}10` }}>
              {l}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
    </div>
  );
}
