import { type Layer, type LayerState } from '@/types/gatechecker';

const LAYERS: {
  key: Layer;
  code: string;
  label: string;
  color: string;
  glowClass: string;
  description: string;
}[] = [
  {
    key: 'Schema',
    code: 'S0xx',
    label: 'Schema',
    color: 'var(--accent-slate)',
    glowClass: 'layer-glow-schema',
    description: 'Structural value checks',
  },
  {
    key: 'Integrity',
    code: 'I0xx',
    label: 'Integrity',
    color: 'var(--accent-teal)',
    glowClass: 'layer-glow-integrity',
    description: 'Cross-list consistency',
  },
  {
    key: 'Feasibility',
    code: 'F0xx',
    label: 'Feasibility',
    color: 'var(--brass)',
    glowClass: 'layer-glow-feasibility',
    description: 'Coverage & capacity',
  },
];

interface ValidationPipelineProps {
  layerStates: Record<Layer, LayerState>;
  onLayerClick?: (layer: Layer) => void;
  activeLayer: Layer | null;
}

function LayerIcon({ state, color }: { state: LayerState; color: string }) {
  if (state === 'RUNNING') {
    return (
      <svg className="spin-slow flex-shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
        <path d="M12 2A10 10 0 0122 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (state === 'PASSED') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
        <circle cx="12" cy="12" r="10" stroke="var(--accent-pass)" strokeWidth="1.5" opacity="0.4" />
        <path d="M8 12.5L10.5 15L16 9.5" stroke="var(--accent-pass)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === 'ISSUES') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
        <circle cx="12" cy="12" r="10" stroke="var(--accent-warn)" strokeWidth="1.5" opacity="0.4" />
        <path d="M12 8v5M12 16.5v.5" stroke="var(--accent-warn)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (state === 'FATAL') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
        <circle cx="12" cy="12" r="10" stroke="var(--accent-fail)" strokeWidth="1.5" opacity="0.4" />
        <path d="M9 9l6 6M15 9l-6 6" stroke="var(--accent-fail)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  // PENDING
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      <circle cx="12" cy="12" r="10" stroke="var(--border-subtle)" strokeWidth="1.5" />
    </svg>
  );
}

function StatusBadge({ state }: { state: LayerState }) {
  const styles: Record<LayerState, { text: string; color: string }> = {
    PENDING: { text: 'PENDING', color: 'var(--text-muted)' },
    RUNNING: { text: 'RUNNING', color: 'var(--accent-teal)' },
    PASSED: { text: 'PASSED', color: 'var(--accent-pass)' },
    ISSUES: { text: 'ISSUES', color: 'var(--accent-warn)' },
    FATAL: { text: 'FATAL', color: 'var(--accent-fail)' },
  };
  const s = styles[state];
  return (
    <span
      className="font-mono text-xs font-medium px-2 py-0.5 rounded-sm"
      style={{
        color: s.color,
        background: `${s.color}15`,
      }}
    >
      {s.text}
    </span>
  );
}

export default function ValidationPipeline({
  layerStates,
  onLayerClick,
  activeLayer,
}: ValidationPipelineProps) {
  return (
    <div className="flex flex-col">
      <span className="label-caps mb-3 px-1">Validation Pipeline</span>

      {/* Desktop: full layout / Mobile: horizontal scroll */}
      <div className="flex flex-col sm:flex-row gap-0 sm:gap-2">
        {LAYERS.map((layer, idx) => {
          const state = layerStates[layer.key];
          const isRunning = state === 'RUNNING';
          const isClickable = onLayerClick && state !== 'PENDING';
          const isActive = activeLayer === layer.key;

          return (
            <div key={layer.key} className="flex flex-col sm:flex-1 items-center">
              {/* Möbius connector line (desktop only, between cards) */}
              {idx > 0 && (
                <div
                  className="hidden sm:flex items-center justify-center w-full mb-2"
                  style={{ height: 2 }}
                >
                  <svg width="100%" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                    <path
                      d="M0 4 Q25 0, 50 4 Q75 8, 100 4"
                      stroke={state !== 'PENDING' ? 'var(--brass)' : 'var(--border-subtle)'}
                      strokeWidth="1.5"
                      fill="none"
                      opacity={state !== 'PENDING' ? 0.4 : 0.2}
                    />
                  </svg>
                </div>
              )}

              {/* Layer card */}
              <button
                onClick={() => isClickable && onLayerClick?.(layer.key)}
                disabled={!isClickable}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 transition-all duration-300
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                  ${isRunning ? layer.glowClass : ''}
                  ${isActive ? 'ring-1' : ''}
                  touch-target
                `}
                style={{
                  background: isActive ? 'var(--bg-surface-raised)' : 'var(--bg-surface)',
                  border: `1px solid ${isActive ? 'var(--brass)' : isRunning ? layer.color : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  position: 'relative',
                  overflow: 'hidden',
                  outline: 'none',
                }}
              >
                {/* Sweep bar for running state */}
                {isRunning && (
                  <div
                    className="absolute top-0 left-0 h-0.5 sweep-bar"
                    style={{ background: layer.color, width: '40%' }}
                  />
                )}

                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute left-0 top-2 bottom-2 w-0.5"
                    style={{ background: 'var(--brass)', borderRadius: 1 }}
                  />
                )}

                {/* Icon */}
                <div className="flex-shrink-0">
                  <LayerIcon state={state} color={layer.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-display text-sm font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {layer.label}
                    </span>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {layer.code}
                    </span>
                  </div>
                  <span className="text-xs hidden md:inline" style={{ color: 'var(--text-secondary)' }}>
                    {layer.description}
                  </span>
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  <StatusBadge state={state} />
                </div>
              </button>

              {/* Vertical connector for mobile */}
              {idx < LAYERS.length - 1 && (
                <div className="flex sm:hidden flex-col items-center py-1">
                  <div style={{ width: 2, height: 12, background: 'var(--border-subtle)' }} />
                  <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ marginTop: -1 }}>
                    <path d="M1 1L4 4L7 1" stroke="var(--border-subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Click hint */}
      <div className="flex items-center gap-1.5 mt-2 px-1">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          Click a completed layer to filter findings
        </span>
      </div>
    </div>
  );
}
