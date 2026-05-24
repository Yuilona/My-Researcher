# 02 Architecture

## Runner Boundary
The runner is an orchestration and evidence tool. It must call existing commands and APIs; it must not reimplement experiment-foundation domain decisions.

| Area | Runner responsibility | Not runner responsibility |
| --- | --- | --- |
| Shared contracts | execute existing typecheck/test | define new DTO schemas |
| Backend | run full suite and targeted API harness | duplicate readiness/promotion/materialization logic |
| Desktop | run typecheck/build/smoke | own renderer domain state |
| DB | verify connectivity and safe smoke schema | reset developer data |
| External | report opt-in canary readiness | make cloud credentials mandatory |
| Evidence | write redacted report | store secrets or raw artifacts |

## Lanes
| Lane | Default | Purpose | Failure semantics |
| --- | --- | --- | --- |
| `preflight` | yes | prove local prerequisites before expensive checks | blocker |
| `deterministic` | yes | prove repeatable repo-local full flow | blocker |
| `real_local_db` | yes when `DATABASE_URL` is available | prove local Postgres path works safely | blocker only when explicitly requested |
| `external_opt_in` | no | prove real external provider/cloud path | skipped unless enabled |

## Artifact Contract
- Artifact root should be under `.ai/.tmp/experiment-foundation-full-flow/<run-id>/`.
- Report files must be redacted and safe to share in dev-docs.
- Contract-mode outputs:
  - `00-command-contract.md`
  - `01-lane-manifest.json`
  - `02-validation-report.md`
  - `03-blockers.md`
- Preflight-mode adds:
  - `04-preflight.md`
  - `05-preflight.json`

## CLI Contract
- Script: `.ai/scripts/experiment-foundation-full-flow-runner.mjs`
- Package entry: `pnpm experiment-foundation:full-flow -- <options>`
- Supported flags:
  - `--mode <contract|preflight|deterministic|real-local-db|full>`; default `contract`
  - `--run-id <id>`; default timestamped run id
  - `--artifact-dir <path>`; default `.ai/.tmp/experiment-foundation-full-flow/<run-id>`
  - `--include-external-canary`; default false
  - `--require-real-db`; default false
- `contract` and `preflight` are implemented.
- `deterministic`, `real-local-db`, and `full` still write a `NOT_IMPLEMENTED` report and exit non-zero until later phases.

## Preflight Checks
- `.env.local` presence is a blocker when missing.
- `DATABASE_URL` is loaded with explicit env first, then repo/backend local env files; only source and parse status are recorded.
- Postgres connectivity is checked with a lightweight Prisma `SELECT 1`.
- Migration status is checked with `pnpm exec prisma migrate status --schema prisma/schema.prisma`; raw command output is not stored.
- LocalScript root/enabled/allowlist gaps are warnings in Phase 2 because deterministic tests install isolated test env overrides.
- Desktop smoke backend/renderer ports are probed; occupied default ports become warnings when a nearby alternative is available.
- External canary credentials are skipped by default and become blockers only when `--include-external-canary` is requested.

## Lane Manifest Shape
The contract-mode runner writes a JSON manifest with:
- runner id/version, task id, run id, mode, artifact dir, and flags;
- lane definitions for `preflight`, `deterministic`, `real-local-db`, and `external-opt-in`;
- deterministic command inventory with command ids, cwd, argv, and display string;
- phase marker and mode-specific artifact file list.

## Anti-drift Rules
- Do not duplicate T-090 fixture graph construction outside the existing harness unless an explicit reusable helper is extracted.
- Do not synthesize canonical DTOs in the runner; use the registry/API/service tests that already own those payloads.
- Do not treat skipped external canary as a deterministic failure.
- Do not print full `DATABASE_URL`, provider keys, cloud endpoints with tokens, SDK payloads, or local credential paths.
