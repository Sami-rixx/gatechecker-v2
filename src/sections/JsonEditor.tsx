import { useState, useCallback } from 'react';
import { Upload, RotateCcw } from 'lucide-react';

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

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      setLineCount(e.target.value.split('\n').length);
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
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 3 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span
          className="font-heading text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--text-secondary)' }}
        >
          Canonical Payload
        </span>
        <div className="flex items-center gap-3">
          {parseError && (
            <span className="font-mono text-xs" style={{ color: 'var(--accent-red)' }}>
              JSON Error
            </span>
          )}
          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            {lineCount} lines
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden relative" style={{ minHeight: 0 }}>
        {/* Line numbers */}
        <div
          className="flex-shrink-0 py-4 pr-2 pl-4 text-right select-none overflow-hidden"
          style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
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
          className="flex-1 w-full py-4 px-3 font-mono text-sm leading-6 resize-none outline-none border-none"
          style={{
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            tabSize: 2,
          }}
        />
      </div>

      {/* Parse error */}
      {parseError && (
        <div
          className="px-4 py-2 font-mono text-xs"
          style={{ background: 'rgba(196, 90, 74, 0.1)', color: 'var(--accent-red)', borderTop: '1px solid var(--border-subtle)' }}
        >
          {parseError}
        </div>
      )}

      {/* Action bar */}
      <div className="p-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={onRun}
          disabled={isRunning}
          className="w-full h-11 font-heading text-sm font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--accent-teal)',
            color: '#0c0e13',
            borderRadius: 3,
          }}
          onMouseEnter={(e) => {
            if (!isRunning) e.currentTarget.style.background = '#5ab5a5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent-teal)';
          }}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="spin-slow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5A6.5 6.5 0 001.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M8 14.5A6.5 6.5 0 0014.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
              </svg>
              Validating...
            </span>
          ) : (
            'Run Gatecheck'
          )}
        </button>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onLoadSample}
            className="flex items-center gap-1.5 font-mono text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Upload size={12} />
            Load Sample Data
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 font-mono text-xs transition-colors"
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
