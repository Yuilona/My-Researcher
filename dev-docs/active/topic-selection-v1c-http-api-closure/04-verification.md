# 04 Verification

## Planned Checks
- Memory route integration for full v1c chain.
- Validation tests for missing fields, invalid enums, stale refs, and non-promote bridge attempts.
- Review/read route tests for promotion input snapshots, support/dossiers, gate checks, decisions, bridges, feedback, and recheck requests.
- Replay route integration for synthetic v1c baseline, run, case result, metrics, and diffs.
- Prisma HTTP smoke against a real local `DATABASE_URL`.
- OpenAPI strict verification.
- API index strict verification.

## Exit Commands
- `pnpm --filter @paper-engineering-assistant/shared typecheck`
- `pnpm --filter @paper-engineering-assistant/shared test`
- `DATABASE_URL=<local-dev-db> pnpm --filter @paper-engineering-assistant/backend prisma:validate`
- `DATABASE_URL=<local-dev-db> pnpm --filter @paper-engineering-assistant/backend typecheck`
- `DATABASE_URL=<local-dev-db> pnpm --filter @paper-engineering-assistant/backend test`
- `node .ai/scripts/ctl-openapi-quality.mjs verify --strict`
- `node .ai/scripts/ctl-api-index.mjs verify --strict`
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
