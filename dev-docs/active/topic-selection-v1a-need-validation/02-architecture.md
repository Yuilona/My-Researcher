# 02 Architecture

## Boundary
This package owns v1a need hypothesis, readiness, adjudication, and accepted need materialization.

## Flow
```text
EvidenceMap / EvidenceStrengthAssessment
  -> GenerateNeedCandidates
  -> NeedCandidate
  -> AssessCandidateReadiness
  -> ValidationDecisionSupportPacket
  -> ValidateNeedAdjudicationResult
  -> ValidatedNeed only when final_decision = validate
```

## Authority Objects
- `NeedCandidate`
- `SearchPlanRecheckRequest`
- `ValidationDecisionSupportPacket`
- `ValidateNeedAdjudicationResult`
- `ValidatedNeed`
- `HumanConfirmedDecision`
- candidate `DecisionMemoryEntry` suggestion refs

## Decision Outcomes
- `validate`
- `return_to_candidate`
- `request_searchplan_recheck`
- `reject`
- `park`
- `merge`

## Invariants
- `ready_for_validation` means adjudication-ready, not validated.
- `ValidatedNeed` is evidence-version-bound and human-confirmed.
- `return_to_candidate`, `request_searchplan_recheck`, `reject`, `park`, and `merge` do not create ValidatedNeed.
- NeedCandidate does not directly mutate SearchPlan.

## Downstream Contract
v1b consumes `ValidatedNeed` plus adjudication result, support packet, evidence/search snapshots, trace, risks, gaps, memory refs, and recheck status.

## Cross-Package Outputs
- `SearchPlanRecheckRequest`: emitted by this package, handled by search/resource/evidence inputs, and optionally queued/tracked by recheck/risk/memory.
- candidate memory suggestions: emitted by this package, but durable memory entries and effect policy are owned by recheck/risk/memory.
- v1b input bundle: published by this package after `ValidatedNeed` creation and verified by the v1a stage package.
- offline replay inputs: include candidate readiness, support packet, adjudication result, human confirmation, and non-validate outcome refs.
