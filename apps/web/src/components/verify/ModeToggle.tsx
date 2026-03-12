import { useState, useEffect } from 'react';

export type SahayakMode = 'chat' | 'verify';

interface Props {
  mode: SahayakMode;
  onChange: (mode: SahayakMode) => void;
}

export function ModeToggle({ mode, onChange }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="relative flex rounded-xl border border-white/10 bg-white/[0.04] p-0.5 backdrop-blur-sm">
      {/* Sliding pill background */}
      <div
        className="absolute top-0.5 bottom-0.5 rounded-lg transition-all duration-300 ease-out"
        style={{
          left: mode === 'chat' ? '2px' : '50%',
          width: 'calc(50% - 4px)',
          background: mode === 'chat'
            ? 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.25))'
            : 'linear-gradient(135deg, rgba(245,158,11,0.35), rgba(234,88,12,0.25))',
          opacity: mounted ? 1 : 0,
        }}
      />

      <button
        onClick={() => onChange('chat')}
        className={`relative z-10 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
          mode === 'chat' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
        }`}
      >
        <span>💬</span>
        <span>Chat</span>
      </button>

      <button
        onClick={() => onChange('verify')}
        className={`relative z-10 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
          mode === 'verify' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
        }`}
      >
        <span>🔍</span>
        <span>Verify Doc</span>
      </button>
    </div>
  );
}
