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
- targeted T-066 service test
- `pnpm --filter @paper-engineering-assistant/backend test`
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
