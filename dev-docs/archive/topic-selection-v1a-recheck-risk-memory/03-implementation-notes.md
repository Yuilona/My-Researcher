# 03 Implementation Notes

## Initial Notes
- Implement ledger-first and scheduler-later.
- Storm control requires strict event admission, lineage-limited propagation, retry budgets, cooldown, batching, and auditable stop decisions.
- CandidateDecisionMemory can start as a v1a projection before full generic DecisionMemoryEntry is tableized.

## Open Questions
- UI queue or notification display remains future work; T-051 now exposes backend queue authority via `DecisionWorkQueueItem`.
- `AcceptedRisk` is stored as a shared T-051 authority record and is referenced by overrides, resolutions, queue payloads, and downstream paths.
- Non-overridable blocker behavior is policy-data driven through `TopicSelectionBlockerPolicy`; T-051 does not hard-code blocker code vocabulary.

## 2026-05-13 Implementation
- Added shared T-051 contracts and schemas for recheck events, impacts, resolutions, accepted risks, human overrides, blocker policies, decision memory entries, candidate memory projections, and decision work queue items.
- Added Prisma authority/thin records and migration SQL for the T-051 ledger slice; `docs/context/db/schema.json` was refreshed from repo-prisma SSOT.
- Added `TopicSelectionRecheckRiskMemoryRepository` with in-memory and Prisma implementations.
- Added `TopicSelectionRecheckRiskMemoryService` as the only policy interpretation layer for raw quality signals, gate results, workflow failures, search-plan recheck requests, candidate memory suggestions, accepted-risk expiry, human overrides, downstream feedback, and impact resolution.
- Added read helpers in the control-plane service for quality signals, gate results, and workflow runs; added need-validation repository read helper for single candidate memory suggestions.
- Added backend unit coverage for duplicate event merge, impact/queue dedup, retry budget/cooldown, raw signal interpretation, accepted-risk expiry reopening, override risk requirements, non-overridable blocker policy, memory materialization as non-evidence, downstream feedback queueing, and accepted-risk impact resolution.

## 2026-05-13 Review Fixes
- Replaced broad historical dedup unique constraints with active/open partial unique indexes in migration SQL; Prisma schema now keeps query indexes without preventing repeated resolved ledger cycles.
- Hardened AcceptedRisk use for human overrides and accepted-risk impact resolution: referenced risks must exist, be active, not expired, and align with protected target/workspace/title.
- Routed `pass_with_risk` gate interpretation to accepted-risk human review handling instead of blocker resolution.
- Preserved workspace/title ownership on derived recheck events, impacts, and queue items.
- Added regression tests for each review finding.
