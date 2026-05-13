# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-034`

## Goal
- Replace the key-content digest placeholder with a versioned semantic dossier extractor.

## Outcome
- `KEY_CONTENT_READY` now writes a `KEY_CONTENT_DOSSIER` artifact using `key_content.v1` / `paper_semantic_dossier.v1` contracts.
- Extraction uses structured output, validates source refs against abstract/fulltext anchors, and records ready/partial/failed diagnostics.
- `LiteratureRecord.keyContentDigest` remains display-only, while user-edited content is preserved across reruns.

## Retained Context
- Chunking, embeddings, and retrieval were intentionally deferred to `T-035`/`T-036`.
- Generated summaries are not treated as original abstracts.
