# 01 Plan

## Phase 1 - Alignment And Test Matrix
- Status: aligned; deterministic mock coverage expanded in the backend suite. Real E2E harness remains pending.
- Confirm roadmap scope and milestone order.
- Convert the quality baseline into a test matrix:
  - source discovery
  - metadata import
  - fulltext acquisition
  - content processing stages
  - retrieve
  - stale/backfill/cleanup
- Decide which real external dependencies are allowed in CI-like local runs.

## Phase 2 - Source And Scorer Hardening
- Status: partially implemented. Acquisition settings now carry source throttles and an OpenAI quality-scorer profile; source cooldown/runtime persistence exists for fulltext acquisition. Broader auto-pull source pacing remains pending.
- Add source-specific rate/backoff behavior.
- Improve run summaries and alert taxonomy for fetch/import/scoring boundaries.
- Implement or integrate a real scorer profile with deterministic fallback behavior.
- Add unit and route tests for source/scorer failures.

## Phase 3 - Fulltext Acquisition Hardening
- Status: foundation implemented. Durable fulltext acquisition APIs, Prisma persistence, arXiv/Unpaywall/explicit URL planning, and download safety tests are in place.
- Extend URL resolver and download safety.
- Add SSRF/redirect/size/mime/timeout tests.
- Add asset acquisition diagnostics and UI-visible status.
- Decide whether batch downloads are synchronous or durable jobs.

## Phase 4 - Parser And Extraction Quality Gates
- Status: unchanged except existing GROBID health/OCR blocker behavior remains covered by backend tests.
- Harden GROBID health/version diagnostics.
- Add parser failure fixtures.
- Add key-content evaluator and real OpenAI smoke path.
- Preserve user edits through extraction reruns.

## Phase 5 - Retrieval Evaluation
- Status: stale-index isolation implemented in retrieve; seeded recall evaluator remains pending.
- Create seeded retrieval evaluation set.
- Add evaluator script and thresholds.
- Tune retrieve profiles without changing the physical index split.
- Record relevance, provenance, and degraded-mode evidence.

## Phase 6 - Temporary Postgres Batch E2E
- Create a temporary schema test harness.
- Run batch ingestion/download/process/index/retrieve.
- Cover stale propagation, retry, partial failure, and cleanup dry-run.
- Record artifacts under `04-verification.md`.

## Phase 7 - Desktop And Operator UX
- Surface missing prerequisites and recovery actions.
- Surface acquisition/download/parser/scorer status.
- Keep UI changes on the data-ui/token path; do not extend frozen legacy CSS.

## Phase 8 - Cutover Review
- Run final verification suite.
- Update OpenAPI/API index/context.
- Split remaining non-blocking work into explicit follow-on tasks.
- Mark this task complete only after the roadmap's release gate passes.

## Initial Acceptance Gates
- Gate A: roadmap accepted.
- Gate B: local E2E harness accepted.
- Gate C: source/scorer/download hardening accepted.
- Gate D: real PDF + real OpenAI processing accepted.
- Gate E: temporary Postgres batch E2E accepted.
- Gate F: release/cutover evidence accepted.
