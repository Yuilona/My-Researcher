# 02 Architecture

## Boundary
v1a owns the evidence-to-need decision loop. It proves whether the system can move from a title-card/topic seed and literature resource snapshot to a human-confirmed `ValidatedNeed`.

## Canonical Flow
```text
TitleCard intent / TopicSeed
  -> LiteratureResourcePoolSnapshot
  -> SearchPlan
  -> SearchRun
  -> EvidenceMap / EvidenceUnit
  -> NeedCandidate
  -> ValidationDecisionSupportPacket
  -> ValidateNeedAdjudicationResult
  -> ValidatedNeed
```

## Authority Objects
- `TopicSeed`
- title-card adapter refs
- `LiteratureResourcePoolSnapshot`
- `SearchPlan`
- coverage child records
- `SearchRun`
- `EvidenceMap`
- `EvidenceUnit`
- `EvidenceStrengthAssessment`
- `NeedCandidate`
- `SearchPlanRecheckRequest`
- `ValidationDecisionSupportPacket`
- `ValidateNeedAdjudicationResult`
- `ValidatedNeed`
- `ContextPolicyVersion`
- `InputSnapshot`
- `ArtifactRef`
- `LLMWorkflowRun`
- `QualitySignal`
- `TransitionPolicyVersion`
- `WorkflowProfilePolicy`
- `ReadinessGateResult`
- `ChainTransitionAttempt`
- `FunctionalLineageLink`
- `TraceSnapshot`
- `RecheckEvent` / `RecheckImpact` / `RecheckResolution`
- `DecisionWorkQueueItem`
- `AcceptedRisk`
- `HumanConfirmedDecision`
- `HumanOverride`
- `BlockerPolicy`
- `CandidateDecisionMemory`
- `OfflineEvaluation*` records

## Cross-Cutting Invariants
- `ValidatedNeed` is created only when `ValidateNeedAdjudicationResult.final_decision = validate`.
- `ValidatedNeed` creation requires a `HumanConfirmedDecision`; LLM output can recommend but cannot finalize validation.
- Runtime `QualitySignal` is not offline evaluation.
- `EvidenceStrengthAssessment` is target-specific, demand-driven, and bundle-first.
- Recheck is a ledger plus focused queue, not broadcast automation.
- Stage closure requires traceable source refs, human decision refs, and replayable artifacts.

## Downstream Contract
v1b consumes a v1a input bundle:
- `ValidatedNeed` identity and version.
- `ValidateNeedAdjudicationResult` and `ValidationDecisionSupportPacket`.
- EvidenceMap, SearchPlan, SearchRun, and LiteratureResourcePoolSnapshot versions.
- support/challenge/baseline EvidenceUnit refs and EvidenceStrengthAssessment refs.
- accepted risk refs, unresolved gaps, decision memory refs, and open recheck impacts.
- trace snapshot, artifact refs, and human decision refs.

v1b must not re-prove need existence; it uses this bundle to select a research slice and question.
