# 01 Plan

## Phase 1 - Metric Contract
- Define minimum v1b metrics:
  - slice boundary drift rate
  - answerability false-pass rate
  - value overclaim rate
  - package trace completeness
  - package readiness false-pass rate
  - downstream loopback cause distribution

Acceptance:
- [x] Metrics have numerator, denominator, case refs, and notes.

## Phase 2 - Replay Harness
- Reuse or extend offline evaluation records without duplicating runtime authority semantics.
- Add frozen adapters for intake, slice, question, value, and package objects.

Acceptance:
- [x] Replay does not call production write services for v1b authority outputs.

## Phase 3 - Baseline
- Seed a first synthetic baseline.
- After v1b vertical smoke exists, seed a frozen replay case from real outputs.

Acceptance:
- [x] First synthetic v1b baseline is seeded through frozen fixtures.
- [ ] Expand with a larger real-output corpus after `T-054` HTTP/API closure.
