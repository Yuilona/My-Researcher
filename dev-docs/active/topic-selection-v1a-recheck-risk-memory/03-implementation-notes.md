# 03 Implementation Notes

## Initial Notes
- Implement ledger-first and scheduler-later.
- Storm control requires strict event admission, lineage-limited propagation, retry budgets, cooldown, batching, and auditable stop decisions.
- CandidateDecisionMemory can start as a v1a projection before full generic DecisionMemoryEntry is tableized.

## Open Questions
- Which current UI queue or notification model can display focused work items?
- Where should AcceptedRisk be stored so coverage, gate, and override paths share it?
- Which blocker codes are non-overridable in v1a?
