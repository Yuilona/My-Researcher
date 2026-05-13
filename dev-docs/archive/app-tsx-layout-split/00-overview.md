# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-012`

## Goal
- Split `App.tsx` and desktop layout responsibilities while preserving user-visible behavior.

## Outcome
- `App.tsx` was reduced to orchestration: governance control moved to `shell/useGovernancePanelController.ts`, shell/dashboard derivations moved into shell hooks, and literature composition moved to `literature/LiteratureWorkspace.tsx`.
- Auto/manual import business handlers and overview actions were moved into feature controllers; REST paths, UI semantics, classes, and `data-ui` behavior were not changed.

## Retained Context
- This was Wave 1A of the maintainability split and deliberately avoided deeper container/controller and CSS work.
- Further container/controller cleanup was handed to `T-018`.
