import { useState } from 'react';
import type { DrishtiTaggedParagraph, ParagraphType } from '@nyayasetu/shared-types';

interface Props {
  paragraphs: DrishtiTaggedParagraph[];
}

const ALL_TYPES: ParagraphType[] = ['ratio', 'obiter', 'background', 'procedural', 'conclusion'];

const TYPE_STYLES: Record<ParagraphType, { bg: string; text: string; border: string }> = {
  ratio:       { bg: 'bg-green-500/8',   text: 'text-green-400',   border: 'border-green-500/20' },
  obiter:      { bg: 'bg-purple-500/8',  text: 'text-purple-400',  border: 'border-purple-500/20' },
  background:  { bg: 'bg-gray-500/8',    text: 'text-gray-400',    border: 'border-gray-500/20' },
  procedural:  { bg: 'bg-blue-500/8',    text: 'text-blue-400',    border: 'border-blue-500/20' },
  conclusion:  { bg: 'bg-yellow-500/8',  text: 'text-yellow-400',  border: 'border-yellow-500/20' },
};

export default function DrishtiRatioObiter({ paragraphs }: Props) {
  const [filter, setFilter] = useState<ParagraphType | 'all'>('all');

  if (paragraphs.length === 0) {
    return (
      <div className="glass-card text-center py-10 text-gray-500 text-sm">
        No tagged paragraphs extracted.
      </div>
    );
  }

  const filtered = filter === 'all' ? paragraphs : paragraphs.filter((p) => p.type === filter);
  const counts = Object.fromEntries(
    ALL_TYPES.map((t) => [t, paragraphs.filter((p) => p.type === t).length])
  ) as Record<ParagraphType, number>;

  return (
    <div className="glass-card">
      <h3 className="mb-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">
        Ratio &amp; Obiter Dicta
      </h3>

      {/* Filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
            filter === 'all'
              ? 'border-neon-cyan/40 bg-neon-cyan/15 text-neon-cyan'
              : 'border-white/[0.08] text-gray-500 hover:text-gray-300'
          }`}
        >
          All ({paragraphs.length})
        </button>
        {ALL_TYPES.filter((t) => counts[t] > 0).map((t) => {
          const style = TYPE_STYLES[t];
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
                filter === t
                  ? `${style.bg} ${style.border} ${style.text}`
                  : 'border-white/[0.08] text-gray-500 hover:text-gray-300'
              }`}
            >
              {t} ({counts[t]})
            </button>
          );
        })}
      </div>

      {/* Paragraphs */}
      <div className="space-y-3">
        {filtered.map((para, i) => {
          const style = TYPE_STYLES[para.type];
          return (
            <div
              key={i}
              className={`rounded-xl border p-4 ${style.bg} ${style.border}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${style.text} ${style.border}`}
                >
                  {para.type}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{para.text}</p>
              {para.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {para.citations.map((c, j) => (
                    <span
                      key={j}
                      className={`rounded-full border px-2 py-0.5 text-[10px] ${style.text} ${style.border}`}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
