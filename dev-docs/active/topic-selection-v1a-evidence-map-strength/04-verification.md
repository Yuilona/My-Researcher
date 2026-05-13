# 04 Verification

## 2026-05-13
- Check: project governance sync after package creation.
- Result: registered this package as `T-047` and mapped it to `M-001 / F-001 / R-009`.
- Check: v1a implementation contract review.
- Result: this package owns claim-level evidence and target-specific strength assessment; recheck/risk/memory and offline replay consume structured refs, not EvidenceMap summary text.
- Check: `pnpm --filter @paper-engineering-assistant/shared typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/backend prisma:generate`.
- Result: passed; Prisma Client regenerated from repo SSOT.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/backend test`.
- Result: passed, 240 tests. Includes T-047 in-memory slice tests for EvidenceMap creation, locator provenance, role separation, abstract-only support, negative cases, target-specific cache keys, cache reuse, and stale marking.
- Check: first run of `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: failed because the barrel runtime-surface whitelist did not include the new T-047 direct module exports.
- Fix: added `topicSelectionEvidenceMapContracts` to the expected barrel export surface in `title-card-management-contracts.schema.test.ts`.
- Check: rerun `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed, 22 tests.
- Check: `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`.
- Result: passed; `docs/context/db/schema.json` refreshed from `prisma/schema.prisma`.
- Check: `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict`.
- Result: passed.

## Pending Checks
- None.

## 2026-05-13 Review Follow-up
- Fix: tightened `EvidenceSourceLocator` shared schema and service validation so every EvidenceUnit must carry a concrete `locator.source_ref`; section/paragraph/anchor primary locator refs are checked against SearchRun-authorized refs.
- Fix: normalized persisted `EvidenceUnit.source_refs` from explicit unit refs plus locator source/content refs so downstream packages do not see a second provenance track.
- Fix: hardened `source_statement` runtime validation so malformed internal inputs produce `AppError(INVALID_PAYLOAD)` rather than a raw `TypeError`.
- Check: `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed, 23 tests. Added source locator schema coverage for required `source_ref`.
- Check: `pnpm --filter @paper-engineering-assistant/shared typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/backend test`.
- Result: passed, 241 tests. Added service negative coverage for missing source provenance and malformed `source_statement`.
- Check: `DATABASE_URL='postgresql://user:pass@localhost:5432/my_researcher?schema=public' pnpm --filter @paper-engineering-assistant/backend prisma:validate`.
- Result: passed.
- Check: `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict`.
- Result: passed.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: `git diff --check`.
- Result: passed.

## 2026-05-13 Cross-Package Closure Review
- Check: T-048/T-052/T-047 holistic implementation review.
- Result: T-047 stays internal backend/shared-contract only, consumes T-048 control-plane and T-052 SearchRun/search-plan/literature-snapshot refs, keeps role-separated EvidenceUnits, and does not implement NeedCandidate, ValidatedNeed, UI, REST, OpenAPI, v1b, or v1c behavior.
- Cleanup: Prisma adapter imports now target explicit T-048/T-047 contract modules instead of the aggregate research-lifecycle barrel; temporary `.DS_Store` and `.ai/.tmp` artifacts were removed.
- Verification: shared test passed with 23 tests, backend test passed with 241 tests, shared/backend typecheck passed, Prisma format/validate/generate passed, DB context sync passed, context verify passed, project governance sync/lint passed, and `git diff --check` passed.

## Final Verification Rerun
- Check: `DATABASE_URL='postgresql://user:pass@localhost:5432/my_researcher?schema=public' pnpm --filter @paper-engineering-assistant/backend prisma:format`.
- Result: passed.
- Check: `DATABASE_URL='postgresql://user:pass@localhost:5432/my_researcher?schema=public' pnpm --filter @paper-engineering-assistant/backend prisma:validate`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/backend prisma:generate`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed, 22 tests.
- Check: `pnpm --filter @paper-engineering-assistant/shared typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/backend test`.
- Result: passed, 240 tests.
- Check: `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`.
- Result: passed; all checksums up to date after final Prisma format/generate.
- Check: `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict`.
- Result: passed.
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: passed; project registry/dashboard/feature-map/task-index regenerated.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: `git diff --check`.
- Result: passed.

## Acceptance Checks
- [x] EvidenceMap can be rebuilt/audited from SearchRun refs.
- [x] Abstract-only support is flagged.
- [x] Same EvidenceUnit is not automatically reused across different target semantics.
- [x] NeedCandidate readiness receives support/challenge/baseline/context bundles.
- [x] Offline replay can receive frozen EvidenceMap/EvidenceUnit/assessment snapshots for trace and recall metrics.
