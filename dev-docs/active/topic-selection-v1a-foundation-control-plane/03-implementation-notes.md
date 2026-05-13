# 03 Implementation Notes

## Initial Notes
- Prefer extending existing workflow/audit infrastructure over creating a parallel topic-selection runtime.
- Keep the first implementation harness-first; do not build a scheduler.
- Use DB rows for identity/state/refs and artifact storage for large prompts, responses, diagnostics, and raw tool outputs.

## 2026-05-13 Pre-Implementation Review
- Existing paper lifecycle gate (`ResearchLifecycleService`, `StageNode`, `Snapshot`) is a useful pattern but should not own T-048 because it is paper-project scoped and maps gate decisions directly to node status.
- Existing literature pipeline run/artifact records are useful implementation examples but should not be reused directly because they are literature-stage scoped.
- Existing title-card research records are upstream/downstream refs, not control-plane records. Their `recordStatus`, `lineage`, and JSON payloads are insufficient for T-048 authority semantics.
- Decision: create a dedicated topic-selection control-plane contract and repository layer.
- Recommended shared contract path: `packages/shared/src/research-lifecycle/topic-selection-control-plane-contracts.ts`.
- Recommended backend service path: `apps/backend/src/services/topic-selection-control-plane-service.ts`.
- Recommended repository paths: `apps/backend/src/repositories/topic-selection-control-plane.repository.ts`, `apps/backend/src/repositories/in-memory-topic-selection-control-plane-repository.ts`, and `apps/backend/src/repositories/prisma/prisma-topic-selection-control-plane-repository.ts`.
- Implementation should start with contracts and persistence shape, then add the service/harness.
- Persisted schema work must use repo-Prisma as SSOT and refresh `docs/context/db/schema.json` after migration.

## Open Questions
- Resolved: workflow run persistence should be owned by the new topic-selection control-plane repository/service, wrapping `BackendLlmGateway` where LLM calls are needed.
- Resolved: `ArtifactRef` should use a new generic manifest and may borrow local file-store/checksum behavior from literature content processing.
- Resolved: `attemptTransition(...)` should live on `TopicSelectionControlPlaneService` and persist `ChainTransitionAttempt` plus state-write intents.
- Resolved: T-048 defines orthogonal state-write intent contracts; downstream packages decide how to map them to new business-object state fields or legacy compatibility fields.
