# 01 Plan

## Phase 1 - Contract Hold
- Track v1b `TopicPackage(draft)` readiness semantics. Completed after v1b closure and hardening.
- Preserve promotion and bridge target contracts without implementation commitments.

Acceptance:
- [x] v1c input contract does not require v1b to create PaperProject-owned objects.
- [x] v1c does not re-run value assessment as a hidden gate.

## Phase 2 - Detailed Split After V1B
- Split v1c now that package readiness and promotion input snapshot are stable.
- Create child tasks for promotion input snapshot, gate/support, human decision/profile, bridge, downstream feedback/recheck, offline replay, and HTTP/API closure.

Acceptance:
- [x] Each child task has a clear authority boundary.
- [x] Human authorization and bridge creation remain separated.

## Phase 2A - Implementation Child Packages
1. `T-061 topic-selection-v1c-promotion-input-snapshot`
2. `T-062 topic-selection-v1c-promotion-gate-support`
3. `T-063 topic-selection-v1c-human-promotion-decision-profile`
4. `T-064 topic-selection-v1c-paper-project-bridge`
5. `T-065 topic-selection-v1c-downstream-feedback-recheck`
6. `T-066 topic-selection-v1c-offline-evaluation-replay`
7. `T-067 topic-selection-v1c-http-api-closure`

Acceptance:
- [x] `T-061` creates a stable v1c input surface from `TopicSelectionV1bToV1cInputBundle`.
- [x] `T-062` produces support/dossier/gate artifacts without human authorization.
- [x] `T-063` persists human promotion decisions and commitment profiles.
- [x] `T-064` creates `PaperProjectBridge` only after human-confirmed promotion.
- [x] `T-065` routes downstream issues into feedback/recheck records.
- [x] `T-066` evaluates frozen v1c snapshots without writing production authority state.
- [x] `T-067` closes HTTP/API after service/repository contracts stabilize.
- [x] each child package documents its pre-next review checklist and stop conditions.

## Phase 3 - Stage Closure
- Create or connect `PaperProjectBridge` only after human-confirmed promotion.
- Verify downstream feedback/recheck contract from PaperProject, Writing, or ResearchArgument back to topic selection.

Acceptance:
- [x] Bridge trace can be followed back to package, question, slice, need, evidence, and search refs.
- [x] Downstream feedback creates feedback/recheck events rather than mutating upstream authority.
- [x] v1c stage closure is represented in project governance as done after T-067 HTTP/API closure.
