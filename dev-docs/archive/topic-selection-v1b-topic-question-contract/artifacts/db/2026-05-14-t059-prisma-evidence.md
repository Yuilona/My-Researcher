# T-059 Prisma Evidence

## Scope
- Migration: `prisma/migrations/20260514160000_add_topic_selection_v1b_topic_question_contract/migration.sql`
- Schema: `prisma/schema.prisma`
- Context refresh: `docs/context/db/schema.json`

## Checks
- `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate`
  - Result: pass.
- `pnpm --filter @paper-engineering-assistant/backend typecheck`
  - Result: pass.
- `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`
  - Result: pass; DB context contract refreshed.

## Notes
- The existing physical `TopicQuestion` table is reused through nullable v1b authority metadata columns, including `v1bQuestionType` so T-059 question-type semantics remain separate from the legacy `contributionHypothesis` field.
- T-059 sidecar tables are authority tables for formation runs, frames, candidate sets/candidates, selection decisions, contracts, answerability plans, structured refs, and falsification conditions.
- `TopicQuestionContract` persists `answerabilityPlanId`, accepted risk refs, and risk notes in addition to claim ceilings, excluded/prohibited claims, required evidence categories, allowed refinements, stop/reopen conditions, and contract hash metadata.
- No HTTP/API closure or production promotion tables were added in this task.
