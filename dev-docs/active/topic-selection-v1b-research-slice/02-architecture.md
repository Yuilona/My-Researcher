# 02 Architecture

## Input Contract
- `V1bIntakeSnapshot`
- `ResearchConstraintProfile`
- `V1bIntakeReadinessAssessment(recommendation=ready_for_slice)`
- inherited `ValidatedNeed`, evidence role bundle, accepted risks, recheck status, and memory context

## Output Contract
`ResearchSlice` must include:
- source `validated_need_ref`
- source `v1b_intake_snapshot_ref`
- `constraint_profile_ref`
- slice boundary and excluded adjacent scopes
- method/resource assumptions
- target community or use context
- claim ceiling and non-goals
- selected evidence and risk refs
- slice selection decision ref

## Handoff To TopicQuestion
Question formation receives a selected slice plus its boundary contract. It may ask for slice refinement, but it may not silently expand scope.

## Failure/Loopback
- `refine_slice`
- `needs_constraint_clarification`
- `recheck_evidence_or_search`
- `park`
- `drop`

Loopbacks are represented through T-051 queue/recheck policy, not ad hoc status strings.
