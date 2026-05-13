# 03 Implementation Notes

## Initial Notes
- Use existing title-card as the first practical entrypoint.
- Keep LiteratureResourcePoolSnapshot as a topic-selection input boundary; literature module owns source/content details.
- Large snapshot membership should use paged membership, delta manifest, or artifact manifest rather than one large JSON blob.
- SearchPlan revision requests are emitted by downstream packages but accepted/rejected here through controlled plan versioning.

## Open Questions
- Which title-card fields map to TopicSeed intent, constraints, scope, non-goals, and search hints?
- Which literature APIs can provide source health and content locator availability?
- How much of SearchRun execution can reuse existing retrieval/index code?
