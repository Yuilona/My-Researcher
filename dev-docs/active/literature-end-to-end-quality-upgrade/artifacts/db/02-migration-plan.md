# 02 Migration Plan

## Strategy

- Use versioned Prisma migration.
- Apply later with `prisma migrate dev` for local development or `prisma migrate deploy` for shared environments after explicit approval.

## Rollout Expectations

- Existing literature records remain untouched.
- Existing content-processing/backfill tables remain the source for processing and indexing state.
- New fulltext acquisition jobs/items are additive and can shadow current manual/single-asset download flows.

## Rollback Expectations

- Because the migration is additive, rollback before data is written can drop the three new tables.
- After jobs/items exist, preserve or export acquisition provenance before dropping tables.

## Not Applied In This Pass

- No database write was executed because the approval checkpoint for applying migrations was not completed.
