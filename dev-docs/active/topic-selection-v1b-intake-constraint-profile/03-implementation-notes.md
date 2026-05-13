# 03 Implementation Notes

## 2026-05-14 - Split Creation
- Created as the v1b entry package because `ResearchConstraintProfile` and upstream readiness are separate responsibilities from ResearchSlice generation.
- This package prevents downstream packages from each inventing their own v1a bundle parsing and stale/recheck policy.

## 2026-05-14 - Landing
- Added shared v1b intake contracts for `TopicSelectionV1bIntakeSnapshotRecord`, `TopicSelectionResearchConstraintProfileRecord`, `TopicSelectionV1bIntakeReadinessAssessmentRecord`, and `TopicSelectionV1bResearchSlicePlanningInput`.
- Added additive repo-prisma models and migration for v1b intake snapshot, versioned research constraint profile, and readiness assessment persistence.
- Added repository interfaces plus in-memory and Prisma implementations for the T-055 authority objects.
- Added `TopicSelectionV1bIntakeService` with methods to create intake snapshots, create versioned constraint profiles, assess readiness idempotently, and publish the T-057 planning input DTO.
- Readiness blocks stale/mismatched upstream refs before recheck/constraint checks, including support packet and adjudication ref mismatches; it interprets open T-051 rechecks through T-052 accepted risks and does not create ResearchSlice, TopicQuestion, ValueAssessment, TopicPackage, promotion, or API routes.

## 2026-05-14 - Review Fixes
- Adjusted the shared `ResearchConstraintProfile` record schema so draft profiles may persist empty `target_community` / `claim_ceiling`; readiness, not the record schema, decides whether the profile is sufficient for slice planning.
- Hardened intake trace validation to require the source `NeedCandidate`, persisted human-confirmed decision, and inherited `TraceSnapshot` records.
- Reused the T-051 accepted-risk usability semantics for v1b recheck coverage: risk refs must be active, unexpired, scoped, title/workspace-compatible, and targeted to the protected validated need.
- Implemented the `park` readiness outcome through explicit `constraint_payload.v1b_intake_disposition = "park"` on a profile version, keeping repeated readiness assessment deterministic for the same snapshot/profile version.
- Cleaned the T-055 boundary review: no HTTP/API routes, package/promotion objects, duplicate handoff contracts, or throwaway T-055 test artifacts were introduced.
