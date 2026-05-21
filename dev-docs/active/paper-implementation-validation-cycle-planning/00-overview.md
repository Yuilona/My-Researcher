# T-095 Paper Implementation Validation Cycle Planning

## Status
- State: done
- Parent task: `T-091 paper-implementation-full-landing`
- Mapping: `M-001 > F-001 > R-013`
- Flow node: validation cycle, route/probe planning, experiment-plan candidates
- Completed: backend minimum closure for validation planning authority.
- Next step: T-096 consumes admitted validation planning objects as WorkOrder-ready inputs.

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
- [x] `ValidationCycle` has criteria, budget, expected information gain, and stop conditions.
- [x] Validation scheduling respects admitted `CoreMotiveVersion`, active motive role, fresh motive state, and trace-ready board context.
- [x] Route/probe/experiment plan candidates are planning-only, trace-ready, and do not call experiment-foundation.
- [x] Low-information repeated cycles create `loop_budget_review` review items instead of silently continuing.
- [x] Expensive or scope-broadening admission paths require human confirmation; unresolved baseline gaps block expensive/confirmatory plans.
- [x] Handoff to T-096 can use admitted `ValidationCycle`, `TechnicalRouteCandidate`, `FeasibilityProbe`, and `ExperimentPlanLight` refs.
