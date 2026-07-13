import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, XCircle, AlertCircle, Info } from 'lucide-react';
import type { Finding, Layer } from '@/types/gatechecker';

interface FindingsPanelProps {
  findings: Finding[];
  hasRun: boolean;
  activeLayer: Layer | null;
}

const SEVERITY_CONFIG = {
  FATAL: {
    bg: 'rgba(184, 107, 107, 0.12)',
    text: 'var(--accent-fail)',
    label: 'FATAL',
    icon: XCircle,
    guidance: 'Fix this before the run can continue.',
  },
  HIGH: {
    bg: 'rgba(201, 169, 110, 0.15)',
    text: 'var(--accent-warn)',
    label: 'HIGH',
    icon: AlertTriangle,
    guidance: 'Review and resolve for best results.',
  },
  MEDIUM: {
    bg: 'rgba(201, 169, 110, 0.08)',
    text: 'var(--accent-warn)',
    label: 'MEDIUM',
    icon: AlertCircle,
    guidance: 'Check if this affects your allocation.',
  },
  LOW: {
    bg: 'rgba(90, 122, 150, 0.08)',
    text: 'var(--accent-slate)',
    label: 'LOW',
    icon: Info,
    guidance: 'Informational — no action needed.',
  },
};

const LAYER_COLORS: Record<Layer, string> = {
  Schema: 'var(--accent-slate)',
  Integrity: 'var(--accent-teal)',
  Feasibility: 'var(--brass)',
};

export default function FindingsPanel({ findings, hasRun, activeLayer }: FindingsPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const filteredFindings = activeLayer
    ? findings.filter((f) => f.layer === activeLayer)
    : findings;

  return (
    <div className="panel flex flex-col">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-3 sm:px-4 py-3 text-left touch-target"
        style={{
          borderBottom: expanded ? '1px solid var(--border-subtle)' : 'none',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="label-caps truncate">Findings</span>
          {findings.length > 0 && (
            <span
              className="font-mono text-xs px-1.5 py-0.5 rounded-sm flex-shrink-0"
              style={{
                background: findings.some((f) => f.severity === 'FATAL')
                  ? 'rgba(184, 107, 107, 0.12)'
                  : findings.length > 0
                    ? 'rgba(201, 169, 110, 0.08)'
                    : 'rgba(107, 168, 138, 0.1)',
                color: findings.some((f) => f.severity === 'FATAL')
                  ? 'var(--accent-fail)'
                  : findings.length > 0
                    ? 'var(--accent-warn)'
                    : 'var(--accent-pass)',
              }}
            >
              {findings.length}
            </span>
          )}
          {activeLayer && (
            <span
              className="font-mono text-xs px-1.5 py-0.5 rounded-sm flex-shrink-0"
              style={{
                background: `${LAYER_COLORS[activeLayer]}15`,
                color: LAYER_COLORS[activeLayer],
              }}
            >
              {activeLayer}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col" style={{ maxHeight: 420, overflowY: 'auto' }}>
          {!hasRun ? (
            /* Empty state — invitation to act */
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)' }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="var(--text-muted)" strokeWidth="1.5" />
                  <path d="M7 10l2.5 2.5L14 8" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  No findings yet
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Upload your school&apos;s payload and run the gatecheck to see results
                </p>
              </div>
            </div>
          ) : findings.length === 0 ? (
            /* Clean pass state */
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(107, 168, 138, 0.1)', border: '1px solid rgba(107, 168, 138, 0.2)' }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="var(--accent-pass)" strokeWidth="1.5" />
                  <path d="M7 10l2.5 2.5L14 8" stroke="var(--accent-pass)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--accent-pass)' }}>
                  All checks passed
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  No issues found in any validation layer
                </p>
              </div>
            </div>
          ) : filteredFindings.length === 0 ? (
            /* Filtered empty */
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No findings in the {activeLayer} layer
              </p>
            </div>
          ) : (
            /* Findings list */
            <div className="flex flex-col gap-2 p-3 sm:p-4">
              {filteredFindings.map((finding, idx) => {
                const config = SEVERITY_CONFIG[finding.severity];
                const Icon = config.icon;

                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 p-3 sm:p-4 fade-in-up"
                    style={{
                      background: 'var(--bg-surface-raised)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      animationDelay: `${Math.min(idx * 60, 400)}ms`,
                    }}
                  >
                    {/* Top row: severity badge + rule ID */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span
                        className="font-mono text-xs font-medium px-2 py-0.5 rounded-sm flex items-center gap-1.5"
                        style={{ background: config.bg, color: config.text }}
                      >
                        <Icon size={11} />
                        {config.label}
                      </span>
                      <span
                        className="font-mono text-xs font-semibold"
                        style={{ color: LAYER_COLORS[finding.layer] }}
                      >
                        {finding.rule}
                      </span>
                    </div>

                    {/* Message in plain language */}
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {finding.message}
                    </p>

                    {/* Detail */}
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {finding.detail}
                    </p>

                    {/* Bottom row: layer tag + guidance */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: LAYER_COLORS[finding.layer] }}
                        />
                        <span className="font-mono text-xs" style={{ color: LAYER_COLORS[finding.layer] }}>
                          {finding.layer}
                        </span>
                      </div>
                      <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                        {config.guidance}
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
              className="flex items-center justify-center gap-3 sm:gap-4 py-2.5 px-4 font-mono text-xs flex-wrap"
              style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}
            >
              <span>HIGH = 0.30</span>
              <span style={{ color: 'var(--border-subtle)' }}>|</span>
              <span>MED = 0.15</span>
              <span style={{ color: 'var(--border-subtle)' }}>|</span>
              <span>LOW = 0.05</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
