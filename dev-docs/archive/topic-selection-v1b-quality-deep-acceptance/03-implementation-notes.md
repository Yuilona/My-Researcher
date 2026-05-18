# 03 Implementation Notes

## 2026-05-18
- Opened T-080 as a focused v1b quality acceptance package.
- This task starts after T-068 backend chain acceptance and T-079 resource sampling stability are done.
- Added deterministic TopicQuestionContract quality guards:
  - answerable candidates must have a specific question shape;
  - support/challenge/baseline/context traceability evidence roles are required;
  - observable success criteria are required;
  - falsification conditions must be actionable and cite trigger refs;
  - `accepted_risk_refs` must use `ref_type=accepted_risk`.
- Added deterministic ValueAssessment quality guards:
  - ready assessments must recommend `advance_to_package`;
  - non-ready assessments cannot recommend `advance_to_package`;
  - ready assessments require `total_score >= 70`;
  - ready assessments cannot contain dimension scores below 60;
  - inherited accepted-risk refs are normalized into `ready_with_accepted_risk` output when the provider omits them.
- Updated the real-flow harness with v1b quality-acceptance mode:
  - default E2E still requires advance readiness;
  - with `TOPIC_SELECTION_REAL_ALLOW_NON_ADVANCE_V1B=1`, a non-ready ValueAssessment creates the recommended non-advance disposition and stops before package/v1c.
- Product-level v1b E2E found a real LLM contract-stability issue: the provider returned only one `hard_gates` item for `TopicValueAssessment`, so backend validation correctly rejected the run with missing value gates.
- Tightened the v1b ValueAssessment output contract:
  - `topicSelectionAssessTopicValueLlmOutputSchema.hard_gates` now requires exactly the six known value gate keys.
  - `topicSelectionAssessTopicValueLlmOutputSchema.dimension_scores` now requires exactly the nine known value dimensions.
  - The ValueAssessment prompt now explicitly asks for exact gate and dimension counts and order.
- While restoring clean verification, fixed two unrelated experiment-foundation TypeScript narrowness issues that were blocking backend/shared typecheck and `ts-node/esm` real-flow startup:
  - cast persisted JSON `platform_ref` through `unknown` before the domain type;
  - preserve `LocalJobState` status literal typing during local job cancellation;
  - remove an obsolete test helper argument from `trainingPlatformRefPayload()`.

## 2026-05-18 Closure
- All T-080 acceptance criteria were already verified before archival.
- Governance closure marks the task done and moves it from active work to archive.
