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
