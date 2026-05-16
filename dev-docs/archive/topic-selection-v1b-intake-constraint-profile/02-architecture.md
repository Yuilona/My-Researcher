# 02 Architecture

## Input Contract
- `TopicSelectionV1aToV1bInputBundle`
- `ValidatedNeed`
- `ValidationDecisionSupportPacket`
- `ValidateNeedAdjudicationResult`
- inherited evidence/search refs, trace refs, risk refs, gap codes, recheck refs, and memory refs

## Local Contract
`ResearchConstraintProfile` captures constraints that shape topic formation:
- target community / venue class
- method and resource constraints
- intended contribution style
- non-goals and claim ceilings
- feasibility budget and available assets
- human-authored constraint notes

## Output Contract
- `V1bIntakeSnapshot`
- `ResearchConstraintProfile(versioned)`
- `V1bIntakeReadinessAssessment`
- `ReadinessGateResult` and `ChainTransitionAttempt` refs from T-048

## Handoff To ResearchSlice
ResearchSlice planning receives:
- source `v1b_input_bundle_ref`
- intake snapshot ref
- constraint profile ref/version
- blocking status, accepted-risk refs, and required actions

It must not directly reinterpret raw v1a evidence or silently ignore unresolved recheck refs.

## Review Checklist
- Upstream `ValidatedNeed` is human-confirmed.
- Evidence/search refs in bundle are traceable.
- No open high-priority recheck is unhandled.
- Accepted risks are scoped and active.
- Constraint profile is sufficient to bound slice generation.
