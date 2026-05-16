# 02 Architecture

## Boundary
This package owns cross-cutting response to stale inputs, blockers, accepted risks, overrides, repeated failures, and negative memory. It does not own business-object creation.

## Flow
```text
Workflow/Gate state signals
  -> QualitySignal interpretation policy
  -> TopicSelectionRecheckRiskMemoryService
  -> RecheckEvent
  -> RecheckImpact
  -> DecisionWorkQueueItem
  -> RecheckResolution / AcceptedRisk / HumanOverride / new version
```

## Authority Objects
- `RecheckEvent`
- `RecheckImpact`
- `RecheckResolution`
- `AcceptedRisk`
- `HumanOverride`
- `CandidateDecisionMemory`
- `DecisionMemoryEntry`
- `DecisionWorkQueueItem`
- `BlockerPolicy`
- `QualitySignal` interpretation policy

## Invariants
- Recheck updates freshness/impact semantics, not historical decision status.
- `invalidated` requires retract, supersede, drop, revise, or human-confirmed exceptional handling.
- AcceptedRisk is scoped and expires or reopens under explicit conditions.
- Decision memory is caution/blocking context, not evidence.
- UI and scheduler consume queue items, not raw QualitySignal/RecheckImpact.
- This package does not define the raw `QualitySignal` schema; the foundation/control-plane package does.

## Downstream Contract
All v1a business packages can emit state signals and candidate memory suggestions. This package decides whether they become durable recheck/memory/queue/risk records.

## Implemented Slice
- Shared contract module: `topic-selection-recheck-risk-memory-contracts`.
- Backend service: `TopicSelectionRecheckRiskMemoryService`.
- Backend repositories: in-memory and Prisma implementations behind `TopicSelectionRecheckRiskMemoryRepository`.
- No UI, REST/OpenAPI, scheduler, v1b/v1c implementation, or target DB apply is included in this slice.
