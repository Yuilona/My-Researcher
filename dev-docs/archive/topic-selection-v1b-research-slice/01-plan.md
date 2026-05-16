# 01 Plan

## Phase 1 - Contracts
- Define slice run, option set, option, decision, and selected slice schemas.
- Define slice states: `draft`, `selected`, `needs_refinement`, `blocked`, `superseded`.

Acceptance:
- [x] Slice schema preserves upstream refs and constraint profile version.

## Phase 2 - Service
- Implement option generation and selection service methods.
- Enforce that selected slice scope is within validated need and constraint profile.

Acceptance:
- [x] Selection fails when the intake readiness is not `ready_for_slice`.
- [x] Selection fails when selected option exceeds claim ceiling or violates non-goals.

## Phase 3 - Handoff
- Produce a `ResearchSlice` handoff for question formation.
- Add tests for refinement, recheck loopback, accepted risk, and stale intake.

Acceptance:
- [x] TopicQuestion package can consume selected slice refs and boundary fields.
