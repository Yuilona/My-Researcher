# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-019`

## Goal
- Decompose the monolithic research-lifecycle shared contract file into bounded-context files while preserving existing barrel compatibility.

## Outcome
- `interface-field-contracts.ts` was reduced to a compatibility aggregator.
- Contracts were split into core, paper-project, literature, and auto-pull bounded-context files.
- Shared barrels continued to expose the existing consumer surface, so backend and desktop did not need immediate import migrations.

## Retained Context
- This task intentionally did not remove the compatibility layer; cleanup was handled later by `T-020`.
- Consumer compatibility became an explicit regression concern.
