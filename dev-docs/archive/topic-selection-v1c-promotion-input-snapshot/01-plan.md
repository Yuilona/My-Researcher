# 01 Plan

## Phase 1 - Contracts
- Add shared contracts for `PromotionInputSnapshot` and promotion input readiness/staleness details.

Acceptance:
- [x] Schema accepts complete v1b-to-v1c bundle snapshots.
- [x] Schema rejects missing readiness/check refs.

## Phase 2 - Persistence And Service
- Add memory and Prisma repository support.
- Implement `createPromotionInputSnapshot({ v1b_to_v1c_input_bundle_id, workspace_id?, created_by?, policy_version_id? })`.
- Implement read methods needed by T-062 and tests.

Acceptance:
- [x] Snapshot creation is idempotent or version-safe for the same current input bundle.
- [x] Repository round-trips all upstream refs and snapshot hashes.

## Phase 3 - Handoff
- Publish a stable T-062 handoff DTO.
- Add targeted tests for stale/superseded/non-ready inputs.

Acceptance:
- [x] Promotion gate support consumes only the handoff, not raw v1b records.
