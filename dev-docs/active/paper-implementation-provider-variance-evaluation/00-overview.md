# T-105 Paper Implementation Provider Variance Evaluation

## Status
- State: planned
- Task ID: `T-105`
- Feature / Milestone / Requirement: `F-001` / `M-001` / `R-013`
- Current focus: define evaluation boundary after splitting it from `T-104`.

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
- [ ] Provider variance runner accepts a fixed PaperImplementation input snapshot and workflow type.
- [ ] Repeated live runs record provider/model/profile/prompt metadata without secrets or raw credentials.
- [ ] Every provider output is validated against the T-099 proposal artifact contract.
- [ ] Evaluation reports schema validity, trace ref validity, direct mutation attempts, overclaim rate, blocker/queue item rate, and decision/proposal stability.
- [ ] Failed or drifting provider outputs produce evaluation artifacts and quality signals, not authority mutations.
- [ ] Default verification remains deterministic and credential-free; live provider checks are opt-in and clearly skipped/blocked/passed.
- [ ] Tests cover provider fakes, variance aggregation, and guardrail violations without requiring real provider calls.

## Handoff
- Start from T-099 AI workflow harness and T-101 evaluation suite.
- Do not implement provider calls until the runner profile, credential boundary, and artifact format are confirmed.
