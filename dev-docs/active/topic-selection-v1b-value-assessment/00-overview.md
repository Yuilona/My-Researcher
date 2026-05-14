# 00 Overview

## Status
- State: done
- Completed: shared contracts, service/repository, Prisma sidecars, LLM registry, and T-060 service tests.
- Next step: T-058 consumes `TopicSelectionV1bPackageDraftInput` from active/current `advance_to_package` decisions.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1b-need-to-draft-topic/`
- Upstream dependency: `dev-docs/active/topic-selection-v1b-topic-question-contract/`

## Goal
- Assess whether a selected question and slice are valuable enough to become a draft topic package.
- Create `TopicValueAssessment`, `ValueReasoningMemo`, and `ValueDispositionDecision`.

## Non-goals
- Do not authorize PaperProject promotion.
- Do not change the question or slice in place.
- Do not hide downstream promotion checks inside value scoring.

## Owned Scope
- `TopicValueAssessment`
- `ValueReasoningMemo`
- `ValueDispositionDecision`
- value blockers, objections, and loopback actions

## Acceptance Criteria
- [x] Value assessment evaluates significance, originality, answerability, feasibility, claim-ceiling fit, reviewer risk, effort/value fit, strategic fit, and negative memory check.
- [x] `ValueDispositionDecision` supports `advance_to_package`, `refine_question`, `refine_slice`, `recheck_evidence_or_search`, `park`, and `drop`.
- [x] Only `advance_to_package` can persist `TopicSelectionV1bPackageDraftInput`.
- [x] Non-advance outcomes have `package_draft_input=null` and `output_topic_package_id=null`.
