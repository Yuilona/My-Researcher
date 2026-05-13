# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-036`

## Goal
- Implement scenario-based retrieval profiles plus explicit trigger and stale-state UX.

## Outcome
- Retrieve supports `general`, `topic_exploration`, `paper_management`, and `writing_evidence` profiles.
- Retrieval returns provenance, degraded-mode metadata, and stale freshness warnings.
- Desktop overview surfaces stale reasons and lightweight single-literature processing actions without auto-enqueueing runs.
- Settings route redaction was covered while wiring retrieve/settings contracts.

## Retained Context
- Batch backfill operations were deferred to `T-037`.
- Physical per-scenario indexes were intentionally not introduced.
