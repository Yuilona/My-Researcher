# 03 Implementation Notes

## Current Decisions
- This package is a stage-level coordinator. It should not become the place where all v1a implementation details accumulate.
- v1a implementation details should move into child task bundles with clear ownership.
- The first child split should preserve the dependency order: foundation -> search/evidence inputs -> evidence map/strength -> need validation -> recheck/risk/memory -> offline evaluation.
- v1a must include both entry adapters and cross-cutting control objects. The title-card/topic-seed adapter and Literature -> TopicSelection snapshot/content/source-health contracts are part of this stage, not later UI work.
- v1a closure must publish a stable v1b input bundle containing `ValidatedNeed`, adjudication/support packet refs, evidence/search snapshots, trace, risks, gaps, memory, recheck state, and human decision refs.
- Stage-level closure now has a Prisma-backed regression test at `apps/backend/src/services/topic-selection-v1a-prisma.e2e.test.ts`. It is skipped by default and runs only with `RUN_TOPIC_SELECTION_V1A_PRISMA_E2E=1` plus `DATABASE_URL`, so normal unit tests stay local/in-memory.
- The E2E smoke uses real Postgres persistence and Prisma repositories, not in-memory fixtures, to validate the vertical slice plus cross-cutting recheck/risk/memory and frozen replay baseline behavior.
- Backend HTTP/API closure is covered by `T-053 topic-selection-v1a-http-api-closure`, with Fastify routes under `/topic-selection/v1a/*`, OpenAPI context entries, and memory/prisma route smoke verification.
- 2026-05-14 status closure: v1a stage and implementation child packages are represented as `done`; future frontend/UIUX exposure should be tracked separately and should not reopen the backend v1a implementation packages.

## Implementation Constraints
- Do not create v1b/v1c tables or workflows as hidden dependencies of v1a.
- Do not treat `SearchPlanCoverageMatrix` as an authority table; use coverage child records and a view/read model.
- Do not let `NeedCandidate` mutate `SearchPlan` directly; use `SearchPlanRecheckRequest`.
- Do not create `ValidatedNeed` for return/recheck/reject/park/merge outcomes.

## Open Implementation Questions
- What frontend/UIUX surfaces should consume the v1a REST routes, and what anti-rubber-stamp interaction should sit above human validation?
- What curated, non-synthetic reviewed cases should become the next persistent offline dataset beyond the single Prisma smoke fixture?
