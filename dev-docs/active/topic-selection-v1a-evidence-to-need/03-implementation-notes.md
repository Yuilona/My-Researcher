# 03 Implementation Notes

## Current Decisions
- This package is a stage-level coordinator. It should not become the place where all v1a implementation details accumulate.
- v1a implementation details should move into child task bundles with clear ownership.
- The first child split should preserve the dependency order: foundation -> search/evidence inputs -> evidence map/strength -> need validation -> recheck/risk/memory -> offline evaluation.
- v1a must include both entry adapters and cross-cutting control objects. The title-card/topic-seed adapter and Literature -> TopicSelection snapshot/content/source-health contracts are part of this stage, not later UI work.
- v1a closure must publish a stable v1b input bundle containing `ValidatedNeed`, adjudication/support packet refs, evidence/search snapshots, trace, risks, gaps, memory, recheck state, and human decision refs.

## Implementation Constraints
- Do not create v1b/v1c tables or workflows as hidden dependencies of v1a.
- Do not treat `SearchPlanCoverageMatrix` as an authority table; use coverage child records and a view/read model.
- Do not let `NeedCandidate` mutate `SearchPlan` directly; use `SearchPlanRecheckRequest`.
- Do not create `ValidatedNeed` for return/recheck/reject/park/merge outcomes.

## Open Implementation Questions
- Which existing title-card records become the first v1a adapter entrypoint?
- Which existing evidence basket structures can be reused for EvidenceMap/EvidenceUnit?
- Which workflow harness entrypoint should own `ValidateNeedAdjudication`?
- How much of offline evaluation can run before full persistence is complete?
