# 05 Pitfalls

## Do Not Repeat
- Do not treat SearchPlanCoverageMatrix as authority.
- Do not let NeedCandidate mutate SearchPlan directly.
- Do not use live literature pool state without a snapshot ref.
- Do not hide source health or missing fulltext states in narrative only.
- Do not hide gate-critical lineage/source-health/result-accounting fields only in JSON payloads; keep stable query columns beside typed refs.
- Do not accept SearchRun coverage records whose `coverage_row_intent_id` is not owned by the target SearchPlan.
- Do not let SearchRun summaries become evidence claims.
- Do not use raw search logs or artifact refs as EvidenceMap authority refs; SearchRun must publish stable source/content refs.
