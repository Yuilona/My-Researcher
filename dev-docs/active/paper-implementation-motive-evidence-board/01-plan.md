# 01 Plan

## Phases
1. Review intake handoff from T-093 and motive fields from design docs.
2. Define `CoreMotiveIdentity`, `CoreMotiveVersion`, `CoreMotiveSet`, assertion, and evidence-board contracts.
3. Define `CrossBoardReview`, `MotivePortfolioDecision`, and `PortfolioCoordinator` boundaries.
4. Define admission, version/evolution, portfolio-role, and confirmation rules.
5. Add trace-ready refs for literature, topic-selection inputs, internal notes, challenge evidence, and portfolio decisions.
6. Verify board and portfolio outputs can drive T-095 validation-cycle planning.

## Review Before Next Flow
- Confirm uncertainty/gap fields are explicit enough for validation planning.
- Confirm portfolio priority and motive-role fields are explicit enough for validation scheduling.
- Confirm no board field can be interpreted as final claim evidence.
- Confirm semantic changes are versioned, not overwritten.
- Confirm primary motive merge/split/demote/abandon and primary replacement require human-confirmed transitions.

## Verification
- Schema and natural-language field role tests.
- Gate tests for missing trace, unsupported assertion, stale refs, memo-as-evidence, portfolio constraint violation, and unconfirmed primary-motive change.
