# 04 Verification

## Planned Verification
- `pnpm --filter @paper-engineering-assistant/shared typecheck`
- `pnpm --filter @paper-engineering-assistant/shared test`
- `pnpm --filter @paper-engineering-assistant/backend typecheck`
- `pnpm --filter @paper-engineering-assistant/backend test`
- `pnpm --filter @paper-engineering-assistant/desktop typecheck`
- `pnpm --filter @paper-engineering-assistant/desktop build`
- `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e`
- T-103 runner preflight-only mode
- T-103 runner deterministic mode
- T-103 runner real-local-DB mode when safe
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- `git diff --check`

## Creation Verification - 2026-05-24
- [pass] `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
  - Result: registered T-103 and regenerated project derived views.
- [pass] `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
  - Result: project governance lint passed.
- [pass] `git diff --check`
  - Result: no whitespace errors in the current diff.
