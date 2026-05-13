# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-031`

## Goal
- Replace the legacy content-processing contract surface with the canonical semantic stage chain and stale status model.

## Outcome
- Canonical stage order became `CITATION_NORMALIZED -> ABSTRACT_READY -> FULLTEXT_PREPROCESSED -> KEY_CONTENT_READY -> CHUNKED -> EMBEDDED -> INDEXED`.
- `STALE` became a first-class stage status.
- Overview actions were replaced with `process_content`, `process_to_retrievable`, `rebuild_index`, `reextract`, `retry_failed`, and `view_reason`.
- Placeholder abstract/key-content generation was removed from product runtime behavior.

## Retained Context
- `STALE` did not require a Prisma migration because stage/status persistence was string-backed.
- No compatibility aliases or dual action semantics were kept.
