# 00 Overview

## Status
- State: in-progress
- Next step: Handoff stable EvidenceMap/EvidenceUnit/assessment refs to `topic-selection-v1a-need-validation`.
- Implementation: internal shared-contract/backend slice landed on 2026-05-13; no UI, REST API, OpenAPI, NeedCandidate, ValidatedNeed, v1b, or v1c behavior added; no target DB migration applied.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1a-evidence-to-need/`
- Architecture parent: `dev-docs/active/topic-selection-decision-chain-redesign/`

## Goal
- Implement the v1a evidence layer from SearchRun outputs to claim-level EvidenceMap/EvidenceUnit and demand-driven EvidenceStrengthAssessment.

## Non-goals
- Do not generate NeedCandidate or ValidatedNeed in this package.
- Do not score papers globally.
- Do not precompute every EvidenceUnit against every possible target.

## Owned Scope
- `EvidenceMap`
- `EvidenceUnit`
- `TypedLink` / `Cluster` / `Pattern` / `ConflictSet` thin records where needed
- Evidence pollution controls
- EvidenceUnit locator/source provenance
- `EvidenceStrengthAssessment`
- Evidence strength trigger/cache/stale rules

## Acceptance Criteria
- [x] EvidenceMap is built from SearchRun refs and claim-level EvidenceUnits.
- [x] EvidenceUnit locators trace to source/content refs.
- [x] support/challenge/baseline/context roles are separated.
- [x] EvidenceStrengthAssessment is target-specific, bundle-first, demand-driven, and cacheable by explicit key.
- [x] Need-validation package can consume EvidenceMap and strength assessments.
- [x] Recheck/risk/memory and offline replay can consume evidence freshness, conflict, locator, and source-health refs without parsing summary text.
