# T-095 Paper Implementation Validation Cycle Planning

## Status
- State: planned
- Parent task: `T-091 paper-implementation-full-landing`
- Mapping: `M-001 > F-001 > R-013`
- Flow node: validation cycle, route/probe planning, experiment-plan candidates
- Next step: define planning contracts after T-094 exposes motive assertions and board gaps.

## Goal
- Turn motive/evidence-board gaps into validation cycles and route/probe/experiment plans.
- Schedule validation work under current portfolio priority and motive-role constraints.
- Preserve budget, expected information gain, stop rules, and human-confirmation requirements.
- Produce work-order-ready plans without submitting experiments directly.

## Non-goals
- Do not call experiment-foundation directly.
- Do not create trusted evidence or claims.
- Do not broaden upstream topic scope without human confirmation.

## Acceptance Criteria
- [ ] `ValidationCycle` has criteria, budget, expected information gain, and stop conditions.
- [ ] Validation scheduling respects `CoreMotiveSet`, `MotivePortfolioDecision`, active-motive limits, and current portfolio priority.
- [ ] Route/probe/experiment plan candidates are gated and trace-ready.
- [ ] Low-information repeated cycles create `loop_budget_review` queue items instead of silently continuing.
- [ ] Expensive or scope-broadening steps require human confirmation.
- [ ] Handoff to T-096 can create `ResearchWorkOrderDraft` / `ResearchWorkOrder`.
