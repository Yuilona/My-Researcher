# 01 Plan

## Phase 1 - Existing Foundation Survey
- Locate current workflow run, artifact, gate, and title-card transition patterns.
- Decide whether v1a extends existing services or adds topic-selection-specific adapters.

Acceptance:
- [x] Existing reusable code paths are identified.
- [x] Missing shared contracts are listed.
- [x] Dedicated topic-selection control-plane ownership is chosen over extending existing paper/literature/title-card authority stores.

## Phase 2 - Contract Implementation
- Add or adapt records for context policy, input snapshot, artifact refs, workflow run, gate result, transition policy, workflow profile policy, and chain transition attempt.
- Add `QualitySignal`, `FunctionalLineageLink`, `TraceSnapshot`, and generic `HumanConfirmedDecision`.
- Add deterministic gate shell and state-axis write intent helpers.
- Implement shared contracts before product/business-object repositories depend on them.

Acceptance:
- [x] Contracts persist with stable ids and queryable refs.
- [x] Gate output can block, pass, pass with risk, or request human review.
- [x] Raw `QualitySignal` and raw workflow output cannot directly create authority state writes.
- [x] Prisma schema changes are followed by DB context refresh.

## Phase 3 - Integration Harness
- Expose helper APIs for downstream v1a workflows.
- Add minimal test fixtures that simulate a workflow with artifacts, gate result, and transition attempt.
- Prove one passing transition, one blocked transition, and one pass-with-risk transition.

Acceptance:
- [x] Search/evidence and need-validation packages can call the same harness.
- [x] Verification proves audit trace from transition to workflow run and artifacts.
- [x] Verification proves trace from transition to input snapshot, quality signals, and human-gate/accepted-risk refs where applicable.

## Phase 4 - Handoff
- Publish implementation notes for downstream child packages.
- Record any parent design adjustments.

Acceptance:
- [x] Downstream packages have clear integration instructions.
