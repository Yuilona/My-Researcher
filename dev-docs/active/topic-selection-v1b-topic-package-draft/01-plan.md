# 01 Plan

## Phase 1 - Contracts
- Define `TopicPackage(draft)` and v1b-to-v1c input bundle schemas.
- Define package readiness states: `draft`, `ready_for_promotion_review`, `blocked`, `needs_revision`, `superseded`.

Acceptance:
- [ ] Package schema separates narrative fields from authority refs and readiness status.

## Phase 2 - Service
- Implement package creation from value handoff.
- Implement trace/boundary/readiness checks.

Acceptance:
- [ ] Package cannot be created from non-advance decisions.
- [ ] Readiness blocks on missing refs, boundary conflict, stale upstream, or unresolved high-priority recheck.

## Phase 3 - Handoff
- Publish v1c input bundle.
- Add vertical service smoke from v1a bundle to draft package.
