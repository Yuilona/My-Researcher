# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-029`

## Goal
- Separate literature collection/import semantics from explicit content-processing semantics across contracts, backend, desktop, and docs.

## Outcome
- REST paths and DTOs now distinguish collection endpoints from `/literature/:literatureId/content-processing*` endpoints.
- Collection import/Zotero/auto-pull paths only upsert literature/source metadata and no longer enqueue processing runs.
- Explicit content-processing run creation remains the only normal trigger for extraction, chunking, embedding, indexing, activation, and retrieval readiness.
- Old import/pipeline routes intentionally return 404.

## Retained Context
- No Prisma schema migration was required for this boundary rename.
- Old route mentions remain only in negative route tests.
