# 04 Verification

## Planned Verification
### Baseline checks
- `pnpm --filter @paper-engineering-assistant/shared typecheck`
- `pnpm --filter @paper-engineering-assistant/shared test`
- `pnpm --filter @paper-engineering-assistant/backend typecheck`
- targeted experiment foundation backend route/service tests
- `pnpm --filter @paper-engineering-assistant/desktop typecheck`

### Capability validation checks
- backend scenario test suite for registry/readiness/promotion/execution/result/evidence paths
- LocalScript safe execution suite
- mocked Aliyun mirror/policy/checksum suite
- result/evidence/sidecar robustness suite
- adjacent workflow no-copy/no-second-track suite
- desktop smoke/e2e for `实验基座` operator workflow

### Optional environment checks
- Prisma/live DB smoke with `DATABASE_URL` and migrated test DB
- browser/manual smoke only when the desktop dev environment is available

### Governance
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- `git diff --check`

## Creation Verification - 2026-05-19
- [pass] `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
  - Result: registered `T-090 experiment-foundation-capability-validation` and regenerated project derived views.
- [pass] registry mapping corrected to `M-001 > F-001 > R-012 > T-090`, then sync regenerated derived views.
- [pass] `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
  - Result: project governance lint passed.
- [pass] `git diff --check`
  - Result: no whitespace errors in current diff.

## Test Matrix Sync - 2026-05-20
- [pass] `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- [pass] `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- [pass] `git diff --check`

## Harness / Fixture Design Sync - 2026-05-20
- [pass] `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- [pass] `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- [pass] `git diff --check`

## Critical-node Deep-test Sync - 2026-05-20
- [pass] `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- [pass] `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- [pass] `git diff --check`
