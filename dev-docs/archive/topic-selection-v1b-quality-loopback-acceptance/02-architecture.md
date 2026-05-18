# 02 Architecture

## Boundary
- The loopback authority lives in v1b `ValueDispositionDecision`.
- `TopicValueAssessment` decides readiness; `ValueDispositionDecision` decides whether to advance or return for repair.
- v1c may only consume `advance_to_package` decisions that are active/current and carry package draft input.

## Loopback Targets
- `refine_question`: targets the active `TopicQuestionContract` authority ref.
- `refine_slice`: targets the `ResearchSlice` authority ref from the value assessment input snapshot.
- `recheck_evidence_or_search`: targets a known recheck request; if none exists, the service may use a deterministic pending recheck ref.
- `park` and `drop`: require actions but do not require a loopback target.

## Invariants
- Non-advance decisions are terminal for package drafting until a later successful loop creates a new ready assessment and advance decision.
- Disposition records are append-only; a newer decision supersedes older decisions by current pointer/status.
- No non-current, inactive, or non-advance disposition can publish T-058 input.

## Real-Flow Anchor
- T-080 real-flow run `v1b-quality-real-nonadvance-20260518062006` produced `needs_refinement -> refine_slice` and no v1c package. T-081 converts that behavior into repeatable acceptance tests.
