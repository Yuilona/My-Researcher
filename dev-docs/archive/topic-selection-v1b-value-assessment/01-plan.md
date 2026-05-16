# 01 Plan

## Phase 1 - Contracts
- Define value assessment dimensions, reasoning memo, and disposition decision schema.
- Define hard blockers and soft risk handling.

Acceptance:
- [x] Assessment dimensions are separate from promotion authorization.

## Phase 2 - Service
- Implement value assessment creation and disposition adjudication.
- Enforce non-mutating loopbacks to question/slice/evidence packages.

Acceptance:
- [x] `advance_to_package` records gate/transition refs and a package-draft input handoff.
- [x] Non-advance outcomes persist required actions and output refs without creating a package.

## Phase 3 - Handoff
- Produce value handoff for draft package creation.
- Add tests for overclaim, weak answerability, accepted risk, and non-advance decisions.

Acceptance:
- [x] `buildPackageDraftInput()` returns only active/current `advance_to_package` handoffs.
- [x] T-060 does not mutate `TopicQuestion`, `TopicQuestionContract`, `ResearchSlice`, package, promotion, or PaperProject state.
