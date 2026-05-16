# 01 Plan

## Phase 1 - Existing Evidence Survey
- Inspect evidence basket and extraction models.
- Map reusable fields to EvidenceMap/EvidenceUnit.

Acceptance:
- [x] Reusable evidence structures are identified.
- [x] Missing locator/source provenance fields are listed.

## Phase 2 - EvidenceMap And EvidenceUnit
- Implement claim-level EvidenceUnit model and EvidenceMap membership/state.
- Add TypedLink/Cluster/Pattern/ConflictSet thin records only where useful for v1a gates.

Acceptance:
- [x] EvidenceUnits separate source claims from LLM inference.
- [x] Abstract-only support can be detected.

## Phase 3 - EvidenceStrengthAssessment
- Implement target-specific bundle assessment contracts.
- Add trigger/cache/stale logic.

Acceptance:
- [x] NeedCandidate readiness can request support/challenge/baseline/context bundle assessments.
- [x] Stale assessment state follows upstream evidence/search/source-health changes.

## Phase 4 - Handoff To Need Validation
- Publish EvidenceMap input bundle for NeedCandidate generation and readiness.

Acceptance:
- [x] Need-validation package can consume selected evidence bundles without raw transcripts.
