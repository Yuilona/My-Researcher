# 00 Overview

## Status
- State: planned
- Next step: Confirm current evidence basket/extraction structures that can evolve into EvidenceMap/EvidenceUnit.

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
- [ ] EvidenceMap is built from SearchRun refs and claim-level EvidenceUnits.
- [ ] EvidenceUnit locators trace to source/content refs.
- [ ] support/challenge/baseline/context roles are separated.
- [ ] EvidenceStrengthAssessment is target-specific, bundle-first, demand-driven, and cacheable by explicit key.
- [ ] Need-validation package can consume EvidenceMap and strength assessments.
- [ ] Recheck/risk/memory and offline replay can consume evidence freshness, conflict, locator, and source-health refs without parsing summary text.
