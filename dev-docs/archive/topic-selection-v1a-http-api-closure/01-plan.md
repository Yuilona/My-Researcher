# 01 Plan

## Phase 1 - API Surface
- Add a v1a controller that wraps existing topic-selection services and maps `AppError` to the backend error envelope.
- Add route schemas for the v1a main chain and support endpoints.
- Register routes under `/topic-selection/v1a/*`.

## Phase 2 - App Wiring
- Instantiate the v1a repositories/services in `buildApp()`.
- Use the existing memory/prisma repository strategy so API tests can run in memory and local DB runs can use Prisma.

## Phase 3 - Verification
- Add route integration tests using `buildApp().inject()`.
- Cover one full evidence-to-need validation path and one schema validation failure.
- Run backend typecheck/test and governance sync/lint.

## Acceptance Checks
- `pnpm --filter @paper-engineering-assistant/backend typecheck`
- `pnpm --filter @paper-engineering-assistant/backend test`
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
