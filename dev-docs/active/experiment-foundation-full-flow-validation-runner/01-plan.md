# 01 Plan

## Phase 1 - Inventory and Command Contract
- Confirm the canonical command list from T-090 verification.
- Define the runner CLI shape, flags, and artifact directory convention.
- Classify lanes as `deterministic`, `real_local_db`, and `external_opt_in`.

## Phase 2 - Environment Preflight
- Check `.env.local` presence without printing values.
- Confirm `DATABASE_URL` resolves through the same local env loading path as backend tests.
- Check Postgres connectivity and migration availability.
- Check LocalScript execution root and command allowlist requirements.
- Check required backend/desktop ports or select safe alternatives.

## Phase 3 - Deterministic Runner
- Orchestrate shared checks, backend full suite, desktop checks, T-090 smoke/harness, governance sync/lint, and diff check.
- Capture command exit status, duration, and redacted output summaries.
- Stop early on structural preflight failures; continue per-lane on optional skips.

## Phase 4 - Real-environment Lanes
- Add a disposable-schema or read-only DB smoke lane for registry/readiness/execution records.
- Keep cloud/Aliyun canary opt-in and skipped by default.
- Require explicit environment flags for any real external submission.

## Phase 5 - Report and Handoff
- Emit a redacted Markdown/JSON validation report.
- Document local troubleshooting and rerun instructions.
- Mark T-103 done only after the deterministic lane passes and optional lanes produce correct skipped/blocked/passed states.

## Execution Order
1. Preflight only.
2. Deterministic full-flow local lane.
3. Real local DB lane.
4. Optional external canary lane.
5. Governance and task closure.
