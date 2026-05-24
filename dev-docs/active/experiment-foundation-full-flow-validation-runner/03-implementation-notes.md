# 03 Implementation Notes

## Creation - 2026-05-24
- Created T-103 as the post-V1 validation runner package following T-090 closure.
- T-103 owns one-command orchestration and environment preflight, not product semantics.
- Default validation should remain credential-free except for local `.env.local` database connectivity already used by the backend full suite.
- Real Aliyun/cloud canary remains opt-in and must report skipped/blocked/passed separately.

## Phase 1 Command Contract - 2026-05-24
- Added `.ai/scripts/experiment-foundation-full-flow-runner.mjs` as the durable runner entry.
- Added root package script `experiment-foundation:full-flow`.
- Phase 1 only supports successful `contract` mode.
  - `preflight`, `deterministic`, `real-local-db`, and `full` write `NOT_IMPLEMENTED` artifacts and exit non-zero.
  - No environment variables are loaded, no DB connection is attempted, no services are started, and no cloud/external adapter path is invoked.
- Contract-mode artifacts are written under `.ai/.tmp/experiment-foundation-full-flow/<run-id>/`.
  - `00-command-contract.md`
  - `01-lane-manifest.json`
  - `02-validation-report.md`
  - `03-blockers.md`
- The lane manifest records the deterministic command inventory for shared/backend/desktop/T-090/governance/diff checks, but marks every command as `phase_1_execution = not_executed`.

## Phase 2 Preflight - 2026-05-24
- Implemented `--mode preflight` in `.ai/scripts/experiment-foundation-full-flow-runner.mjs`.
- The preflight checks:
  - root `.env.local` presence;
  - `DATABASE_URL` local env resolution and URL parsing;
  - Postgres connectivity through Prisma `SELECT 1`;
  - Prisma migration status through `pnpm exec prisma migrate status --schema prisma/schema.prisma`;
  - LocalScript root/enabled/allowlist readiness;
  - desktop smoke backend and renderer port availability;
  - external canary credential readiness only when explicitly requested.
- Preflight writes `04-preflight.md` and `05-preflight.json` in addition to the existing command contract, manifest, validation report, and blockers files.
- The implementation stores only key presence, source names, statuses, durations, and action text. It does not store raw `DATABASE_URL`, provider keys, credential paths, Prisma output, SDK payloads, or logs.
- Current local run result: `PREFLIGHT_FAILED` because Prisma reports unapplied repo migrations. Postgres connectivity itself passed.
