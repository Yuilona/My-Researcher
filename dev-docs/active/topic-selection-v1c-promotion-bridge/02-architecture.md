# 02 Architecture

## Boundary
v1c starts from a readiness-satisfied `TopicPackage(draft)` and ends at `PaperProjectBridge`. It is an authorization bridge, not paper execution.

## Canonical Flow
```text
TopicPackage(draft)
  -> PromotionInputSnapshot
  -> PromotionDecisionSupport
  -> PromotionGateCheck
  -> ArgumentReadinessMiniCheck
  -> HumanPromotionDecision
  -> PromotionDecision
  -> PromotionCommitmentProfile
  -> PaperProjectBridge
```

## Required Inputs From V1B
- `TopicPackage(draft)` with explicit `package_readiness_status`
- `TopicQuestionContract`
- `TopicValueAssessment` / `ValueDispositionDecision`
- `ValueReasoningMemo`
- upstream `ValidatedNeed` refs
- package trace/boundary check result
- trace snapshot, accepted risks, blockers, package draft issues, and recheck state

## Stage Invariants
- Promotion requires human confirmation.
- `ArgumentReadinessMiniCheck` is required inside `PromotionGateCheck` but is not a new main-chain node.
- `PromotionCommitmentProfile` freezes scope, claim ceiling, accepted risks, allowed refinements, early checks, and stop/reopen conditions.
- `PaperProjectBridge` is created only for `promote` or `promote_with_conditions`.
- Non-promote outcomes must record typed loopback targets, required actions, and source refs.
- `PaperProjectBridge` passes refs and working-copy text downstream; downstream changes do not overwrite upstream authority.

## Downstream Contract
PaperProject, Writing, and ResearchArgument may consume the bridge refs and working-copy text. If downstream work finds a problem, it must create typed feedback/recheck records rather than editing upstream package, value, question, slice, need, evidence, or search authority.
