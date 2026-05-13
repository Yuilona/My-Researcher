# 00 Overview

## Status
- State: planned
- Next step: Confirm current queue/risk/override patterns and how they map to v1a.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1a-evidence-to-need/`
- Architecture parent: `dev-docs/active/topic-selection-decision-chain-redesign/`

## Goal
- Implement v1a cross-cutting recheck, risk acceptance, override, decision memory, and focused work queue behavior.

## Non-goals
- Do not implement a background scheduler.
- Do not implement full workspace dependency graph propagation.
- Do not let risk acceptance rewrite historical decisions.

## Owned Scope
- `RecheckEvent`
- `RecheckImpact`
- `RecheckResolution`
- storm-control policy
- `AcceptedRisk`
- `HumanOverride`
- `CandidateDecisionMemory`
- `DecisionMemoryEntry` thin model where needed
- `DecisionWorkQueueItem`
- `QualitySignal` interpretation policy for recheck, memory, queue, risk, and required-action routing

## Acceptance Criteria
- [ ] Recheck is event/impact/resolution ledger plus focused queue.
- [ ] LLM state signals cannot directly write `freshness_status`.
- [ ] AcceptedRisk and HumanOverride are scoped, auditable, and recheckable.
- [ ] CandidateDecisionMemory can warn or block only according to effect policy and scope.
- [ ] Queue items are control-plane-derived, deduplicated, and have allowed handlers.
- [ ] Raw `QualitySignal`, gate results, workflow failures, accepted-risk expiry, and downstream feedback become durable queue/recheck/memory records only through explicit policy interpretation.
