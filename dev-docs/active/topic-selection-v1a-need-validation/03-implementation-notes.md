# 03 Implementation Notes

## Initial Notes
- Keep NeedCandidate as a hypothesis workspace with evidence-backed narrative, not a factual claim.
- The support packet is a reviewer-facing view over evidence and artifacts, not a source of facts.
- Human confirmation is required for ValidatedNeed creation.

## Open Questions
- Which existing NeedReview fields map to candidate decision status and readiness?
- Where should human validation decisions be captured in current UI/API?
- How should merge targets be represented when candidates are combined?
- Which parts of CandidateDecisionMemory are emitted here versus owned by recheck-risk-memory?
