import type { RightsCardStandard } from '@nyayasetu/shared-types';

interface Props {
  card: RightsCardStandard;
  accentColor: string;
}

export function CardStandard({ card, accentColor }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* 3 Rights */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: accentColor }}>
          Your 3 Key Rights
        </p>
        <div className="flex flex-col gap-2">
          {card.rights.map((right, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span
                className="flex-none w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                style={{ background: accentColor + '22', color: accentColor }}
              >
                {i + 1}
              </span>
              <p className="text-sm text-white/90 leading-relaxed">{right}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* 2 Duties */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 text-amber-400/80">
          Your 2 Duties
        </p>
        <div className="flex flex-col gap-2">
          {card.duties.map((duty, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="flex-none mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/60" />
              <p className="text-sm text-white/80 leading-relaxed">{duty}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Tip */}
      <div
        className="rounded-xl p-3.5 flex gap-3 items-start"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span className="text-lg flex-none">💡</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-emerald-400/80">
            Safety Tip
          </p>
          <p className="text-sm text-white/80 leading-relaxed">{card.safetyTip}</p>
        </div>
      </div>
    </div>
  );
}
