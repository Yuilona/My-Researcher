# 02 Architecture

## Boundary
This package owns entry normalization and search/resource provenance. It ends at SearchRun outputs ready for EvidenceMap.

## Flow
```text
TitleCard intent
  -> TopicSeed
  -> LiteratureResourcePoolSnapshot
  -> SearchPlan
  -> coverage child records
  -> SearchRun
  -> EvidenceMap input refs
```

## Authority Objects
- `TopicSeed`
- `LiteratureResourcePoolSnapshot`
- `SearchPlan`
- `SearchPlanRecheckRequest` handling record or revision link
- `CoverageRowIntent`
- `CoverageExecutionObservation`
- `CoverageEvidenceBinding`
- `CoverageAssessment`
- `CoverageRiskAcceptance`
- `SearchRun`

## Views
- `SearchPlanCoverageMatrix` is a reviewer-facing view/read model over coverage child records.

## Invariants
- `SearchPlanCoverageMatrix` is not the authority table.
- `SearchPlan` and `SearchRun` must reference a concrete literature snapshot.
- Source health and missing fulltext states must be queryable.
- SearchRun does not create evidence claims; it creates retrieval/execution provenance for EvidenceMap.

## Recheck Interface
- Need validation emits `SearchPlanRecheckRequest` when candidate/adjudication gaps require new or corrected coverage.
- Recheck/risk/memory may queue, deduplicate, or attach accepted risk to the request.
- This package owns the decision to accept, reject, or materialize the request as a revised `SearchPlan` and follow-up `SearchRun`.
- Rejected or accepted-risk outcomes must remain traceable to the originating request and policy decision.

## Downstream Contract
EvidenceMap consumes SearchRun refs, source/content refs, source health, dedup/canonical refs, and coverage observations.
