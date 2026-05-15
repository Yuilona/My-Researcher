# 04 Verification

## 2026-05-14
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: registered this package as `T-056`.
- Check: `node .ai/scripts/ctl-project-governance.mjs map --project main --task T-056 --feature F-001 --milestone M-001 --requirement R-009 --apply`.
- Result: mapped this package to `M-001 / F-001 / R-009`.

## Pending
- None for T-056 backend/service scope. HTTP/API exposure remains `T-054`.

## 2026-05-14 - Implementation Verification
- Check: `pnpm --filter @paper-engineering-assistant/shared typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed, 34 shared schema/export tests.
- Check: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-offline-evaluation-replay-service.unit.test.ts`.
- Result: passed, 14 targeted offline replay service tests covering v1a compatibility and v1b baseline metrics/diffs/isolation.
- Check: `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate`.
- Result: passed; no Prisma schema changes were required for T-056.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed after Prisma Client generation.
- Check: `pnpm --filter @paper-engineering-assistant/backend test`.
- Result: passed, 358 backend tests total with 357 pass, 1 skip, 0 fail.
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: passed; refreshed `.ai/project/main` derived views after marking `T-056` done.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.

## 2026-05-15 Closure Hardening
- Check: service-level replay stage-purity guard.
- Result: `addCase` now rejects frozen bundle stage mismatches and case types incompatible with the dataset stage; `startRun` rejects metric keys incompatible with the dataset stage.
- Check: targeted service test.
- Result: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-offline-evaluation-replay-service.unit.test.ts` passed with 15/15.
