# 02 Migration Plan

- Migration file: `prisma/migrations/20260516100000_add_topic_selection_v1c_downstream_feedback_recheck/migration.sql`
- Operation: create append-only downstream feedback table and indexes.
- Execution owner: future DB apply workflow.
- Current task action: source-only migration creation and validation.

## Apply Boundary
- Do not run live database migration during T-065.
- Apply later through repo-prisma DB SSOT workflow with target environment approval.

