# 00 Overview

## Status
- State: done
- Next step: Hand off the stable intake/profile/readiness DTO to `T-057 topic-selection-v1b-research-slice`.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1b-need-to-draft-topic/`
- Architecture parent: `dev-docs/active/topic-selection-decision-chain-redesign/`
- Upstream dependency: `dev-docs/active/topic-selection-v1a-evidence-to-need/`

## Goal
- Convert a stable `TopicSelectionV1aToV1bInputBundle` into a v1b-ready intake snapshot.
- Establish `ResearchConstraintProfile` and v1b intake readiness before any ResearchSlice planning.
- Block v1b progression when upstream evidence, risk, recheck, or trace inputs are stale or unresolved.

## Non-goals
- Do not create `ResearchSlice`, `TopicQuestion`, `TopicValueAssessment`, or `TopicPackage(draft)`.
- Do not revalidate whether the unmet need exists.
- Do not resolve search/evidence rechecks directly; route them through existing T-051/T-052 contracts.

## Owned Scope
- `V1bIntakeSnapshot`
- `ResearchConstraintProfile`
- `V1bIntakeReadinessAssessment`
- v1a bundle freshness and trace intake checks
- accepted-risk/recheck intake policy
- local user constraints for resource, venue, community, method, and non-goals

## Acceptance Criteria
- [x] Intake consumes `TopicSelectionV1aToV1bInputBundle`, not a bare `ValidatedNeed`.
- [x] `ResearchConstraintProfile` is versioned and linked to the validated need, evidence/search refs, risk refs, and user constraints.
- [x] Open high-priority recheck blocks v1b unless explicitly covered by accepted risk.
- [x] Downstream ResearchSlice planning can consume a single intake snapshot and constraint profile without rereading v1a internals.
