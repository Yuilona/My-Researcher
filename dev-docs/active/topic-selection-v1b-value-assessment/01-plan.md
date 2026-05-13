# 01 Plan

## Phase 1 - Contracts
- Define value assessment dimensions, reasoning memo, and disposition decision schema.
- Define hard blockers and soft risk handling.

Acceptance:
- [ ] Assessment dimensions are separate from promotion authorization.

## Phase 2 - Service
- Implement value assessment creation and disposition adjudication.
- Enforce non-mutating loopbacks to question/slice/evidence packages.

Acceptance:
- [ ] `advance_to_package` records gate/transition refs and a package-ready handoff.
- [ ] Non-advance outcomes persist required actions and output refs without creating a package.

## Phase 3 - Handoff
- Produce value handoff for draft package creation.
- Add tests for overclaim, weak answerability, accepted risk, and non-advance decisions.
