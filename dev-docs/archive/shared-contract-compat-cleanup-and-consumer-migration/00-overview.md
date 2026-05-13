# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-020`

## Goal
- Remove the shared contract compatibility layer and migrate backend consumers to filename-aligned public subpath imports.

## Outcome
- Shared package exports now provide filename-aligned public subpaths for split research-lifecycle contract files.
- `interface-field-contracts.ts` was removed, and `research-lifecycle/index.ts` re-exports split modules directly.
- Backend code was migrated off the shared package root import; a static boundary test now blocks regression.

## Retained Context
- The shared root entry remains available as package-level compatibility for non-backend consumers.
- Desktop/frontend migration was out of scope.
