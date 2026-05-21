# 02 Architecture

## Contract Boundary
| Item | Contract |
|---|---|
| Input objects | `CoreMotiveVersion`, assertions, evidence-board gaps/conflicts, `CoreMotiveSet`, `MotivePortfolioDecision` |
| Output objects | `ValidationCycle`, route/probe candidates, `ExperimentPlanLight`, work-order draft refs, `loop_budget_review` queue candidates, upstream feedback candidates |
| Authority writer | `PaperImplementationValidationCyclePlanningService` through validation repository |
| Gates | cycle admission, route selection, feasibility, portfolio constraint, budget/stop rule, scope-broadening confirmation |
| Trace | motive refs, board refs, baseline/data refs, decision policy refs |
| Handoff | T-096 receives admitted validation cycles plus route/probe/experiment-plan-light refs with policy, trace, and portfolio context refs |

## Implemented Boundary
- Shared contracts live in `paper-implementation-validation-contracts`.
- Persistence is isolated in T-095 Prisma tables; required query fields are columnized and full refs are preserved as payload JSON.
- Service code is Prisma-free and depends on PaperImplementation project, motive, trace, and validation repositories.
- REST routes expose validation draft/admit/complete, planning objects, review items, upstream feedback candidates, and explicit dispatch.
- Admission does not call experiment-foundation, create `ResearchWorkOrder`, create evidence, or create claims.
- Completion does not mutate `CoreMotiveVersion`, evidence boards, portfolio roles, or upstream topic authority.

## Contract Review
- Low-cost cycles can be policy-confirmed.
- Expensive cycles and boundary expansion require human-confirmed transition.
- Exploratory plans can inform future planning but cannot support strong claims without later confirmatory evidence.
- Every active motive must have a current validation cycle, a portfolio decision, or a clear park/abandon state.
- Repeated low-information cycles must create a queue item rather than consuming budget silently.
