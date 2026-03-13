import { useRef, useState, useEffect } from 'react';

export type SahayakMode = 'chat' | 'verify';

interface Props {
  mode: SahayakMode;
  onChange: (mode: SahayakMode) => void;
}

export function ModeToggle({ mode, onChange }: Props) {
  const chatRef = useRef<HTMLButtonElement>(null);
  const verifyRef = useRef<HTMLButtonElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeRef = mode === 'chat' ? chatRef : verifyRef;
    if (activeRef.current) {
      const el = activeRef.current;
      setPill({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [mode]);

  return (
    <div className="relative flex rounded-xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-sm">
      {/* Sliding pill background */}
      <div
        className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out"
        style={{
          left: pill.left,
          width: pill.width,
          background: mode === 'chat'
            ? 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.25))'
            : 'linear-gradient(135deg, rgba(245,158,11,0.35), rgba(234,88,12,0.25))',
          opacity: pill.width ? 1 : 0,
        }}
      />

      <button
        ref={chatRef}
        onClick={() => onChange('chat')}
        className={`relative z-10 flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors duration-200 ${
          mode === 'chat' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
        }`}
      >
        <span>💬</span>
        <span>Chat</span>
      </button>

      <button
        ref={verifyRef}
        onClick={() => onChange('verify')}
        className={`relative z-10 flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors duration-200 ${
          mode === 'verify' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
        }`}
      >
        <span>🔍</span>
        <span>Verify Doc</span>
      </button>
    </div>
  );
}
