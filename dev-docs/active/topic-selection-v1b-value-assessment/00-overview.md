# 00 Overview

## Status
- State: planned
- Next step: Implement value assessment after `TopicQuestionContract` is stable.

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
- [ ] Value assessment evaluates novelty, significance, answerability, feasibility, risk, and claim ceiling.
- [ ] `ValueDispositionDecision` supports `advance_to_package`, `refine_question`, `refine_slice`, `recheck_evidence_or_search`, `park`, and `drop`.
- [ ] Only `advance_to_package` can create a draft package handoff.
- [ ] Non-advance outcomes have `output_topic_package_id=null`.
