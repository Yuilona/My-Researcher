# 01 Plan

## Phase 1 - Contracts
- Define support packet, promotion dossier read model, argument mini-check, and gate result schemas.

Acceptance:
- [x] Gate dispositions and blocker/action vocabularies are typed.
- [x] Argument mini-check output cannot imply full paper readiness.

## Phase 2 - Service And Persistence
- Add repository support.
- Implement `buildPromotionDecisionSupport(...)`.
- Implement `buildPromotionDossier(...)` as a read model over support and snapshot refs.
- Implement `runPromotionGateCheck(...)`.

Acceptance:
- [x] Gate records control-plane refs and artifact refs.
- [x] Blocking rechecks and unresolved blockers prevent `ready_for_human_decision`.

## Phase 3 - Tests
- Add unit tests for blocker/recheck, accepted risks, argument gaps, and ready cases.

Acceptance:
- [x] T-063 can consume one support/dossier/gate handoff.
