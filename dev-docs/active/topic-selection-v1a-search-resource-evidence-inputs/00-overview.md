# 00 Overview

## Status
- State: in-progress
- Next step: Keep stable `SearchRun` refs and coverage matrix contracts available for T-047/T-049 consumers; T-047 has consumed the T-052 SearchRun handoff.
- Implementation: internal shared-contract/backend slice landed on 2026-05-13; no UI or REST API added; no target DB migration applied.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1a-evidence-to-need/`
- Architecture parent: `dev-docs/active/topic-selection-decision-chain-redesign/`

## Goal
- Implement the v1a entry and search input layer from title-card/topic seed and literature resources through `SearchPlan` and `SearchRun`.
- Produce stable search/resource/evidence-input refs that `EvidenceMap` can consume.

## Non-goals
- Do not build EvidenceMap/EvidenceUnit extraction in this package.
- Do not adjudicate needs.
- Do not implement full SearchPlanCoverageMatrix as an authority table.

## Owned Scope
- title-card/topic seed adapter
- `TopicSeed`
- `LiteratureResourcePoolSnapshot`
- Literature -> TopicSelection snapshot/content/source-health contracts
- `SearchPlan`
- coverage child records
- `SearchPlanCoverageMatrix` view/read model
- `SearchRun`
- SearchRun accounting and source-health summary
- `SearchPlanRecheckRequest` handling: accept/reject/materialize revised `SearchPlan` and follow-up `SearchRun`

## Acceptance Criteria
- [x] A title-card/topic seed can produce a versioned `TopicSeed`.
- [x] A concrete `LiteratureResourcePoolSnapshot` is referenced by SearchPlan and SearchRun.
- [x] SearchPlan coverage child records are persisted and can render a matrix view.
- [x] SearchRun records query/run provenance, result accounting, source health, and artifact refs.
- [x] A `SearchPlanRecheckRequest` from need validation or recheck queue can be accepted, rejected, or converted into a revised `SearchPlan` plus follow-up `SearchRun`.
- [x] EvidenceMap package can consume SearchRun outputs without using raw search logs as authority.
