import { useState, useCallback, useRef } from 'react';
import JsonEditor from '@/sections/JsonEditor';
import ValidationPipeline from '@/sections/ValidationPipeline';
import FindingsPanel from '@/sections/FindingsPanel';
import GateReportView from '@/sections/GateReport';
import { SAMPLE_DATA } from '@/engine/sampleData';
import { runValidation } from '@/engine/validator';
import type { CanonicalPayload, GateReport, Layer, LayerState } from '@/types/gatechecker';

const DEFAULT_LAYER_STATES: Record<Layer, LayerState> = {
  Schema: 'PENDING',
  Integrity: 'PENDING',
  Feasibility: 'PENDING',
};

export default function App() {
  const [jsonValue, setJsonValue] = useState(() => JSON.stringify(SAMPLE_DATA, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [layerStates, setLayerStates] = useState<Record<Layer, LayerState>>(DEFAULT_LAYER_STATES);
  const [report, setReport] = useState<GateReport | null>(null);
  const [activeLayer, setActiveLayer] = useState<Layer | null>(null);
  const abortRef = useRef(false);

  const handleRun = useCallback(async () => {
    let data: CanonicalPayload;
    try {
      data = JSON.parse(jsonValue);
      setParseError(null);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON');
      return;
    }

    setIsRunning(true);
    setHasRun(true);
    setReport(null);
    setLayerStates({ ...DEFAULT_LAYER_STATES });
    setActiveLayer(null);
    abortRef.current = false;

    try {
      const result = await runValidation(data, (progress) => {
        if (abortRef.current) return;
        setLayerStates((prev) => ({
          ...prev,
          [progress.layer]: progress.state,
        }));
      });

      if (!abortRef.current) {
        setReport(result);
        setLayerStates(result.layerStates);
      }
    } catch (e) {
      console.error('Validation error:', e);
    } finally {
      setIsRunning(false);
    }
  }, [jsonValue]);

  const handleLoadSample = useCallback(() => {
    setJsonValue(JSON.stringify(SAMPLE_DATA, null, 2));
    setParseError(null);
  }, []);

  const handleReset = useCallback(() => {
    setJsonValue('{}');
    setParseError(null);
    setHasRun(false);
    setReport(null);
    setLayerStates({ ...DEFAULT_LAYER_STATES });
    setActiveLayer(null);
  }, []);

  const handleLayerClick = useCallback((layer: Layer) => {
    setActiveLayer((prev) => (prev === layer ? null : layer));
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: 'var(--bg-canvas)' }}
    >
      {/* Blueprint grid overlay */}
      <div
        className="fixed inset-0 blueprint-grid pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* === HEADER === */}
      <header
        className="relative flex-shrink-0 flex items-center justify-between px-4 sm:px-6 h-14"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          zIndex: 10,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Möbius strip logo */}
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" className="flex-shrink-0">
            <path
              d="M16 4C16 4 8 8 8 16C8 24 16 28 16 28C16 28 24 24 24 16C24 8 16 4 16 4Z"
              stroke="var(--brass)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="rgba(201,169,110,0.08)"
            />
            <path
              d="M16 28C16 28 12 20 12 16C12 12 16 4 16 4"
              stroke="var(--brass)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
            <circle cx="16" cy="16" r="3" fill="var(--brass)" opacity="0.35" />
          </svg>
          <div className="flex items-baseline gap-2 min-w-0">
            <span
              className="font-display text-sm sm:text-base font-semibold tracking-wide truncate"
              style={{ color: 'var(--text-primary)', letterSpacing: '0.02em' }}
            >
              Blueprint Gatechecker
            </span>
            <span
              className="hidden sm:inline font-mono text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              v2.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Status dot */}
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: hasRun && report
                  ? report.status === 'BLOCKED'
                    ? 'var(--accent-fail)'
                    : report.status === 'PASSED'
                      ? 'var(--accent-pass)'
                      : 'var(--accent-warn)'
                  : 'var(--text-muted)',
              }}
            />
            <span className="font-mono text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
              {hasRun && report
                ? report.status === 'BLOCKED'
                  ? 'Blocked'
                  : report.status === 'PASSED'
                    ? 'Passed'
                    : 'Warned'
                : 'Ready'}
            </span>
          </div>
        </div>
      </header>

      {/* === MAIN CONTENT === */}
      <main
        className="relative flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 p-3 sm:p-4 overflow-auto"
        style={{ zIndex: 1 }}
      >
        {/* Left column: JSON Editor */}
        <div className="w-full lg:flex-1 lg:min-w-0 lg:max-w-[52%] xl:max-w-[50%]">
          <JsonEditor
            value={jsonValue}
            onChange={setJsonValue}
            onRun={handleRun}
            isRunning={isRunning}
            onLoadSample={handleLoadSample}
            onReset={handleReset}
            parseError={parseError}
          />
        </div>

        {/* Right column: Pipeline + Findings + Report */}
        <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col gap-3 sm:gap-4 lg:overflow-y-auto">
          {/* Validation Pipeline — prominent visual element */}
          <ValidationPipeline
            layerStates={layerStates}
            onLayerClick={handleLayerClick}
            activeLayer={activeLayer}
          />

          {/* Findings Panel */}
          <FindingsPanel
            findings={report?.findings ?? []}
            hasRun={hasRun}
            activeLayer={activeLayer}
          />

          {/* Gate Report */}
          <GateReportView report={report} hasRun={hasRun} />
        </div>
      </main>
    </div>
  );
}
