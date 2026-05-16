# 04 Verification

## 2026-05-13
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: registered this package as `T-044`.
- Check: `node .ai/scripts/ctl-project-governance.mjs map --task T-044 --feature F-001 --milestone M-001 --requirement R-009 --apply`.
- Result: mapped this package to `M-001 / F-001 / R-009`.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: coverage review against parent v1a contract.
- Result: explicit coverage added for title-card/topic-seed adapter, Literature -> TopicSelection contracts, cross-cutting control objects, and v1a->v1b input bundle.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: created six v1a implementation child packages and ran `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: packages registered as `T-047 topic-selection-v1a-evidence-map-strength`, `T-048 topic-selection-v1a-foundation-control-plane`, `T-049 topic-selection-v1a-need-validation`, `T-050 topic-selection-v1a-offline-evaluation-replay`, `T-051 topic-selection-v1a-recheck-risk-memory`, and `T-052 topic-selection-v1a-search-resource-evidence-inputs`.
- Check: mapped `T-047` through `T-052` to `M-001 / F-001 / R-009`, then reran governance sync.
- Result: registry and derived project views updated.
- Check: implementation contract review for v1a child-package coverage.
- Result: added `06-implementation-contract-review.md`; resolved ownership gaps for `QualitySignal`, `SearchPlanRecheckRequest`, generic human confirmation, trace lineage, v1b handoff, and offline replay sequencing.

## Pending Checks
- None for backend/service/API v1a closure. Frontend/UIUX exposure and larger curated replay datasets are future packages.

## Stage Closure Checks
- [x] A `ValidatedNeed` can be created only through `ValidateNeedAdjudicationResult.final_decision = validate`.
- [x] Non-validate adjudication outcomes keep `output_validated_need_id = null`.
- [x] Trace can be followed from `ValidatedNeed` to EvidenceUnit, SearchRun, SearchPlan, and literature snapshot.
- [x] Recheck/risk/memory states are visible to gates and do not rewrite historical decisions.
- [x] Offline evaluation/replay can report the v1a minimum metrics.

## 2026-05-13 Prisma E2E Smoke
- Check: `pnpm install --frozen-lockfile`.
- Result: passed; workspace dependencies were already up to date.
- Check: baseline verification before adding the E2E smoke.
- Result: `pnpm --filter @paper-engineering-assistant/shared test`, `pnpm --filter @paper-engineering-assistant/shared typecheck`, `pnpm --filter @paper-engineering-assistant/backend typecheck`, and `pnpm --filter @paper-engineering-assistant/backend test` passed; backend baseline was 279 passing tests.
- Check: local Postgres environment setup.
- Result: created isolated local database `my_researcher_v1a_e2e_20260513`; `prisma migrate deploy` applied all 23 repo migrations successfully through `20260513224500_add_topic_selection_offline_evaluation_replay`.
- Check: added `apps/backend/src/services/topic-selection-v1a-prisma.e2e.test.ts`.
- Result: the test is skipped by default and explicitly requires `RUN_TOPIC_SELECTION_V1A_PRISMA_E2E=1` plus `DATABASE_URL`; normal backend tests do not require Postgres.
- Check: `DATABASE_URL='postgresql://yurui@127.0.0.1:5432/my_researcher_v1a_e2e_20260513?schema=public' RUN_TOPIC_SELECTION_V1A_PRISMA_E2E=1 node --test --loader ts-node/esm src/services/topic-selection-v1a-prisma.e2e.test.ts` from `apps/backend`.
- Result: passed. The smoke created persisted title-card/literature/fulltext inputs, `TopicSeed`, `LiteratureResourcePoolSnapshot`, `SearchPlan`, `SearchRun`, `EvidenceMap`, `NeedCandidate`, readiness, support packet, human-confirmed `ValidatedNeed`, v1b input bundle, interpreted `QualitySignal`, accepted risk, materialized `SearchPlanRecheckRequest`, durable decision memory, and a frozen replay run seeded from the real vertical-slice output.
- Fix: initial E2E test asserted `effect_policy` on `CandidateDecisionMemory`; corrected it to assert `DecisionMemoryEntry.effect_policy`, matching the T-051 contract.
- Fix: repeat-run E2E exposed a test isolation bug where open queue assertions were global and could see previous smoke data in the same database. Scoped the queue assertion to the current `title_card_id`, then reran the Prisma E2E twice successfully against the already-populated database.
- Check: post-fix default verification.
- Result: `pnpm --filter @paper-engineering-assistant/backend typecheck` passed; default `pnpm --filter @paper-engineering-assistant/backend test` passed with 279 passing tests and 1 skipped Prisma E2E; shared test/typecheck passed; `git diff --check` passed.

## 2026-05-13 HTTP/API Closure
- Check: `T-053 topic-selection-v1a-http-api-closure`.
- Result: added buildApp-wired Fastify routes under `/topic-selection/v1a/*`, controller boundary, OpenAPI context entries, and route tests.
- Check: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-v1a-routes.integration.test.ts`.
- Result: passed in memory mode; HTTP smoke created a human-confirmed `ValidatedNeed`, v1b input bundle, interpreted recheck queue item, accepted risk, materialized candidate memory, and synthetic offline baseline dataset.
- Check: same route test with local Prisma/Postgres environment using `my_researcher_v1a_e2e_20260513`.
- Result: passed with `TITLE_CARD_REPOSITORY=prisma`, `RESEARCH_LIFECYCLE_REPOSITORY=prisma`, `AUTO_PULL_REPOSITORY=prisma`, and `APPLICATION_SETTINGS_REPOSITORY=prisma`.

## 2026-05-14 Status Sync
- Check: v1a package status review before v1b split.
- Result: `T-044`, `T-047`, `T-048`, `T-049`, `T-050`, `T-051`, `T-052`, and `T-053` have satisfied their backend/service/API closure criteria and can be represented as `done` in project governance.
