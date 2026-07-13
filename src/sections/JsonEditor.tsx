import { useState, useCallback } from 'react';
import { Upload, RotateCcw, AlertCircle, Check, Play } from 'lucide-react';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  isRunning: boolean;
  onLoadSample: () => void;
  onReset: () => void;
  parseError: string | null;
}

export default function JsonEditor({
  value,
  onChange,
  onRun,
  isRunning,
  onLoadSample,
  onReset,
  parseError,
}: JsonEditorProps) {
  const [lineCount, setLineCount] = useState(1);
  const [isValidJson, setIsValidJson] = useState(true);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      onChange(text);
      setLineCount(text.split('\n').length);
      try {
        if (text.trim()) {
          JSON.parse(text);
          setIsValidJson(true);
        }
      } catch {
        setIsValidJson(false);
      }
    },
    [onChange]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = target.value.substring(0, start) + '  ' + target.value.substring(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  }, [onChange]);

  const lines = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  return (
    <div className="panel flex flex-col h-full" style={{ minHeight: 320 }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 sm:px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="label-caps truncate">Payload Input</span>
          {parseError ? (
            <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--accent-fail)' }}>
              <AlertCircle size={12} className="inline mr-1" />
              Error
            </span>
          ) : value.trim() && isValidJson ? (
            <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--accent-pass)' }}>
              <Check size={12} className="inline mr-1" />
              Valid
            </span>
          ) : null}
        </div>
        <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          {lineCount} lines
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden relative" style={{ minHeight: 0 }}>
        {/* Line numbers */}
        <div
          className="hidden sm:flex flex-shrink-0 py-4 pr-2 pl-3 text-right select-none overflow-hidden"
          style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', minWidth: 48 }}
        >
          {lines.map((n) => (
            <div key={n} className="font-mono text-xs leading-6">
              {n}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 w-full py-4 px-3 sm:px-4 font-mono text-xs sm:text-sm leading-6 resize-none outline-none border-none touch-target"
          style={{
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            tabSize: 2,
          }}
          placeholder="Paste your school's canonical payload here to begin validation..."
        />
      </div>

      {/* Parse error banner */}
      {parseError && (
        <div
          className="px-3 sm:px-4 py-2.5 font-mono text-xs"
          style={{
            background: 'rgba(184, 107, 107, 0.1)',
            color: 'var(--accent-fail)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {parseError}
        </div>
      )}

      {/* Action bar */}
      <div className="px-3 sm:px-4 py-3 flex flex-col sm:flex-row gap-2 sm:gap-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex-1 h-11 sm:h-10 font-display text-sm font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-target flex items-center justify-center gap-2"
          style={{
            background: 'var(--brass)',
            color: 'var(--ink)',
            borderRadius: 'var(--radius-sm)',
          }}
          onMouseEnter={(e) => {
            if (!isRunning) e.currentTarget.style.background = 'var(--brass-bright)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--brass)';
          }}
        >
          {isRunning ? (
            <>
              <svg className="spin-slow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5A6.5 6.5 0 001.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M8 14.5A6.5 6.5 0 0014.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
              </svg>
              Validating...
            </>
          ) : (
            <>
              <Play size={15} />
              Run Gatecheck
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-4 sm:gap-3">
          <button
            onClick={onLoadSample}
            className="flex items-center gap-1.5 font-mono text-xs transition-colors touch-target py-2"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Upload size={12} />
            Load Sample
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 font-mono text-xs transition-colors touch-target py-2"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
