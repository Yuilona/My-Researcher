# 03 Implementation Notes

## Initial Notes
- Start with 3-5 curated cases per case type when feasible.
- Store long run outputs and replay diffs as artifacts.
- Keep metrics explicit and simple before adding dashboards.

## Implementation Decisions
- First dataset is a deterministic synthetic fixture baseline with one case for each required v1a case type.
- First replay mode is frozen snapshot evaluation; it does not execute live workflow, LLM, or search.
- Frozen snapshots are stored as offline evaluation case payloads and refs, with large future artifacts left to `ArtifactRef`/file-backed payloads.

## Follow-up
- Seed the next dataset from real v1a vertical-slice title-card outputs once enough reviewed cases exist.
- Add dashboard/UI only after downstream consumers agree on the offline read model.
