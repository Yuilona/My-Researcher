# T-055 Migration Plan

Date: 2026-05-14

## Migration
- File: `prisma/migrations/20260514110000_add_topic_selection_v1b_intake/migration.sql`

## Tables
- `TopicSelectionV1bIntakeSnapshot`
- `TopicSelectionResearchConstraintProfile`
- `TopicSelectionV1bIntakeReadinessAssessment`

## Indexing And Uniqueness
- Intake snapshots are unique by `v1bInputBundleId + snapshotVersion`.
- Constraint profiles are unique by `v1bInputBundleId + profileVersion`.
- Readiness assessments are unique by `v1bIntakeSnapshotId + researchConstraintProfileId + profileVersion`.
- Lookup indexes cover title card, validated need, bundle, recommendation/status, and control-plane refs.

## Apply Policy
- Repo DB SSOT mode is `repo-prisma`.
- This pass creates the repo migration and validates Prisma schema only.
- Applying the migration to a target database remains a separate explicit operation.
