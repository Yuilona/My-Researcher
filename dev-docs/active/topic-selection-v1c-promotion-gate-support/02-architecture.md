# 02 Architecture

## Input Contract
- `PromotionInputSnapshot`
- carried-forward risk/blocker/recheck refs
- package trace/boundary/readiness refs
- optional policy/model profile for support generation

## Output Contract
- `PromotionDecisionSupport`
- `PromotionDossier`
- `ArgumentReadinessMiniCheck`
- `PromotionGateCheck`
- T-063 human decision handoff

## Boundary
This package can recommend, block, or request revision. It cannot approve promotion or create a bridge.

## Review Checklist
- Gate does not bypass human confirmation.
- Required actions are typed and traceable.
- Accepted risks are scoped and active.
- Argument mini-check is bounded to promotion suitability, not full research execution.

## Gate Semantics
- `ready_for_human_decision`: T-063 may record promote or non-promote decisions.
- `blocked`: T-063 may record only non-promote decisions that include blocker refs and required actions.
- `needs_revision`: T-063 may record only loopback decisions to package/question/slice/value surfaces.
- `recheck_required`: T-063 may record only recheck or park decisions until the recheck is resolved or accepted as risk.
- `park`: T-063 may record park or drop decisions.

## Pre-Next Closure
- T-063 receives a handoff containing `PromotionInputSnapshot`, `PromotionDecisionSupport`, `PromotionDossier`, `PromotionGateCheck`, and `ArgumentReadinessMiniCheck` refs.
- Promote outcomes require `PromotionGateCheck.disposition=ready_for_human_decision`.
- Every non-ready disposition must carry typed required actions and loopback hints.
