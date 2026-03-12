import { useEffect, useState } from 'react';
import type { AuthenticityVerdict } from '@nyayasetu/shared-types';

interface Props {
  score: number;
  verdict: AuthenticityVerdict;
}

const VERDICT_CONFIG: Record<AuthenticityVerdict, { label: string; color: string; glow: string }> = {
  'likely-authentic': { label: 'Likely Authentic', color: '#34d399', glow: 'rgba(52,211,153,0.3)' },
  'suspicious': { label: 'Suspicious', color: '#fbbf24', glow: 'rgba(251,191,36,0.3)' },
  'likely-fraudulent': { label: 'Likely Fraudulent', color: '#f87171', glow: 'rgba(248,113,113,0.3)' },
};

export function AuthenticityScore({ score, verdict }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const config = VERDICT_CONFIG[verdict];

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative"
        style={{ filter: `drop-shadow(0 0 12px ${config.glow})` }}
      >
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background circle */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          {/* Score arc */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{animatedScore}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">/ 100</span>
        </div>
      </div>

      {/* Verdict label */}
      <div
        className="rounded-full px-3 py-1 text-xs font-semibold"
        style={{
          color: config.color,
          background: `${config.color}15`,
          border: `1px solid ${config.color}30`,
        }}
      >
        {config.label}
      </div>
    </div>
  );
}
