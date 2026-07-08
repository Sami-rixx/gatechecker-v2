# Blueprint Gatechecker v2

A validation-first rules engine for school timetable planning data. Data is inspected through three deterministic filtration layers (Schema → Integrity → Feasibility) before any allocation or timetable construction is attempted.

## What It Does

Gatechecker takes a **canonical payload** (JSON) describing your school's teachers, subjects, capabilities, and preferences — then runs it through a strict validation pipeline that catches structural errors, referential inconsistencies, and feasibility problems **before** any allocation algorithm runs.

## Validation Layers

### Schema (S0xx) — Structural Value Checks
- **S001**: All `max_periods_week` values > 0
- **S002**: All `priority` values in range [1, 3]

### Integrity (I0xx) — Cross-List Consistency
- **I011**: Every `teacher_id`/`subject_code` reference exists
- **I012**: No duplicate capability rows (same teacher + subject + grades)
- **I013**: Preferences match actual capabilities with grade overlap

### Feasibility (F0xx) — Coverage & Capacity
- **F001**: Every subject-grade combination has a capable teacher
- **F002**: Total demand ≤ total supply (respects `overload_policy`)
- **F007**: Specialist scope lock enforcement
- **F008**: Per-row confidence escalation

## Canonical Payload v1.0.0

```json
{
  "schema_version": "1.0.0",
  "school": { "name": "...", "filled_by": "...", "filled_at": "..." },
  "policy": {
    "generalists_grade_scope": "explicit_only",
    "overload_policy": "block",
    "ambiguous_data_policy": "use_default_and_warn",
    "specialist_scope_lock": true
  },
  "subjects": [
    { "subject_code": "MATH", "subject_name": "Mathematics", "grade_levels": ["G7","G8","G9"], "periods_per_week": [5,5,5] }
  ],
  "teachers": [
    { "teacher_id": "T1", "name": "Mr. Otieno", "max_periods_week": 24, "specialist": false, "confidence": 0.95 }
  ],
  "capabilities": [
    { "teacher_id": "T1", "subject_code": "MATH", "grades_can_teach": ["G7","G8","G9"], "confidence": 0.95 }
  ],
  "preferences": [
    { "teacher_id": "T1", "subject_code": "MATH", "grades": ["G7","G8","G9"], "priority": 1 }
  ]
}
```

## Field Contract

| Field | Meaning |
|---|---|
| `teacher_id` | Unique teacher identifier (not `.id`) |
| `subject_code` | Unique subject identifier (not `.id` or `subject_id`) |
| `grades_can_teach` | Array of grade levels a teacher can teach a subject for |
| `grades` | Array of grade levels in a preference entry |
| `priority` | 1 (most preferred), 2 (normal), 3 (last resort) |
| `confidence` | Row-level confidence score (0.0–1.0) |
| `flag_note` | Optional human-readable note for low-confidence rows |

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- OR-Tools CP-SAT (for the allocation phase, not gatechecking)
- Client-side only — no backend required

## Running Locally

```bash
npm install
npm run dev
```

## License

MIT
