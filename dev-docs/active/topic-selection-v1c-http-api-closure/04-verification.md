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

## Runs
- 2026-05-16: `pnpm --filter @paper-engineering-assistant/backend exec tsc -p tsconfig.json --noEmit` -> pass.
- 2026-05-16: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-v1c-routes.integration.test.ts` -> initial fail because `overclaim` downstream feedback requires `required_action`; fixed test payload to honor T-065 contract.
- 2026-05-16: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-v1c-routes.integration.test.ts` -> pass.
- 2026-05-16: `node .ai/scripts/ctl-openapi-quality.mjs verify --strict` -> initial fail because v1c path parameters used `$ref`; changed them to inline params to match repo convention.
- 2026-05-16: `node .ai/scripts/ctl-openapi-quality.mjs verify --strict` -> pass.
- 2026-05-16: `node .ai/scripts/ctl-api-index.mjs generate --touch` -> pass, generated 177 endpoints.
- 2026-05-16: `node .ai/scripts/ctl-api-index.mjs verify --strict` -> pass.
- 2026-05-16: `pnpm --filter @paper-engineering-assistant/shared typecheck` -> pass.
- 2026-05-16: `pnpm --filter @paper-engineering-assistant/shared test` -> pass.
- 2026-05-16: `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate` -> pass.
- 2026-05-16: `pnpm --filter @paper-engineering-assistant/backend typecheck` -> pass.
- 2026-05-16: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` -> pass.
- 2026-05-16: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` -> initial warning for `in_progress` status enum; changed to `in-progress`.
- 2026-05-16: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` -> pass.
- 2026-05-16: `node .ai/scripts/ctl-api-index.mjs verify --strict && node .ai/scripts/ctl-openapi-quality.mjs verify --strict` -> pass.
- 2026-05-16: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` -> pass.
- 2026-05-16: `node .ai/scripts/ctl-openapi-quality.mjs verify --strict && node .ai/scripts/ctl-api-index.mjs generate --touch && node .ai/scripts/ctl-api-index.mjs verify --strict` -> pass after removing unused component parameter definitions.
- 2026-05-16: `pnpm ci:prisma-smoke -- --base-url "$(sed -n 's/^DATABASE_URL=//p' .env.local)" --schema-prefix t067_v1c --artifacts-dir .ai/.tmp/prisma-smoke-t067` -> pass. Created isolated schema `t067_v1c_20260516_000222_465b`, applied 34 migrations, ran backend node tests (`423` tests, `422` pass, `1` skipped), dropped the smoke schema, and wrote artifacts to `.ai/.tmp/prisma-smoke-t067/20260516-000222`.
- 2026-05-16: `pnpm --filter @paper-engineering-assistant/backend typecheck` -> pass after review fixes.
- 2026-05-16: `DATABASE_URL="$(sed -n 's/^DATABASE_URL=//p' .env.local)" pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-v1c-routes.integration.test.ts` -> expected environment failure because the local dev schema had not applied `20260516100000_add_topic_selection_v1c_downstream_feedback_recheck`; the T-067 Prisma smoke test correctly failed instead of silently skipping.
- 2026-05-16: `node .ai/scripts/ctl-openapi-quality.mjs verify --strict` -> pass after constraining v1c offline dataset `stage` to `v1c`.
- 2026-05-16: `node .ai/scripts/ctl-api-index.mjs generate --touch && node .ai/scripts/ctl-api-index.mjs verify --strict` -> pass, generated 177 endpoints with source checksum `10d71b81260cc1be...`.
- 2026-05-16: `pnpm ci:prisma-smoke -- --base-url "$(sed -n 's/^DATABASE_URL=//p' .env.local)" --schema-prefix t067_v1c_fix --artifacts-dir .ai/.tmp/prisma-smoke-t067-fix` -> pass. Created isolated schema `t067_v1c_fix_20260516_003344_9340`, applied 34 migrations, ran backend node tests (`424` tests, `423` pass, `1` skipped), verified T-067 Prisma HTTP full chain, dropped the smoke schema, and wrote artifacts to `.ai/.tmp/prisma-smoke-t067-fix/20260516-003344`.
- 2026-05-16: `pnpm --filter @paper-engineering-assistant/backend typecheck` -> pass before v1c E2E smoke expansion.
- 2026-05-16: `pnpm ci:prisma-smoke -- --base-url "$(sed -n 's/^DATABASE_URL=//p' .env.local)" --schema-prefix t067_v1c_e2e --artifacts-dir .ai/.tmp/prisma-smoke-v1c-e2e` -> pass. Created isolated schema `t067_v1c_e2e_20260516_004139_6518`, applied 34 migrations, ran backend node tests (`424` tests, `423` pass, `1` skipped), and dropped the schema.
- 2026-05-16: v1c E2E smoke review found a stage-boundary gap in replay write routes: v1c `runs` and `case-results` endpoints were not stage-scoped when supplied existing v1a/v1b dataset/run ids. Added `startRunForStage` and `recordFrozenCaseResultForStage`, and wired the v1c controller to require `v1c`.
- 2026-05-16: `pnpm --filter @paper-engineering-assistant/backend typecheck` -> pass after stage-scoped replay write fix.
- 2026-05-16: `pnpm ci:prisma-smoke -- --base-url "$(sed -n 's/^DATABASE_URL=//p' .env.local)" --schema-prefix t067_v1c_e2e_fix --artifacts-dir .ai/.tmp/prisma-smoke-v1c-e2e-fix` -> pass. Created isolated schema `t067_v1c_e2e_fix_20260516_004411_78c1`, applied 34 migrations, ran backend node tests (`424` tests, `423` pass, `1` skipped), verified expanded v1c HTTP E2E smoke coverage, dropped the schema, and wrote artifacts to `.ai/.tmp/prisma-smoke-v1c-e2e-fix/20260516-004411`.
