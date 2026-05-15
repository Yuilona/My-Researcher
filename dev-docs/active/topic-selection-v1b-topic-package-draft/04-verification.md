# 04 Verification

## 2026-05-14
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: registered this package as `T-058`.
- Check: `node .ai/scripts/ctl-project-governance.mjs map --project main --task T-058 --feature F-001 --milestone M-001 --requirement R-009 --apply`.
- Result: mapped this package to `M-001 / F-001 / R-009`.

## Pending
- None for T-058 backend/service scope. HTTP/API closure remains `T-054`.

## 2026-05-14 - Implementation Verification
- Check: `pnpm --filter @paper-engineering-assistant/shared typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed, 33 shared schema/export tests.
- Check: `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate`.
- Result: passed; Prisma schema is valid. This was a schema validation only, not a live DB migration.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed after Prisma Client generation.
- Check: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-v1b-topic-package-service.unit.test.ts`.
- Result: passed, 7 targeted T-058 service/repository/migration tests.
- Check: `pnpm --filter @paper-engineering-assistant/backend test`.
- Result: passed, 352 backend tests total with 351 pass and 1 expected skip.
- Check: `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`.
- Result: passed; updated `docs/context/db/schema.json` from `prisma/schema.prisma`.
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: passed; propagated `T-058` status and regenerated project views.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.

## 2026-05-14 - Review Fix Verification
- Check: `pnpm --filter @paper-engineering-assistant/backend test -- topic-selection-v1b-topic-package-service.unit.test.ts`.
- Result: passed. The backend test runner executed 355 tests total with 354 pass and 1 expected skip; the T-058 coverage now includes stale embedded decision refs, malformed nested evidence refs, and Prisma transaction rollback of control-plane rows.
- Check: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-v1b-topic-package-service.unit.test.ts`.
- Result: passed, 10 targeted T-058 service/repository/migration tests.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed after Prisma Client generation.
- Check: `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate`.
- Result: passed; schema validation only, no live DB migration.
- Check: `pnpm --filter @paper-engineering-assistant/shared typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed, 33 shared tests.
