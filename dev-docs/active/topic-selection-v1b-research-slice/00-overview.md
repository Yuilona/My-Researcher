# 00 Overview

## Status
- State: planned
- Next step: Implement ResearchSlice planning after intake/constraint profile contracts land.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1b-need-to-draft-topic/`
- Upstream dependency: `dev-docs/active/topic-selection-v1b-intake-constraint-profile/`

## Goal
- Transform a v1b-ready intake snapshot into a selected `ResearchSlice`.
- Generate slice options, make selection explicit, and preserve alternatives and rejection reasons.

## Non-goals
- Do not form final research questions.
- Do not assess topic value.
- Do not create draft packages.
- Do not broaden beyond the validated need or constraint profile without a new review.

## Owned Scope
- `PlanResearchSliceRun`
- `ResearchSliceOptionSet`
- `ResearchSliceOption`
- `SliceSelectionDecision`
- `ResearchSlice`
- slice blockers and loopback recommendations

## Acceptance Criteria
- [ ] Slice options are generated from intake snapshot, constraint profile, and inherited evidence refs.
- [ ] `SliceSelectionDecision` records selected, rejected, and deferred options with rationale.
- [ ] `ResearchSlice` has explicit boundary, method/resource assumptions, target community, claim ceiling, and non-goals.
- [ ] TopicQuestion formation can consume `ResearchSlice` without inventing new scope.
