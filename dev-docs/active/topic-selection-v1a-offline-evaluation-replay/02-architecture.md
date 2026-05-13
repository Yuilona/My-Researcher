# 02 Architecture

## Boundary
This package owns offline calibration and replay. It never writes production authority state.

## Flow
```text
OfflineEvaluationDataset
  -> OfflineEvaluationCase
  -> frozen snapshots + workflow/profile/model/search/policy versions
  -> OfflineEvaluationRun
  -> OfflineEvaluationCaseResult
  -> OfflineEvaluationMetricResult
  -> ReplayDiff
```

## Required Case Types
- true unmet need
- pseudo gap
- strong baseline solved
- author future work misleading
- abstract overclaim body unsupported
- terminology shift same task
- same-team duplicate claim
- source health or missing fulltext
- downstream failure feedback

## Minimum Metrics
- false-gap rate
- baseline miss rate
- counter-evidence recall
- trace completeness
- readiness false-pass rate
- human override rate
- rerun instability
- recheck precision
- negative memory usefulness
- downstream rework cause

## Required Frozen Inputs
- Foundation/control-plane: input snapshots, artifact refs, workflow runs, gate results, transition attempts, quality signals, trace snapshots, and human decisions.
- Search/resource inputs: topic seed, literature snapshot, search plan, coverage child records, matrix view materialization if present, search run, and source-health summaries.
- Evidence layer: EvidenceMap, EvidenceUnit, locators, conflicts, typed links/clusters/patterns, and EvidenceStrengthAssessment snapshots.
- Need validation: NeedCandidate, readiness outputs, support packet, adjudication result, ValidatedNeed when created, and non-validate outcome refs.
- Recheck/risk/memory: recheck events/impacts/resolutions, queue items, accepted risks, human overrides, and decision memory entries.
- Downstream feedback: v1b/v1c or later failure/rework labels when available.

## Invariants
- Offline evaluation is separate from runtime `QualitySignal`.
- Replay uses frozen inputs.
- First runs establish baselines before mature thresholds.
- Trace completeness and readiness false-pass feed back into production gate/policy improvements, not runtime overrides.
