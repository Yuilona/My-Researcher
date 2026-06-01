# 02 Architecture

## Boundary
- Input owner: title-card/topic-selection artifacts remain upstream source authority.
- Research-argument owner: graph/state/readiness, sidecar packet/report assembly, and bridge decision.
- Downstream owner: PaperProject creation and writing lifecycle remain unchanged.

## Backend Shape
- Service methods consume existing shared bridge DTOs:
  - `SeedWorkspaceFromTitleCardRequest`
  - `ReadinessVerifyRequest`
  - `PromoteToPaperProjectRequest`
- Promotion uses a narrow gateway compatible with `CreatePaperProjectRequest`.
- Sidecar objects are represented by `WritingEntryPacket` and `SubmissionRiskReport`, and their stable refs are persisted through `ReportProjection` records.

## Invariants
- Not-ready branches must not call PaperProject creation.
- Duplicate promotion for a workspace with `paper_id` must return existing refs and avoid creating a second PaperProject.
- `title_card_id`, `workspace_id`, and `branch_id` must agree before promotion.
- Sidecar refs must be retrievable through report projections.
- Research-argument must not mutate upstream title-card/topic-selection authority.
