# 04 Verification

## Planned Checks
- Shared contract schema and export tests.
- Service tests for every loopback target.
- Service tests for no-recheck feedback, warning feedback, and blocking feedback.
- Repository round-trip tests for feedback, classification, recheck refs, and impact summary.
- Isolation test that no v1b/v1c authority service is invoked.

## Results - 2026-05-16
- `pnpm --filter @paper-engineering-assistant/shared test` passed.
- `pnpm --filter @paper-engineering-assistant/shared typecheck` passed.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate` passed.
- `pnpm --filter @paper-engineering-assistant/backend exec node --enable-source-maps --loader ts-node/esm src/services/topic-selection-v1c-downstream-feedback-recheck-service.unit.test.ts` passed.
- `pnpm --filter @paper-engineering-assistant/backend exec node --enable-source-maps --loader ts-node/esm src/services/topic-selection-recheck-risk-memory-service.unit.test.ts` passed.
- `pnpm --filter @paper-engineering-assistant/backend typecheck` passed.
- `pnpm --filter @paper-engineering-assistant/backend prisma:format` and `prisma:generate` completed without connecting to a live database.
- `pnpm --filter @paper-engineering-assistant/backend test` ran 413 backend tests; 411 passed, 1 skipped, and the only failure was the existing T-054 Prisma HTTP smoke check because no real `DATABASE_URL` was provided. Live DB smoke execution is out of scope for T-065.

## Exit Commands
- `pnpm --filter @paper-engineering-assistant/shared typecheck`
- `pnpm --filter @paper-engineering-assistant/shared test`
- `pnpm --filter @paper-engineering-assistant/backend prisma:validate`
- `pnpm --filter @paper-engineering-assistant/backend typecheck`
- targeted T-065 service test
- `pnpm --filter @paper-engineering-assistant/backend test`
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
