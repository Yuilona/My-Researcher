# Roadmap

## Decision Log
- FC-001: This package owns v1a shared control-plane mechanics.
- FC-002: Business packages must consume these contracts rather than redefining workflow/gate/transition records.
- FC-003: First delivery is harness-first, not scheduler-first.
- FC-004: T-048 should create dedicated topic-selection control-plane authority records instead of extending `StageNode`, `Snapshot`, `TitleCardResearchRecord`, or `LiteraturePipelineRun`.
- FC-005: `BackendLlmGateway` is reused only behind a workflow harness that persists `LLMWorkflowRun`, telemetry, artifacts, and state signals.
- FC-006: `ArtifactRef` is a generic manifest; literature pipeline artifacts are implementation references, not dependencies.
- FC-007: `attemptTransition(...)` lives in the topic-selection control-plane service and emits state-write intents, not direct business-object mutations.
- FC-008: Raw `QualitySignal` is non-authoritative and can only be interpreted by downstream policy packages.

## Dependencies
- None inside v1a; this package is the first implementation dependency.
- Repo-Prisma is the DB SSOT for persisted schema changes.

## Enables
- `topic-selection-v1a-search-resource-evidence-inputs`
- `topic-selection-v1a-evidence-map-strength`
- `topic-selection-v1a-need-validation`
- `topic-selection-v1a-recheck-risk-memory`
- `topic-selection-v1a-offline-evaluation-replay`
