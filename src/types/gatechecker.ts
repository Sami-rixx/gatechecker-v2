// Gatechecker v2 — Core Type Definitions
// Field names match the canonical payload contract (v1.0.0)

export interface SchoolInfo {
  name: string;
  filled_by: string;
  filled_at: string;
}

export interface Policy {
  generalists_grade_scope: string;
  overload_policy: string;
  ambiguous_data_policy: string;
  specialist_scope_lock?: boolean;
}

export interface Subject {
  subject_code: string;
  subject_name: string;
  grade_levels: string[];
  periods_per_week: number[]; // aligned to grade_levels
  requires_lab?: boolean;
}

export interface Teacher {
  teacher_id: string;
  name: string;
  max_periods_week: number;
  specialist?: boolean;
  confidence?: number;
  flag_note?: string;
}

export interface Capability {
  teacher_id: string;
  subject_code: string;
  grades_can_teach: string[];
  confidence?: number;
  flag_note?: string;
}

export interface Preference {
  teacher_id: string;
  subject_code: string;
  grades: string[];
  priority: number; // 1 (most preferred), 2 (normal), 3 (last resort)
  confidence?: number;
  flag_note?: string;
}

export interface CanonicalPayload {
  schema_version: string;
  school: SchoolInfo;
  policy: Policy;
  subjects: Subject[];
  teachers: Teacher[];
  capabilities: Capability[];
  preferences: Preference[];
}

export type Severity = 'FATAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Layer = 'Schema' | 'Integrity' | 'Feasibility';
export type Status = 'BLOCKED' | 'PASSED_WITH_WARNINGS' | 'PASSED';
export type LayerState = 'PENDING' | 'RUNNING' | 'PASSED' | 'ISSUES' | 'FATAL';

export interface Finding {
  rule: string;
  layer: Layer;
  severity: Severity;
  message: string;
  detail: string;
}

export interface GateReport {
  schema_version: string;
  school: SchoolInfo;
  run_timestamp: string;
  status: Status;
  allocation_blocked: boolean;
  flagged: boolean;
  run_confidence: number;
  records_inspected: number;
  findings: Finding[];
  summary: {
    fatal: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  layerStates: Record<Layer, LayerState>;
}

export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  FATAL: 1.0,
  HIGH: 0.30,
  MEDIUM: 0.15,
  LOW: 0.05,
};
