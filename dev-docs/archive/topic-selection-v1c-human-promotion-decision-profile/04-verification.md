# 04 Verification

## 2026-05-15 Verification
- `node --test --loader ts-node/esm src/services/topic-selection-v1c-human-promotion-decision-service.unit.test.ts` from `apps/backend` - passed, 7 tests.
- `pnpm --filter @paper-engineering-assistant/shared test` - passed, 40 tests.
- `pnpm --filter @paper-engineering-assistant/backend typecheck` - passed.
- `pnpm --filter @paper-engineering-assistant/shared typecheck` - passed.
- `pnpm --filter @paper-engineering-assistant/backend prisma:validate` - failed first because `DATABASE_URL` was not set in the shell; no schema validation result was produced.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate` - passed.
- `node --test --loader ts-node/esm src/services/topic-selection-v1c-promotion-gate-service.unit.test.ts` from `apps/backend` - passed, 13 tests; covers T-062 regression after adding latest gate handoff read support and dossier snapshot excerpt.
- `pnpm --filter @paper-engineering-assistant/backend prisma:format` - passed; formatted `prisma/schema.prisma`.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate` - passed after format.
- `pnpm --filter @paper-engineering-assistant/backend typecheck` - passed after Prisma format and client regeneration.
- `node --test --loader ts-node/esm src/services/topic-selection-v1c-human-promotion-decision-service.unit.test.ts` from `apps/backend` - passed again after control-plane artifact checksum ordering fix.
- `pnpm --filter @paper-engineering-assistant/backend typecheck` - passed again after control-plane artifact checksum ordering fix.
- `node .ai/scripts/ctl-db-ssot.mjs sync-to-context` - passed; refreshed `docs/context/db/schema.json`.
- `node .ai/scripts/ctl-db-ssot.mjs sync-to-context` - passed after format; checksums already up to date.
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` - passed; refreshed T-063 derived fields and project views.
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` - passed.

## 2026-05-15 Follow-up Hardening Verification
- `pnpm --filter @paper-engineering-assistant/shared test` - passed, 40 tests; added malformed condition and nested bridge-decision schema rejection checks.
- `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-v1c-human-promotion-decision-service.unit.test.ts` - passed, 10 tests; added malformed condition, missing claim ceiling, and Prisma current snapshot unique-conflict mapping coverage.
- `pnpm --filter @paper-engineering-assistant/shared typecheck` - passed.
- `pnpm --filter @paper-engineering-assistant/backend typecheck` - passed.
- `pnpm --filter @paper-engineering-assistant/backend prisma:validate` - failed because `DATABASE_URL` was not set in the shell; schema validation was rerun with explicit placeholder URL.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate` - passed.

## Coverage Notes
- Shared contract tests cover direct and aggregate exports, valid decision/profile/handoff payloads, `promote_with_conditions` missing conditions, non-promote missing required actions, and non-promote bridge handoff rejection.
- Service tests cover human actor requirement, snapshot hash confirmation, workspace drift, stale gate rejection, promote-only ready gate enforcement, condition-detail validation, claim-ceiling enforcement, non-promote loopback, idempotent same-key retry, and same-snapshot current decision conflict.
- Repository tests cover memory behavior through service tests and Prisma round-trip through a fake Prisma client, including generic `TopicSelectionHumanConfirmedDecision` persistence and current-snapshot unique conflict mapping.
