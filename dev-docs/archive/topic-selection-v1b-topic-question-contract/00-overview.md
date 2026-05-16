# 00 Overview

## Status
- State: done
- Completed: T-059 service/repository/shared/Prisma path is implemented and verified.
- Next step: T-060 consumes `TopicSelectionV1bValueAssessmentInput` from active `TopicQuestionContract` records.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1b-need-to-draft-topic/`
- Upstream dependency: `dev-docs/active/topic-selection-v1b-research-slice/`

## Goal
- Form a bounded, answerable `TopicQuestion` from a selected `ResearchSlice`.
- Attach an explicit `TopicQuestionContract` and `TopicQuestionAnswerabilityPlan`.

## Non-goals
- Do not assess publication value.
- Do not package the topic.
- Do not create a promotion decision.

## Owned Scope
- `FormTopicQuestionRun`
- `TopicQuestionCandidateSet`
- `TopicQuestionCandidate`
- `TopicQuestionSelectionDecision`
- `TopicQuestion`
- `TopicQuestionContract`
- `TopicQuestionAnswerabilityPlan`

## Acceptance Criteria
- [x] Question candidates inherit ResearchSlice boundaries and validated need refs.
- [x] Selection decision records answerability, boundary, risk, blocker, and rejection rationale.
- [x] `TopicQuestionContract` includes claim ceiling, excluded/prohibited claims, required evidence, allowed refinements, and stop/reopen/falsification conditions.
- [x] ValueAssessment can consume the contract without re-forming the question through `TopicSelectionV1bValueAssessmentInput`.
