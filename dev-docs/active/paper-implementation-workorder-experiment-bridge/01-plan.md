# 01 Plan

## Phases
1. [x] Review admitted plans from T-095 and experiment-foundation contracts.
2. [x] Define `ResearchWorkOrder`, broker, harness, and run policy.
3. [x] Define refs/hashes into `RunRecipe`, `TrainingTaskSpec`, `ExternalTrainingJob`, `ExperimentResult`, `ResultValidationReport`, `EvaluationFact`, and `EvidenceCandidate`.
4. [x] Define `RunMonitorAdapter` intake for async job updates and result callbacks.
5. [x] Define `EvidenceLedgerWriter` and `RunEvidenceUnit` ingestion.
6. [x] Define upstream feedback trigger boundary for data unavailable, route infeasible, or baseline solving the need.
7. [x] Verify failed-run retention and exploratory/confirmatory separation.

## Review Before Next Flow
- Confirmed result interpretation can operate from `RunEvidenceUnit`.
- Confirmed work order statuses and failure summaries are queryable.
- Confirmed monitor callbacks without work-order refs are marked untrusted and cannot create run evidence.
- Confirmed implementation feedback remains explicit through T-093/T-095 trigger paths; T-096 does not mutate upstream topic-selection authority.
- Confirmed no experiment-foundation object is copied as authority state; only refs and hashes are stored.

## Verification
- Service/repository tests for work-order admission and ingestion.
- Negative tests for missing recipe hash, missing dataset/code/config, missing work-order id, failed-run omission, AutoTune primary evidence misuse, and JSON-only run status.
