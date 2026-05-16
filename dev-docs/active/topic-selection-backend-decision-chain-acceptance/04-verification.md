# 04 Verification

## Planned Commands
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- `pnpm --filter @paper-engineering-assistant/shared test`
- `pnpm --filter @paper-engineering-assistant/shared typecheck`
- `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate`
- `pnpm --filter @paper-engineering-assistant/backend typecheck`
- `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-v1a-routes.integration.test.ts`
- `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-v1b-routes.integration.test.ts`
- `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-v1c-routes.integration.test.ts`
- `node .ai/scripts/ctl-openapi-quality.mjs verify --strict`
- `node .ai/scripts/ctl-api-index.mjs verify --strict`
- `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict`
- `pnpm ci:prisma-smoke -- --base-url "$(sed -n 's/^DATABASE_URL=//p' .env.local)" --schema-prefix topic_selection_acceptance --artifacts-dir .ai/.tmp/prisma-smoke-topic-selection-acceptance`

## Results
## 2026-05-16 Task Package Opening
- Check: created `dev-docs/active/topic-selection-backend-decision-chain-acceptance/` with standard task bundle files.
- Result: task package opened as `T-068`, status `planned`.
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: passed; T-068 registered in project hub.
- Check: `node .ai/scripts/ctl-project-governance.mjs map --project main --task T-068 --feature F-001 --milestone M-001 --requirement R-009 --apply`.
- Result: passed; T-068 mapped to `M-001 / F-001 / R-009`.
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main && node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed; registry and derived views are in sync.
- Check: `git diff --check`.
- Result: passed.

## 2026-05-16 End-to-End Functional Acceptance
- Check: task status update.
- Result: T-068 moved from `planned` to `in-progress` before running acceptance commands.

- Check: `pnpm --filter @paper-engineering-assistant/shared typecheck`.
- Result: passed.

- Check: `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed; 45 tests passed, 0 failed, 0 skipped.

- Check: `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate`.
- Result: passed; Prisma schema is valid.

- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed; Prisma generate completed before TypeScript compilation.

- Check: `node .ai/scripts/ctl-openapi-quality.mjs verify --strict && node .ai/scripts/ctl-api-index.mjs verify --strict && node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict`.
- Result: passed; API index checksum verified and context verification passed with the built-in validator.

- Check: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-v1a-routes.integration.test.ts`.
- Result: passed; 3 tests passed, 0 failed.
- Covered:
  - v1a evidence-to-need route path through `buildApp`.
  - malformed search-plan payload rejection before service execution.
  - optional request-body endpoints accepting omitted bodies.

- Check: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-v1b-routes.integration.test.ts`.
- Result: environment/precondition failure without `DATABASE_URL`; 4 memory-mode route tests passed and the Prisma HTTP smoke subtest failed with `DATABASE_URL is required for T-054 Prisma HTTP smoke test.`
- Classification: environment/precondition failure, not accepted as persistence evidence by itself.
- Resolution: the same T-054 Prisma HTTP smoke subtest passed in the isolated Prisma smoke run below.

- Check: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-v1c-routes.integration.test.ts`.
- Result: environment/precondition failure without `DATABASE_URL`; 4 memory-mode route tests passed and the Prisma HTTP smoke subtest failed with `DATABASE_URL is required for T-067 Prisma HTTP smoke test.`
- Classification: environment/precondition failure, not accepted as persistence evidence by itself.
- Resolution: the same T-067 Prisma HTTP smoke subtest passed in the isolated Prisma smoke run below.

- Check: `pnpm ci:prisma-smoke -- --base-url "$(sed -n 's/^DATABASE_URL=//p' .env.local)" --schema-prefix topic_selection_acceptance --artifacts-dir .ai/.tmp/prisma-smoke-topic-selection-acceptance`.
- Result: passed.
- Evidence:
  - Smoke schema created: `topic_selection_acceptance_20260516_023007_d307`.
  - Prisma generate passed.
  - 34 repo migrations applied.
  - Backend tests passed against isolated Prisma schema: 424 tests total, 423 passed, 1 skipped, 0 failed.
  - T-054 v1b Prisma HTTP smoke passed as backend test `ok 64`.
  - T-067 v1c Prisma HTTP smoke passed as backend test `ok 68`.
  - Smoke schema cleanup passed; `90-summary.json` reports `success: true`, `failed: false`, `cleanup_failed: false`.
- Artifacts:
  - `.ai/.tmp/prisma-smoke-topic-selection-acceptance/20260516-023007/00-context.json`
  - `.ai/.tmp/prisma-smoke-topic-selection-acceptance/20260516-023007/01-prisma-generate.log`
  - `.ai/.tmp/prisma-smoke-topic-selection-acceptance/20260516-023007/02-prisma-migrate-deploy.log`
  - `.ai/.tmp/prisma-smoke-topic-selection-acceptance/20260516-023007/03-backend-test-prisma.log`
  - `.ai/.tmp/prisma-smoke-topic-selection-acceptance/20260516-023007/04-drop-schema.log`
  - `.ai/.tmp/prisma-smoke-topic-selection-acceptance/20260516-023007/90-summary.json`

## Hard Decision Invariants
- v1a:
  - Candidate creation stores hypothesis only.
  - Non-validate adjudication persists result with no `output_validated_need_id`.
  - Validate adjudication requires a human confirmation actor and creates `HumanConfirmedDecision`, `ValidatedNeed`, candidate result link, and v1b bundle.
  - `request_searchplan_recheck` emits T-052 request without mutating `SearchPlan`.
  - Memory suggestions remain suggestions only.
- v1b:
  - `advance_to_package` creates a trace-ready draft package and v1c bundle.
  - Non-advance and already-output decisions cannot create packages.
  - Boundary conflicts create revision-needed packages without v1c bundles.
- v1c:
  - Promote handoff creates an active `PaperProjectBridge` without creating `PaperProject`.
  - Non-promote, superseded, missing commitment, workspace drift, and malformed bridge handoff lineage are rejected before bridge creation.
  - Downstream feedback maps loopback causes to explicit targets and remains append-only.
  - Upstream authority loopbacks are rejected when bridge lineage is missing.
- Control plane and replay:
  - Raw `QualitySignal` does not directly block or create authority state.
  - `needs-human-review` transition requires valid human confirmation.
  - Offline replay records case results without production workflow or `ValidatedNeed` dependencies.
  - v1c replay metrics include human-promotion bypass and bridge trace completeness checks.

## Acceptance Summary
- Decision: accepted after tightened node-level, invariant/negative, route-contract, and isolated persistence acceptance on 2026-05-16.
- Blocking backend defects found in the previous pass: none found.
- Required follow-ups: none inside T-068.
- Out-of-scope residual gaps:
  - Desktop reviewer UI does not yet expose the new v1a/v1b/v1c reviewer workflow.
  - Full downstream `PaperProject` execution remains separate from `PaperProjectBridge` handoff acceptance.
  - Synthetic replay baselines do not establish mature real-world research-quality thresholds.

## 2026-05-16 Closure Checks
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main && node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed; T-068 is registered as `done` in project hub derived views.
- Check: `git diff --check`.
- Result: passed.

## 2026-05-16 Invariant, Negative, Persistence, And Contract Acceptance
- Change: extended `apps/backend/src/routes/topic-selection-decision-chain-acceptance.test.ts`.
- Fixture: reused the deterministic T-068 mock data and added targeted negative branches without relying on broad connectivity.
- Check: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-decision-chain-acceptance.test.ts`.
- Result: passed; 32 tests passed, 0 failed. The parent decision-chain test contains 30 node-level/invariant subtests.
- Added invariant/negative coverage:
  - v1a blocked readiness with no support/baseline/context refs returns `evidence_gap` and cannot create a validation support packet;
  - v1a duplicate adjudication after `ValidatedNeed` authority closure returns `GATE_CONSTRAINT_FAILED`;
  - v1b `park` disposition cannot create a draft package or v1c handoff;
  - v1b duplicate draft package creation for the same value disposition returns `VERSION_CONFLICT`;
  - v1c non-promote `refine_package` decision is not bridge-eligible and bridge creation returns `GATE_CONSTRAINT_FAILED`;
  - downstream `no_recheck_needed` feedback appends a second feedback item without fabricating a recheck projection.
- Added route-contract coverage:
  - malformed v1a search-plan payload returns `INVALID_PAYLOAD`;
  - invalid v1b slice-selection enum returns `INVALID_PAYLOAD`;
  - malformed v1c promotion-decision payload returns `INVALID_PAYLOAD`;
  - malformed v1c downstream-feedback payload returns `INVALID_PAYLOAD`.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed; Prisma generate completed before TypeScript compilation.
- Check: `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed; 45 tests passed, 0 failed, 0 skipped.
- Check: `pnpm --filter @paper-engineering-assistant/shared typecheck`.
- Result: passed.
- Check: `node .ai/scripts/ctl-openapi-quality.mjs verify --strict`.
- Result: passed.
- Check: `node .ai/scripts/ctl-api-index.mjs verify --strict`.
- Result: passed; API index checksum verified as `10d71b81260cc1be...`.
- Check: `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict`.
- Result: passed; context verification used the built-in validator because Ajv is not installed locally.
- Check: `pnpm ci:prisma-smoke -- --base-url "$(sed -n 's/^DATABASE_URL=//p' .env.local)" --schema-prefix topic_selection_acceptance --artifacts-dir .ai/.tmp/prisma-smoke-topic-selection-acceptance`.
- Result: passed.
- Evidence:
  - Smoke schema created: `topic_selection_acceptance_20260516_031236_0122`.
  - Prisma generate passed.
  - 34 repo migrations applied.
  - Backend tests passed against isolated Prisma schema: 456 tests total, 455 passed, 1 skipped, 0 failed.
  - T-068 decision-chain acceptance passed inside the isolated backend test run.
  - Smoke schema cleanup passed; script reported successful execution.
- Artifacts:
  - `.ai/.tmp/prisma-smoke-topic-selection-acceptance/20260516-031236/00-context.json`
  - `.ai/.tmp/prisma-smoke-topic-selection-acceptance/20260516-031236/01-prisma-generate.log`
  - `.ai/.tmp/prisma-smoke-topic-selection-acceptance/20260516-031236/02-prisma-migrate-deploy.log`
  - `.ai/.tmp/prisma-smoke-topic-selection-acceptance/20260516-031236/03-backend-test-prisma.log`
  - `.ai/.tmp/prisma-smoke-topic-selection-acceptance/20260516-031236/04-drop-schema.log`
  - `.ai/.tmp/prisma-smoke-topic-selection-acceptance/20260516-031236/90-summary.json`

## 2026-05-16 Tightened Node-Level Acceptance
- Change: added `apps/backend/src/routes/topic-selection-decision-chain-acceptance.test.ts`.
- Fixture: deterministic T-068 mock title card, literature source, coverage rows, evidence units, v1b LLM outputs, human decisions, promotion condition, and downstream feedback.
- Check: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-decision-chain-acceptance.test.ts`.
- Result: passed; 28 tests passed, 0 failed. The parent test contains 27 node-level subtests.
- Covered v1a nodes:
  - fixture title card/literature/evidence basket;
  - topic seed;
  - resource pool snapshot;
  - search plan;
  - search run and coverage matrix;
  - evidence map and validation evidence bundle;
  - need candidate;
  - readiness assessment and validation support packet;
  - human adjudication and v1b input handoff.
- Covered v1b nodes:
  - intake snapshot;
  - research constraint profile;
  - intake readiness;
  - research-slice option generation;
  - human slice selection and `ResearchSlice` materialization;
  - topic-question candidate generation;
  - human question selection and contract materialization;
  - value assessment gates/dimensions;
  - value disposition;
  - trace-ready draft package;
  - idempotent v1c input handoff.
- Covered v1c nodes:
  - promotion input snapshot;
  - deterministic promotion support;
  - dossier;
  - argument readiness mini-check;
  - promotion gate;
  - human promotion decision;
  - commitment profile;
  - promotion decision read models;
  - active `PaperProjectBridge` without `PaperProject` side effect;
  - downstream feedback and recheck projection.
- Negative boundaries:
  - system-only v1a validate adjudication rejected with `INVALID_PAYLOAD`;
  - premature bridge creation rejected with `NOT_FOUND`;
  - non-human v1c promotion actor rejected with `INVALID_PAYLOAD`.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed.
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main && node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed; T-068 remains registered as `done` after the tightened acceptance update.
- Check: `git diff --check`.
- Result: passed.

## 2026-05-16 Final Closure Checks
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: passed; T-068 is registered as `done` in project hub derived views after the invariant/persistence acceptance update.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: `git diff --check`.
- Result: passed.

## 2026-05-16 Quality Baseline Acceptance
- Change: extended `apps/backend/src/routes/topic-selection-decision-chain-acceptance.test.ts` with a dedicated route-level quality baseline acceptance test.
- Scope:
  - v1a/v1b/v1c synthetic offline replay baseline datasets;
  - case-type coverage and same-stage frozen input bundles;
  - stage-specific default metric sets;
  - representative metric ratios;
  - replay diff changed-dimension coverage;
  - cross-stage metric rejection.
- Check: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-decision-chain-acceptance.test.ts`.
- Result: passed; 33 tests passed, 0 failed. The target file now includes node-level decision-chain acceptance, route-contract acceptance, and quality baseline acceptance.
- Quality baseline assertions:
  - each stage's synthetic dataset is `synthetic_fixture`, `active`, and covers every required stage-specific case type;
  - each case has a same-stage frozen input bundle and `fixture_observed_output`;
  - incompatible cross-stage metric keys return `INVALID_PAYLOAD`;
  - each run exposes the full stage-specific metric key set;
  - metric records carry numeric numerator/denominator, case refs, failure refs, and notes;
  - representative ratios match expected v1a/v1b/v1c synthetic baseline values;
  - replay diffs expose the expected changed dimensions for v1a, v1b, and v1c.
- Check: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-offline-evaluation-replay-service.unit.test.ts`.
- Result: passed; 19 tests passed, 0 failed.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed; Prisma generate completed before TypeScript compilation.
- Check: `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed; 45 tests passed, 0 failed, 0 skipped.
- Acceptance interpretation: accepted as a synthetic offline replay regression baseline. It does not establish mature real-world research-quality thresholds.

## Closure Checklist
- [x] All required checks have recorded outcomes.
- [x] Failures have root-cause classification and follow-up ownership.
- [x] Acceptance summary states accepted / accepted with follow-ups / blocked under the final tightened/invariant/persistence standard.
- [x] Project governance sync/lint passes after status updates.
