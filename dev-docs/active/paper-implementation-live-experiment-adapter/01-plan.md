# Plan

## Phase 0 - Boundary Alignment
- [ ] Confirm T-104 task identity and project mapping.
- [ ] Confirm adapter owns orchestration only, not experiment-foundation authority.
- [ ] Confirm default test lane is deterministic and credential-free.
- [ ] Confirm whether a new PaperImplementation adapter contract is needed or existing WorkOrder/harness contracts are sufficient.

## Phase 1 - Current-State Audit
- [ ] Inspect `ExperimentFoundationExecutionService` submit/sync/cancel/collect behavior.
- [ ] Inspect PaperImplementation WorkOrder, harness run, monitor intake, and run evidence repository boundaries.
- [ ] Identify whether existing Prisma fields cover external job linkage and sync state.
- [ ] Identify route-level API shape for PaperImplementation-owned orchestration commands.

## Phase 2 - Contract/API Slice
- [ ] Add shared request/response contracts only if current contracts cannot express the adapter commands.
- [ ] Add REST endpoints under `/paper-implementation/projects/:implementation_project_id/research-work-orders/:work_order_id/...`.
- [ ] Keep experiment-foundation execution APIs available as their own bounded context; PaperImplementation calls services, not raw repositories.

## Phase 3 - Service Implementation
- [ ] Submit admitted WorkOrder to experiment-foundation execution with idempotency.
- [ ] Persist or reuse harness run/external job link without copying canonical payloads.
- [ ] Sync/collect experiment-foundation job status and feed monitor intake.
- [ ] Pre-allocate run evidence identity and target-specific trace before final trusted evidence ingestion.

## Phase 4 - Tests And Governance
- [ ] Shared schema tests if contracts change.
- [ ] Service tests for submit/sync/collect/idempotency/status mapping.
- [ ] Route tests through `buildApp`.
- [ ] Regression tests for T-102 trace hardening and T-098 claim/dossier readiness.
- [ ] Project governance sync/lint and docs verification.
