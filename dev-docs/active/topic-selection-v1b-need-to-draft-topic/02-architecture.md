# 02 Architecture

## Boundary
v1b starts from a human-confirmed `ValidatedNeed` and ends at `TopicPackage(draft)`. It does not validate need existence and does not authorize project creation.

## Canonical Flow
```text
TopicSelectionV1aToV1bInputBundle
  -> ResearchConstraintProfile / V1bIntakeReadiness
  -> PlanResearchSliceRun / ResearchSliceOptionSet
  -> SliceSelectionDecision
  -> ResearchSlice
  -> FormTopicQuestionRun / TopicQuestionCandidateSet
  -> TopicQuestionSelectionDecision
  -> TopicQuestion
  -> TopicQuestionContract
  -> TopicValueAssessment
  -> ValueDispositionDecision
  -> TopicPackage(draft)
```

## Required Inputs From V1A
- `TopicSelectionV1aToV1bInputBundle`
- `ValidatedNeed`
- `ValidateNeedAdjudicationResult`
- `ValidationDecisionSupportPacket`
- EvidenceMap/SearchPlan/SearchRun versions
- EvidenceStrengthAssessment refs
- accepted risks, unresolved gaps, and recheck status
- decision memory context

## Local Stage Inputs
- `ResearchConstraintProfile`
- user resource, venue, community, and non-goal constraints
- selected target community and contribution preferences

## Stage Invariants
- v1b consumes validated need refs; it must not create a new unmet need.
- v1b must run intake/readiness before slice planning; stale upstream refs, open high-priority recheck, or missing accepted-risk handling must block progression.
- `ResearchSlice` and `TopicQuestionContract` inherit need/evidence refs; they cannot invent new support evidence.
- `ValueDispositionDecision.decision = advance_to_package` is the only path that creates `TopicPackage(draft)`.
- `advance_to_package` creates draft only; it does not authorize promotion.
- `TopicPackage(draft)` needs explicit readiness state before v1c can consume it.
- Stale or recheck-required upstream inputs must block or enter accepted-risk handling before package readiness.
- Offline evaluation/replay observes frozen v1b outputs; it does not mutate production `ResearchSlice`, `TopicQuestion`, `TopicValueAssessment`, or `TopicPackage`.

## Downstream Contract
v1c consumes a v1b input bundle:
- `TopicPackage(draft)` identity, version, and `package_readiness_status`.
- `TopicQuestionContract`, `TopicValueAssessment`, `ValueReasoningMemo`, and `ValueDispositionDecision` refs.
- inherited ValidatedNeed, ResearchSlice, evidence, search, and trace refs.
- package trace/boundary check results, draft issues, blockers, accepted risks, and recheck impacts.

v1c must not re-run value assessment as a hidden promotion gate.
