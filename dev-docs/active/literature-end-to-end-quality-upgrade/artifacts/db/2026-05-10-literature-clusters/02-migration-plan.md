# Migration Plan

Strategy: versioned Prisma migration.

Rollout expectation:

- Apply with `prisma migrate deploy` in managed environments after review.
- Existing literature records remain valid; cluster tables are initially empty.
- Generated candidate clusters are `candidate` by default and do not affect retrieval until explicitly confirmed.

Rollback expectation:

- Because the migration is additive, rollback can be handled by disabling cluster generation/consumption at the application layer first.
- Dropping the new tables is destructive to cluster decisions and evidence, so it should only be used before real user decisions depend on them.
