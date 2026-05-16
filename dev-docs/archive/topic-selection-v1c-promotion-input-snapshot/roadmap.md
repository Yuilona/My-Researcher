# Roadmap

## Decision Log
- T-061-001: v1c starts from `TopicSelectionV1bToV1cInputBundle`, not a bare `TopicPackage`.
- T-061-002: promotion input creation is validation and snapshotting only; it does not run promotion gates or create decisions.

## Milestones
1. Define shared contracts for `PromotionInputSnapshot` and readiness/stale checks.
2. Add memory and Prisma repositories.
3. Implement service method to create/read promotion input snapshots.
4. Add tests for non-ready, superseded, stale, and complete input bundles.

## Exit Criteria
- T-062 can consume one stable `PromotionInputSnapshot` without rereading v1b internals.
