# 03 Implementation Notes

## 2026-05-20 - Task Package Created
- Created `T-096` for WorkOrder and experiment-foundation bridge.
- Depends on T-095 planning and T-097 trace contracts.
- No product code changes were made.

## Open Notes
- Preserve experiment-foundation ownership and use refs/hashes only.

## 2026-05-21 - Backend Minimum Closure
- Added shared T-096 contracts and schemas for `ResearchWorkOrder`, `ResearchWorkOrderHarnessRun`, `RunMonitorIntakeRecord`, and `RunEvidenceUnit`.
- Added Prisma persistence and migration for work orders, harness runs, monitor intake, and run evidence units with queryable project, work-order, validation-cycle, run type/status, trace, result, external-job, and failure-summary fields.
- Added in-memory and Prisma repositories behind a Prisma-free service interface.
- Added `PaperImplementationWorkOrderExperimentBridgeService` with active-project, admitted-validation-cycle, trace-complete, run-policy, reproducibility, and monitor-trust gates.
- Added REST endpoints under the existing `paper-implementation` route group; no parallel module or `research-argument` path was created.
- Confirmatory and reproduction work orders require locked recipe/config hashes and cannot use autotune as a primary evidence path.
- Failed, cancelled, inconclusive, and negative trusted final runs are retained as `RunEvidenceUnit`; orphan callbacks are untrusted monitor records only.
- T-096 does not execute experiment-foundation itself and does not create claim/dossier authority; T-098 owns result interpretation and claim admission.

## 2026-05-21 - Quality Review Closure
- Tightened `CreateResearchWorkOrderDraftRequest`: `work_order_id` is explicit and required because the pre-existing T-097 trace manifest must target `research_work_order:<work_order_id>` before the draft is created.
- Hardened monitor trust: a trusted monitor intake now requires a prior harness submission that recorded `external_job_ref/hash`; direct callbacks with only `work_order_id` remain untrusted and cannot create run evidence.
- Narrowed Prisma `ResearchWorkOrder` updates to mutable runtime fields only (`status`, admission timestamp/result, external job bridge, `updatedAt`), preserving creation-time lineage such as validation cycle and creation timestamp.
- Resolved a blocking dirty-worktree typecheck issue in `topic-selection-workflow-harness-service.ts` by consolidating the normalized SearchRun runner helpers into a single implementation path; no PaperImplementation authority was moved into topic-selection.
