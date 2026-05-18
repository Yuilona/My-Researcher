# 04 Verification

## 2026-05-18
- `DATABASE_URL=dummy node --test --loader ts-node/esm src/services/topic-selection-v1b-topic-question-service.unit.test.ts`
  - Passed, 32 tests.
- `DATABASE_URL=dummy node --test --loader ts-node/esm src/services/topic-selection-v1b-value-assessment-service.unit.test.ts`
  - Passed, 23 tests.
- `DATABASE_URL=dummy node --test --loader ts-node/esm src/services/topic-selection-v1b-topic-question-service.unit.test.ts src/services/topic-selection-v1b-value-assessment-service.unit.test.ts`
  - Passed, 55 tests.
- `pnpm --filter @paper-engineering-assistant/backend typecheck`
  - Passed.
- Real provider run without non-advance allowance: `v1b-quality-real-20260518061604`
  - Result: failed at the disposition step because the script tried `advance_to_package` against a non-ready assessment.
  - Backend response: `GATE_CONSTRAINT_FAILED: advance_to_package requires ready value assessment.`
  - Interpretation: backend quality gate behaved correctly; harness needed a v1b non-advance acceptance mode.
- Real provider run with v1b non-advance allowance: `v1b-quality-real-nonadvance-20260518062006`
  - Result: passed as `passed_v1b_non_advance`.
  - Resource sample: 16 selected records, support=4/challenge=4/baseline=4/context=4.
  - TopicQuestion answerability verdict: `answerable_with_risk`.
  - Accepted risk created and carried into v1b selection.
  - ValueAssessment readiness: `needs_refinement`.
  - Value recommendation/disposition: `refine_slice`.
  - Package/v1c were not created, which is the expected quality-gated behavior for non-ready v1b output.

## 2026-05-18 Product-Level v1b E2E
- Initial full v1b module run with `DATABASE_URL=dummy`:
  - Command: `DATABASE_URL=dummy node --test --loader ts-node/esm src/services/topic-selection-v1b-intake-service.unit.test.ts src/services/topic-selection-v1b-research-slice-service.unit.test.ts src/services/topic-selection-v1b-topic-question-service.unit.test.ts src/services/topic-selection-v1b-value-assessment-service.unit.test.ts src/services/topic-selection-v1b-topic-package-service.unit.test.ts src/routes/topic-selection-v1b-routes.integration.test.ts`
  - Result: 90/91 passed; the only failure was expected environment misuse because the Prisma HTTP smoke requires a real Postgres `DATABASE_URL`.
- v1b HTTP/Prisma rerun with `.env.local`:
  - Command: `set -a; . ../../.env.local; set +a; node --test --loader ts-node/esm src/routes/topic-selection-v1b-routes.integration.test.ts`
  - Result: passed; 5/5 tests.
- Full v1b module rerun with `.env.local`:
  - Command: `set -a; . ../../.env.local; set +a; node --test --loader ts-node/esm src/services/topic-selection-v1b-intake-service.unit.test.ts src/services/topic-selection-v1b-research-slice-service.unit.test.ts src/services/topic-selection-v1b-topic-question-service.unit.test.ts src/services/topic-selection-v1b-value-assessment-service.unit.test.ts src/services/topic-selection-v1b-topic-package-service.unit.test.ts src/routes/topic-selection-v1b-routes.integration.test.ts`
  - Result: passed; 91/91 tests.
- Real provider product-flow run before fix:
  - Run id: `v1b-product-e2e-20260518072018`
  - Result: failed at `v1b LLM topic-value assessment`.
  - Backend response: `GATE_CONSTRAINT_FAILED: Value assessment value gates coverage invalid.`
  - Missing gates: `non_solved_sanity`, `answerability_sanity`, `feasibility_sanity`, `evidence_sanity`, `claim_ceiling_fit`.
  - Interpretation: backend guard behaved correctly, but provider output stability needed stronger schema and prompt constraints.
- Focused verification after fix:
  - Command: `DATABASE_URL=dummy node --test --loader ts-node/esm src/services/topic-selection-v1b-value-assessment-service.unit.test.ts`
  - Result: passed; 26/26 tests.
  - Command: `pnpm --filter @paper-engineering-assistant/shared test`
  - Result: passed; 89/89 tests.
  - Command: full v1b module rerun with `.env.local`.
  - Result: passed; 91/91 tests.
  - Command: `pnpm --filter @paper-engineering-assistant/backend typecheck && pnpm --filter @paper-engineering-assistant/shared typecheck`
  - Result: passed.
- Real provider product-flow run after fix:
  - Run id: `v1b-product-e2e-clean-20260518073017`
  - Artifact dir: `.ai/.tmp/topic-selection-real-flow/v1b-product-e2e-clean-20260518073017`
  - Result: passed.
  - Resource sample: 16 selected records; sample status `ready_with_warning`; warning `CONTEXT_CAP_APPLIED`.
  - TopicQuestion answerability verdict: `answerable_with_risk`.
  - ValueAssessment readiness: `ready_with_accepted_risk`.
  - Value disposition: `advance_to_package`.
  - TopicPackage created: `topic_package_df73b775-7483-4b3f-9243-541044944457`.
  - v1c handoff created: `v1b_to_v1c_input_bundle_4e53a38f-5de8-46e4-bb5c-1db47c48ffd0`.

## 2026-05-18 Governance Closure
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
  - Passed; T-080 moved from active to archive and registry-derived views were regenerated.
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
  - Passed.
