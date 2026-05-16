# 03 Implementation Notes

## 2026-05-14 - Split Creation
- Created as the first business object package after v1b intake.
- Keeps slice selection separate from question formation so weak or overbroad slices can be rejected before question candidates appear.

## 2026-05-14 - Implementation Landed
- Added shared T-057 contracts for plan runs, option sets, options, selection decisions, selected `ResearchSlice`, selected-slice evidence/boundary/assumption rows, and the T-059 handoff DTO.
- Added LLM registry entries for `topic-selection-research-slice-planning` and wired `TopicSelectionV1bResearchSliceService` to the existing `BackendLlmGateway`.
- Added Prisma SSOT models, migration, in-memory repository, and Prisma repository for the durable T-057 authority objects.
- Deterministic gates validate LLM options before persistence: inherited `ValidatedNeed` refs, inherited evidence refs, non-empty included/excluded boundaries, target community alignment, non-goal preservation, hard blockers, and human-review triggers for high-risk/uncertain options.
- Selection creates immutable `SliceSelectionDecision`; only `decision=select` creates a selected `ResearchSlice` plus child evidence, boundary, and assumption rows. `request_more_options`, `park`, and `reject` preserve loopback state without creating a slice.
- `buildTopicQuestionFormationInput` returns a stable T-059 DTO only for the current selected `ResearchSlice`.

## 2026-05-14 - Review Fixes
- Tightened the selection state machine: only `ready_for_selection` option sets can create a new `SliceSelectionDecision`; looped-back or already-selected option sets cannot later create a selected slice through the same path.
- Added explicit `claim_ceiling_alignment` to the LLM option contract and persisted option records. `exceeds` blocks option persistence; `uncertain` or low-confidence alignment requires human/risk handling before selection.
- Moved successful plan-run, option-set, and option persistence behind a single repository transaction in the Prisma implementation to avoid dangling succeeded runs without option sets.
- Marked the selected option row as `selected` when a selected `ResearchSlice` is created, keeping option-set, option, decision, and slice semantics aligned.
- Carried `memory_suggestion_refs` and `recheck_request_refs` into `PlanResearchSliceRun`, selected `ResearchSlice`, and the T-059 handoff DTO so downstream stages do not need to rediscover them through indirect snapshots.
