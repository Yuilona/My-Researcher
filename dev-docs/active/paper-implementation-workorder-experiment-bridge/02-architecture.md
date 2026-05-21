# 02 Architecture

## Contract Boundary
| Item | Contract |
|---|---|
| Input objects | `ValidationCycle`, `ExperimentPlanLight`, motive/assertion refs |
| Output objects | `ResearchWorkOrder`, harness run, experiment-foundation refs, `RunMonitorAdapter` intake record, `EvidenceLedgerWriter` write record, `RunEvidenceUnit`, upstream feedback candidates |
| Authority writer | work-order service and run-evidence ingestion service through `StateWriter` when available |
| Gates | work-order admission, reproducibility, run policy, monitor trust, failed-run retention |
| Trace | recipe/task/job/result/fact refs and hashes, config/data/code refs |
| Handoff | T-098 receives run evidence, validation reports, metrics, failure summaries, and evidence-candidate refs |

## Contract Review
- Confirmatory runs require frozen config and locked recipe hash.
- Exploratory/autotune runs can generate new plans but cannot directly support strong claims.
- Failed runs are evidence ledger entries, not disposable logs.
- Run results without `work_order_id` are untrusted and cannot enter claim support.
- `RunEvidenceUnit` must expose queryable run type, status, dataset/code/config refs, and trace refs.

## Implemented Boundary
- Shared contract: `paper-implementation-workorder-contracts.ts` owns `ResearchWorkOrder`, harness run, monitor intake, and `RunEvidenceUnit`.
- Persistence: Prisma tables keep gate/trace/work-order/run fields columnized; rich callback payload remains JSON payload only.
- Backend service: `PaperImplementationWorkOrderExperimentBridgeService` admits work orders only from active `ImplementationProject` and admitted `ValidationCycle`.
- Experiment-foundation bridge: `run_recipe_ref/hash`, `training_task_spec_ref/hash`, `external_job_ref/hash`, result refs, and validation report refs are lineage pointers, not copied authority payloads.
- Monitor trust rule: callbacks without `work_order_id` are persisted as untrusted intake records and do not produce `RunEvidenceUnit`.
- T-098 entry: consume `RunEvidenceUnit` plus validation/trace refs; do not read raw experiment-foundation platform state for claim interpretation.
