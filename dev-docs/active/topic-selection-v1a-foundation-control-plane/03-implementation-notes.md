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

## 2026-05-13 Implementation
- Added shared topic-selection control-plane contracts and JSON schemas in `packages/shared/src/research-lifecycle/topic-selection-control-plane-contracts.ts`, exported through the research-lifecycle barrel and package subpath.
- Added repo-Prisma authority models plus migration `20260513120000_add_topic_selection_control_plane` for `TopicSelection*` control-plane records. `titleCardId` is queryable text only, not a title-card FK.
- Added repository boundary with in-memory and Prisma implementations. Business service code imports only shared contracts and repository interfaces; Prisma stays inside the Prisma repository adapter.
- Added `TopicSelectionControlPlaneService` with `compileInputSnapshot`, `recordArtifactRef`, `recordWorkflowRun`, `runDeterministicGate`, `emitQualitySignal`, `recordHumanDecision`, `linkLineage`, `buildTraceSnapshot`, and `attemptTransition`.
- `attemptTransition(...)` persists transition attempts and state-write intents only. It strips state-write intents and created-authority refs for blocked, human-review-required, and accepted-risk-required results.
- Raw `QualitySignal` remains telemetry only. Tests verify a failing raw signal does not directly block a transition or create authority state unless an explicit gate/policy decision does so.
- DB context was refreshed from Prisma SSOT via `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`. No target database migration was applied.

## 2026-05-13 Review Remediation
- Hardened deterministic gate semantics: a gate with blockers can no longer be persisted as `pass`, `pass_with_risk`, or `needs_human_review`.
- Hardened transition entry semantics: `attemptTransition(...)` now requires a persisted readiness gate result instead of defaulting missing gates to pass.
- Added human confirmation validation for `needs_human_review` gates. Human decision refs must resolve to stored `HumanConfirmedDecision` records, use `decision_type=confirm`, come from a human or hybrid actor, match the gate target ref, and match the gate policy version when present.
- Moved workflow-run plus artifact-ref persistence behind a repository aggregate method. The Prisma implementation now writes the workflow run and artifact refs in a single transaction.
- Completed JSON schema exports for all public T-048 records, including policy records, `ArtifactRef`, `LLMWorkflowRun`, `QualitySignal`, `FunctionalLineageLink`, `TraceSnapshot`, and `HumanConfirmedDecision`.
- Added regression tests for blocker/pass inconsistency, ungated transition rejection, missing/invalid human decision refs, and valid human-confirmed transition pass.
