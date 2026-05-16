# 02 Architecture

## Boundary
v1c starts from `TopicSelectionV1bToV1cInputBundle` for a readiness-satisfied `TopicPackage(draft)` and ends at `PaperProjectBridge` plus downstream feedback/recheck contracts. It is an authorization bridge, not paper execution.

## Canonical Flow
```text
TopicSelectionV1bToV1cInputBundle
  -> PromotionInputSnapshot
  -> PromotionDecisionSupport / PromotionDossier
  -> PromotionGateCheck
  -> ArgumentReadinessMiniCheck
  -> HumanPromotionDecision
  -> PromotionDecision
  -> PromotionCommitmentProfile
  -> PaperProjectBridge
```

## Required Inputs From V1B
- `TopicSelectionV1bToV1cInputBundle`
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
- `PromotionDossier` is a reviewer-facing read model produced by T-062; it cannot authorize promotion and should not become a separate authority gate.
- `PromotionCommitmentProfile` freezes scope, claim ceiling, accepted risks, allowed refinements, early checks, and stop/reopen conditions.
- `PaperProjectBridge` is created only for `promote_to_paper_project` or `promote_with_conditions`.
- Non-promote outcomes must record typed loopback targets, required actions, and source refs. The canonical non-promote outcomes are `merge_packages`, `refine_package`, `reassess_value`, `revise_question`, `revise_slice`, `recheck_evidence_or_search`, `park`, and `drop`.
- `PaperProjectBridge` passes refs and working-copy text downstream; downstream changes do not overwrite upstream authority.

## Child Package Ownership
- `T-061` owns v1c input snapshot and stale/superseded/readiness checks.
- `T-062` owns promotion support, promotion dossier read model, gate checks, and argument mini-check.
- `T-063` owns human authorization, promotion decision, and commitment profile.
- `T-064` owns bridge creation/linking and trace-preserving downstream handoff.
- `T-065` owns downstream feedback/recheck loopback records.
- `T-066` owns offline replay snapshots/metrics only.
- `T-067` owns Fastify routes, controller wiring, OpenAPI, API index, and HTTP smoke tests.

## Downstream Contract
PaperProject, Writing, and ResearchArgument may consume the bridge refs and working-copy text. If downstream work finds a problem, it must create typed feedback/recheck records rather than editing upstream package, value, question, slice, need, evidence, or search authority.
