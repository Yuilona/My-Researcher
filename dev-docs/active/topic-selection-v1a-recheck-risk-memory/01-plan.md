# 01 Plan

## Phase 1 - Existing Risk/Queue Survey
- Inspect existing blocker, review, queue, and override structures.
- Map reusable behavior to recheck/risk/memory contracts.

Acceptance:
- [x] Reusable patterns are identified.
- [x] Missing risk/override fields are listed.

## Phase 2 - Recheck Ledger
- Implement RecheckEvent, RecheckImpact, RecheckResolution thin records.
- Add event fingerprint, impact dedup key, cooldown, retry budget, and resolution status.

Acceptance:
- [x] Recheck does not broadcast automatically.
- [x] Impact state can mark objects stale/recheck_required/invalidated through control plane only.

## Phase 3 - Risk And Override
- Implement AcceptedRisk and HumanOverride semantics.
- Add blocker policy interaction and accepted-risk expiry/recheck handling.

Acceptance:
- [x] Override does not erase blocker history.
- [x] AcceptedRisk scope and expiry are queryable.

## Phase 4 - Decision Memory And Queue
- Implement CandidateDecisionMemory/DecisionMemoryEntry projection.
- Implement DecisionWorkQueueItem as focused work ledger.

Acceptance:
- [x] Memory is not evidence.
- [x] Queue item handling returns to control plane.
