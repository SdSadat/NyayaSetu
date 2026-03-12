import type { SafetyNote as SafetyNoteType } from '@nyayasetu/shared-types';

interface Props {
  note: SafetyNoteType;
}

export default function SafetyNote({ note }: Props) {
  if (!note.text) return null;

  const isWarn = note.isDeescalation;

  return (
    <div
      className={`rounded-xl border p-4 ${
        isWarn
          ? 'border-amber-500/20 bg-amber-500/5'
          : 'border-accent-500/20 bg-accent-500/5'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            isWarn
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-accent-500/20 text-accent-400'
          }`}
        >
          {isWarn ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-widest ${
              isWarn ? 'text-amber-400' : 'text-accent-400'
            }`}
          >
            {isWarn ? 'Important Safety Note' : 'Note'}
          </p>
          <p
            className={`mt-1 text-sm leading-relaxed ${
              isWarn ? 'text-amber-200/80' : 'text-accent-200/80'
            }`}
          >
            {note.text}
          </p>
        </div>
      </div>
    </div>
  );
}
