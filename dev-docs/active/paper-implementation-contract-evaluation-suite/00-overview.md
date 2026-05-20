# T-101 Paper Implementation Contract Evaluation Suite

## Status
- State: planned
- Parent task: `T-091 paper-implementation-full-landing`
- Mapping: `M-001 > F-001 > R-013`
- Flow node: contract, replay, adversarial, trace, and dossier evaluation
- Next step: design fixtures from D1-D10 and child outputs as contracts land.

## Goal
- Convert D1-D10 frozen rules into repeatable verification.
- Verify implementation design-doc component coverage, not only the roadmap decisions.
- Prove the implementation flow from intake through dossier/readiness/export projection.
- Catch authority bypass, missing trace, memo-as-evidence, failed-run loss, overclaim, stale ref, and UI command bypass.
- Catch portfolio drift, runtime harness bypass, upstream authority mutation, and JSON-only required fields.

## Non-goals
- Do not add new product semantics.
- Do not use mock-only green paths as product-quality evidence.
- Do not require live cloud/provider credentials for the default suite.

## Acceptance Criteria
- [ ] Evaluation matrix covers T-092 through T-100.
- [ ] Evaluation matrix covers implementation design-doc components and assigns each to tests or explicit residual-risk owners.
- [ ] Replay/adversarial fixtures cover happy paths and blocked paths.
- [ ] Fixtures cover portfolio role change, cross-board review, loop-budget review, runtime harness invariant failure, upstream feedback event, monitor callback without work order, and JSON-only queryability failures.
- [ ] Trace integrity and dossier readiness tests are repeatable.
- [ ] Residual risks and follow-up tasks are recorded before parent closure.
