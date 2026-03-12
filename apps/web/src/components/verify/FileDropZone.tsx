import { useState, useRef, useCallback } from 'react';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
];

const ACCEPT_STRING = '.pdf,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp';
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface Props {
  onSubmit: (file: File) => void;
  disabled?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name: string): string {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'pdf') return '📄';
  if (ext === 'docx') return '📝';
  if (ext === 'txt') return '📃';
  return '🖼️';
}

export function FileDropZone({ onSubmit, disabled }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback((f: File) => {
    setError('');
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Unsupported file type. Please upload PDF, DOCX, TXT, PNG, or JPG.');
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError(`File too large (${formatSize(f.size)}). Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) validateAndSet(f);
    },
    [validateAndSet],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) validateAndSet(f);
    },
    [validateAndSet],
  );

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
          dragOver
            ? 'border-amber-400/60 bg-amber-400/[0.06]'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
        } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={handleChange}
          className="hidden"
        />

        {!file ? (
          <>
            <div className="text-3xl mb-3">📎</div>
            <p className="text-sm text-slate-300 font-medium mb-1">
              Drop a document here or click to browse
            </p>
            <p className="text-xs text-slate-500">
              PDF, DOCX, TXT, PNG, JPG — up to {MAX_SIZE_MB} MB
            </p>
          </>
        ) : (
          <div className="flex items-center gap-3 justify-center">
            <span className="text-2xl">{getFileIcon(file.name)}</span>
            <div className="text-left">
              <p className="text-sm text-slate-200 font-medium truncate max-w-[200px]">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setError(''); }}
              className="ml-2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
      )}

      {/* Analyze button */}
      {file && !error && (
        <button
          onClick={() => onSubmit(file)}
          disabled={disabled}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-500/80 to-orange-500/80 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔍 Analyze Document
        </button>
      )}
    </div>
  );
}
