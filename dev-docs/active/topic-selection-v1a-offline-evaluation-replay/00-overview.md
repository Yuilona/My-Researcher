# 00 Overview

## Status
- State: done
- Next step: Use real v1a vertical-slice outputs to seed the next non-synthetic baseline dataset.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1a-evidence-to-need/`
- Architecture parent: `dev-docs/active/topic-selection-decision-chain-redesign/`

## Goal
- Implement offline evaluation/replay for v1a evidence-to-need workflows.
- Produce a first baseline for agreed minimum metrics without writing production authority objects.

## Non-goals
- Do not replace runtime `QualitySignal`.
- Do not write production `ValidatedNeed` during replay.
- Do not use evaluation metrics as evidence.

## Owned Scope
- `OfflineEvaluationDataset`
- `OfflineEvaluationCase`
- `OfflineEvaluationRun`
- `OfflineEvaluationCaseResult`
- `OfflineEvaluationMetricResult`
- `ReplayDiff`
- curated v1a case set
- metric calculation for v1a minimum metrics
- frozen input adapters for control-plane, search/resource, evidence, need validation, and recheck/risk/memory outputs

## Acceptance Criteria
- [x] Evaluation dataset covers the required v1a case types.
- [x] Replay runs on frozen snapshots and versioned workflow/model/search/policy profiles.
- [x] Metrics include false-gap rate, baseline miss rate, counter-evidence recall, trace completeness, readiness false-pass rate, human override rate, rerun instability, recheck precision, negative memory usefulness, and downstream rework cause.
- [x] First run records baseline values and failure examples.
- [x] Replay can start from frozen fixtures before all production persistence is complete, but stage baseline closure uses real v1a vertical-slice outputs.
