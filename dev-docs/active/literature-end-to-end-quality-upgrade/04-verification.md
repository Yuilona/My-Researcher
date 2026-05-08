# 04 Verification

## 2026-05-08 - Task Package Creation

- Created task package under `dev-docs/active/literature-end-to-end-quality-upgrade/`.
- `node .ai/scripts/ctl-project-governance.mjs sync --apply` passed and registered `T-041`.
- `node .ai/scripts/ctl-project-governance.mjs lint --check` passed after normalizing historical `T-040` status from `completed` to `done`.
- Roadmap alignment was completed before the foundation implementation pass.

## 2026-05-08 - Foundation Implementation Pass

- `pnpm --filter @paper-engineering-assistant/shared typecheck` passed.
- `pnpm --filter @paper-engineering-assistant/backend typecheck` passed.
- `pnpm --filter @paper-engineering-assistant/desktop typecheck` passed.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate` passed.
- `pnpm --filter @paper-engineering-assistant/backend test` passed: 168/168.
- `node .ai/scripts/ctl-api-index.mjs verify` passed after regenerating API index from OpenAPI.
- `node .ai/scripts/ctl-openapi-quality.mjs verify --source docs/context/api/openapi.yaml --strict` passed.
- `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict` passed.
- `node .ai/scripts/ctl-db-ssot.mjs sync-to-context` passed and refreshed `docs/context/db/schema.json`.
- DB migration apply was intentionally not run; approval-gated evidence is recorded under `artifacts/db/`.

### Mock Coverage Added

- Literature acquisition settings persist Unpaywall/downloader configuration.
- Manual content-asset download enforces persisted acquisition downloader limits even when a larger per-request limit is supplied.
- Manual content-asset download records redirect-chain provenance and blocks redirect-to-localhost before following it.
- Manual content-asset download rejects localhost before fetch.
- Fulltext acquisition job downloads an arXiv PDF URL as a separate acquisition job.
- Fulltext acquisition worker uses persisted source throttle/cooldown state for request-start pacing and in-process concurrency slots.
- Retrieval excludes stale indexes by default and includes them only with `include_stale`.

## Planned Verification Suite

- Static:
  - `pnpm --filter @paper-engineering-assistant/shared typecheck`
  - `pnpm --filter @paper-engineering-assistant/backend typecheck`
  - `pnpm --filter @paper-engineering-assistant/desktop typecheck`
  - `node .ai/scripts/ctl-api-index.mjs verify`
  - `node .ai/scripts/ctl-openapi-quality.mjs verify --source docs/context/api/openapi.yaml --strict`
  - `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict`
- Unit/integration:
  - `pnpm --filter @paper-engineering-assistant/backend test`
  - targeted route/service tests for source, scorer, download, parser, backfill, retrieve.
- Local real-dependency smoke:
  - Docker GROBID ready.
  - OpenAI key configured in settings.
  - real arXiv PDF download and preprocess.
  - real Crossref metadata import.
- Temporary Postgres E2E:
  - temp schema migration.
  - batch import/download/process/index/retrieve.
  - cleanup and schema teardown.

## 2026-05-08 - Code Quality Follow-up

- `pnpm --filter @paper-engineering-assistant/backend typecheck` passed after downloader-limit and source-throttle attribution fixes.
- `pnpm --filter @paper-engineering-assistant/backend test` passed: 168/168.
- `git diff --check` passed.
- Repository cleanup scan found no `.tmp`, `.log`, `.bak`, `.orig`, `.DS_Store`, or editor-backup files outside ignored/generated paths.

## 2026-05-08 - Local Real-Dependency E2E Rerun

- Environment:
  - Temporary Postgres schema: `lit_e2e_20260508T133047Z`.
  - Docker GROBID: `http://localhost:8070`, version `0.9.0`.
  - OpenAI key: loaded from local persisted desktop settings; not written into repo evidence.
  - Real sources: arXiv, Crossref, arXiv PDF download.
- Evidence:
  - Report JSON: `.ai/.tmp/literature-e2e/20260508T133047Z-t041-full-chain/report.json`.
  - Report Markdown: `.ai/.tmp/literature-e2e/20260508T133047Z-t041-full-chain/report.md`.
  - Crossref smoke: `.ai/.tmp/literature-e2e/20260508T133047Z-t041-full-chain/crossref-smoke.json`.
- Result:
  - Overall report status is `PARTIAL` because real arXiv search import returned HTTP 429 and was mapped to `SOURCE_RATE_LIMIT`.
  - Downstream fulltext/content/retrieval chain passed after known arXiv metadata fallback:
    - GROBID dependency health passed.
    - Content-processing and acquisition settings persisted and redacted the OpenAI key.
    - Fulltext acquisition dry-run selected `https://arxiv.org/pdf/1706.03762`.
    - Fulltext acquisition job downloaded and registered the raw fulltext asset.
    - Full content-processing run reached `SUCCESS`.
    - Fresh retrieval returned results.
    - Stale retrieval isolation passed: default retrieval excluded stale index; diagnostic `include_stale` could see it.
    - Backfill dry-run detected stale work, backfill rerun succeeded, and retrieval after backfill returned results.
  - Crossref real source smoke passed separately:
    - Run status: `SUCCESS`.
    - Source attempt: `CROSSREF` `PARTIAL`, fetched 5, imported 1, failed/rejected 4 by deterministic completeness/signal filters.
    - OpenAI quality scorer path was exercised; `llm_score_avg` recorded as `8`.
- Cleanup:
  - Temporary schema `lit_e2e_20260508T133047Z` was dropped after evidence capture.
- Product fix found by this rerun:
  - Real backfill initially failed by timing out while waiting for the content-processing run.
  - `LiteratureBackfillService` now uses a configurable `contentRunTimeoutMs` with a 15 minute default, fails timed-out items explicitly, and closes running items if the worker fails.
- Verification after fix:
  - `node --loader ts-node/esm src/services/literature-backfill-service.unit.test.ts` passed: 12/12.
  - `pnpm --filter @paper-engineering-assistant/backend typecheck` passed.
  - `pnpm --filter @paper-engineering-assistant/backend test` passed: 169/169.

## 2026-05-08 - Pre-commit Quality Review

- Fixes applied:
  - Aligned fulltext acquisition dry-run `max_byte_size` with the persisted downloader hard cap.
  - Replaced unbounded download body buffering with streaming limit enforcement.
  - Covered IPv4-mapped localhost rejection in download safety tests.
  - Added fulltext acquisition worker convergence for interrupted/running items.
  - Tightened desktop OpenAI-key IPC clear semantics and encrypted-file permissions.
- Verification:
  - `node --loader ts-node/esm src/routes/research-lifecycle-routes.integration.test.ts` passed: 16/16.
  - `pnpm --filter @paper-engineering-assistant/backend typecheck` passed.
  - `pnpm --filter @paper-engineering-assistant/desktop typecheck` passed.
  - `pnpm --filter @paper-engineering-assistant/backend test` passed: 170/170.
  - `pnpm --filter @paper-engineering-assistant/shared typecheck` passed.
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate` passed.
  - `pnpm --filter @paper-engineering-assistant/desktop build` passed and refreshed tracked desktop dist files.
  - `node .ai/scripts/ctl-api-index.mjs verify` passed.
  - `node .ai/scripts/ctl-openapi-quality.mjs verify --source docs/context/api/openapi.yaml --strict` passed.
  - `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict` passed.
  - `node .ai/scripts/ctl-project-governance.mjs lint --check` passed.
  - `git diff --check` passed.
  - Repository cleanup scan found no `.tmp`, `.log`, `.bak`, `.orig`, `.DS_Store`, or editor-backup files outside ignored/generated paths.
