# 04 Verification

## 2026-05-14
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: registered this package as `T-054`.
- Check: `node .ai/scripts/ctl-project-governance.mjs map --project main --task T-054 --feature F-001 --milestone M-001 --requirement R-009 --apply`.
- Result: mapped this package to `M-001 / F-001 / R-009`.

## Pending
- None for memory/API context closure.
- None for Prisma HTTP smoke when `DATABASE_URL` points at a reachable Postgres database with repo migrations applied.

## 2026-05-14 T-054 Landing
- Check: `pnpm --filter @paper-engineering-assistant/shared typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed, 34 shared tests.
- Check: `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate`.
- Result: passed; Prisma schema is valid.
- Check: `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed.
- Check: targeted v1b HTTP route integration excluding Prisma smoke.
- Result: passed; covered full memory chain, validation, non-advance conflict mapping, and v1b replay metrics/diffs.
- Check: targeted T-060 package handoff regression.
- Result: passed; package draft input now carries T-058-compatible `research_slice_snapshot` identity fields.
- Check: `node .ai/scripts/ctl-openapi-quality.mjs verify --strict`.
- Result: passed.
- Check: `node .ai/scripts/ctl-api-index.mjs generate --touch` and `node .ai/scripts/ctl-api-index.mjs verify --strict`.
- Result: passed; API index now lists 149 endpoints.
- Check: `DATABASE_URL=postgresql://yurui@127.0.0.1:5432/postgres?schema=t054_smoke_20260514230231 pnpm --filter @paper-engineering-assistant/backend test`.
- Result: passed, 363 backend tests total with 362 pass, 1 skip, 0 fail; the always-run T-054 Prisma HTTP smoke passed against an isolated migrated Postgres schema.
- Check: targeted Prisma smoke without `DATABASE_URL`.
- Result: failed explicitly with `DATABASE_URL is required for T-054 Prisma HTTP smoke test.`
- Check: targeted Prisma smoke against an isolated migrated Postgres schema.
- Result: passed; the smoke preflight now fails early unless `DATABASE_URL` is reachable and migrations are applied.
- Check: CI backend test chain.
- Result: `.github/workflows/ci.yml` now runs `pnpm ci:prisma-smoke` inside `backend-checks` with a Postgres service, so the automated backend test chain creates an isolated schema, applies repo migrations, runs full backend tests including the non-skipped T-054 Prisma HTTP smoke, uploads artifacts, and drops the schema. The script injects only the isolated `DATABASE_URL`; repository-mode switching remains owned by the specific smoke test.

## 2026-05-15 Closure Hardening
- Check: v1b replay HTTP schema boundary.
- Result: v1b replay case routes now accept only v1b case types and v1b frozen bundles; v1b replay run routes now accept only v1b metric keys.
- Check: targeted route integration.
- Result: naked targeted route command failed as expected without `DATABASE_URL`; rerun with `.env.local` local Prisma dev DB loaded passed with 5/5, including the non-skipped Prisma HTTP smoke.
- Check: full backend Prisma smoke.
- Result: `pnpm ci:prisma-smoke -- --base-url postgresql://yurui@127.0.0.1:5432/postgres --schema-prefix v1b_hardening --artifacts-dir .ai/.tmp/prisma-smoke-hardening` passed with 364 backend tests total, 363 pass, 1 skip, 0 fail; isolated schema cleanup succeeded.
