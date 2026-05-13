# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-033`

## Goal
- Replace placeholder fulltext preprocessing with local asset-backed, source-aligned fulltext artifacts.

## Outcome
- Added explicit content asset registration/listing and normalized fulltext persistence.
- Text/Markdown preprocessing now records sections, paragraphs, offsets, checksums, diagnostics, and stable anchors.
- Unsupported/missing content paths produce explicit diagnostics rather than silently marking success.
- Downstream stages can cite stable source anchors.

## Retained Context
- Semantic interpretation and key-content extraction were deferred to `T-034`.
- Complex rights management and OCR were not implemented in this task.
