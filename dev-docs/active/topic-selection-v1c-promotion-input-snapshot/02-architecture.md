# 02 Architecture

## Input Contract
- `TopicSelectionV1bToV1cInputBundle`
- `TopicPackage(draft)` snapshot with `package_readiness_status=ready_for_promotion_review`
- package trace/boundary check and readiness assessment refs
- value/question/slice/need/evidence/risk/blocker/memory/recheck refs

## Output Contract
- `PromotionInputSnapshot`
- input freshness/check details
- closure status: `ready_for_gate`, `blocked`, `needs_upstream_refresh`, or `superseded`
- T-062 handoff DTO

## Boundary
This package establishes the v1c input surface. It does not decide whether to promote and does not create downstream paper-project objects.

## Review Checklist
- Bundle is current and not superseded.
- Package readiness is still `ready_for_promotion_review`.
- Required v1b refs are present and versioned.
- Accepted risks, blockers, and recheck refs are visible for promotion gate support.

## Pre-Next Closure
- T-062 may consume only `PromotionInputSnapshot` records with `closure_status=ready_for_gate`.
- `blocked` must include blocker refs and required action.
- `needs_upstream_refresh` must include the stale package, bundle, recheck, or readiness refs that caused rejection.
- `superseded` must point to the current replacement snapshot or bundle where known.
