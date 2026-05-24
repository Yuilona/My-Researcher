# Plan

## Phase 0 - Boundary Alignment
- [ ] Confirm T-105 is separate from T-104.
- [ ] Confirm provider variance is evaluation infrastructure, not authority logic.
- [ ] Confirm live provider runs are opt-in and skipped by default.
- [ ] Confirm output metrics and artifact expectations.

## Phase 1 - Current-State Audit
- [ ] Inspect T-099 PaperImplementation AI workflow harness contracts and service behavior.
- [ ] Inspect T-101 deterministic evaluation suite and residual-risk report.
- [ ] Inspect existing topic-selection provider canary patterns for reusable evaluation shape, without copying topic-selection semantics.

## Phase 2 - Evaluation Contract
- [ ] Define provider variance run request/response or local runner artifact schema.
- [ ] Define stable metrics: schema validity, trace validity, mutation attempt rate, overclaim rate, proposal stability, blocker rate, queue rate, latency, and provider failure shape.
- [ ] Define redaction rules for provider metadata and prompt/output artifacts.

## Phase 3 - Runner And Service Slice
- [ ] Add deterministic fake-provider runner path.
- [ ] Add optional live-provider runner profile.
- [ ] Store or emit evaluation artifacts without changing PaperImplementation authority state.
- [ ] Integrate with existing quality signal / decision queue patterns only when violations are observed.

## Phase 4 - Verification
- [ ] Unit tests for aggregation and guardrail metrics.
- [ ] Fake-provider tests for variance, invalid schema, unsupported refs, overclaim, and direct mutation attempts.
- [ ] Optional live-provider command documented but not required for default closure.
- [ ] Governance sync/lint and docs verification.
