# 01 Plan

## Phases
1. Build D1-D10 frozen-rule test matrix.
2. Build design-doc component coverage matrix for control plane, portfolio, WorkOrder harness, trace, feedback, and evaluation components.
3. Add contract tests for each flow-node child.
4. Add replay/adversarial fixtures for stale refs, missing trace, memo-as-evidence, failed-run omission, overclaim, confirmation bypass, portfolio drift, runtime harness bypass, and upstream authority mutation.
5. Add queryability tests for required gate/queue/trace/run/claim/dossier fields.
6. Add dossier readiness and packet projection tests.
7. Produce parent closure review and residual-risk report.

## Review Before Closure
- Confirm every child task has verification evidence.
- Confirm full flow can be replayed without relying on UI-only or mock-only authority.
- Confirm required query fields can be tested without JSON payload inspection.
- Confirm design-doc components are either implemented, deferred with owner, or split into follow-up tasks.
- Confirm open risks are either accepted with owner or split into follow-up tasks.

## Verification
- Contract/replay/mutation/adversarial/queryability tests.
- Governance lint and parent closure review.
