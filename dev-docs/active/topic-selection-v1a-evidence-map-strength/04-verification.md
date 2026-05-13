# 04 Verification

## 2026-05-13
- Check: project governance sync after package creation.
- Result: registered this package as `T-047` and mapped it to `M-001 / F-001 / R-009`.
- Check: v1a implementation contract review.
- Result: this package owns claim-level evidence and target-specific strength assessment; recheck/risk/memory and offline replay consume structured refs, not EvidenceMap summary text.

## Pending Checks
- Tests for EvidenceUnit locator/source provenance.
- Tests for EvidenceStrengthAssessment cache key and stale transitions.
- Tests that evidence freshness, conflict, locator, and source-health refs can be consumed by downstream packages without parsing summaries.

## Acceptance Checks
- EvidenceMap can be rebuilt/audited from SearchRun refs.
- Abstract-only support is flagged.
- Same EvidenceUnit is not automatically reused across different target semantics.
- NeedCandidate readiness receives support/challenge/baseline bundles.
- Offline replay receives frozen EvidenceMap/EvidenceUnit/assessment snapshots for trace and recall metrics.
