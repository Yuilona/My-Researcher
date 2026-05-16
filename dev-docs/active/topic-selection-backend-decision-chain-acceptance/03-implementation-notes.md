# 03 Implementation Notes

## Current Position
- This task is an acceptance task, not an architecture or implementation task.
- T-042 is closed as the parent architecture/governance package.
- T-046 and T-061 through T-067 are closed as the v1c stage and child implementation packages.
- The first execution should prefer existing route/service tests and isolated Prisma smoke before adding any new tests.

## Acceptance Rules
- Record exact commands and outcomes in `04-verification.md`.
- If a check fails, classify it before changing code:
  - environment/precondition failure;
  - test harness defect;
  - contract drift;
  - actual backend behavior bug;
  - out-of-scope UI/downstream gap.
- Do not broaden T-042 scope while executing this task.
- Do not treat skipped or environment-gated Prisma checks as accepted unless an isolated smoke has passed in this task.

## Initial Residual-Risk Watch List
- Full backend test commands may intentionally require `DATABASE_URL` because v1b/v1c Prisma HTTP smokes are non-skipped.
- Existing desktop title-card UI does not yet expose the new topic-selection v1a/v1b/v1c reviewer workflow.
- Synthetic replay baselines prove harness coverage, not mature research-quality thresholds.

## Acceptance Decision - 2026-05-16
- Result: superseded by the tighter node-level acceptance standard requested on 2026-05-16.
- Blocking backend defects found in the previous pass: none.
- Product code changes made by this task: none.
- Environment/precondition finding: direct v1b/v1c single-file route commands fail when `DATABASE_URL` is unset because their Prisma HTTP smoke subtests intentionally require a migrated Postgres database. This is not a product-code defect; the same subtests passed inside the isolated Prisma smoke run.
- Residual gaps remain outside T-068: desktop reviewer UI exposure, full downstream `PaperProject` execution, and real-world research-quality threshold calibration.

## Tightened Acceptance Standard - 2026-05-16
- T-068 must include a deterministic mock fixture that represents a realistic topic-selection case and exercises every backend decision-chain node one by one.
- Each node must have explicit assertions for identity propagation, human/system decision boundary, trace refs, status transitions, and downstream handoff IDs where applicable.
- A broad API smoke is supporting evidence only; it is not sufficient acceptance evidence for this task.

## Node-Level Acceptance Decision - 2026-05-16
- Result: accepted.
- Added test: `apps/backend/src/routes/topic-selection-decision-chain-acceptance.test.ts`.
- Coverage shape: one deterministic fixture, 27 node-level subtests, and explicit negative checks for system-only validation, premature bridge creation, and non-human promotion authority.
- Blocking backend defects found: none.
- Product code changes made by this task: test-only plus dev-docs/project governance updates.

## Additional Acceptance Scope - 2026-05-16
- Continue using T-068 for two additional evidence classes:
  - invariant and negative acceptance;
  - persistence and contract acceptance.
- Do not reopen T-042 or split a new task unless acceptance exposes implementation work outside the backend decision chain.
- Prefer deterministic API-level acceptance tests plus isolated Prisma smoke evidence; avoid treating broad connectivity alone as sufficient.

## Invariant, Negative, Persistence, And Contract Acceptance Decision - 2026-05-16
- Result: accepted.
- Added coverage in `apps/backend/src/routes/topic-selection-decision-chain-acceptance.test.ts`.
- Coverage shape: the deterministic T-068 route test now has 30 node-level/invariant subtests plus a separate route-contract test; 32 tests pass in the target command.
- New invariant coverage:
  - blocked v1a readiness cannot create a validation support packet;
  - closed/validated v1a candidate cannot be adjudicated again;
  - v1b `park` disposition cannot create a draft package or v1c handoff;
  - duplicate v1b draft package creation for the same value disposition is rejected;
  - v1c non-promote decision is not bridge-eligible and bridge creation is rejected;
  - downstream no-recheck feedback is append-only and does not fabricate a recheck projection.
- Contract/persistence evidence:
  - malformed v1a/v1b/v1c route payloads return stable `INVALID_PAYLOAD` envelopes;
  - shared contract tests/typecheck, backend typecheck, OpenAPI/API index/context checks passed;
  - isolated Prisma smoke passed against disposable schema `topic_selection_acceptance_20260516_031236_0122`.
- Blocking backend defects found: none.
- Product code changes made by this task: none; changes are test-only plus task/governance documentation.

## Quality Baseline Acceptance Decision - 2026-05-16
- Result: accepted.
- Added route-level quality baseline coverage in `apps/backend/src/routes/topic-selection-decision-chain-acceptance.test.ts`.
- Coverage shape: the T-068 target test now includes a dedicated quality baseline test; total target command coverage is 33 tests.
- Verified baseline properties:
  - v1a/v1b/v1c synthetic baseline datasets are `synthetic_fixture`, `active`, stage-specific, and cover every required case type;
  - every synthetic case carries a same-stage frozen input bundle and fixture observed output;
  - cross-stage metric keys are rejected with `INVALID_PAYLOAD`;
  - default runs expose the full stage-specific metric key set;
  - case results can be recorded from fixture observed outputs, completed, and read back through route metrics;
  - representative metric ratios match the service-level quality baseline expectations;
  - replay diffs expose the expected changed dimensions for each stage.
- Guardrail: this remains a synthetic offline replay quality baseline. It verifies contract and regression-calibration behavior, not mature real-world research-quality thresholds.
- Blocking backend defects found: none.
- Product code changes made by this task: none; changes are test-only plus task/governance documentation.
