# 03 Implementation Notes

## 2026-05-18 Intake
- Created T-086 as the scoped implementation task requested by T-023's current continuation rule.
- Scope is backend-first bridge acceptance, not UI or planner/critic expansion.

## 2026-05-18 Implementation
- Added `ResearchArgumentPaperProjectGateway` to keep PaperProject creation behind a service boundary.
- Added service behavior for title-card seeding, readiness verification, and ready-branch promotion.
- Promotion now creates sidecar report projections for `writing_entry` and `submission_risk`, records one `advance` decision, marks the workspace `promoted`, and attaches `paper_id`.
- Duplicate promotion is idempotent: it reuses the attached `paper_id` and rewrites deterministic sidecar refs without creating another PaperProject or decision.
- The implementation remains backend service-level. HTTP route wiring, desktop review surfaces, planner/critic generation, and async orchestration remain outside this task.
