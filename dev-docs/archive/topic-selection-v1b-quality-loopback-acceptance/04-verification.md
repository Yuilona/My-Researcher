# 04 Verification

## 2026-05-18

### Focused Value Assessment Unit Tests
Command:
```bash
DATABASE_URL=dummy node --test --loader ts-node/esm src/services/topic-selection-v1b-value-assessment-service.unit.test.ts
```
Working directory:
```text
apps/backend
```
Outcome:
- Passed: 26/26 tests.

### v1b Topic Question + Value Assessment Unit Tests
Command:
```bash
DATABASE_URL=dummy node --test --loader ts-node/esm src/services/topic-selection-v1b-topic-question-service.unit.test.ts src/services/topic-selection-v1b-value-assessment-service.unit.test.ts
```
Working directory:
```text
apps/backend
```
Outcome:
- Passed: 58/58 tests.

### Backend Typecheck
Command:
```bash
pnpm --filter @paper-engineering-assistant/backend typecheck
```
Working directory:
```text
repo root
```
Outcome:
- Passed.

## 2026-05-18 HTTP Loopback Re-Entry E2E

### v1b Route Integration
Command:
```bash
set -a
. ../../.env.local
set +a
node --test --loader ts-node/esm src/routes/topic-selection-v1b-routes.integration.test.ts
```
Working directory:
```text
apps/backend
```
Outcome:
- Passed: 6/6 tests.
- New coverage: `topic-selection v1b HTTP loopback re-enters from refine_slice and advances after refinement`.

### Full v1b Module Set
Command:
```bash
set -a
. ../../.env.local
set +a
node --test --loader ts-node/esm \
  src/services/topic-selection-v1b-intake-service.unit.test.ts \
  src/services/topic-selection-v1b-research-slice-service.unit.test.ts \
  src/services/topic-selection-v1b-topic-question-service.unit.test.ts \
  src/services/topic-selection-v1b-value-assessment-service.unit.test.ts \
  src/services/topic-selection-v1b-topic-package-service.unit.test.ts \
  src/routes/topic-selection-v1b-routes.integration.test.ts
```
Working directory:
```text
apps/backend
```
Outcome:
- Passed: 92/92 tests.

### Typecheck And Hygiene
Command:
```bash
pnpm --filter @paper-engineering-assistant/backend typecheck
pnpm --filter @paper-engineering-assistant/shared typecheck
node .ai/scripts/ctl-project-governance.mjs lint --check --project main
git diff --check
```
Working directory:
```text
repo root
```
Outcome:
- Passed.

## 2026-05-18 Expanded Loopback, Idempotency, And Real Provider Regression

### v1b Route Integration
Command:
```bash
set -a
. ./.env.local
set +a
pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-v1b-routes.integration.test.ts
```
Working directory:
```text
repo root
```
Outcome:
- Passed: 8/8 tests.
- New coverage:
  - `refine_question` HTTP loopback re-enters question formation and advances after reframing.
  - `recheck_evidence_or_search` HTTP loopback targets pending recheck and advances after reassessment.

### TopicPackage Idempotency And Prisma Conflict Mapping
Command:
```bash
DATABASE_URL=dummy pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-v1b-topic-package-service.unit.test.ts
```
Working directory:
```text
repo root
```
Outcome:
- Passed: 12/12 tests.
- New coverage:
  - concurrent duplicate package creation returns one package and one `VERSION_CONFLICT`;
  - Prisma `P2002` on `v1bSourceValueDispositionDecisionId` maps to `VERSION_CONFLICT`.

### TopicQuestion Provider Drift Regression
Command:
```bash
DATABASE_URL=dummy pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/services/topic-selection-v1b-topic-question-service.unit.test.ts
```
Working directory:
```text
repo root
```
Outcome:
- Passed: 33/33 tests.
- New coverage: assumption refs with dropped `research_slice_assumption_` prefix normalize to inherited assumptions.

### Full v1b Module Set
Command:
```bash
set -a
. ./.env.local
set +a
pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm \
  src/services/topic-selection-v1b-intake-service.unit.test.ts \
  src/services/topic-selection-v1b-research-slice-service.unit.test.ts \
  src/services/topic-selection-v1b-topic-question-service.unit.test.ts \
  src/services/topic-selection-v1b-value-assessment-service.unit.test.ts \
  src/services/topic-selection-v1b-topic-package-service.unit.test.ts \
  src/routes/topic-selection-v1b-routes.integration.test.ts
```
Working directory:
```text
repo root
```
Outcome:
- Passed: 97/97 tests.

### Real Provider Multi-Sample Regression
Command pattern:
```bash
set -a
. ./.env.local
set +a
TOPIC_SELECTION_REAL_RUN_ID="<run-id>" \
TOPIC_SELECTION_REAL_LITERATURE_LIMIT=<12|16|20> \
TOPIC_SELECTION_REAL_ALLOW_NON_ADVANCE_V1B=1 \
pnpm --filter @paper-engineering-assistant/backend exec node --loader ts-node/esm ../../.ai/.tmp/topic-selection-real-flow.mjs
```
Working directory:
```text
repo root
```
Outcome:
- `v1b-multisample-12-20260518080900`: passed; 12 literature; `ready_with_accepted_risk -> advance_to_package`; package, v1c bundle, and bridge created.
- `v1b-multisample-16-20260518081147`: failed before fix at TopicQuestion formation due provider assumption-ref id prefix drift.
- `v1b-multisample-16-rerun-20260518081555`: passed as expected non-advance; 16 literature; `needs_refinement -> refine_question`; no package/v1c handoff.
- `v1b-multisample-20-20260518081846`: passed; 20 literature; `ready_with_accepted_risk -> advance_to_package`; package, v1c bundle, and bridge created.

### Typecheck
Command:
```bash
pnpm --filter @paper-engineering-assistant/backend typecheck
pnpm --filter @paper-engineering-assistant/shared typecheck
```
Working directory:
```text
repo root
```
Outcome:
- Passed.

## 2026-05-18 Repair Closure Regression

### v1b Route Integration
Command:
```bash
set -a
. ./.env.local
set +a
pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm src/routes/topic-selection-v1b-routes.integration.test.ts
```
Working directory:
```text
repo root
```
Outcome:
- Passed: 8/8 tests.
- Added `refine_question` repair closure assertions:
  - original non-ready assessment rejects forced `advance_to_package`;
  - old loopback disposition remains unable to create a package after repaired package success;
  - repaired contract and value snapshot preserve original ResearchSlice lineage;
  - support/challenge/baseline/context evidence roles, boundary refs, and inherited assumptions remain present.

### Full v1b Module Set
Command:
```bash
set -a
. ./.env.local
set +a
pnpm --filter @paper-engineering-assistant/backend exec node --test --loader ts-node/esm \
  src/services/topic-selection-v1b-intake-service.unit.test.ts \
  src/services/topic-selection-v1b-research-slice-service.unit.test.ts \
  src/services/topic-selection-v1b-topic-question-service.unit.test.ts \
  src/services/topic-selection-v1b-value-assessment-service.unit.test.ts \
  src/services/topic-selection-v1b-topic-package-service.unit.test.ts \
  src/routes/topic-selection-v1b-routes.integration.test.ts
```
Working directory:
```text
repo root
```
Outcome:
- Passed: 97/97 tests.

## 2026-05-18 Governance Closure
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
  - Passed; T-081 moved from active to archive and registry-derived views were regenerated.
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
  - Passed.

### Typecheck
Command:
```bash
pnpm --filter @paper-engineering-assistant/backend typecheck
pnpm --filter @paper-engineering-assistant/shared typecheck
```
Working directory:
```text
repo root
```
Outcome:
- Passed.
