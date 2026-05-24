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

## Implemented Handoff Response Shape
T-104 may return handoff refs for the next workflow step, but these are read-model hints only:

```ts
{
  action: 'submit' | 'sync' | 'collect' | 'cancel';
  outcome: 'submitted' | 'synced' | 'collected' | 'cancel_requested' | 'already_recorded' | 'blocked';
  external_job: ExternalTrainingJob;
  harness_run?: ResearchWorkOrderHarnessRun | null;
  monitor_intake?: RunMonitorIntakeRecord | null;
  run_evidence_unit?: RunEvidenceUnit | null;
  trace_manifest?: TraceManifest | null;
  handoff: {
    next_action_refs: TopicSelectionFunctionalRef[];
    recommended_next_actions: string[];
    notes: string[];
  };
}
```

Allowed handoff actions may include `create_result_interpretation_packet`, but T-104 must not create T-098 objects itself.

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

## Implemented API Shape
- `POST /paper-implementation/projects/:implementation_project_id/research-work-orders/:work_order_id/live-experiment-runs/submit`
- `POST /paper-implementation/projects/:implementation_project_id/research-work-orders/:work_order_id/live-experiment-runs/:external_job_id/sync`
- `POST /paper-implementation/projects/:implementation_project_id/research-work-orders/:work_order_id/live-experiment-runs/:external_job_id/collect`
- `POST /paper-implementation/projects/:implementation_project_id/research-work-orders/:work_order_id/live-experiment-runs/:external_job_id/cancel`

## Queryability Decision
- No Prisma migration was required.
- Submit idempotency uses `PaperImplementationWorkOrderHarnessRun.idempotencyKey`, already columnized/indexed.
- External job lookup and final evidence lookup use existing external job ref columns on harness/run evidence tables.
- `materialization_result_ref/hash` were added to the WorkOrder bridge contract and stored in existing `experimentBridge` JSON because they are submit payload refs, not a gate/queue/trace lookup key.

## Hard Invariants
- No trusted live result without an admitted WorkOrder.
- No trusted live result without a submitted or linked external job.
- No final trusted evidence without `run_evidence_unit_id` and `run_evidence_trace_manifest_id`.
- T-104 must pre-allocate the final `run_evidence_unit_id`, create or require a complete target-specific `TraceManifest`, and pass both values into `recordRunMonitorIntake`; `recordRunMonitorIntake` remains the final admission gate.
- No direct PaperImplementation copy of experiment-foundation DTO payloads.
- No result interpretation, claim, dossier, or writing packet mutation in the adapter.
- No default test dependency on cloud credentials.

## Verification Lanes
| Lane | Default | Purpose |
|---|---:|---|
| Unit fake adapter | yes | Verify status mapping, idempotency, trace/evidence gates, and failure retention. |
| Route integration with fake execution service | yes | Verify API orchestration closure without external dependencies. |
| Local script dry-run or mocked local runner | optional default | Verify local adapter shape only when side-effect free. |
| Real cloud/external canary | no | Explicit opt-in environment check with skipped/blocked/passed reporting. |
| Expensive experiment run | no | Manual profile only; never required for default closure. |
