# 03 Implementation Notes

## Initial Notes
- Use existing title-card as the first practical entrypoint.
- Keep LiteratureResourcePoolSnapshot as a topic-selection input boundary; literature module owns source/content details.
- Large snapshot membership should use paged membership, delta manifest, or artifact manifest rather than one large JSON blob.
- SearchPlan revision requests are emitted by downstream packages but accepted/rejected here through controlled plan versioning.

## Open Questions
- Resolved for this slice: `TopicSeed` maps from title-card `working_title` and `brief`, with optional scope notes; richer constraints/search hints can be added by later workflow payloads without changing the authority identity.
- Resolved for this slice: source health is derived from title-card evidence basket ids, literature records, literature sources, and pipeline state summaries.
- Resolved for this slice: SearchRun execution is modeled as provenance/accounting over stable refs; actual retrieval/index execution remains upstream and raw logs stay artifact-only.

## 2026-05-13 Implementation
- Added shared T-052 contracts and JSON schemas for `TopicSeed`, `LiteratureResourcePoolSnapshot`, `SearchPlan`, coverage child records, `SearchRun`, `SearchPlanRecheckRequest`, and the `SearchPlanCoverageMatrix` read model.
- Added repo-Prisma SSOT models and migration `20260513143000_add_topic_selection_search_resource_inputs`; tables use queryable `titleCardId`, lineage ids, source-health/result-accounting columns, and functional refs without title-card/literature/control-plane foreign-key coupling.
- Added internal backend repository/service layer with in-memory and Prisma adapters. No UI, route, controller, or OpenAPI surface was added.
- Service flow now proves `createTopicSeedFromTitleCard -> createLiteratureResourcePoolSnapshot -> createSearchPlan -> recordSearchRun -> getCoverageMatrix`.
- `SearchRun` is retrieval provenance only. Consumable SearchRuns require source health, result accounting, and stable EvidenceMap input refs; raw search logs can only be attached as artifacts and cannot become EvidenceMap authority refs.
- Coverage child records recorded with a `SearchRun` are rejected unless their `coverage_row_intent_id` belongs to the target `SearchPlan`.
- `SearchPlanRecheckRequest` handling supports accepted, rejected, accepted-risk, and materialized terminal outcomes; materialized outcomes create a revised `SearchPlan` and optional follow-up `SearchRun` linked to the originating request.
- DB context was refreshed from Prisma SSOT via `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`. No target database migration was applied.
