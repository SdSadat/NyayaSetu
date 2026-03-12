import type { RightsCardQuickRef } from '@nyayasetu/shared-types';

interface Props {
  card: RightsCardQuickRef;
  accentColor: string;
}

export function CardQuickRef({ card, accentColor }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Rows */}
      <div className="flex flex-col gap-2">
        {card.rows.map((row, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden border border-white/8"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            {/* Situation */}
            <div className="px-4 py-2 border-b border-white/6" style={{ background: accentColor + '0a' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">
                If...
              </p>
              <p className="text-xs font-medium text-white/70">{row.situation}</p>
            </div>

            {/* Right */}
            <div className="px-4 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accentColor + 'aa' }}>
                Your Right
              </p>
              <p className="text-sm text-white/90 leading-relaxed">{row.yourRight}</p>
              <p className="text-[10px] font-mono text-white/30 mt-1.5">{row.legalSource}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom note */}
      <div className="flex gap-2 items-start rounded-xl px-3.5 py-3 bg-white/4 border border-white/8">
        <span className="flex-none text-sm">📌</span>
        <p className="text-xs text-white/55 leading-relaxed">{card.bottomNote}</p>
      </div>
    </div>
  );
}
