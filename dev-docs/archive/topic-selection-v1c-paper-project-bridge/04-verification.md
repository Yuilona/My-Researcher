# 04 Verification

## Planned Checks
- Shared contract schema and export tests.
- Service tests for promote and promote-with-conditions decisions.
- Service tests rejecting non-promote, stale, superseded, and duplicate decisions.
- Repository round-trip tests for bridge, handoff, and control-plane refs.
- Isolation check that no package, value, question, slice, or need authority state is mutated.

## Exit Commands
- `pnpm --filter @paper-engineering-assistant/shared typecheck`
- `pnpm --filter @paper-engineering-assistant/shared test`
- `pnpm --filter @paper-engineering-assistant/backend prisma:validate`
- `pnpm --filter @paper-engineering-assistant/backend typecheck`
- targeted T-064 service test
- `pnpm --filter @paper-engineering-assistant/backend test`
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`

## 2026-05-15 Verification
- `pnpm --filter @paper-engineering-assistant/shared test` - passed, 42 tests.
- `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-v1c-paper-project-bridge-service.unit.test.ts` - passed, 6 tests.
- `pnpm --filter @paper-engineering-assistant/backend prisma:generate` - passed after adding the Prisma model.
- `pnpm --filter @paper-engineering-assistant/shared typecheck` - passed.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate` - passed.
- `pnpm --filter @paper-engineering-assistant/backend typecheck` - passed.
- `pnpm --filter @paper-engineering-assistant/backend prisma:format` - passed; formatted `prisma/schema.prisma`.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate` - passed after format.
- `pnpm --filter @paper-engineering-assistant/backend typecheck` - passed after format and Prisma client regeneration.
- `node .ai/scripts/ctl-db-ssot.mjs sync-to-context` - passed; refreshed `docs/context/db/schema.json` and registry checksum.
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` - passed; refreshed project registry and derived views.
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` - passed.
- `pnpm --filter @paper-engineering-assistant/backend test` - failed only at existing T-054 Prisma HTTP smoke guard because `DATABASE_URL` was not set for the full-suite run; 403 tests passed, 1 skipped, new T-064 tests passed within the suite.
- `pnpm --filter @paper-engineering-assistant/shared test` - passed after review hardening, 42 tests.
- `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-v1c-paper-project-bridge-service.unit.test.ts` - passed after review hardening, 7 tests.
- `pnpm --filter @paper-engineering-assistant/shared typecheck` - passed after review hardening.
- `pnpm --filter @paper-engineering-assistant/backend typecheck` - passed after review hardening.

## Coverage Notes
- Shared schema tests cover direct and aggregate exports, valid bridge record/handoff payloads, invalid nested promotion source, invalid working-copy payload, and invalid source snapshot hash.
- Service tests cover active bridge creation, condition carry-forward, duplicate idempotency, non-promote/superseded/missing-commitment/workspace rejection, source immutability, malformed handoff lineage rejection, trace object refs coverage, Prisma fake round-trip, and source-promotion uniqueness race handling.
