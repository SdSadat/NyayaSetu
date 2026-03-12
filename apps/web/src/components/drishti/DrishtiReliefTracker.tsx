import type { DrishtiReliefItem } from '@nyayasetu/shared-types';

interface Props {
  items: DrishtiReliefItem[];
}

const COMPLIANCE_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  mandatory:     { bg: 'bg-red-500/8',    text: 'text-red-400',    border: 'border-red-500/20',    icon: '!' },
  discretionary: { bg: 'bg-yellow-500/8', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: '◎' },
  procedural:    { bg: 'bg-blue-500/8',   text: 'text-blue-400',   border: 'border-blue-500/20',   icon: '→' },
};

export default function DrishtiReliefTracker({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="glass-card text-center py-10 text-gray-500 text-sm">
        No relief directions extracted.
      </div>
    );
  }

  return (
    <div className="glass-card">
      <h3 className="mb-5 text-sm font-semibold text-gray-300 uppercase tracking-wider">
        Relief Directions &amp; Compliance
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => {
          const style = COMPLIANCE_STYLES[item.complianceType] ?? COMPLIANCE_STYLES.procedural;
          return (
            <div
              key={i}
              className={`rounded-xl border p-4 ${style.bg} ${style.border}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${style.text} ${style.border}`}
                >
                  {style.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 leading-snug">{item.direction}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {item.authority && (
                      <span>
                        <span className="text-gray-600">Authority: </span>
                        <span className="text-gray-400">{item.authority}</span>
                      </span>
                    )}
                    {item.deadline && (
                      <span>
                        <span className="text-gray-600">Deadline: </span>
                        <span className="text-yellow-400">{item.deadline}</span>
                      </span>
                    )}
                  </div>
                  <span
                    className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${style.text} ${style.border}`}
                    style={{ backgroundColor: 'transparent' }}
                  >
                    {item.complianceType}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
