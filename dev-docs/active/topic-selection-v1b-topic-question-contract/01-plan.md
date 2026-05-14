# 01 Plan

## Phase 1 - Contracts
- Define question run, candidate set, selected question, contract, and answerability plan.
- Define answerability verdicts: `answerable`, `answerable_with_risk`, `needs_slice_refinement`, `not_answerable`.

Acceptance:
- [x] Contract schema separates question text from boundary and evidence obligations.

## Phase 2 - Service
- Implement candidate generation and question selection.
- Validate selected question against slice boundary and constraint profile.

Acceptance:
- [x] Overbroad questions fail before persistence as selected `TopicQuestion`.
- [x] Answerability plan references available evidence, expected work, and known gaps.

## Phase 3 - Handoff
- Publish `TopicQuestionContract` to value assessment.
- Add tests for boundary drift, unanswerable question, missing answerability plan, and allowed refinement.

Acceptance:
- [x] `TopicSelectionV1bValueAssessmentInput` is built only from an active/current `TopicQuestionContract`.
- [x] Non-admit decisions create no `TopicQuestion`.
