# 02 Architecture

## Boundary
This package owns evidence representation and target-specific strength assessment. It does not decide whether a need is valid.

## Flow
```text
SearchRun outputs
  -> EvidenceMap
  -> EvidenceUnit
  -> links/clusters/conflicts
  -> EvidenceStrengthAssessment
  -> NeedCandidate readiness inputs
```

## Authority Objects
- `EvidenceMap`
- `EvidenceUnit`
- `TypedLink`
- `Cluster`
- `Pattern`
- `ConflictSet`
- `EvidenceStrengthAssessment`

## Invariants
- EvidenceMap summary text is a view, not authority.
- EvidenceUnit is claim-level, not paper-level.
- LLM inference cannot be stored as source claim.
- EvidenceStrengthAssessment does not create facts and cannot replace coverage assessment.
- Context evidence cannot be silently counted as support.

## Downstream Contract
Need validation consumes:
- EvidenceMap/version refs.
- support/challenge/baseline/context EvidenceUnit refs.
- conflict set refs.
- EvidenceStrengthAssessment refs.
- freshness/recheck/source-health states.

Recheck/risk/memory consumes evidence freshness, conflict, locator, source-health, and stale-assessment signals through control-plane contracts. Offline replay consumes frozen EvidenceMap, EvidenceUnit, locator, conflict, and EvidenceStrengthAssessment snapshots for trace completeness, counter-evidence recall, and baseline-miss metrics.
