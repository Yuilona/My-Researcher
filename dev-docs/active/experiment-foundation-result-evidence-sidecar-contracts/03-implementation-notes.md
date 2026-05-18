# 03 Implementation Notes

## 2026-05-17
- Created because the review report found `EvidenceCandidate` too thin to block direct result-to-claim flow.
- Initial design decision: validated facts and evidence candidates remain separate from final claims and paper tables.

## 2026-05-17 - T-074 shared contract landing
- Completed `T-074 experiment-foundation-result-evidence-sidecar-contracts` as a shared-contract-only slice.
- Extended `packages/shared/src/research-lifecycle/experiment-foundation-contracts.ts` with result packets, validation reports, evaluation facts, evidence candidates, paper-table fact sets, implementation decision signals, and paper sidecar contracts.
- `ExperimentResult` and `FineTuningResult` consume T-073 task/materialization refs and hashes; they do not redefine `TrainingTaskSpec`, adapter metadata, external job lifecycle, or platform execution payloads.
- `ResultValidationReport` gates downstream evidence creation. `EvidenceCandidate.validation_status` accepts only `valid` or `accepted_partial`; invalid, partial, or unvalidated outputs are rejected by schema.
- `EvaluationFact`, `MetricObservation`, and `ComparisonObservation` require run/result/protocol/asset context and explicitly reject claim/ranking/table leakage.
- `PaperTableFactSet` groups validated facts for later drafting, but remains non-rendering and non-leaderboard.
- `PaperExperimentSidecar` stores frozen refs, version locks, hashes, snapshots, event refs, and provenance refs; it rejects copied reusable asset/result DTOs.
- Mainline next owner is `T-075 experiment-foundation-candidate-promotion-contracts`.
