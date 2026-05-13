# 01 Plan

## Phase 1 - Existing Need Flow Survey
- Inspect current NeedReview/title-card need structures.
- Map current fields to NeedCandidate, readiness, support packet, adjudication result, and ValidatedNeed.

Acceptance:
- [ ] Reusable current behavior is identified.
- [ ] Gaps against new adjudication result semantics are listed.

## Phase 2 - NeedCandidate And Readiness
- Implement candidate hypothesis structure and readiness gate.
- Emit structured SearchPlanRecheckRequest where coverage is insufficient.

Acceptance:
- [ ] Candidate can be returned, revised, merged, parked, rejected, or made ready for validation.
- [ ] Candidate ranking is stored as snapshot, not durable truth.

## Phase 3 - Adjudication
- Implement validation support packet and adjudication result.
- Enforce validate-only materialization of ValidatedNeed.

Acceptance:
- [ ] All adjudication decisions are auditable.
- [ ] ValidatedNeed carries source candidate, adjudication result, support packet, human decision, evidence/search snapshots, and trace refs.

## Phase 4 - V1B Handoff
- Publish v1a input bundle for v1b.

Acceptance:
- [ ] v1b can consume ValidatedNeed without re-proving need existence.
