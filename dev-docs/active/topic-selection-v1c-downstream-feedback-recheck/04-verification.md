# 04 Verification

## Planned Checks
- Shared contract schema and export tests.
- Service tests for every loopback target.
- Service tests for no-recheck feedback, warning feedback, and blocking feedback.
- Repository round-trip tests for feedback, classification, recheck refs, and impact summary.
- Isolation test that no v1b/v1c authority service is invoked.

## Exit Commands
- `pnpm --filter @paper-engineering-assistant/shared typecheck`
- `pnpm --filter @paper-engineering-assistant/shared test`
- `pnpm --filter @paper-engineering-assistant/backend prisma:validate`
- `pnpm --filter @paper-engineering-assistant/backend typecheck`
- targeted T-065 service test
- `pnpm --filter @paper-engineering-assistant/backend test`
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
