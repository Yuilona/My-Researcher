# 04 Verification

## 2026-05-13
- Check: project governance sync after package creation.
- Result: registered this package as `T-049` and mapped it to `M-001 / F-001 / R-009`.
- Check: v1a implementation contract review.
- Result: this package owns readiness, adjudication, `ValidatedNeed` materialization, v1b input bundle publication, `SearchPlanRecheckRequest` emission, and candidate memory suggestions; durable memory policy remains owned by recheck/risk/memory.

## Pending Checks
- Tests for candidate readiness blockers.
- Tests that non-validate adjudication does not create ValidatedNeed.
- Integration test for validate path with human confirmation.
- Contract test for v1b input bundle completeness after `ValidatedNeed` creation.

## Acceptance Checks
- `output_validated_need_id` is non-null only for validate.
- `ValidatedNeed` can trace to candidate, support packet, adjudication result, human decision, evidence units, SearchRun, SearchPlan, and literature snapshot.
- Request-searchplan-recheck creates a structured request instead of mutating SearchPlan.
- Candidate memory suggestions are handed to recheck/risk/memory and do not become durable blocking memory without policy interpretation.
