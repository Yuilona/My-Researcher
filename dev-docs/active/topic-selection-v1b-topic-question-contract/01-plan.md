# 01 Plan

## Phase 1 - Contracts
- Define question run, candidate set, selected question, contract, and answerability plan.
- Define answerability verdicts: `answerable`, `answerable_with_risk`, `needs_slice_refinement`, `not_answerable`.

Acceptance:
- [ ] Contract schema separates question text from boundary and evidence obligations.

## Phase 2 - Service
- Implement candidate generation and question selection.
- Validate selected question against slice boundary and constraint profile.

Acceptance:
- [ ] Overbroad questions fail before persistence as selected `TopicQuestion`.
- [ ] Answerability plan references available evidence, expected work, and known gaps.

## Phase 3 - Handoff
- Publish `TopicQuestionContract` to value assessment.
- Add tests for boundary drift, unanswerable question, missing answerability plan, and allowed refinement.
