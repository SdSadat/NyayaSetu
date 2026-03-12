import type { CertaintyLevel, CertaintyScore } from '@nyayasetu/shared-types';

interface Props {
  level: CertaintyLevel;
  score: CertaintyScore;
}

const LEVEL_STYLES: Record<
  CertaintyLevel,
  { border: string; bg: string; text: string; dot: string; label: string }
> = {
  high: {
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'High certainty',
  },
  medium: {
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    label: 'Medium certainty',
  },
  low: {
    border: 'border-red-400/30',
    bg: 'bg-red-400/10',
    text: 'text-red-400',
    dot: 'bg-red-400',
    label: 'Low certainty',
  },
};

export default function CertaintyBadge({ level, score }: Props) {
  const style = LEVEL_STYLES[level];
  const percentage = Math.round(score * 100);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${style.border} ${style.bg} ${style.text}`}
      title={`Certainty score: ${percentage}%`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${style.dot} animate-glow-pulse`}
      />
      {style.label} ({percentage}%)
    </span>
  );
}
