# 05 Pitfalls

## Do Not Repeat
- Do not count papers as evidence strength.
- Do not treat high citation or venue as strong evidence.
- Do not store whole-paper summaries as authority.
- Do not let LLM inference become source claim.
- Do not allow abstract/manual locators to bypass concrete `source_ref` provenance.
- Do not precompute evidence strength for every EvidenceUnit and target.

## 2026-05-13 - Shared Barrel Runtime Surface
- Symptom: `pnpm --filter @paper-engineering-assistant/shared test` failed after adding T-047 contracts.
- Root cause: the shared barrel runtime-surface test builds an expected key set from each split module, but the new `topic-selection-evidence-map-contracts` module was not included in that expected set.
- What was tried: initial contract/schema smoke tests passed, but the aggregate runtime surface equality check failed.
- Fix: import `topicSelectionEvidenceMapContracts` in `title-card-management-contracts.schema.test.ts` and include its keys in the expected barrel export set.
- Prevention: whenever adding a new split contract module under `packages/shared/src/research-lifecycle/`, update both the direct schema smoke test and the barrel runtime-surface expected module list.
