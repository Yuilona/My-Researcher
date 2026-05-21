# T-096 Paper Implementation WorkOrder Experiment Bridge

## Status
- State: done
- Parent task: `T-091 paper-implementation-full-landing`
- Mapping: `M-001 > F-001 > R-013`
- Flow node: `ResearchWorkOrder -> experiment-foundation -> RunEvidenceUnit`
- Next step: enter `T-098 paper-implementation-result-claim-dossier`.

## Goal
- Make all implementation experiment execution pass through `ResearchWorkOrder`.
- Integrate experiment-foundation assets/results by refs and hashes.
- Define run-monitor intake and evidence-ledger writer behavior for asynchronous results.
- Ingest every run outcome into `RunEvidenceUnit`, including failed, cancelled, inconclusive, and negative runs.

## Non-goals
- Do not copy experiment-foundation assets into paper-implementation state.
- Do not create final claim evidence from `EvidenceCandidate` directly.
- Do not allow naked agent or UI experiment submission.

## Acceptance Criteria
- [x] Work orders bind motive/assertion/validation-cycle refs and run policy.
- [x] Experiment-foundation refs/hashes are preserved without ownership drift.
- [x] `RunMonitorAdapter` intake rejects or marks untrusted any run result without `work_order_id`.
- [x] `EvidenceLedgerWriter` writes queryable run status, run type, data/code/config refs, and failure summaries.
- [x] Failed and inconclusive runs are retained as `RunEvidenceUnit`.
- [x] T-098 can interpret results from run evidence without reading raw platform state.
