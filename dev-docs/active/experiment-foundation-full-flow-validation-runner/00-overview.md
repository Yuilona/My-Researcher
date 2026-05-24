# T-103 Experiment Foundation Full-flow Validation Runner

## Status
- State: planned
- Task: T-103
- Current focus: define a repeatable post-V1 validation runner that proves the closed experiment-foundation chain can run end to end in a real local environment.

## Goal
- Provide one operator-facing command for experiment-foundation full-flow validation.
- Preflight `.env.local`, Postgres connectivity, applied migrations, LocalScript execution root, and required backend/desktop ports before running expensive checks.
- Run deterministic harness lanes for shared contracts, backend registry/readiness/promotion/execution/result/evidence, desktop smoke, and governance.
- Add opt-in real-environment lanes for local Postgres smoke and future Aliyun canary without making credentials or cloud spend part of the default suite.
- Emit a redacted validation report that separates deterministic checks, real local DB checks, and external opt-in checks.

## Non-goals
- Do not add new experiment-foundation product semantics.
- Do not implement real Aliyun SDK credential handling in the default lane.
- Do not replace existing shared/backend/desktop unit and route suites.
- Do not reset or mutate the developer's local database outside explicit disposable-schema checks.
- Do not commit secrets, raw datasets, checkpoints, logs, SDK payloads, or cloud credentials.

## Acceptance Criteria
- [ ] A durable runner exists under the repo script/tooling path and can be executed by a single command.
- [ ] Runner preflight reports missing `DATABASE_URL`, unreachable Postgres, unapplied migrations, missing LocalScript root, occupied ports, and missing opt-in credentials without leaking secret values.
- [ ] Default lane runs shared typecheck/test, backend full test, desktop typecheck/build/smoke, T-090 harness coverage, governance sync/lint, and `git diff --check`.
- [ ] Real DB lane uses `.env.local` and a disposable schema or explicitly read-only smoke pattern; it must not require destructive operations on the developer's normal schema.
- [ ] Optional external canary lane is off by default and records skipped/blocked/passed status separately from deterministic validation.
- [ ] Validation report is written to a redacted artifact directory with command results, durations, environment summary, and actionable blockers.
- [ ] T-103 docs record how the runner consumes T-090 harness fixtures without duplicating readiness, promotion, materialization, adapter, or result-validation semantics.

## Handoff
- Start by inventorying current commands from T-090 and backend env runner behavior.
- Then implement the smallest runner that can preflight and orchestrate the deterministic local lanes.
