# 00 Overview

## Status
- State: done
- Next step: Hand off selected/current `ResearchSlice` DTO contract to T-059 topic-question formation.

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
- [x] Slice options are generated from intake snapshot, constraint profile, and inherited evidence refs.
- [x] `SliceSelectionDecision` records selected, rejected, and deferred options with rationale.
- [x] `ResearchSlice` has explicit boundary, method/resource assumptions, target community, claim ceiling, and non-goals.
- [x] TopicQuestion formation can consume `ResearchSlice` without inventing new scope.
