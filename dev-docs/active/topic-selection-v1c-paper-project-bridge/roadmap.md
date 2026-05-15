# Roadmap

## T-064 Paper Project Bridge

### Objective
Create the first PaperProject handoff only after a current human-confirmed promotion decision.

### Execution Order
1. Land bridge contracts.
2. Add repository and service persistence.
3. Enforce one bridge per promotion decision.
4. Add service and repository tests.

### Exit
- `PaperProjectBridge` is traceable to a current `PromotionDecision` and `PromotionCommitmentProfile`.
- Duplicate, stale, or non-promote decisions cannot create bridges.
