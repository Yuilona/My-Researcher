# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-017`

## Goal
- Split frontend normalizers and legacy CSS hotspots into clearer domain/style boundaries while preserving cascade and consumer compatibility.

## Outcome
- `normalizers.ts` became a compatibility barrel over domain modules for common, manual import, governance, auto-pull, overview, and metadata normalization.
- `shell.css`, `literature-auto-import.css`, and `literature-manual-import.css` became aggregation entries over smaller style modules with preserved import order.
- Selector, class, `data-ui`, and runtime behavior were preserved; missing `literature-defaults-grid` was restored during post-close hardening.

## Retained Context
- The frozen legacy CSS layer remains subject to the desktop CSS retirement rules; this task only reorganized approved legacy compatibility files.
- Future work should not move feature selectors back into `shell.css`.
