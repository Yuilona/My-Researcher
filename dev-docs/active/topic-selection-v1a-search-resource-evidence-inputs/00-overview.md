# 00 Overview

## Status
- State: planned
- Next step: Confirm existing title-card and literature module contracts that can feed v1a.

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
- [ ] A title-card/topic seed can produce a versioned `TopicSeed`.
- [ ] A concrete `LiteratureResourcePoolSnapshot` is referenced by SearchPlan and SearchRun.
- [ ] SearchPlan coverage child records are persisted and can render a matrix view.
- [ ] SearchRun records query/run provenance, result accounting, source health, and artifact refs.
- [ ] A `SearchPlanRecheckRequest` from need validation or recheck queue can be accepted, rejected, or converted into a revised `SearchPlan` plus follow-up `SearchRun`.
- [ ] EvidenceMap package can consume SearchRun outputs without using raw search logs as authority.
