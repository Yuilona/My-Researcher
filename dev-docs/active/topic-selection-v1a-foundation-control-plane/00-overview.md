# 00 Overview

## Status
- State: in-progress
- Next step: Keep T-048 as the shared v1a control-plane foundation for T-049/T-051/T-050; apply the generated migration to a target DB only after an explicit environment approval.
- Review: implementation-prep survey completed on 2026-05-13; shared contracts, persistence schema, repositories, service, fake harness verification, and control-plane hardening fixes are implemented. T-052 and T-047 now consume these contracts rather than redefining workflow/gate/transition records.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1a-evidence-to-need/`
- Architecture parent: `dev-docs/active/topic-selection-decision-chain-redesign/`

## Goal
- Implement the v1a shared control-plane foundation used by all evidence-to-need workflows.
- Provide stable context, artifact, workflow-run, readiness-gate, transition, policy, and state-axis contracts before business objects rely on them.

## Non-goals
- Do not implement SearchPlan, SearchRun, EvidenceMap, NeedCandidate, or ValidatedNeed business behavior in this package.
- Do not implement UI anti-rubber-stamp flows.
- Do not implement background schedulers or automatic recheck propagation.

## Owned Scope
- `ContextPolicyVersion`
- `InputSnapshot`
- `ArtifactRef`
- `LLMWorkflowRun`
- `ReadinessGateResult`
- `TransitionPolicyVersion`
- `WorkflowProfilePolicy`
- `ChainTransitionAttempt`
- `QualitySignal` runtime record contract and emission shell
- `FunctionalLineageLink`
- `TraceSnapshot`
- generic `HumanConfirmedDecision` record and human-gate contract
- state-axis write rules
- deterministic gate shell
- `attemptTransition(...)` contract

## Interfaces
- Upstream: existing title-card/workflow infrastructure and local persistence conventions.
- Downstream: all v1a child packages consume this package for context compilation, artifact refs, workflow audit, gate results, and transition attempts.
- Boundary with recheck/risk/memory: this package defines shared `QualitySignal`, trace, gate, and transition records; `topic-selection-v1a-recheck-risk-memory` owns policy interpretation into recheck, memory, queue, risk, or required action.
- Boundary with need validation: this package defines generic `HumanConfirmedDecision`; `topic-selection-v1a-need-validation` uses it as required confirmation for `ValidatedNeed`.

## Acceptance Criteria
- [x] Critical workflow runs can persist input snapshot, workflow run, artifact refs, and gate result.
- [x] `attemptTransition(...)` records policy version, gate result, workflow run, actor, result, and required actions.
- [x] State-axis writes are separated into lifecycle, decision, review, freshness, execution, and permission semantics.
- [x] `QualitySignal`, `FunctionalLineageLink`, `TraceSnapshot`, and generic `HumanConfirmedDecision` can be referenced by downstream v1a packages without redefining local equivalents.
- [x] Downstream v1a packages can use the shared control-plane contracts without redefining them.
