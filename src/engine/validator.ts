import {
  type CanonicalPayload,
  type Finding,
  type Layer,
  type LayerState,
  type GateReport,
  type Status,
  SEVERITY_WEIGHTS,
} from '@/types/gatechecker';

// ============================================================
// SCHEMA RULES (S0xx) — Structural value checks
// ============================================================

function runSchemaRules(data: CanonicalPayload): Finding[] {
  const findings: Finding[] = [];

  // S001: Positive capacity (max_periods_week > 0)
  for (const teacher of data.teachers) {
    if (teacher.max_periods_week <= 0) {
      findings.push({
        rule: 'S001',
        layer: 'Schema',
        severity: teacher.max_periods_week < 0 ? 'FATAL' : 'HIGH',
        message: `Teacher ${teacher.teacher_id} has non-positive capacity: ${teacher.max_periods_week}`,
        detail: `Expected: positive integer > 0. Got: ${teacher.max_periods_week}`,
      });
    }
  }

  // S002: Valid priority tiers [1, 3] per the reconciled registry
  // (canonical payload uses 1/2/3, not 1-5)
  for (const pref of data.preferences) {
    if (pref.priority < 1 || pref.priority > 3) {
      findings.push({
        rule: 'S002',
        layer: 'Schema',
        severity: 'MEDIUM',
        message: `Invalid priority ${pref.priority} for preference of teacher ${pref.teacher_id} on ${pref.subject_code}`,
        detail: 'Priority must be an integer: 1 (most preferred), 2 (normal), or 3 (last resort).',
      });
    }
  }

  return findings;
}

// ============================================================
// INTEGRITY RULES (I0xx) — Referential and cross-list consistency
// ============================================================

function runIntegrityRules(data: CanonicalPayload): Finding[] {
  const findings: Finding[] = [];

  // FIX: canonical payload uses teacher_id / subject_code, not .id
  const teacherIds = new Set(data.teachers.map((t) => t.teacher_id));
  const subjectCodes = new Set(data.subjects.map((s) => s.subject_code));

  // I011: Undefined subject-grade demand reference
  for (const cap of data.capabilities) {
    if (!teacherIds.has(cap.teacher_id)) {
      findings.push({
        rule: 'I011',
        layer: 'Integrity',
        severity: 'FATAL',
        message: `Undefined teacher reference in capabilities: ${cap.teacher_id}`,
        detail: `Teacher ${cap.teacher_id} is not defined in the teachers array.`,
      });
    }
    if (!subjectCodes.has(cap.subject_code)) {
      findings.push({
        rule: 'I011',
        layer: 'Integrity',
        severity: 'FATAL',
        message: `Undefined subject reference in capabilities: ${cap.subject_code}`,
        detail: `Subject ${cap.subject_code} is not defined in the subjects array.`,
      });
    }
  }

  for (const pref of data.preferences) {
    if (!teacherIds.has(pref.teacher_id)) {
      findings.push({
        rule: 'I011',
        layer: 'Integrity',
        severity: 'FATAL',
        message: `Undefined teacher reference in preferences: ${pref.teacher_id}`,
        detail: `Teacher ${pref.teacher_id} is not defined in the teachers array.`,
      });
    }
    if (!subjectCodes.has(pref.subject_code)) {
      findings.push({
        rule: 'I011',
        layer: 'Integrity',
        severity: 'FATAL',
        message: `Undefined subject reference in preferences: ${pref.subject_code}`,
        detail: `Subject ${pref.subject_code} is not defined in the subjects array.`,
      });
    }
  }

  // I012: Duplicate capability/preference row
  // Key includes grades — a teacher can legitimately have multiple capability
  // rows for the same subject when priority differs by grade.
  // Only flag when the same teacher+subject+grade-set appears more than once verbatim.
  const capKeyCounts = new Map<string, number>();
  for (const cap of data.capabilities) {
    const gradeKey = [...cap.grades_can_teach].sort().join(',');
    const key = `${cap.teacher_id}:${cap.subject_code}:${gradeKey}`;
    capKeyCounts.set(key, (capKeyCounts.get(key) || 0) + 1);
  }
  for (const [key, count] of capKeyCounts) {
    if (count > 1) {
      const [tid, sid, grades] = key.split(':');
      findings.push({
        rule: 'I012',
        layer: 'Integrity',
        severity: 'MEDIUM',
        message: `Duplicate capability row for teacher ${tid} on ${sid} (grades ${grades})`,
        detail: `This exact teacher-subject-grade combination appears ${count} times. Remove the duplicate row.`,
      });
    }
  }

  // I013: Capability-preference mismatch
  // Match on subject_code and require actual grade overlap.
  for (const pref of data.preferences) {
    const matchingCaps = data.capabilities.filter(
      (c) => c.teacher_id === pref.teacher_id && c.subject_code === pref.subject_code
    );
    const capableGrades = new Set(matchingCaps.flatMap((c) => c.grades_can_teach));
    const uncovered = pref.grades.filter((g) => !capableGrades.has(g));

    if (matchingCaps.length === 0) {
      findings.push({
        rule: 'I013',
        layer: 'Integrity',
        severity: 'HIGH',
        message: `Preference for teacher ${pref.teacher_id} on ${pref.subject_code} has no matching capability`,
        detail: 'Every preference must correspond to a defined capability for the same teacher and subject.',
      });
    } else if (uncovered.length > 0) {
      findings.push({
        rule: 'I013',
        layer: 'Integrity',
        severity: 'HIGH',
        message: `Preference for teacher ${pref.teacher_id} on ${pref.subject_code} covers grades not in their capabilities: ${uncovered.join(', ')}`,
        detail: 'Capability and preference lists must agree on which grades apply.',
      });
    }
  }

  return findings;
}

// ============================================================
// FEASIBILITY RULES (F0xx) — Coverage, capacity, and policy-driven checks
// ============================================================

function runFeasibilityRules(data: CanonicalPayload): Finding[] {
  const findings: Finding[] = [];

  // F001: Slot-coverage / qualification check — per-subject-grade,
  // does at least one teacher have a capability entry for it?
  for (const subject of data.subjects) {
    for (const grade of subject.grade_levels) {
      const covered = data.capabilities.some(
        (c) => c.subject_code === subject.subject_code && c.grades_can_teach.includes(grade)
      );
      if (!covered) {
        findings.push({
          rule: 'F001',
          layer: 'Feasibility',
          severity: 'FATAL',
          message: `${subject.subject_name} (${subject.subject_code}) at ${grade} has no capable teacher`,
          detail: 'Every subject-grade combination must have at least one teacher with a matching capability entry.',
        });
      }
    }
  }

  // F002: Global capacity check — total demand vs. total supply
  // periods_per_week is an array aligned to grade_levels
  const totalDemand = data.subjects.reduce(
    (sum, s) => sum + s.periods_per_week.reduce((a, b) => a + b, 0),
    0
  );
  const totalSupply = data.teachers.reduce((sum, t) => sum + Math.max(0, t.max_periods_week), 0);
  if (totalDemand > totalSupply) {
    const shortfall = totalDemand - totalSupply;
    const severity = data.policy.overload_policy === 'block' ? 'FATAL' : 'HIGH';
    findings.push({
      rule: 'F002',
      layer: 'Feasibility',
      severity,
      message: `Total demand (${totalDemand} periods/week) exceeds total supply (${totalSupply} periods/week) by ${shortfall}`,
      detail:
        data.policy.overload_policy === 'block'
          ? 'overload_policy is "block" — this shortfall halts the run before any assignment is attempted.'
          : `Shortfall of ${shortfall} periods/week will be distributed as overload under the current policy.`,
    });
  }

  // F007: Specialist-scope violation
  if (data.policy.specialist_scope_lock) {
    const specialistSubjects = new Map<string, Set<string>>();
    for (const cap of data.capabilities) {
      const teacher = data.teachers.find((t) => t.teacher_id === cap.teacher_id);
      if (!teacher?.specialist) continue;
      if (!specialistSubjects.has(cap.teacher_id)) {
        specialistSubjects.set(cap.teacher_id, new Set());
      }
      specialistSubjects.get(cap.teacher_id)!.add(cap.subject_code);
    }
    for (const [teacherId, subjects] of specialistSubjects) {
      if (subjects.size > 1) {
        findings.push({
          rule: 'F007',
          layer: 'Feasibility',
          severity: 'HIGH',
          message: `Specialist ${teacherId} has capabilities across ${subjects.size} subjects: ${[...subjects].join(', ')}`,
          detail: 'specialist_scope_lock is enabled — a specialist should be locked to exactly one subject.',
        });
      }
    }
  }

  // F008: Low-confidence intake escalation
  // Per-row check, respecting ambiguous_data_policy
  const CONFIDENCE_THRESHOLD = 0.7;
  const allRows = [
    ...data.capabilities.map((c) => ({ ...c, _source: 'capabilities' as const })),
    ...data.preferences.map((p) => ({ ...p, _source: 'preferences' as const })),
    ...data.teachers.map((t) => ({ ...t, _source: 'teachers' as const })),
  ];

  for (const row of allRows) {
    if (row.confidence === undefined || row.confidence >= CONFIDENCE_THRESHOLD) continue;

    const blockOnAmbiguous = data.policy.ambiguous_data_policy === 'block_until_resolved';
    const teacherId = 'teacher_id' in row ? row.teacher_id : (row as { teacher_id: string }).teacher_id;
    findings.push({
      rule: 'F008',
      layer: 'Feasibility',
      severity: blockOnAmbiguous ? 'FATAL' : 'MEDIUM',
      message: `Low-confidence ${row._source} row (${row.confidence!.toFixed(2)}) for teacher ${teacherId}`,
      detail: row.flag_note || 'Row confidence below threshold; verify against source data.',
    });
  }

  return findings;
}

// ============================================================
// MAIN VALIDATION ORCHESTRATOR
// ============================================================

export interface ValidationProgress {
  layer: Layer;
  state: LayerState;
}

export async function runValidation(
  data: CanonicalPayload,
  onProgress?: (progress: ValidationProgress) => void
): Promise<GateReport> {
  const findings: Finding[] = [];
  const layerStates: Record<Layer, LayerState> = {
    Schema: 'PENDING',
    Integrity: 'PENDING',
    Feasibility: 'PENDING',
  };

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Step 1: Schema
  layerStates.Schema = 'RUNNING';
  onProgress?.({ layer: 'Schema', state: 'RUNNING' });
  await delay(600);
  const schemaFindings = runSchemaRules(data);
  findings.push(...schemaFindings);
  layerStates.Schema = schemaFindings.some((f) => f.severity === 'FATAL')
    ? 'FATAL'
    : schemaFindings.length > 0
      ? 'ISSUES'
      : 'PASSED';
  onProgress?.({ layer: 'Schema', state: layerStates.Schema });

  // Step 2: Integrity
  layerStates.Integrity = 'RUNNING';
  onProgress?.({ layer: 'Integrity', state: 'RUNNING' });
  await delay(600);
  const integrityFindings = runIntegrityRules(data);
  findings.push(...integrityFindings);
  layerStates.Integrity = integrityFindings.some((f) => f.severity === 'FATAL')
    ? 'FATAL'
    : integrityFindings.length > 0
      ? 'ISSUES'
      : 'PASSED';
  onProgress?.({ layer: 'Integrity', state: layerStates.Integrity });

  // Step 3: Feasibility
  layerStates.Feasibility = 'RUNNING';
  onProgress?.({ layer: 'Feasibility', state: 'RUNNING' });
  await delay(600);
  const feasibilityFindings = runFeasibilityRules(data);
  findings.push(...feasibilityFindings);
  layerStates.Feasibility = feasibilityFindings.some((f) => f.severity === 'FATAL')
    ? 'FATAL'
    : feasibilityFindings.length > 0
      ? 'ISSUES'
      : 'PASSED';
  onProgress?.({ layer: 'Feasibility', state: layerStates.Feasibility });

  // Resolve status
  const hasFatal = findings.some((f) => f.severity === 'FATAL');
  const hasWarnings = findings.some((f) => f.severity !== 'FATAL');

  let status: Status;
  if (hasFatal) {
    status = 'BLOCKED';
  } else if (hasWarnings) {
    status = 'PASSED_WITH_WARNINGS';
  } else {
    status = 'PASSED';
  }

  // Calculate run confidence
  // FATAL findings determine BLOCKED status separately and should not double-count
  const recordsInspected =
    data.teachers.length +
    data.subjects.length +
    data.capabilities.length +
    data.preferences.length;

  const totalWeight = findings
    .filter((f) => f.severity !== 'FATAL')
    .reduce((sum, f) => sum + SEVERITY_WEIGHTS[f.severity], 0);

  const runConfidence =
    recordsInspected > 0
      ? Math.max(0, Math.min(1, 1 - totalWeight / recordsInspected))
      : 1.0;

  // Summary counts
  const summary = {
    fatal: findings.filter((f) => f.severity === 'FATAL').length,
    high: findings.filter((f) => f.severity === 'HIGH').length,
    medium: findings.filter((f) => f.severity === 'MEDIUM').length,
    low: findings.filter((f) => f.severity === 'LOW').length,
    total: findings.length,
  };

  return {
    schema_version: data.schema_version,
    school: data.school,
    run_timestamp: new Date().toISOString(),
    status,
    allocation_blocked: status === 'BLOCKED',
    flagged: status === 'PASSED_WITH_WARNINGS',
    run_confidence: runConfidence,
    records_inspected: recordsInspected,
    findings,
    summary,
    layerStates,
  };
}
