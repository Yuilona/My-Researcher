# T-055 DB Schema Diff Preview

Date: 2026-05-14

## Scope
- Add `TopicSelectionV1bIntakeSnapshot`.
- Add `TopicSelectionResearchConstraintProfile`.
- Add `TopicSelectionV1bIntakeReadinessAssessment`.

## Intent
- Persist v1b intake snapshots produced from `TopicSelectionV1aToV1bInputBundle`.
- Persist versioned constraint profiles before ResearchSlice planning.
- Persist idempotent readiness assessments for a specific intake snapshot plus constraint profile version.

## Non-Goals
- No `ResearchSlice`, `TopicQuestion`, `TopicValueAssessment`, `TopicPackage`, `PromotionDecision`, or `PaperProjectBridge` tables.
- No production database apply was run in this implementation pass.

## Compatibility Notes
- The new tables are additive.
- No existing T-048/T-051/T-052/T-053 tables are changed.
- Control-plane linkage is stored as refs and ids so T-055 interprets gates and transitions without redefining their semantics.
