import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, XCircle, AlertCircle, Info } from 'lucide-react';
import type { Finding, Layer } from '@/types/gatechecker';

interface FindingsPanelProps {
  findings: Finding[];
  hasRun: boolean;
  activeLayer: Layer | null;
}

const SEVERITY_CONFIG = {
  FATAL: { bg: 'rgba(196, 90, 74, 0.15)', text: 'var(--accent-red)', label: 'FATAL', icon: XCircle },
  HIGH: { bg: 'rgba(200, 150, 62, 0.2)', text: 'var(--accent-amber)', label: 'HIGH', icon: AlertTriangle },
  MEDIUM: { bg: 'rgba(200, 150, 62, 0.1)', text: 'var(--accent-amber)', label: 'MEDIUM', icon: AlertCircle },
  LOW: { bg: 'rgba(90, 122, 150, 0.1)', text: 'var(--accent-slate)', label: 'LOW', icon: Info },
};

const LAYER_COLORS: Record<Layer, string> = {
  Schema: 'var(--accent-slate)',
  Integrity: 'var(--accent-teal)',
  Feasibility: 'var(--accent-amber)',
};

export default function FindingsPanel({ findings, hasRun, activeLayer }: FindingsPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const filteredFindings = activeLayer
    ? findings.filter((f) => f.layer === activeLayer)
    : findings;

  return (
    <div
      className="flex flex-col"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 3 }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
        style={{ borderBottom: expanded ? '1px solid var(--border-subtle)' : 'none' }}
      >
        <div className="flex items-center gap-2">
          <span className="font-heading text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
            Findings
          </span>
          {findings.length > 0 && (
            <span
              className="font-mono text-xs px-1.5 py-0.5 rounded-sm"
              style={{
                background: findings.some((f) => f.severity === 'FATAL')
                  ? 'rgba(196, 90, 74, 0.15)'
                  : findings.length > 0
                    ? 'rgba(200, 150, 62, 0.1)'
                    : 'rgba(90, 158, 110, 0.1)',
                color: findings.some((f) => f.severity === 'FATAL')
                  ? 'var(--accent-red)'
                  : findings.length > 0
                    ? 'var(--accent-amber)'
                    : 'var(--accent-green)',
              }}
            >
              {findings.length}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
      </button>

      {expanded && (
        <div className="flex flex-col" style={{ maxHeight: 320, overflowY: 'auto' }}>
          {!hasRun ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'var(--bg-surface-raised)' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" stroke="var(--text-muted)" strokeWidth="1.5" />
                  <path d="M6 9l2.5 2.5L13 7" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Run gatecheck to see findings
              </span>
            </div>
          ) : findings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(90, 158, 110, 0.1)' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" stroke="var(--accent-green)" strokeWidth="1.5" />
                  <path d="M6 9l2.5 2.5L13 7" stroke="var(--accent-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No findings. Data is clean.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-3">
              {filteredFindings.map((finding, idx) => {
                const config = SEVERITY_CONFIG[finding.severity];
                const Icon = config.icon;
                const isDimmed = activeLayer && finding.layer !== activeLayer;

                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-1.5 p-3 fade-in-up"
                    style={{
                      background: 'var(--bg-surface-raised)',
                      border: `1px solid var(--border-subtle)`,
                      borderRadius: 3,
                      opacity: isDimmed ? 0.4 : 1,
                      transition: 'opacity 300ms',
                      animationDelay: `${idx * 80}ms`,
                    }}
                  >
                    {/* Top row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono text-xs font-medium px-2 py-0.5 rounded-sm flex items-center gap-1"
                          style={{ background: config.bg, color: config.text }}
                        >
                          <Icon size={10} />
                          {config.label}
                        </span>
                      </div>
                      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {finding.rule}
                      </span>
                    </div>

                    {/* Message */}
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {finding.message}
                    </span>

                    {/* Detail */}
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {finding.detail}
                    </span>

                    {/* Layer tag */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: LAYER_COLORS[finding.layer] }}
                      />
                      <span className="font-mono text-xs" style={{ color: LAYER_COLORS[finding.layer] }}>
                        {finding.layer}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Severity legend */}
          {hasRun && findings.length > 0 && (
            <div
              className="flex items-center justify-center gap-4 py-2 font-mono text-xs"
              style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}
            >
              <span>HIGH = 0.30</span>
              <span style={{ color: 'var(--border-subtle)' }}>|</span>
              <span>MEDIUM = 0.15</span>
              <span style={{ color: 'var(--border-subtle)' }}>|</span>
              <span>LOW = 0.05</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
