# T-106 Verification

## Creation Verification

Task package creation commands run on 2026-05-24:

```bash
node .ai/scripts/ctl-project-governance.mjs sync --apply --project main
node .ai/scripts/ctl-project-governance.mjs map --project main --task T-106 --milestone M-001 --feature F-001 --requirement R-012 --apply
node .ai/scripts/ctl-project-governance.mjs sync --apply --project main
node .ai/scripts/ctl-project-governance.mjs lint --check --project main
git diff --check -- dev-docs/active/experiment-foundation-real-interaction-hardening .ai/project/main
```

Results:

- `sync --apply`: passed; registry and derived project views regenerated.
- `map --apply`: passed; `T-106` mapped from `M-000/F-000` to `M-001/F-001/R-012`.
- `lint --check`: passed.
- `git diff --check`: passed for the new task package and project governance files.

## Phase 1 Matrix Verification

Commands run on 2026-05-25:

```bash
git diff --check -- dev-docs/active/experiment-foundation-real-interaction-hardening .ai/project/main
node .ai/scripts/ctl-project-governance.mjs sync --apply --project main
node .ai/scripts/ctl-project-governance.mjs lint --check --project main
```

Results:

- `06-hardening-matrix.md` added and reviewed as the Phase 1 executable matrix.
- The matrix contains lane taxonomy, fixture inventory, 22 critical node rows, current coverage baseline, and implementation backlog ids `T106-B1` through `T106-B6`.
- T-106 moved to `in-progress`; registry shows `T-106` under `M-001 > F-001 > R-012`.
- `git diff --check`: passed for T-106 docs and project governance files.
- `sync --apply`: passed and regenerated project derived views.
- `lint --check`: passed.
- No product code, shared contract, Prisma schema, REST route, desktop UI, or runner implementation changed in Phase 1.

## Remaining Verification Lanes

- Hardening matrix lint: every critical node has a fixture, command, expected outcome, and artifact. Phase 1 matrix is now the backlog source.
- LocalScript robustness: Phase 2 targeted backend tests now cover this lane; future runner work should only add artifact reporting and command integration.
- API/DB recovery: memory plus disposable local DB tests for registry, readiness, promotion, materialization, execution, result, and evidence paths.
- UI-driven workbench: desktop smoke/e2e for registry, readiness, jobs, results, evidence, and error states.
- Cross-flow seam: PaperImplementation and adjacent flows consume refs and hashes only.
- External canary: skipped, blocked, fake, or true opt-in behavior recorded separately from deterministic validation.

## Phase 2 LocalScript Verification

Commands run on 2026-05-25:

```bash
node --test --loader ts-node/esm src/services/experiment-foundation-execution-service.unit.test.ts
pnpm --filter @paper-engineering-assistant/backend typecheck
```

Results:

- Targeted execution service test: passed, 10 tests.
- Backend typecheck: passed.
- New tests covered disabled execution, command/root gates, `shell=false` argument behavior, non-terminal collect rejection, timeout terminal failure, partial validation without evidence, repeated collect idempotency, and existing submit idempotency conflict behavior.
- No product code changes were required.

Review fixes run on 2026-05-25:

```bash
node --test --loader ts-node/esm src/services/experiment-foundation-execution-service.unit.test.ts
pnpm --filter @paper-engineering-assistant/backend typecheck
node .ai/scripts/ctl-project-governance.mjs sync --apply --project main
node .ai/scripts/ctl-project-governance.mjs lint --check --project main
git diff --check -- apps/backend/src/services/experiment-foundation-execution-service.unit.test.ts dev-docs/active/experiment-foundation-real-interaction-hardening .ai/project/main
```

Results:

- Targeted execution service test: passed, 10 tests, after temp execution-root cleanup was added.
- Backend typecheck: passed.
- Governance sync/lint: passed.
- `git diff --check`: passed.
- Scope correction: topic-selection T-107/T-108 task packages were restored because they belong to a separate task stream and must not be deleted during T-106 work.
