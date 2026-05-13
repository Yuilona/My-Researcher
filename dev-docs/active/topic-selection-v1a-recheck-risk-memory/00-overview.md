# 00 Overview

## Status
- State: done
- Next step: Consume `DecisionWorkQueueItem` and T-051 read helpers from later UI/scheduler work; do not consume raw `QualitySignal` directly.

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
- [x] Recheck is event/impact/resolution ledger plus focused queue.
- [x] LLM state signals cannot directly write `freshness_status`.
- [x] AcceptedRisk and HumanOverride are scoped, auditable, and recheckable.
- [x] CandidateDecisionMemory can warn or block only according to effect policy and scope.
- [x] Queue items are control-plane-derived, deduplicated, and have allowed handlers.
- [x] Raw `QualitySignal`, gate results, workflow failures, accepted-risk expiry, and downstream feedback become durable queue/recheck/memory records only through explicit policy interpretation.
