# 01 Plan

## Phase 1 - Contracts
- Define bridge record, bridge creation input, bridge handoff, and bridge status enums.

Acceptance:
- [ ] Bridge references `PromotionDecision` and `PromotionCommitmentProfile`.
- [ ] Bridge status distinguishes `active`, `blocked`, `superseded`, and `archived`.

## Phase 2 - Persistence And Service
- Add memory and Prisma repositories.
- Implement `createPaperProjectBridge(...)`.
- Implement `getPaperProjectBridge(...)`.
- Enforce uniqueness by source promotion decision.

Acceptance:
- [ ] Transaction creates bridge and control-plane refs atomically.
- [ ] Duplicate creation is rejected or returned idempotently by explicit contract.

## Phase 3 - Tests
- Cover promote, promote-with-conditions, non-promote, stale, duplicate, and trace carry-forward cases.

Acceptance:
- [ ] T-065 can consume bridge refs for downstream feedback routing.
- [ ] No upstream authority object is mutated by bridge creation.
