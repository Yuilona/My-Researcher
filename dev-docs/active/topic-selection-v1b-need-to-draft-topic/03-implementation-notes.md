# 03 Implementation Notes

## Current Position
- This package is intentionally stage-level only.
- Detailed implementation split is deferred until v1a contracts are verified.
- v1b must preserve the v1a evidence-to-need proof as inherited trace. It should not re-open need validation unless v1a recheck status requires it.
- v1b closure must publish a stable v1c input bundle containing package readiness, package trace/boundary checks, value disposition, accepted risks, blockers, draft issues, and recheck impacts.

## Expected Future Split
- `ResearchSlice` should own narrowing, boundaries, contribution candidates, and resource assumptions.
- `TopicQuestionContract` should own answerability, claim ceiling, boundary inheritance, and falsification conditions.
- `TopicValueAssessment` should own value reasoning and disposition, not promotion.
- `TopicPackage(draft)` should own handoff packaging and readiness state, not project authorization.

## Watch Points
- Do not let package narrative add new need, new evidence, or stronger claims than upstream contracts support.
- Do not let value assessment use `promote`; use `advance_to_package`, `refine_question`, `refine_slice`, `park`, or `drop`.
- Preserve v1a trace and accepted-risk visibility.
