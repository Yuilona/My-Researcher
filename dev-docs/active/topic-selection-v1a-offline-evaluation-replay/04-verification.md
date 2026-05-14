# 04 Verification

## 2026-05-13
- Check: project governance sync after package creation.
- Result: registered this package as `T-050` and mapped it to `M-001 / F-001 / R-009`.
- Check: v1a implementation contract review.
- Result: this package can start with frozen fixtures after shared refs exist, then records the first meaningful baseline from real v1a vertical-slice outputs without writing production authority objects.
- Check: shared contracts and exports.
- Result: added offline evaluation/replay contracts, direct package export, aggregate barrel export, and schema/export coverage.
- Check: backend replay service and repository slice.
- Result: added in-memory and Prisma repositories plus `TopicSelectionOfflineEvaluationReplayService` for synthetic dataset creation, frozen case-result recording, ReplayDiff creation, and metric calculation.
- Check: Prisma SSOT.
- Result: added repo-prisma models and migration SQL for dataset, case, run, case result, metric result, and replay diff records. No target database apply was run.
- Check: synthetic baseline replay.
- Result: deterministic fixture baseline covers all required v1a case types and computes all minimum metrics from frozen observed/gold snapshots.
- Check: post-implementation semantic drift review.
- Result: tightened offline observed-output and baseline-snapshot schemas to reuse T-049 final-decision/readiness vocabularies, including baseline replay snapshots. This prevents a parallel offline vocabulary such as promotion-stage decisions from entering v1a replay records.
- Check: duplicate and completion safety review.
- Result: added service and DB protection for one case result per run/case and one metric result per run/key, rejected late results after completion, required exact active-case result coverage before metric calculation, and made completed metric reads idempotent.
- Check: metric correctness review.
- Result: deduplicated ref-set comparisons for evidence, recheck, and negative-memory calculations so duplicate refs cannot inflate recall/precision or create false replay instability.
- Check: double-track implementation risk review.
- Result: added tests that keep offline replay isolated from live v1a write services and require replay runs to use a non-empty deduplicated metric set.
- Check: verification commands.
- Result:
  - `pnpm --filter @paper-engineering-assistant/shared test` passed.
  - `pnpm --filter @paper-engineering-assistant/backend test` passed.
  - `pnpm --filter @paper-engineering-assistant/shared typecheck` passed.
  - `pnpm --filter @paper-engineering-assistant/backend typecheck` passed.
  - `DATABASE_URL='postgresql://user:pass@localhost:5432/db' pnpm --filter @paper-engineering-assistant/backend prisma:validate` passed.
  - `pnpm --filter @paper-engineering-assistant/backend prisma:format` and `prisma:generate` passed.
  - `node .ai/scripts/ctl-db-ssot.mjs sync-to-context` passed.
  - `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict` passed.
  - `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` passed.
  - `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` passed.
  - `git diff --check` passed.

## Pending Checks
- Curate a larger reviewed non-synthetic dataset after more real v1a cases exist.

## 2026-05-13 Prisma Vertical-Slice Replay Smoke
- Check: `DATABASE_URL='postgresql://yurui@127.0.0.1:5432/my_researcher_v1a_e2e_20260513?schema=public' RUN_TOPIC_SELECTION_V1A_PRISMA_E2E=1 node --test --loader ts-node/esm src/services/topic-selection-v1a-prisma.e2e.test.ts` from `apps/backend`.
- Result: passed. The new E2E smoke creates a `frozen_snapshot` dataset from a real Prisma-backed v1a vertical-slice output, records a case result, completes a replay run, and verifies `trace_completeness = 1` for the smoke case without writing production authority objects from replay.

## Acceptance Checks
- [x] Replay does not write production ValidatedNeed.
- [x] Each metric result has numerator, denominator, contributing cases, and notes.
- [x] ReplayDiff flags final decision, key evidence, blocker set, and trace verdict changes.
- [x] Stage baseline includes the agreed minimum metrics and links failures back to frozen inputs.
