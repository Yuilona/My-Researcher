# 01 Plan

## Phase 1 - Contract Hold
- Track v1b `TopicPackage(draft)` readiness semantics.
- Preserve promotion and bridge target contracts without implementation commitments.

Acceptance:
- [ ] v1c input contract does not require v1b to create PaperProject-owned objects.
- [ ] v1c does not re-run value assessment as a hidden gate.

## Phase 2 - Detailed Split After V1B
- Split v1c once package readiness and promotion input snapshot are stable.
- Create child tasks for promotion gate, decision/profile, and bridge.

Acceptance:
- [ ] Each child task has a clear authority boundary.
- [ ] Human authorization and bridge creation remain separated.

## Phase 3 - Stage Closure
- Create or connect `PaperProjectBridge` only after human-confirmed promotion.
- Verify downstream feedback/recheck contract from PaperProject, Writing, or ResearchArgument back to topic selection.

Acceptance:
- [ ] Bridge trace can be followed back to package, question, slice, need, evidence, and search refs.
- [ ] Downstream feedback creates feedback/recheck events rather than mutating upstream authority.
