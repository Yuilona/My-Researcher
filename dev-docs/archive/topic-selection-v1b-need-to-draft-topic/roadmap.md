# Roadmap

## Stage Decision Log
- V1B-001: v1b is the need-to-draft-topic stage.
- V1B-002: v1b starts from human-confirmed `ValidatedNeed`.
- V1B-003: v1b ends at `TopicPackage(draft)`, not promotion.
- V1B-004: v1b detailed child tasks are deferred until v1a closure.
- V1B-005: v1b owns ResearchSlice planning/selection, TopicQuestion formation/selection, value disposition, and draft package readiness.
- V1B-006: v1b must publish an explicit v1c input bundle; v1c consumes it without re-running value assessment.
- V1B-007: v1b entry is `TopicSelectionV1aToV1bInputBundle` plus intake readiness, not a bare `ValidatedNeed`.
- V1B-008: v1b needs its own offline replay baseline for boundary drift, answerability, value overclaim, package trace completeness, and readiness false-pass risks.

## Child Tasks
1. `T-055 topic-selection-v1b-intake-constraint-profile` - done
2. `T-057 topic-selection-v1b-research-slice`
3. `T-059 topic-selection-v1b-topic-question-contract`
4. `T-060 topic-selection-v1b-value-assessment`
5. `T-058 topic-selection-v1b-topic-package-draft`
6. `T-056 topic-selection-v1b-offline-evaluation-replay`
7. `T-054 topic-selection-v1b-http-api-closure`

## Exit Criteria
- v1a output contract is stable.
- v1b child tasks are created with concrete implementation boundaries.
- A trace-ready `TopicPackage(draft)` can be produced.
- The v1c input bundle contract is complete and verified.
- v1b replay and HTTP/API smoke verify the same core contract.
