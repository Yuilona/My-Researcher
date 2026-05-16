# 01 Plan

## Phase 1 - Contracts
- Add shared contracts/schemas for intake snapshot, constraint profile, and readiness assessment.
- Define allowed intake outcomes: `ready_for_slice`, `blocked_by_recheck`, `blocked_by_stale_trace`, `needs_constraint_clarification`, `park`.

Acceptance:
- [x] Schemas validate required refs from the v1a input bundle.
- [x] Intake outcomes have deterministic blockers and required actions.

## Phase 2 - Persistence And Service
- Add repository support for intake snapshots and constraint profiles.
- Implement service methods:
  - `createV1bIntakeSnapshot(...)`
  - `createOrUpdateResearchConstraintProfile(...)`
  - `assessV1bIntakeReadiness(...)`

Acceptance:
- [x] Repeated readiness checks are idempotent for the same input snapshot/profile version.
- [x] Readiness records T-048 gate/transition refs without redefining control-plane objects.

## Phase 3 - Handoff
- Publish a handoff object for ResearchSlice planning.
- Add focused tests for stale upstream, open recheck, accepted risk, and missing constraints.

Acceptance:
- [x] ResearchSlice package can consume intake output through one stable DTO.
