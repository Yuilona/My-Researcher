# 01 Plan

## Phase 1 - Adapter Survey
- Inspect current title-card intent fields and literature snapshot/content APIs.
- Decide the minimum TopicSeed and LiteratureResourcePoolSnapshot mapping.

Acceptance:
- [ ] Adapter inputs are documented.
- [ ] Missing upstream fields are listed.

## Phase 2 - SearchPlan Contracts
- Implement or stage `TopicSeed`, `SearchPlan`, and coverage child records.
- Provide matrix view/read model over coverage child records.

Acceptance:
- [ ] SearchPlan references TopicSeed and LiteratureResourcePoolSnapshot versions.
- [ ] Coverage intent, execution observation, evidence binding, assessment, and risk acceptance are separable.

## Phase 3 - SearchRun Contracts
- Implement or stage SearchRun execution provenance, result accounting, source health, dedup/canonical refs, and artifact refs.

Acceptance:
- [ ] SearchRun can be replayed/audited against SearchPlan and literature snapshot.
- [ ] Partial/failed source states are explicit.

## Phase 4 - Handoff To EvidenceMap
- Publish SearchRun output shape for EvidenceMap/EvidenceUnit construction.

Acceptance:
- [ ] EvidenceMap package can consume stable refs and does not need raw logs as authority.
