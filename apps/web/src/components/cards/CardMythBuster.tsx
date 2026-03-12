import type { RightsCardMythBuster } from '@nyayasetu/shared-types';

interface Props {
  card: RightsCardMythBuster;
  accentColor: string;
}

export function CardMythBuster({ card, accentColor }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {card.myths.map((item, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden border border-white/8"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          {/* Myth */}
          <div className="flex gap-3 items-start px-4 py-3 bg-red-500/8 border-b border-white/6">
            <span className="flex-none text-sm mt-0.5">❌</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/80 mb-1">
                Myth
              </p>
              <p className="text-sm text-white/70 leading-relaxed italic">"{item.myth}"</p>
            </div>
          </div>

          {/* Reality */}
          <div className="flex gap-3 items-start px-4 py-3">
            <span className="flex-none text-sm mt-0.5">✅</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accentColor + 'cc' }}>
                Reality
              </p>
              <p className="text-sm text-white/90 leading-relaxed">{item.reality}</p>
              <p className="text-[11px] text-white/35 mt-1.5 font-mono">{item.legalBasis}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
