# 03 Implementation Notes

## Initial Notes
- Prefer bundle-level assessment for v1a.
- Unit-level drilldown is needed for blockers, human challenge, locator risk, or claim-strength conflicts.
- Assessment cache key must include target type/id/version, purpose, granularity, evidence bundle hash, EvidenceMap version, SearchPlan/SearchRun refs, policy version, and assessment workflow version.

## Open Questions
- Resolved for this slice: `LiteratureFulltextDocument/Section/Paragraph/Anchor` records provide section/paragraph/anchor locators; abstract and manual locator types are also supported.
- Deferred: this slice does not auto-run LLM extraction. EvidenceUnit inputs are structured service inputs and MUST carry locator-backed source provenance.
- Deferred: deterministic conflict detection is not auto-inferred. Thin `EvidenceConflictSet` records can be supplied and are exposed as refs for downstream consumers.

## 2026-05-13 Implementation
- Added shared T-047 contracts under `packages/shared/src/research-lifecycle/topic-selection-evidence-map-contracts.ts` and exported them through direct and aggregate shared package entries.
- Added Prisma SSOT models and migration `20260513170000_add_topic_selection_evidence_map_strength` for `TopicSelectionEvidenceMap`, `TopicSelectionEvidenceUnit`, thin link/cluster/pattern/conflict records, and `TopicSelectionEvidenceStrengthAssessment`.
- Kept gate-critical fields queryable: title card, evidence map/version, SearchRun/SearchPlan/literature snapshot, literature, coverage row, evidence role, locator ref, abstract-only flag, review/freshness status, target ref, and cache key.
- Added backend repository boundary plus in-memory and Prisma adapters. Shared DTOs remain Prisma-free; Prisma mappings stay inside `PrismaTopicSelectionEvidenceMapRepository`.
- Added `TopicSelectionEvidenceMapService` with HTTP-free methods:
  - `createEvidenceMapFromSearchRun(...)`
  - `getNeedValidationEvidenceBundle(evidence_map_id)`
  - `assessEvidenceStrength(...)`
  - `markEvidenceMapStale(...)`
  - `markEvidenceStrengthAssessmentsStale(...)`
- `createEvidenceMapFromSearchRun(...)` requires a succeeded/partial T-052 `SearchRun`, validates SearchPlan/literature snapshot lineage, rejects missing locators and out-of-run source/content refs, and creates T-048 input snapshot, workflow run, gate, transition, lineage, and trace records before durable evidence output is considered ready.
- Evidence source locators require a concrete `source_ref`; section/paragraph/anchor locator primary refs are also checked against SearchRun-authorized evidence input refs. Persisted `EvidenceUnit.source_refs` are normalized from explicit unit refs plus locator source/content refs so downstream packages do not have to choose between two provenance tracks.
- `EvidenceUnit` stores `source_statement`, `normalized_statement`, and `interpretation_payload` separately. `llm_inference` is rejected as source-claim authority.
- Abstract-only support units are persisted with `abstract_only=true` and `ABSTRACT_ONLY_SUPPORT`; deterministic strength assessment prevents abstract-only support from becoming `strong_support`.
- `EvidenceStrengthAssessment` is demand-driven and cacheable. Cache key includes target ref, purpose, granularity, sorted unit refs, EvidenceMap version, SearchRun/SearchPlan refs, policy version, and assessment workflow version.
- `NeedValidationEvidenceBundle` is a read model regenerated from units/conflict/assessment records. It exposes role-separated structured records and refs, not summary text authority.
