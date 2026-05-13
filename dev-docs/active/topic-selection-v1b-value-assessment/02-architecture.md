# 02 Architecture

## Input Contract
- `TopicQuestionContract`
- `TopicQuestionAnswerabilityPlan`
- selected `ResearchSlice`
- inherited `ValidatedNeed`, evidence, risk, recheck, and memory refs

## Output Contract
- `TopicValueAssessment`
- `ValueReasoningMemo`
- `ValueDispositionDecision`
- optional `draft_package_handoff` only for `advance_to_package`

## Decision Rules
- `advance_to_package`: package creation may proceed.
- `refine_question`: return to question contract package.
- `refine_slice`: return to ResearchSlice package.
- `recheck_evidence_or_search`: route through T-051/T-052.
- `park` / `drop`: no package output.

## Handoff To TopicPackage
Draft package creation receives the value assessment, reasoning memo, disposition decision, selected question contract, selected slice, and inherited trace/risk refs.

It must not recompute value as an implicit hidden gate.
