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
  const [activeLayer] = useState<Layer | null>(null);
  const abortRef = useRef(false);

  const handleRun = useCallback(async () => {
    // Parse JSON
    let data: CanonicalPayload;
    try {
      data = JSON.parse(jsonValue);
      setParseError(null);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON');
      return;
    }

    // Reset state
    setIsRunning(true);
    setHasRun(true);
    setReport(null);
    setLayerStates({ ...DEFAULT_LAYER_STATES });
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
  }, []);

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg-canvas)' }}>
      {/* Blueprint grid overlay */}
      <div
        className="fixed inset-0 blueprint-grid pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Header */}
      <header
        className="relative flex-shrink-0 flex items-center justify-between px-6 h-14"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          zIndex: 10,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Logo */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M11 1L20 6.5V15.5L11 21L2 15.5V6.5L11 1Z"
              stroke="var(--accent-teal)"
              strokeWidth="1.5"
              fill="rgba(74, 155, 142, 0.1)"
            />
            <circle cx="11" cy="11" r="3" fill="var(--accent-teal)" opacity="0.6" />
          </svg>
          <span
            className="font-heading text-sm font-semibold tracking-widest"
            style={{ color: 'var(--text-primary)', letterSpacing: '0.08em' }}
          >
            BLUEPRINT GATECHECKER
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--accent-green)' }}
          />
          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            v2.0
          </span>
        </div>
      </header>

      {/* Main content */}
      <main
        className="relative flex-1 flex gap-4 p-4 overflow-hidden"
        style={{ zIndex: 1 }}
      >
        {/* Left column: JSON Editor */}
        <div className="flex-1 min-w-0" style={{ maxWidth: '55%' }}>
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
        <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto" style={{ maxWidth: '45%' }}>
          <ValidationPipeline layerStates={layerStates} />
          <FindingsPanel
            findings={report?.findings ?? []}
            hasRun={hasRun}
            activeLayer={activeLayer}
          />
          <GateReportView report={report} hasRun={hasRun} />
        </div>
      </main>
    </div>
  );
}
