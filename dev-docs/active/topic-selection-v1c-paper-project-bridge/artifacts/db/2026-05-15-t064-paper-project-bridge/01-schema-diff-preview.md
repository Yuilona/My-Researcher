# 01 Schema Diff Preview

## Added
- Prisma model: `TopicSelectionPaperProjectBridge`
- Migration: `prisma/migrations/20260515170000_add_topic_selection_v1c_paper_project_bridge/migration.sql`

## Bridge Persistence Shape
- `sourcePromotionDecisionId` is unique via `tsppb_source_promotion_decision_key`.
- Bridge rows persist:
  - source promotion decision, human decision, commitment profile, gate, input snapshot, and package lineage
  - source snapshot hashes
  - conditions, accepted risks, allowed refinements, early checks, stop/reopen conditions
  - editable working-copy payload and deterministic payload hashes
  - control-plane refs for input snapshot, workflow run, artifact refs, readiness gate result, transition attempt, and trace snapshot
  - nullable future PaperProject intake/link refs

## Not Changed
- No `PaperProject` table creation or mutation path was added.
- No upstream v1a/v1b/v1c authority objects are rewritten by the bridge schema.
- No destructive schema operation is included in the migration.

## Compatibility
- The unique source promotion guard enforces the T-064 idempotency contract at persistence level.
- Nullable future intake/link refs preserve the boundary that actual PaperProject creation belongs outside T-064.
