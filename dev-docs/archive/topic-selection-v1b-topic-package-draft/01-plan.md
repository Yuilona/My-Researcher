# 01 Plan

## Phase 1 - Contracts
- Define `TopicPackage(draft)` and v1b-to-v1c input bundle schemas.
- Define package readiness states: `draft`, `ready_for_promotion_review`, `blocked`, `needs_revision`, `superseded`.

Acceptance:
- [x] Package schema separates narrative fields from authority refs and readiness status.

## Phase 2 - Service
- Implement package creation from value handoff.
- Implement trace/boundary/readiness checks.

Acceptance:
- [x] Package cannot be created from non-advance decisions.
- [x] Readiness blocks on missing refs, boundary conflict, stale upstream, or unresolved high-priority recheck.

## Phase 3 - Handoff
- Publish v1c input bundle.
- Add vertical service smoke from v1a bundle to draft package.

Acceptance:
- [x] Ready packages publish a persisted `TopicSelectionV1bToV1cInputBundle`.
- [x] Blocked or revision-needed packages retain readiness artifacts and do not publish a valid v1c start.
- [ ] Full v1a-input to draft-package HTTP/API smoke remains owned by `T-054`.
