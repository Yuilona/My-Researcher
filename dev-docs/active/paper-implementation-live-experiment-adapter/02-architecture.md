# Architecture

## Boundary
| Area | Rule |
|---|---|
| Authority root | `PaperImplementationProject` and `ResearchWorkOrder` remain the implementation-side authority. |
| Execution authority | experiment-foundation owns training task specs, external jobs, adapter metadata, result artifacts, and validation reports. |
| Orchestration | T-104 adds a PaperImplementation adapter that calls experiment-foundation execution services for admitted WorkOrders. |
| Evidence authority | Trusted evidence still enters PaperImplementation only through `RunMonitorIntake -> RunEvidenceUnit`. |
| Trace | Final evidence requires a target-specific `TraceManifest` for `run_evidence_unit:<id>`. |
| Claims | T-104 does not create result interpretation, claims, dossier, or writing packets. |

## Proposed Flow
```text
ValidationCycle
  -> ResearchWorkOrder(admitted)
  -> PaperImplementationLiveExperimentAdapter.submit
  -> ExperimentFoundationExecutionService.submitJob
  -> ResearchWorkOrderHarnessRun / external job link
  -> PaperImplementationLiveExperimentAdapter.syncOrCollect
  -> RunMonitorIntake
  -> RunEvidenceUnit
  -> T-098 result/claim/dossier
```

## Existing Surfaces To Reuse
- PaperImplementation:
  - `PaperImplementationWorkOrderExperimentBridgeService`
  - `ResearchWorkOrder`
  - `ResearchWorkOrderHarnessRun`
  - `RunMonitorIntakeRecord`
  - `RunEvidenceUnit`
- Experiment foundation:
  - `ExperimentFoundationExecutionService.submitJob`
  - `syncJob`
  - `cancelJob`
  - `collectJob`
  - `ExternalTrainingJob`

## Initial API Shape
- `POST /paper-implementation/projects/:implementation_project_id/research-work-orders/:work_order_id/live-experiment-submissions`
- `POST /paper-implementation/projects/:implementation_project_id/research-work-orders/:work_order_id/live-experiment-sync`
- `POST /paper-implementation/projects/:implementation_project_id/research-work-orders/:work_order_id/live-experiment-collect`
- `POST /paper-implementation/projects/:implementation_project_id/research-work-orders/:work_order_id/live-experiment-cancel`

The route names are provisional until Phase 0 closes.

## Hard Invariants
- No trusted live result without an admitted WorkOrder.
- No trusted live result without a submitted or linked external job.
- No final trusted evidence without `run_evidence_unit_id` and `run_evidence_trace_manifest_id`.
- No direct PaperImplementation copy of experiment-foundation DTO payloads.
- No claim or dossier mutation in the adapter.
- No default test dependency on cloud credentials.
