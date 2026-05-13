# 00 Overview

## Status
- State: planned
- Next step: Confirm existing NeedReview/title-card semantics that can evolve into NeedCandidate and ValidatedNeed.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1a-evidence-to-need/`
- Architecture parent: `dev-docs/active/topic-selection-decision-chain-redesign/`

## Goal
- Implement the v1a decision loop from EvidenceMap to human-confirmed `ValidatedNeed`.

## Non-goals
- Do not implement ResearchSlice or TopicQuestion.
- Do not mutate SearchPlan directly from NeedCandidate.
- Do not create `ValidatedNeed` for non-validate adjudication outcomes.

## Owned Scope
- `NeedCandidate`
- candidate generation and readiness workflow
- `SearchPlanRecheckRequest` emission from candidate/adjudication gaps
- `ValidationDecisionSupportPacket`
- `ValidateNeedAdjudicationResult`
- `ValidatedNeed`
- human confirmation for validation
- candidate decision-memory suggestions for the recheck/risk/memory package
- v1a->v1b input bundle publication

## Acceptance Criteria
- [ ] NeedCandidate is persisted as hypothesis, not accepted need.
- [ ] readiness gate checks support, challenge, coverage, scope, pseudo-gap, already-solved, and recheck blockers.
- [ ] `ValidateNeedAdjudicationResult` is always persisted for adjudication.
- [ ] `ValidatedNeed` is created only for `final_decision=validate` with human confirmation.
- [ ] non-validate outcomes record loopback, required actions, output refs, and `output_validated_need_id=null`.
- [ ] v1b input bundle is published from validated outputs and includes adjudication result, support packet, evidence/search snapshots, trace, risks, gaps, memory refs, and recheck status.
- [ ] Durable decision memory is not written directly by this package; candidate memory suggestions are handed to recheck/risk/memory policy.
