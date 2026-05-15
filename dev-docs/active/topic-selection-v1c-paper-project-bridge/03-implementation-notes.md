# 03 Implementation Notes

## Expected Implementation
- Keep the service deterministic.
- Derive editable working-copy text from package narrative and commitment profile only.
- Preserve source refs and hashes so PaperProject can audit the bridge back to v1b/v1c authority artifacts.

## Repository Guidance
- Memory repository is required for route and service tests.
- Prisma repository should use a transaction for bridge creation and control-plane refs.
- The unique guard belongs on source `PromotionDecision`.

## Watch Points
- Bridge creation is not a second promotion decision.
- `promote_with_conditions` remains promote-class only when the conditions are carried into the bridge.
- Bridge text is a working copy, not a mutation of `TopicPackage(draft)`.

## 2026-05-15 Implementation
- Added shared T-064 bridge contracts for `PaperProjectBridge`, create input, editable working-copy payload, handoff, and bridge status.
- Added Prisma SSOT model and migration `20260515170000_add_topic_selection_v1c_paper_project_bridge`; the model has a unique `sourcePromotionDecisionId` guard and stores source promotion lineage, snapshot hashes, conditions, risks, working-copy payload, and control-plane refs.
- Added memory and Prisma repositories. Prisma creation writes bridge and control-plane records in one transaction and maps source-promotion uniqueness races to the existing bridge.
- Added `TopicSelectionV1cPaperProjectBridgeService`, consuming only T-063 `PromotionBridgeHandoff`; it rejects non-current/non-promote/missing-commitment/workspace-drift sources, creates no `PaperProject`, and returns existing active bridges idempotently.
- Working-copy text is derived from the commitment profile and source snapshot excerpt only; upstream package/promotion authority payloads are not mutated.

## 2026-05-15 Review Hardening
- Tightened bridge create/record schemas so `created_by` must use canonical topic-selection actor values.
- Added strict source workspace validation: a requested workspace must match bridge source lineage, and nested promotion/human/commitment workspace refs must not drift.
- Added handoff lineage consistency validation for promotion decision, human decision, commitment profile, input snapshot, package, conditions, accepted risks, and snapshot hashes.
- Expanded tests to assert malformed lineage rejection and `TraceSnapshot.object_refs` coverage for bridge, promotion, package/value/question/slice/need/evidence/risk/blocker/memory/recheck refs.
