# 03 Implementation Notes

## Initial Notes
- Keep NeedCandidate as a hypothesis workspace with evidence-backed narrative, not a factual claim.
- The support packet is a reviewer-facing view over evidence and artifacts, not a source of facts.
- Human confirmation is required for ValidatedNeed creation.

## Landed Slice
- Shared contracts are in `packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts`.
- Authority persistence models use `TopicSelection*` Prisma names and keep query-critical ids/statuses as columns while preserving role bundles, refs, risks, and handoff payloads as JSON.
- Backend persistence is isolated behind `TopicSelectionNeedValidationRepository`, with in-memory and Prisma implementations.
- `TopicSelectionNeedValidationService` owns candidate creation, readiness, support packet creation, adjudication, human-confirmed validation, T-052 recheck emission, memory suggestions, and v1b handoff bundle publication.

## Implementation Decisions
- `NeedCandidate` remains `lifecycle_status=hypothesis` and `decision_status=hypothesis` until readiness/adjudication changes it; it is never renamed into `ValidatedNeed`.
- `ValidatedNeed` is pre-id'd before human confirmation so T-048 `HumanConfirmedDecision` can target the same authority ref required by `attemptTransition(...)`.
- `request_searchplan_recheck` calls T-052 `createSearchPlanRecheckRequest(...)` and stores the resulting ref on the adjudication result; it does not update the SearchPlan record.
- `CandidateDecisionMemorySuggestion` is persisted only as a suggestion with `status=suggested`; no T-051 durable memory, queue item, accepted risk, or recheck impact is created by this package.
- Non-validate decisions use `output_validated_need_id=null` and may update candidate status to returned, recheck requested, rejected, parked, or merged.

## Review Hardening
- `ValidatedNeed.sourceNeedCandidateId` is unique in Prisma so one `NeedCandidate` cannot materialize multiple validated needs.
- Support packet creation and adjudication require `decision_status=ready_for_validation`; candidates already closed or already linked to a `ValidatedNeed` cannot be adjudicated again.
- Empty selected evidence role bundles produce a blocked readiness assessment with `strength_assessment_ref=null` instead of bypassing T-049 readiness semantics through a T-047 error.
- Explicit EvidenceUnit selections must resolve inside the matching EvidenceMap role bundle; unknown ids are rejected rather than silently dropped.
- Validate adjudication pre-validates that the confirmation actor is human or hybrid before recording the T-048 `HumanConfirmedDecision`.
