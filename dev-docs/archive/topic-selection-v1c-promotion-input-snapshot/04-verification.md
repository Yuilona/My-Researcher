# 04 Verification

## Pending Checks
- None.

## 2026-05-15 T-061 Landing
- Check: `pnpm --filter @paper-engineering-assistant/shared typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed, 36 shared schema/barrel tests.
- Check: `pnpm --filter @paper-engineering-assistant/backend prisma:generate`.
- Result: passed after adding `TopicSelectionPromotionInputSnapshot`.
- Check: bare `pnpm --filter @paper-engineering-assistant/backend prisma:validate`.
- Result: failed because `DATABASE_URL` was not set; no schema error was reported before env resolution.
- Check: `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate`.
- Result: passed; Prisma schema is valid.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed.
- Check: `node --test --loader ts-node/esm src/services/topic-selection-v1c-promotion-input-service.unit.test.ts` from `apps/backend`.
- Result: passed, 8 targeted T-061 tests covering ready/idempotent/superseded/stale/blocked/workspace-drift/Prisma round-trip/migration assertions.
- Check: `pnpm --filter @paper-engineering-assistant/backend test -- --test-name-pattern "PromotionInput|promotion input|Prisma migration adds promotion input"`.
- Result: failed because the runner executed the broader backend suite and hit the existing always-on T-054 Prisma HTTP smoke `DATABASE_URL is required` preflight before a DB URL was provided; the direct T-061 unit command above is the targeted passing check.
- Check: `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`.
- Result: passed; refreshed `docs/context/db/schema.json` and context checksum.
- Check: `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict`.
- Result: passed.
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: passed; project registry and derived views updated with T-061 status.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.

## 2026-05-15 Post-Review Fix Verification
- Check: `pnpm --filter @paper-engineering-assistant/shared typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed, 36 shared schema/barrel tests including valid snapshot/handoff payloads and malformed evidence-ref rejection.
- Check: `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate`.
- Result: passed; Prisma schema remains valid.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed.
- Check: `node --test --loader ts-node/esm src/services/topic-selection-v1c-promotion-input-service.unit.test.ts` from `apps/backend`.
- Result: passed, 12 targeted T-061 tests covering ready/idempotent/superseded/package drift/bundle hash drift/trace lineage drift/blocked malformed refs/workspace drift/Prisma same-hash uniqueness conflict/migration assertions.
