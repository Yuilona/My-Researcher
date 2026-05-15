# 04 Verification

## 2026-05-13
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: registered this package as `T-046`.
- Check: `node .ai/scripts/ctl-project-governance.mjs map --task T-046 --feature F-001 --milestone M-001 --requirement R-009 --apply`.
- Result: mapped this package to `M-001 / F-001 / R-009`.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: coverage review against parent v1c contract.
- Result: explicit coverage added for PromotionInputSnapshot, package trace/boundary input, non-promote loopbacks, bridge creation restriction, and downstream feedback/recheck contract.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.

## 2026-05-15
- Check: v1b closure and hardening review.
- Result: v1b now produces `TopicPackage(draft)` with explicit readiness, trace/boundary checks, value refs, risk/blocker/recheck carry-forward, and `TopicSelectionV1bToV1cInputBundle` only for `ready_for_promotion_review` packages.
- Check: v1c contract boundary review.
- Result: v1c can start from `TopicSelectionV1bToV1cInputBundle`; it must not re-run v1b value assessment and must not require v1b to create `PromotionDecision` or `PaperProjectBridge`.
- Check: v1c child package split.
- Result: implementation packages created for T-061 promotion input snapshot, T-062 gate/support, T-063 human promotion decision/profile, T-064 paper project bridge, T-065 downstream feedback/recheck, T-066 offline replay, and T-067 HTTP/API closure.
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: project registry and derived views updated with T-061 through T-067.
- Check: `node .ai/scripts/ctl-project-governance.mjs map --project main --task T-061..T-067 --feature F-001 --milestone M-001 --requirement R-009 --apply`.
- Result: all v1c child packages mapped to `M-001 / F-001 / R-009`.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: v1c child package completeness review.
- Result: no new child package required. Closed contract gaps for `PromotionDossier` ownership, canonical promotion outcome vocabulary, pre-next closure statuses, gate-to-human promotion guard, v1c replay input/gate coverage, and HTTP review/read routes.

## Pending Checks
- Execute T-065 next, then continue through T-067 in order.

## 2026-05-15 T-063
- Check: `node --test --loader ts-node/esm src/services/topic-selection-v1c-human-promotion-decision-service.unit.test.ts`.
- Result: passed, 7 tests.
- Check: `node --test --loader ts-node/esm src/services/topic-selection-v1c-promotion-gate-service.unit.test.ts`.
- Result: passed, 13 tests.
- Check: `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed, 40 tests.
- Check: `pnpm --filter @paper-engineering-assistant/shared typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed.
- Check: `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/backend prisma:format`.
- Result: passed.
- Check: `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate`.
- Result: passed after formatting.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed after Prisma format and client regeneration.
- Check: `node --test --loader ts-node/esm src/services/topic-selection-v1c-human-promotion-decision-service.unit.test.ts`.
- Result: passed again after control-plane artifact checksum ordering fix.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed again after control-plane artifact checksum ordering fix.
- Check: `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`.
- Result: passed; refreshed DB context contract after T-063 Prisma schema changes.
- Check: `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`.
- Result: passed after formatting; checksums already up to date.
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: passed; refreshed project registry and derived views.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.

## Stage Closure Checks
- `PaperProjectBridge` is created only after human-confirmed `PromotionDecision`.
- Promotion gate records blockers, accepted risks, argument mini-check outputs, and recheck state.
- Bridge payload carries refs, snapshot hashes, policy version, and editable working-copy text.
- Downstream feedback creates feedback/recheck records rather than modifying upstream authority.

## 2026-05-15 T-064
- Check: `pnpm --filter @paper-engineering-assistant/shared test`.
- Result: passed, 42 tests.
- Check: `pnpm --filter @paper-engineering-assistant/shared typecheck`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-v1c-paper-project-bridge-service.unit.test.ts`.
- Result: passed, 6 tests.
- Check: `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --filter @paper-engineering-assistant/backend prisma:validate`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- Result: passed.
- Check: `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`.
- Result: passed; refreshed DB context contract after T-064 Prisma schema changes.
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: passed; refreshed project registry and derived views.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: `pnpm --filter @paper-engineering-assistant/backend test`.
- Result: full suite stopped only at existing T-054 Prisma HTTP smoke guard because `DATABASE_URL` was not set; 403 tests passed, 1 skipped, and new T-064 tests passed within the suite.
