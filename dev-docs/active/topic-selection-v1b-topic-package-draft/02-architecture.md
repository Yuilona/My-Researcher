# 02 Architecture

## Input Contract
- `ValueDispositionDecision(decision=advance_to_package)`
- `TopicValueAssessment`
- `ValueReasoningMemo`
- `TopicQuestionContract`
- `ResearchSlice`
- `ResearchConstraintProfile`
- source v1a bundle and inherited trace/risk/recheck refs

## Output Contract
`TopicPackage(draft)` must include:
- identity and version
- package narrative fields
- selected title candidates
- research background and contribution summary
- candidate methods and evaluation plan
- key risks and non-goals
- authority refs to v1a/v1b objects
- package readiness status
- trace/boundary check refs

`TopicSelectionV1bToV1cInputBundle` must include:
- package ref/version/readiness
- value decision and reasoning refs
- question contract and slice refs
- inherited validated need and evidence/search refs
- accepted risks, blockers, recheck impacts, and readiness check refs

## Handoff To V1C
v1c consumes the bundle for promotion review. It must not re-run value assessment as a hidden promotion gate.
