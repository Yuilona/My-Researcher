# 01 Plan

## Phases
1. [x] Review motive/evidence-board gaps, `CoreMotiveSet`, and portfolio decisions from T-094.
2. [x] Define `ValidationCycle`, route candidate, feasibility probe, and `ExperimentPlanLight` contracts.
3. [x] Define admission/completion gates, portfolio constraint checks, and budget/stop-rule policy.
4. [x] Define `loop_budget_review` queue behavior for repeated low-information cycles.
5. [x] Define upstream feedback candidate and explicit dispatch path for infeasible route, data unavailable, or topic boundary mismatch.
6. [x] Define work-order-ready handoff objects for T-096 without creating `ResearchWorkOrder`.
7. [x] Verify negative cases: missing/trace-broken inputs, baseline gap, unconfirmed expensive/scope-broadening plan, low-info loop, and feedback dispatch.

## Review Before Next Flow
- Confirmed every executable experiment request remains an `ExperimentPlanLight` until T-096 creates a work order.
- Confirmed exploratory/confirmatory markers are explicit through `run_mode` and `confirmatory_marker`.
- Confirmed validation cycles do not schedule draft, stale, parked, or abandoned motives.
- Confirmed route infeasibility emits a local `ValidationUpstreamFeedbackCandidate`; only explicit dispatch creates `ImplementationFeedbackEvent`.
- Confirmed validation completion records assessment only and cannot create claims or mutate motive authority.

## Verification
- Contract/schema tests for planning DTOs.
- Gate tests for budget, baseline gap, missing trace, portfolio constraint violations, loop-budget review, upstream feedback triggers, and human-confirmation requirements.
