# 00 Overview

## Status
- State: planned
- Next step: Implement topic-question contracts after selected ResearchSlice output is stable.

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
- [ ] Question candidates inherit ResearchSlice boundaries and validated need refs.
- [ ] Selection decision records answerability, boundary, novelty-risk, and rejection rationale.
- [ ] `TopicQuestionContract` includes claim ceiling, excluded claims, required evidence, and allowed refinements.
- [ ] ValueAssessment can consume the contract without re-forming the question.
