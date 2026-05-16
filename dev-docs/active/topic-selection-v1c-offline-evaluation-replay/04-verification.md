# 04 Verification

## Planned Checks
- Shared schema/export tests for `stage='v1c'`.
- Minimal v1c frozen bundle validation test.
- Synthetic v1c baseline service test covering all case types.
- Metric tests for all v1c metric keys.
- Replay diff tests for all v1c dimensions.
- Isolation test preventing imports from production v1c services/repositories.

## Exit Commands
- `pnpm --filter @paper-engineering-assistant/shared typecheck`
- `pnpm --filter @paper-engineering-assistant/shared test`
- `pnpm --filter @paper-engineering-assistant/backend prisma:validate`
- `pnpm --filter @paper-engineering-assistant/backend typecheck`
- `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-offline-evaluation-replay-service.unit.test.ts`
- `DATABASE_URL=<isolated test postgres url> pnpm --filter @paper-engineering-assistant/backend test`
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`

## Results - 2026-05-16
- `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-offline-evaluation-replay-service.unit.test.ts` passed, 19 tests covering v1a/v1b compatibility and v1c baseline, metrics, diffs, stage compatibility, isolation, and replay invariants.
- `pnpm --filter @paper-engineering-assistant/shared test` passed, 45 schema/barrel tests including v1c frozen replay payload validation.
- `pnpm --filter @paper-engineering-assistant/shared typecheck` passed.
- `DATABASE_URL=<test postgres url> pnpm --filter @paper-engineering-assistant/backend prisma:validate` passed.
- `pnpm --filter @paper-engineering-assistant/backend typecheck` passed.
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` passed before status sync.
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` passed and updated registry/dashboard/feature-map/task-index for T-066 status.
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` passed after status sync.

## Review Fix Results - 2026-05-16
- `pnpm --filter @paper-engineering-assistant/shared typecheck` passed after v1c replay enum hardening.
- `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-offline-evaluation-replay-service.unit.test.ts` passed, 19 tests including hardened stage compatibility assertions.
- `pnpm --filter @paper-engineering-assistant/shared test` passed, 45 tests including v1c frozen replay positive validation and invalid v1c vocabulary rejection.
- `DATABASE_URL=<test postgres url> pnpm --filter @paper-engineering-assistant/backend prisma:validate` passed.
- `pnpm --filter @paper-engineering-assistant/backend typecheck` passed.
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` passed.
- `git diff --check` passed for the T-066 replay/service/test/doc files touched by review fixes.
- `pnpm --filter @paper-engineering-assistant/backend test` was attempted without `DATABASE_URL`; the only observed failure was the pre-existing T-054 Prisma HTTP smoke prerequisite: `DATABASE_URL is required for T-054 Prisma HTTP smoke test.`
- The full backend suite remains an environment-gated check and must be rerun with an isolated test Postgres URL before treating that command as green.
