# 00 Overview

## Status
- State: done
- Result: backend-first acceptance for the research-argument writing-entry bridge is implemented and verified.

## Parent And Scope Source
- Umbrella: `dev-docs/active/research-argument-control-plane-v1/`
- Prior completed foundation:
  - `dev-docs/archive/research-argument-contracts-and-ssot/`
  - `dev-docs/archive/research-argument-graph-and-state-v1/`
- Downstream reference: `dev-docs/active/topic-selection-paper-project-bridge-downstream-acceptance/`

## Goal
- Make the existing research-argument graph/state backend consume its bridge contracts:
  - seed workspace from title-card lineage;
  - verify readiness into explicit bridge verdicts;
  - promote a ready research-argument branch into PaperProject via existing createPaperProject semantics;
  - return and persist refs for `WritingEntryPacket` and `SubmissionRiskReport`.

## Non-goals
- Do not build desktop UI.
- Do not implement planner/critic generation or async task orchestration.
- Do not rewrite PaperProject contracts.
- Do not reopen archived T-026/T-027/T-028 as standalone active tasks.

## Acceptance Criteria
- [x] `SeedWorkspaceFromTitleCardRequest` has service behavior and source trace refs are preserved.
- [x] `ReadinessVerifyRequest` returns stable `ready_for_writing_entry`, `worth_continuing`, or `not_ready` decisions from current graph state.
- [x] `PromoteToPaperProjectRequest` rejects not-ready branches before downstream creation.
- [x] Promotion creates one PaperProject through a gateway, attaches `paper_id` to the workspace, marks workspace promoted, and records an advance decision.
- [x] Promotion returns `WritingEntryPacket` and `SubmissionRiskReport` refs backed by report projections.
- [x] Duplicate promotion is idempotent and does not create another PaperProject.
- [x] Targeted service tests and typecheck pass.
