# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-035`

## Goal
- Replace placeholder chunking/hash embeddings/token-only index with deterministic chunks, OpenAI embeddings, local indexes, and active version lifecycle.

## Outcome
- Added flat classified chunks with stable ids and provenance.
- OpenAI Embeddings API became the normal embedding provider path through configured profiles.
- `EMBEDDED` creates inactive ready embedding versions; `INDEXED` activates a version only after index build and smoke checks.
- Old hash embedding behavior was removed from the normal implementation.

## Retained Context
- OpenAI Vector Store is not the authoritative retrieval store.
- Retrieve profile UI was deferred to `T-036`.
