import { useEffect, useState, useRef } from 'react';
import { Download, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { GateReport } from '@/types/gatechecker';

interface GateReportProps {
  report: GateReport | null;
  hasRun: boolean;
}

/* === Ring Confidence Gauge (Möbius eye motif) === */
function ConfidenceRing({ value }: { value: number }) {
  const radius = 44;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);

  // Color interpolation based on value
  const getStrokeColor = (v: number) => {
    if (v >= 0.8) return 'var(--accent-pass)';
    if (v >= 0.5) return 'var(--accent-warn)';
    return 'var(--accent-fail)';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 108, height: 108 }}>
        <svg width="108" height="108" viewBox="0 0 108 108" className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="54"
            cy="54"
            r={radius}
            className="confidence-ring-bg"
            strokeWidth={strokeWidth}
          />
          {/* Value ring */}
          <circle
            cx="54"
            cy="54"
            r={radius}
            className="confidence-ring-fill ring-animate"
            strokeWidth={strokeWidth}
            stroke={getStrokeColor(value)}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              ['--ring-circumference' as string]: circumference,
              ['--ring-offset' as string]: offset,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {Math.round(value * 100)}%
          </span>
        </div>
      </div>
      <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        Confidence
      </span>
    </div>
  );
}

/* === Status Display === */
function StatusDisplay({ status }: { status: 'BLOCKED' | 'PASSED_WITH_WARNINGS' | 'PASSED' }) {
  const config = {
    BLOCKED: {
      color: 'var(--accent-fail)',
      icon: AlertTriangle,
      headline: 'Validation Blocked',
      subtext: 'Fix the fatal issues above before allocation can proceed.',
      proceed: 'No — allocation halted',
    },
    PASSED_WITH_WARNINGS: {
      color: 'var(--accent-warn)',
      icon: Info,
      headline: 'Passed with Warnings',
      subtext: 'Review the flagged items above — allocation can proceed.',
      proceed: 'Yes — with flags',
    },
    PASSED: {
      color: 'var(--accent-pass)',
      icon: CheckCircle2,
      headline: 'All Checks Passed',
      subtext: 'Your data is clean. Allocation can proceed.',
      proceed: 'Yes — clear to go',
    },
  };
  const c = config[status];
  const Icon = c.icon;

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex items-center gap-2">
        <Icon size={18} style={{ color: c.color }} />
        <span className="font-display text-base sm:text-lg font-bold" style={{ color: c.color }}>
          {c.headline}
        </span>
      </div>
      <p className="text-xs sm:text-sm max-w-xs" style={{ color: 'var(--text-secondary)' }}>
        {c.subtext}
      </p>
      <span
        className="font-mono text-xs px-2 py-0.5 rounded-sm"
        style={{
          color: c.color,
          background: `${c.color}15`,
        }}
      >
        {c.proceed}
      </span>
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
      const duration = 900;
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
    <div className="panel flex flex-col">
      {/* Header */}
      <div className="px-3 sm:px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="label-caps">Gate Report</span>
      </div>

      <div className="flex flex-col items-center gap-5 p-4 sm:p-6">
        {!hasRun ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 py-8">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="var(--text-muted)" strokeWidth="1.5" />
                <path d="M10 6v5M10 13.5v.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No report yet
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Run the gatecheck to generate a validation report
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Status */}
            {report && <StatusDisplay status={report.status} />}

            {/* Confidence ring */}
            <ConfidenceRing value={animatedConfidence} />

            {/* Formula */}
            <div
              className="font-mono text-xs text-center px-3 py-2"
              style={{
                color: 'var(--text-muted)',
                background: 'var(--bg-surface-raised)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              confidence = 1 − (Σ severity_weight / records_inspected)
            </div>

            {/* Records inspected */}
            {report && (
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-mono">{report.records_inspected}</span> records inspected
              </span>
            )}

            {/* Summary counts */}
            {report && report.summary.total > 0 && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {report.summary.fatal > 0 && (
                  <span
                    className="font-mono text-xs px-2 py-1 rounded-sm"
                    style={{ background: 'rgba(184, 107, 107, 0.1)', color: 'var(--accent-fail)' }}
                  >
                    {report.summary.fatal} FATAL
                  </span>
                )}
                {report.summary.high > 0 && (
                  <span
                    className="font-mono text-xs px-2 py-1 rounded-sm"
                    style={{ background: 'rgba(201, 169, 110, 0.1)', color: 'var(--accent-warn)' }}
                  >
                    {report.summary.high} HIGH
                  </span>
                )}
                {report.summary.medium > 0 && (
                  <span
                    className="font-mono text-xs px-2 py-1 rounded-sm"
                    style={{ background: 'rgba(201, 169, 110, 0.06)', color: 'var(--accent-warn)' }}
                  >
                    {report.summary.medium} MED
                  </span>
                )}
                {report.summary.low > 0 && (
                  <span
                    className="font-mono text-xs px-2 py-1 rounded-sm"
                    style={{ background: 'rgba(90, 122, 150, 0.08)', color: 'var(--accent-slate)' }}
                  >
                    {report.summary.low} LOW
                  </span>
                )}
              </div>
            )}

            {/* Export button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 font-mono text-xs transition-colors touch-target py-2"
              style={{ color: 'var(--accent-slate)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brass)'; }}
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
