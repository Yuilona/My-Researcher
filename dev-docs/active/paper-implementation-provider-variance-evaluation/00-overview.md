# T-105 Paper Implementation Provider Variance Evaluation

## Status
- State: done
- Task ID: `T-105`
- Feature / Milestone / Requirement: `F-001` / `M-001` / `R-013`
- Current focus: closed as deterministic provider-variance evaluation infrastructure.

## Goal
- Add an opt-in live LLM/provider variance evaluation lane for PaperImplementation AI proposal workflows.
- Measure whether real provider outputs remain schema-valid, proposal-only, trace-aware, and low-overclaim across repeated runs for the same controlled input snapshot.
- Preserve T-099's rule that AI outputs are proposal artifacts only and cannot mutate PaperImplementation authority directly.

## Non-goals
- Do not implement live experiment execution; that is `T-104`.
- Do not make provider credentials or live model availability part of default CI.
- Do not let live provider output write motive, validation, work-order, claim, dossier, or trace authority state directly.
- Do not replace deterministic T-101 evaluation; this is an opt-in product-mode evaluation lane.
- Do not create a new AI orchestration authority outside the existing PaperImplementation harness.

## Acceptance Criteria
- [x] Provider variance runner accepts a fixed PaperImplementation input snapshot and workflow type.
- [x] Repeated deterministic/profile runs record provider/model/profile/prompt metadata without secrets or raw credentials.
- [x] Every provider output is validated through the T-099 proposal artifact contract.
- [x] Evaluation reports schema validity, trace ref validity, direct mutation attempts, overclaim rate, blocker/queue item rate, and decision/proposal stability.
- [x] Failed or drifting provider outputs produce evaluation artifacts, quality signals, and queue blockers, not authority mutations.
- [x] Default verification remains deterministic and credential-free; live provider checks are opt-in and clearly skipped/blocked/passed.
- [x] Tests cover provider fakes, variance aggregation, live-profile preflight, and guardrail violations without requiring real provider calls.

## Handoff
- Runtime entry point: `POST /paper-implementation/projects/:implementation_project_id/provider-variance-evaluations/run`.
- T-105 reuses T-099 `ImplementationHarness`, `ImplementationInputSnapshot`, proposal artifacts, quality signals, and decision queue blockers.
- T-105 does not add Prisma fields or a new persisted evaluation authority. If future live execution requires queryable fields beyond current harness objects, implementation must stop and record a blocker instead of hiding gate fields in JSON-only payloads.
