# 01 Plan

## Phase 1 - Contracts
- Define human decision, promotion decision, and commitment profile schemas.
- Define promotion decisions: `promote_to_paper_project`, `promote_with_conditions`, `merge_packages`, `refine_package`, `reassess_value`, `revise_question`, `revise_slice`, `recheck_evidence_or_search`, `park`, and `drop`.

Acceptance:
- [ ] Promote decisions require human actor and gate/support refs.
- [ ] Non-promote decisions require loopback target and required actions.
- [ ] Promote decisions are rejected unless the referenced gate disposition is `ready_for_human_decision`.

## Phase 2 - Persistence And Service
- Add memory/Prisma repositories.
- Implement `recordHumanPromotionDecision(...)`.
- Implement `buildPromotionBridgeInput(...)` for T-064.

Acceptance:
- [ ] Current decision uniqueness is enforced.
- [ ] Non-promote outcomes do not create bridge input.
- [ ] `promote_with_conditions` requires explicit conditions that become commitment-profile obligations.

## Phase 3 - Tests
- Cover bypass rejection, gate mismatch, loopback requirements, currentness, and bridge handoff.

Acceptance:
- [ ] T-064 can consume only current human-confirmed promote decisions.
