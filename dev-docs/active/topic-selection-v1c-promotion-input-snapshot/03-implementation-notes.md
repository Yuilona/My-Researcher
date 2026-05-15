# 03 Implementation Notes

## Current Position
- Planned after v1b closure and replay hardening.
- This package should reuse T-058 v1c input bundle contracts rather than introducing a second v1b exit surface.

## Watch Points
- Do not accept a raw package id as the service entry point.
- Do not silently ignore package blockers or open recheck refs.
- Do not let snapshot creation imply promotion readiness beyond v1b package readiness.

## 2026-05-15 Implementation Start
- Reusing existing `T-061 topic-selection-v1c-promotion-input-snapshot` task bundle and mapping.
- Confirmed implementation choices: persist non-ready audit snapshots, allow only `ready_for_gate` handoff DTOs for T-062, and return the existing snapshot idempotently for the same current bundle/hash.
- DB SSOT mode is `repo-prisma`; this task updates `prisma/schema.prisma` and a versioned migration file, but does not apply migrations to a live database.

## 2026-05-15 Landing
- Added `topic-selection-v1c-promotion-input-contracts` with `PromotionInputSnapshot`, closure statuses, check details, and a ready-only handoff DTO.
- Added memory and Prisma `TopicSelectionV1cPromotionInputRepository` implementations plus `TopicSelectionV1cPromotionInputService`.
- Extended the v1b topic-package repository with `findV1cInputBundleById` so T-061 starts from the bundle, not a raw package id.
- Added `TopicSelectionPromotionInputSnapshot` to the Prisma SSOT and a versioned migration with a unique guard on `v1bToV1cInputBundleId`.
- Kept HTTP/OpenAPI untouched for T-061; route/API exposure remains owned by T-067.

## 2026-05-15 Post-Review Fixes
- Tightened `ready_for_gate` evaluation so source bundle hash drift, frozen package snapshot drift, trace/boundary lineage drift, readiness carry-forward drift, and malformed evidence refs cannot pass into T-062 handoff.
- Tightened promotion input `evidence_refs` schema from generic objects to `TopicSelectionTopicQuestionEvidenceRefRecord`.
- Updated Prisma repository behavior so a concurrent unique conflict on `v1bToV1cInputBundleId` returns the existing same-hash snapshot instead of surfacing a duplicate write error.
