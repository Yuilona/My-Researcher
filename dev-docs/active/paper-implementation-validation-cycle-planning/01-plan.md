# 01 Plan

## Phases
1. Review motive/evidence-board gaps, `CoreMotiveSet`, and portfolio decisions from T-094.
2. Define `ValidationCycle`, route candidate, feasibility probe, and `ExperimentPlanLight` contracts.
3. Define admission/completion gates, portfolio constraint checks, and budget/stop-rule policy.
4. Define `loop_budget_review` queue behavior for repeated low-information cycles.
5. Define upstream feedback triggers for infeasible route, data unavailable, or topic boundary mismatch.
6. Define work-order draft handoff.
7. Verify negative cases: trivial route, missing baseline, over-budget plan, unconfirmed scope broadening, and portfolio constraint violation.

## Review Before Next Flow
- Confirm every executable experiment request can become a work order.
- Confirm exploratory and confirmatory markers are explicit.
- Confirm validation cycles do not schedule abandoned/parked motives unless reopen conditions are satisfied.
- Confirm route infeasibility can emit `ImplementationFeedbackEvent` instead of changing upstream topic state.
- Confirm validation completion cannot create claims directly.

## Verification
- Contract/schema tests for planning DTOs.
- Gate tests for budget, baseline gap, missing trace, portfolio constraint violations, loop-budget review, upstream feedback triggers, and human-confirmation requirements.
