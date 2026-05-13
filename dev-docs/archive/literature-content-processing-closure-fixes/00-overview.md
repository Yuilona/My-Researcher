# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-040`

## Goal
- Close post-review content-processing gaps around public DTO naming, active embedding profile retrieval, storage-root consumption, GROBID PDF preprocessing, and paper-level consolidation.

## Outcome
- Public backfill DTO/OpenAPI/frontend now use `content_processing_run_id` only.
- Retrieval embeds and ranks against the configured active embedding profile instead of mixing vector spaces.
- Content-processing outputs now materialize through storage-root-backed file refs with checksums.
- PDF `FULLTEXT_PREPROCESSED` calls configured GROBID, persists TEI/normalized text/source anchors, and reports parser unavailable or OCR-required blockers explicitly.
- `KEY_CONTENT_READY` now runs paper-level consolidation after section extraction.

## Retained Context
- Backend does not auto-start or manage GROBID.
- OCR for scanned PDFs and visual semantic interpretation remain explicit future work.
