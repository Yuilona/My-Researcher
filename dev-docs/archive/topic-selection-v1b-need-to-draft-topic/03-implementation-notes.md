# 03 Implementation Notes

## 2026-05-14 - V1B Split
- v1a backend/service/API status is closed and represented as `done`; v1b split can proceed.
- Expanded the original four-package split with two missing boundaries: intake/constraint readiness before ResearchSlice, and offline evaluation/replay before API closure.
- Execution order is intake -> slice -> question contract -> value assessment -> draft package -> offline replay -> HTTP/API closure.

## Current Position
- This package is intentionally stage-level only.
- T-055, T-057, T-059, T-060, T-058, T-056, and T-054 are complete.
- v1b is closed at the HTTP/API boundary and should hand off to v1c through `TopicSelectionV1bToV1cInputBundle`.
- v1b closure hardening now rejects cross-stage offline replay case types, frozen bundle stages, and metric keys at both service and v1b HTTP schema boundaries.
- v1b must preserve the v1a evidence-to-need proof as inherited trace. It should not re-open need validation unless v1a recheck status requires it.
- v1b now publishes a stable v1c input bundle containing package readiness, package trace/boundary checks, value disposition, accepted risks, blockers, draft issues, and recheck impacts.
- v1b now has a frozen offline replay baseline for slice boundary drift, answerability false-pass, value overclaim, package trace completeness, package readiness false-pass, and downstream loopback causes.

## Expected Future Split
- `ResearchSlice` owns narrowing, boundaries, contribution candidates, and resource assumptions.
- `TopicQuestionContract` owns answerability, claim ceiling, boundary inheritance, and falsification conditions.
- `TopicValueAssessment` owns value reasoning and disposition, not promotion.
- `TopicPackage(draft)` owns handoff packaging and readiness state, not project authorization.

## Watch Points
- Do not let package narrative add new need, new evidence, or stronger claims than upstream contracts support.
- Do not let value assessment use `promote`; use `advance_to_package`, `refine_question`, `refine_slice`, `park`, or `drop`.
- Preserve v1a trace and accepted-risk visibility.
- Keep v1b replay datasets stage-pure; v1b replay APIs must not accept v1a case types or metric keys.
