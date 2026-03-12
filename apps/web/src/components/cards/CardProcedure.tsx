import type { RightsCardProcedure } from '@nyayasetu/shared-types';

interface Props {
  card: RightsCardProcedure;
  accentColor: string;
}

export function CardProcedure({ card, accentColor }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* Scenario */}
      <div
        className="rounded-xl px-4 py-3 text-sm text-white/80 leading-relaxed"
        style={{ background: accentColor + '12', border: `1px solid ${accentColor}22` }}
      >
        <span className="font-semibold text-white/60 text-[10px] uppercase tracking-widest block mb-1">
          Scenario
        </span>
        {card.scenario}
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-0">
        {card.steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center flex-none">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-none"
                style={{ background: accentColor + '22', color: accentColor, border: `1.5px solid ${accentColor}55` }}
              >
                {i + 1}
              </div>
              {i < card.steps.length - 1 && (
                <div className="w-px flex-1 my-1" style={{ background: accentColor + '20', minHeight: '16px' }} />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <p className="text-sm font-semibold text-white/90 leading-snug mb-1">{step.label}</p>
              <p className="text-xs text-white/60 leading-relaxed">{step.description}</p>
              {step.authority && (
                <p className="text-[11px] text-white/40 mt-1.5">
                  <span className="text-white/25">Authority: </span>{step.authority}
                </p>
              )}
              {step.documents && step.documents.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {step.documents.map((doc, j) => (
                    <span
                      key={j}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: accentColor + '15', color: accentColor + 'bb' }}
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Timeframe */}
      <div className="flex items-center gap-2 text-xs text-white/40">
        <span>⏱</span>
        <span>{card.timeframe}</span>
      </div>

      {/* Common failure points */}
      {card.commonFailurePoints.length > 0 && (
        <>
          <div className="h-px bg-white/10" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-amber-400/80">
              Common Mistakes to Avoid
            </p>
            <div className="flex flex-col gap-1.5">
              {card.commonFailurePoints.map((point, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="flex-none text-amber-400/60 text-xs mt-0.5">⚠</span>
                  <p className="text-xs text-white/60 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
