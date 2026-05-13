# 01 Plan

## Phase 1 - Existing Risk/Queue Survey
- Inspect existing blocker, review, queue, and override structures.
- Map reusable behavior to recheck/risk/memory contracts.

Acceptance:
- [ ] Reusable patterns are identified.
- [ ] Missing risk/override fields are listed.

## Phase 2 - Recheck Ledger
- Implement RecheckEvent, RecheckImpact, RecheckResolution thin records.
- Add event fingerprint, impact dedup key, cooldown, retry budget, and resolution status.

Acceptance:
- [ ] Recheck does not broadcast automatically.
- [ ] Impact state can mark objects stale/recheck_required/invalidated through control plane only.

## Phase 3 - Risk And Override
- Implement AcceptedRisk and HumanOverride semantics.
- Add blocker policy interaction and accepted-risk expiry/recheck handling.

Acceptance:
- [ ] Override does not erase blocker history.
- [ ] AcceptedRisk scope and expiry are queryable.

## Phase 4 - Decision Memory And Queue
- Implement CandidateDecisionMemory/DecisionMemoryEntry projection.
- Implement DecisionWorkQueueItem as focused work ledger.

Acceptance:
- [ ] Memory is not evidence.
- [ ] Queue item handling returns to control plane.
