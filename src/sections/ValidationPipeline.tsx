import { type Layer, type LayerState } from '@/types/gatechecker';

const LAYERS: { key: Layer; code: string; label: string; color: string; glowClass: string }[] = [
  { key: 'Schema', code: 'S0xx', label: 'Schema', color: 'var(--accent-slate)', glowClass: 'layer-glow-schema' },
  { key: 'Integrity', code: 'I0xx', label: 'Integrity', color: 'var(--accent-teal)', glowClass: 'layer-glow-integrity' },
  { key: 'Feasibility', code: 'F0xx', label: 'Feasibility', color: 'var(--accent-amber)', glowClass: 'layer-glow-feasibility' },
];

interface ValidationPipelineProps {
  layerStates: Record<Layer, LayerState>;
}

function LayerIcon({ state, color }: { state: LayerState; color: string }) {
  if (state === 'RUNNING') {
    return (
      <svg className="spin-slow" width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
        <path d="M11 2A9 9 0 0120 11" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (state === 'PASSED') {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="var(--accent-green)" strokeWidth="1.5" opacity="0.5" />
        <path d="M7 11.5L9.5 14L15 8.5" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === 'ISSUES') {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="var(--accent-amber)" strokeWidth="1.5" opacity="0.5" />
        <path d="M11 7v5M11 15.5v.5" stroke="var(--accent-amber)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (state === 'FATAL') {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="var(--accent-red)" strokeWidth="1.5" opacity="0.5" />
        <path d="M8 8l6 6M14 8l-6 6" stroke="var(--accent-red)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  // PENDING
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="10" stroke="var(--border-subtle)" strokeWidth="1.5" />
    </svg>
  );
}

function StatusBadge({ state }: { state: LayerState }) {
  const styles: Record<LayerState, { text: string; color: string }> = {
    PENDING: { text: 'PENDING', color: 'var(--text-muted)' },
    RUNNING: { text: 'RUNNING', color: 'var(--accent-teal)' },
    PASSED: { text: 'PASSED', color: 'var(--accent-green)' },
    ISSUES: { text: 'ISSUES', color: 'var(--accent-amber)' },
    FATAL: { text: 'FATAL', color: 'var(--accent-red)' },
  };
  const s = styles[state];
  return (
    <span className="font-mono text-xs font-medium" style={{ color: s.color }}>
      {s.text}
    </span>
  );
}

export default function ValidationPipeline({ layerStates }: ValidationPipelineProps) {
  return (
    <div className="flex flex-col">
      <span
        className="font-heading text-xs font-semibold tracking-widest uppercase mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        Validation Pipeline
      </span>

      <div className="flex flex-col gap-0">
        {LAYERS.map((layer, idx) => {
          const state = layerStates[layer.key];
          const isRunning = state === 'RUNNING';

          return (
            <div key={layer.key} className="flex flex-col items-center">
              {/* Layer card */}
              <div
                className={`w-full flex items-center gap-4 px-4 transition-all duration-300 ${isRunning ? layer.glowClass : ''}`}
                style={{
                  height: 56,
                  background: 'var(--bg-surface)',
                  border: `1px solid ${isRunning ? layer.color : 'var(--border-subtle)'}`,
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Sweep bar for running state */}
                {isRunning && (
                  <div
                    className="absolute top-0 left-0 h-0.5 sweep-bar"
                    style={{ background: layer.color, width: '50%' }}
                  />
                )}

                {/* Icon */}
                <div className="flex-shrink-0">
                  <LayerIcon state={state} color={layer.color} />
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <span className="font-heading text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {layer.label}
                  </span>
                  <span className="font-mono text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                    {layer.code}
                  </span>
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  <StatusBadge state={state} />
                </div>
              </div>

              {/* Connector line */}
              {idx < LAYERS.length - 1 && (
                <div className="flex flex-col items-center py-1">
                  <div style={{ width: 2, height: 16, background: 'var(--border-subtle)' }} />
                  <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ marginTop: -1 }}>
                    <path d="M1 1L4 4L7 1" stroke="var(--border-subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
