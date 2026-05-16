# 02 Migration Plan

## Planned Migration
- Versioned migration directory: `20260515170000_add_topic_selection_v1c_paper_project_bridge`
- Operation: create `TopicSelectionPaperProjectBridge` and indexes.

## Execution Boundary
- This task commits the migration file as repo SSOT evidence.
- This task does not run `prisma migrate deploy`, `prisma migrate dev`, or any command that writes to a real database.
- A future environment-specific DB rollout must review and apply the migration separately.

## Rollout Checks For A Future DB Apply
- Confirm no existing bridge table exists in the target database.
- Confirm unique guard on `sourcePromotionDecisionId` is acceptable for the target environment.
- Run Prisma validation before deploy.
- After deploy, smoke test bridge create/idempotent read against a non-production or approved target database.

## Rollback Consideration
- Since this migration only adds a new T-064 table and indexes, rollback would drop `TopicSelectionPaperProjectBridge`.
- Do not rollback after downstream systems start referencing bridge ids without a data retention/export decision.
