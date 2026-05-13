# 04 Verification

## 2026-05-13
- Check: project governance sync after package creation.
- Result: registered this package as `T-049` and mapped it to `M-001 / F-001 / R-009`.
- Check: v1a implementation contract review.
- Result: this package owns readiness, adjudication, `ValidatedNeed` materialization, v1b input bundle publication, `SearchPlanRecheckRequest` emission, and candidate memory suggestions; durable memory policy remains owned by recheck/risk/memory.
- Check: post-implementation quality review and semantic-drift hardening.
- Result: tightened ready/adjudication gates, rejected unknown EvidenceUnit selections, handled empty selected role bundles as blocked readiness, restricted memory suggestion status to `suggested`, and added a DB uniqueness guard so one `NeedCandidate` cannot create multiple `ValidatedNeed` records.
- Check: shared schema/export smoke tests.
- Command: `pnpm --filter @paper-engineering-assistant/shared test`
- Result: pass, 24 tests.
- Check: shared typecheck.
- Command: `pnpm --filter @paper-engineering-assistant/shared typecheck`
- Result: pass.
- Check: Prisma schema format and validation with explicit local DATABASE_URL.
- Commands:
  - `DATABASE_URL='postgresql://user:pass@localhost:5432/my_researcher?schema=public' pnpm --filter @paper-engineering-assistant/backend prisma:format`
  - `DATABASE_URL='postgresql://user:pass@localhost:5432/my_researcher?schema=public' pnpm --filter @paper-engineering-assistant/backend prisma:validate`
- Result: pass; migration SQL added but no target DB apply was performed.
- Check: Prisma client generation.
- Command: `pnpm --filter @paper-engineering-assistant/backend prisma:generate`
- Result: pass.
- Check: backend service tests.
- Command: `pnpm --filter @paper-engineering-assistant/backend test`
- Result: pass, 254 tests.
- Check: backend typecheck.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: pass.
- Check: DB context refresh after Prisma schema change.
- Command: `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`
- Result: pass; `docs/context/db/schema.json` refreshed from repo-prisma SSOT.
- Check: strict context verification.
- Command: `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict`
- Result: pass.
- Check: project governance sync.
- Command: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- Result: pass; project registry and derived views regenerated.
- Check: project governance lint.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: pass.
- Check: diff hygiene.
- Command: `git diff --check`
- Result: pass.

## Pending Checks
- Target database migration apply remains pending explicit environment approval; this package only adds reviewed migration SQL and validates/generates locally.

## Acceptance Checks
- [x] `output_validated_need_id` is non-null only for validate.
- [x] `ValidatedNeed` can trace to candidate, support packet, adjudication result, human decision, evidence units, SearchRun, SearchPlan, and literature snapshot.
- [x] Request-searchplan-recheck creates a structured request instead of mutating SearchPlan.
- [x] Candidate memory suggestions are handed to recheck/risk/memory and do not become durable blocking memory without policy interpretation.
