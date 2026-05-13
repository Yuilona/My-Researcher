# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-018`

## Goal
- Split literature frontend container/controller hotspots into view, command, and view-model boundaries without behavior changes.

## Outcome
- `AutoImportTab.tsx` was reduced to a container over topic settings, rule center, and runs/alerts views.
- `useAutoImportController.ts` became a facade over view-model, loader, and command controllers.
- `useManualImportController.ts` became a facade over upload, review, Zotero, submit, and session helpers.
- `App.tsx` wiring was tightened to pass grouped controller objects instead of expanding prop fan-out.

## Retained Context
- CSS and normalizer decomposition was intentionally deferred to `T-017`.
- Public hook/component facade names were preserved to avoid import churn.
