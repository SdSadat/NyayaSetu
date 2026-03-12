import type { DrishtiTimelineEvent } from '@nyayasetu/shared-types';

interface Props {
  events: DrishtiTimelineEvent[];
}

const EVENT_META: Record<string, { color: string; abbr: string }> = {
  filing:   { color: '#60a5fa', abbr: 'FIL' },
  hearing:  { color: '#a78bfa', abbr: 'HRG' },
  order:    { color: '#fb923c', abbr: 'ORD' },
  judgment: { color: '#4ade80', abbr: 'JDG' },
  stay:     { color: '#f472b6', abbr: 'STA' },
  remand:   { color: '#facc15', abbr: 'REM' },
  appeal:   { color: '#22d3ee', abbr: 'APP' },
  other:    { color: '#9ca3af', abbr: 'EVT' },
};

export default function DrishtiTimeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="glass-card py-10 text-center text-sm text-gray-500">
        No timeline events extracted.
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Case Timeline
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-400"
              style={{ boxShadow: '0 0 6px rgba(250,204,21,0.6)' }} />
            Key event
          </span>
          <span>{events.length} events</span>
        </div>
      </div>

      <div className="relative">
        {/* Continuous vertical track */}
        <div className="absolute left-[19px] top-5 bottom-5 w-px"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 10%, rgba(255,255,255,0.08) 90%, transparent)' }} />

        <div className="space-y-0">
          {events.map((ev, i) => {
            const meta = EVENT_META[ev.eventType] ?? EVENT_META.other;
            const isLast = i === events.length - 1;
            return (
              <div key={i} className="group relative flex gap-4">
                {/* Node column */}
                <div className="relative z-10 flex flex-col items-center" style={{ width: 40 }}>
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold"
                    style={{
                      borderColor: ev.isKeyEvent ? meta.color : `${meta.color}50`,
                      backgroundColor: ev.isKeyEvent ? `${meta.color}18` : `${meta.color}0a`,
                      color: meta.color,
                      boxShadow: ev.isKeyEvent ? `0 0 14px ${meta.color}50, 0 0 4px ${meta.color}30` : undefined,
                      borderWidth: ev.isKeyEvent ? 2 : 1,
                    }}
                  >
                    {meta.abbr}
                  </div>
                  {/* connector to next */}
                  {!isLast && (
                    <div className="w-px flex-1 my-1"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', minHeight: 16 }} />
                  )}
                </div>

                {/* Content */}
                <div className={`mb-3 flex-1 rounded-xl border px-4 py-3 transition-all duration-200 ${
                  ev.isKeyEvent
                    ? 'border-white/[0.1] bg-white/[0.04] shadow-[0_0_20px_rgba(0,0,0,0.3)]'
                    : 'border-white/[0.05] bg-white/[0.02] group-hover:border-white/[0.08]'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs text-gray-400">{ev.date}</span>
                    <div className="flex items-center gap-2">
                      {ev.isKeyEvent && (
                        <span className="rounded-full bg-yellow-400/15 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
                          Key Event
                        </span>
                      )}
                      <span
                        className="rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize"
                        style={{ color: meta.color, borderColor: `${meta.color}35`,
                          backgroundColor: `${meta.color}12` }}
                      >
                        {ev.eventType}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-200">{ev.description}</p>
                  {ev.court && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M3 21h18M9 21V7l9-4v18M3 7l9-4" />
                      </svg>
                      {ev.court}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
