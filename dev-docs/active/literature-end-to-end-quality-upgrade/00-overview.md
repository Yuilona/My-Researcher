# 00 Overview

## Status
- State: in-progress
- Parent: `T-030 literature-content-processing-landing-roadmap`
- Related: `T-011 literature-management-flow`, `T-029 literature-collection-content-processing-boundary`, `T-037 literature-backfill-operations-workbench`, `T-040 literature-content-processing-closure-fixes`
- Next step: apply the new Prisma migration to a temporary Postgres schema and run the local real-dependency E2E suite.

## Goal
- Upgrade the literature module from "functionally complete" to "reliable full-chain operation" across web discovery, metadata import, fulltext acquisition, parsing, semantic extraction, chunking, embedding, indexing, retrieval, stale handling, backfill, and cutover verification.
- Turn the current manual E2E evidence into repeatable local and temporary-Postgres E2E suites with quality gates.
- Harden the weakest links found during real-flow testing: source rate limits, quality scoring, URL download safety, PDF discovery, batch reliability, observability, and retrieval quality measurement.

## Current Baseline
- Collection and content-processing are separated at public boundaries.
- Auto-pull can query Crossref/arXiv/Zotero through rule runs.
- Content assets support local-path registration and now URL download into local raw-file storage.
- GROBID-backed PDF preprocessing works when a local GROBID service is running.
- Explicit content-processing runs can reach `INDEXED` and retrieval with OpenAI embeddings.
- Backfill and cleanup dry-runs exist and protect active versions/raw assets.

## Quality Assessment Baseline
- Strong:
  - citation/abstract readiness, explicit stage ordering, local asset registration, stage state visibility, retrieval against active embedding versions.
- Adequate:
  - GROBID PDF preprocessing, key-content/chunk/embedding/index implementation, backfill dry-runs.
- Weak:
  - arXiv rate-limit handling, real quality scorer setup, fulltext URL discovery, synchronous remote download robustness, SSRF/redirect controls, large-batch E2E, retrieval relevance metrics, production run observability.

## Non-goals
- Do not merge collection and content-processing semantics.
- Do not replace the seven-stage content-processing model.
- Do not make OpenAI Vector Store the primary retrieval SSOT.
- Do not auto-start Docker/GROBID from backend business logic.
- Do not implement broad cloud sync or multi-user permissions in this task.
- Do not ship destructive cleanup automation without dry-run and active-version protection.

## Scope
- Web discovery and import reliability.
- Remote fulltext acquisition and URL/PDF resolver quality.
- Download security and rights-aware asset registration.
- GROBID/parser/OCR readiness policy.
- Key-content extraction quality and provenance gates.
- Chunk/embedding/index/retrieve quality evaluation.
- Batch backfill reliability, cost/rate controls, and observability.
- Local E2E and temporary Postgres E2E harnesses.

## Acceptance Criteria
- [x] Roadmap is aligned with explicit milestone gates.
- [ ] Local E2E harness can run from discovery/import through retrieval using real dependencies where configured.
- [ ] Temporary Postgres E2E suite can run without contaminating default schemas.
- [ ] Source rate limits are handled with retry/backoff and source-specific pacing.
- [x] Remote download has SSRF/redirect/size/type safety gates and repeatable tests.
- [x] Fulltext acquisition can resolve arXiv PDF URLs and has a documented DOI/fulltext strategy.
- [ ] Real quality scorer and real OpenAI content-processing paths are tested separately from mocks.
- [ ] Retrieval quality is measured with a seeded evaluation set and pass/fail thresholds.
- [ ] Backfill/cutover verification covers multi-literature batches, stale states, partial failures, and cleanup protection.
