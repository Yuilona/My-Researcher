# 03 Implementation Notes

## Initial Notes
- Prefer bundle-level assessment for v1a.
- Unit-level drilldown is needed for blockers, human challenge, locator risk, or claim-strength conflicts.
- Assessment cache key must include target type/id/version, purpose, granularity, evidence bundle hash, EvidenceMap version, SearchPlan/SearchRun refs, policy version, and assessment workflow version.

## Open Questions
- Which existing source locator model can provide paragraph/section/table/figure anchors?
- Which extraction artifacts are reliable enough to seed EvidenceUnit records?
- Which conflicts can be detected deterministically before LLM review?
