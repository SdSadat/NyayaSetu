import type { RightsCardCrisis } from '@nyayasetu/shared-types';

interface Props {
  card: RightsCardCrisis;
}

export function CardCrisis({ card }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* Situation banner */}
      <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/25 flex gap-3 items-center">
        <span className="text-xl">🚨</span>
        <p className="text-sm font-medium text-red-300 leading-snug">{card.situation}</p>
      </div>

      {/* Do now */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 text-emerald-400">
          Do This Now
        </p>
        <div className="flex flex-col gap-2">
          {card.doNow.map((action, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="flex-none w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-white/90 leading-relaxed">{action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Do not do */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 text-red-400">
          Do Not
        </p>
        <div className="flex flex-col gap-2">
          {card.doNotDo.map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="flex-none mt-1 text-red-400 text-sm">✕</span>
              <p className="text-sm text-white/80 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Helpline */}
      <a
        href={`tel:${card.helplineNumber}`}
        className="flex items-center justify-between rounded-xl px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">
            Helpline
          </p>
          <p className="text-sm text-white/80">{card.helplineLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-emerald-400 font-mono tracking-wide">
            {card.helplineNumber}
          </span>
          <span className="text-white/30 group-hover:text-white/60 transition-colors">→</span>
        </div>
      </a>
    </div>
  );
}
