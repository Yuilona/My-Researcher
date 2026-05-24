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

## Phase 1 Command-contract Verification - 2026-05-24
- [pass] `node --check .ai/scripts/experiment-foundation-full-flow-runner.mjs`
  - Result: runner script syntax check passed.
- [pass] `node .ai/scripts/experiment-foundation-full-flow-runner.mjs --help`
  - Result: CLI help printed supported options and Phase 1 contract-mode boundary.
- [pass] `node .ai/scripts/experiment-foundation-full-flow-runner.mjs --mode contract --run-id t103-phase1-smoke`
  - Result: contract-mode runner exited 0 and wrote the expected artifact set.
- [pass] `pnpm experiment-foundation:full-flow -- --mode contract --run-id t103-phase1-package-smoke`
  - Result: root package script exited 0 and wrote the expected artifact set.
- [pass] artifact file check under `.ai/.tmp/experiment-foundation-full-flow/t103-phase1-smoke` and `.ai/.tmp/experiment-foundation-full-flow/t103-phase1-package-smoke`
  - Result: each run produced `00-command-contract.md`, `01-lane-manifest.json`, `02-validation-report.md`, and `03-blockers.md`.
- [pass] redaction spot-check
  - Result: artifacts contain only key names and contract text; no raw database URL or provider key values are stored.
- [pass] `node .ai/scripts/experiment-foundation-full-flow-runner.mjs --mode preflight --run-id t103-phase1-not-implemented`
  - Result: command wrote `NOT_IMPLEMENTED` artifacts and exited non-zero as intended for non-contract modes in Phase 1.
- [pass] `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
  - Result: T-103 status propagated to `in-progress` in project governance views.
- [pass] `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
  - Result: project governance lint passed.
- [pass] `git diff --check`
  - Result: no whitespace errors in the current diff.
