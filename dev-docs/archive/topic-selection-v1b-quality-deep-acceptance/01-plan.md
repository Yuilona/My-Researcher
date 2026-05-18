# 01 Plan

## Phase 1: Inventory Existing Coverage
- Read current v1b TopicQuestion and ValueAssessment services/tests.
- Identify quality dimensions already covered and missing.

## Phase 2: Add Deep Quality Tests
- Extend service unit tests with deterministic mocked LLM outputs.
- Prefer service-level tests for business rules and post-processing.
- Add route tests only if a route-level contract gap is found.

## Phase 3: Fix Defects
- Apply minimal service changes for any uncovered quality defect.
- Preserve current contracts unless a defect is impossible to fix otherwise.

## Phase 4: Verify
- Run targeted v1b tests.
- Run backend typecheck.
- Run project governance lint.

## Candidate Quality Dimensions
- Research question specificity.
- Evidence-link integrity.
- Falsification condition quality.
- Boundary/scope fit.
- Support/challenge/baseline/context coverage.
- Accepted-risk semantics.
- Value disposition consistency with evidence and risk.
