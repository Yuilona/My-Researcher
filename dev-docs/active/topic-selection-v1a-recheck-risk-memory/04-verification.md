# 04 Verification

## 2026-05-13
- Check: project governance sync after package creation.
- Result: registered this package as `T-051` and mapped it to `M-001 / F-001 / R-009`.
- Check: v1a implementation contract review.
- Result: this package owns interpretation of raw `QualitySignal`, gate results, recheck requests, workflow failures, accepted-risk expiry, and downstream feedback into durable recheck, risk, memory, or queue records.

## Pending Checks
- Tests for event fingerprint and impact dedup.
- Tests for retry budget/cooldown behavior.
- Tests for accepted risk expiry/recheck reopening.
- Tests that raw control-plane signals are ignored until policy interpretation produces a derived record.

## Acceptance Checks
- Duplicate events merge instead of creating storms.
- LLM state signals cannot write freshness directly.
- Accepted risk and override preserve scoped rationale and refs.
- Decision memory cannot be used as evidence.
- UI and scheduler consume `DecisionWorkQueueItem` or other derived control-plane records, not raw `QualitySignal` or `RecheckImpact`.
