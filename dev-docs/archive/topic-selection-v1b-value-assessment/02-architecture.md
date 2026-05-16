# 02 Architecture

## Input Contract
- active/current `TopicSelectionV1bValueAssessmentInput` from T-059
- active `TopicQuestionContract`
- `TopicQuestionAnswerabilityPlan`
- selected `ResearchSlice` snapshot from T-057
- inherited `ValidatedNeed`, evidence, risk, recheck, and memory refs

## Output Contract
- `TopicValueAssessment` through legacy `TopicValueAssessment` / Prisma `TitleCardValueAssessment` with nullable v1b metadata
- `ValueReasoningMemo`
- `ValueDispositionDecision`
- optional `TopicSelectionV1bPackageDraftInput` persisted only on active/current `advance_to_package`

## Persistence
- Assessment materialization writes the legacy value assessment, `AssessTopicValueRun`, value input snapshot, reasoning memo, evidence refs, and trace metadata transactionally.
- Disposition materialization writes `ValueDispositionDecision` separately and patches the active disposition metadata on the legacy value assessment.
- `advance_to_package` does not create `TopicPackage`, reserve a package id, create promotion state, or imply promotion readiness.

## Decision Rules
- `advance_to_package`: package creation may proceed.
- `refine_question`: return to question contract package.
- `refine_slice`: return to ResearchSlice package.
- `recheck_evidence_or_search`: route through T-051/T-052.
- `park` / `drop`: no package output.

## Handoff To TopicPackage Draft
Draft package creation receives the value assessment, reasoning memo, disposition decision, selected question contract, selected slice, and inherited trace/risk refs.

It must not recompute value as an implicit hidden gate.
