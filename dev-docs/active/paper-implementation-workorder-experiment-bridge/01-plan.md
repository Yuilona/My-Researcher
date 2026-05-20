# 01 Plan

## Phases
1. Review admitted plans from T-095 and experiment-foundation contracts.
2. Define `ResearchWorkOrder`, broker, harness, and run policy.
3. Define refs/hashes into `RunRecipe`, `TrainingTaskSpec`, `ExternalTrainingJob`, `ExperimentResult`, `ResultValidationReport`, `EvaluationFact`, and `EvidenceCandidate`.
4. Define `RunMonitorAdapter` intake for async job updates and result callbacks.
5. Define `EvidenceLedgerWriter` and `RunEvidenceUnit` ingestion.
6. Define upstream feedback triggers for data unavailable, route infeasible, or baseline solving the need.
7. Verify failed-run retention and exploratory/confirmatory separation.

## Review Before Next Flow
- Confirm result interpretation can operate from `RunEvidenceUnit`.
- Confirm work order statuses and failure summaries are queryable.
- Confirm monitor callbacks without work-order refs are rejected or marked untrusted.
- Confirm implementation feedback is emitted when run outcomes invalidate upstream assumptions.
- Confirm no experiment-foundation object is copied as authority state.

## Verification
- Service/repository tests for work-order admission and ingestion.
- Negative tests for missing recipe hash, missing dataset/code/config, missing work-order id, failed-run omission, AutoTune primary evidence misuse, and JSON-only run status.
