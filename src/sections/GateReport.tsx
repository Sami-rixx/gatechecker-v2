import { useEffect, useState, useRef } from 'react';
import { Download } from 'lucide-react';
import type { GateReport } from '@/types/gatechecker';

interface GateReportProps {
  report: GateReport | null;
  hasRun: boolean;
}

function ConfidenceGauge({ value }: { value: number }) {
  const radius = 80;
  const strokeWidth = 8;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - value);
  const centerX = 100;
  const centerY = 95;

  const angleDeg = 180 - value * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const needleLen = radius - 12;
  const needleX = centerX + needleLen * Math.cos(angleRad);
  const needleY = centerY - needleLen * Math.sin(angleRad);

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="110" viewBox="0 0 200 110">
        {/* Background arc */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-red)" />
            <stop offset="50%" stopColor="var(--accent-amber)" />
            <stop offset="100%" stopColor="var(--accent-green)" />
          </linearGradient>
        </defs>

        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="var(--text-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: 'x2 800ms ease-out, y2 800ms ease-out' }}
        />

        {/* Center dot */}
        <circle cx={centerX} cy={centerY} r="4" fill="var(--text-primary)" />

        {/* Ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const a = (180 - t * 180) * (Math.PI / 180);
          const innerR = radius - 16;
          const outerR = radius - 10;
          return (
            <line
              key={t}
              x1={centerX + innerR * Math.cos(a)}
              y1={centerY - innerR * Math.sin(a)}
              x2={centerX + outerR * Math.cos(a)}
              y2={centerY - outerR * Math.sin(a)}
              stroke="var(--text-muted)"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>

      {/* Percentage */}
      <div className="flex flex-col items-center" style={{ marginTop: -8 }}>
        <span className="font-heading text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {Math.round(value * 100)}%
        </span>
        <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Run Confidence
        </span>
      </div>
    </div>
  );
}

function StatusDisplay({ status }: { status: 'BLOCKED' | 'PASSED_WITH_WARNINGS' | 'PASSED' }) {
  const config = {
    BLOCKED: { color: 'var(--accent-red)', proceeds: 'NO', proceedsColor: 'var(--accent-red)' },
    PASSED_WITH_WARNINGS: { color: 'var(--accent-amber)', proceeds: 'YES, Flagged', proceedsColor: 'var(--accent-amber)' },
    PASSED: { color: 'var(--accent-green)', proceeds: 'YES', proceedsColor: 'var(--accent-green)' },
  };
  const c = config[status];

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-heading text-xl font-bold" style={{ color: c.color }}>
        {status.replace(/_/g, ' ')}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Allocation Proceeds?
        </span>
        <span className="text-xs font-semibold" style={{ color: c.proceedsColor }}>
          {c.proceeds}
        </span>
      </div>
    </div>
  );
}

export default function GateReportView({ report, hasRun }: GateReportProps) {
  const [animatedConfidence, setAnimatedConfidence] = useState(0);
  const prevConfidence = useRef(0);

  useEffect(() => {
    if (report) {
      const target = report.run_confidence;
      const start = prevConfidence.current;
      const duration = 800;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * eased;
        setAnimatedConfidence(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          prevConfidence.current = target;
        }
      };

      requestAnimationFrame(animate);
    }
  }, [report?.run_confidence]);

  const handleExport = () => {
    if (!report) return;
    const exportData = {
      schema_version: report.schema_version,
      school: report.school,
      run_timestamp: report.run_timestamp,
      status: report.status,
      allocation_blocked: report.allocation_blocked,
      flagged: report.flagged,
      run_confidence: report.run_confidence,
      records_inspected: report.records_inspected,
      findings: report.findings,
      summary: report.summary,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    a.href = url;
    a.download = `gate_report_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="flex flex-col"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 3 }}
    >
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="font-heading text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
          Gate Report
        </span>
      </div>

      <div className="flex flex-col items-center gap-4 p-5">
        {!hasRun ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-surface-raised)' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="8" stroke="var(--text-muted)" strokeWidth="1.5" />
                <path d="M9 5v5M9 12.5v.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Run gatecheck to generate report
            </span>
          </div>
        ) : (
          <>
            {/* Status */}
            {report && <StatusDisplay status={report.status} />}

            {/* Confidence gauge */}
            <ConfidenceGauge value={animatedConfidence} />

            {/* Formula */}
            <div
              className="font-mono text-xs text-center px-3 py-2"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-raised)', borderRadius: 3 }}
            >
              run_confidence = 1 - (Σ severity_weight / records_inspected)
            </div>

            {/* Records inspected */}
            {report && (
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Records inspected: {report.records_inspected}
              </span>
            )}

            {/* Summary counts */}
            {report && report.summary.total > 0 && (
              <div className="flex items-center gap-3">
                {report.summary.fatal > 0 && (
                  <span className="font-mono text-xs px-2 py-1 rounded-sm" style={{ background: 'rgba(196, 90, 74, 0.1)', color: 'var(--accent-red)' }}>
                    {report.summary.fatal} FATAL
                  </span>
                )}
                {report.summary.high > 0 && (
                  <span className="font-mono text-xs px-2 py-1 rounded-sm" style={{ background: 'rgba(200, 150, 62, 0.1)', color: 'var(--accent-amber)' }}>
                    {report.summary.high} HIGH
                  </span>
                )}
                {report.summary.medium > 0 && (
                  <span className="font-mono text-xs px-2 py-1 rounded-sm" style={{ background: 'rgba(200, 150, 62, 0.05)', color: 'var(--accent-amber)' }}>
                    {report.summary.medium} MED
                  </span>
                )}
                {report.summary.low > 0 && (
                  <span className="font-mono text-xs px-2 py-1 rounded-sm" style={{ background: 'rgba(90, 122, 150, 0.1)', color: 'var(--accent-slate)' }}>
                    {report.summary.low} LOW
                  </span>
                )}
              </div>
            )}

            {/* Export button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 font-mono text-xs transition-colors"
              style={{ color: 'var(--accent-slate)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#7a9ab6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--accent-slate)'; }}
            >
              <Download size={12} />
              Export Report
            </button>
          </>
        )}
      </div>
    </div>
  );
}
