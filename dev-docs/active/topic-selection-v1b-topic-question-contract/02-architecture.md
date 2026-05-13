# 02 Architecture

## Input Contract
- selected `ResearchSlice`
- `SliceSelectionDecision`
- source `ValidatedNeed`
- constraint profile
- selected evidence/risk/recheck/memory refs

## Output Contract
`TopicQuestionContract` must include:
- selected `topic_question_ref`
- source `research_slice_ref`
- normalized question statement
- answerability plan ref
- claim ceiling and prohibited claims
- required evidence categories
- unresolved risks and accepted-risk refs
- allowed refinements and stop/reopen conditions

## Handoff To ValueAssessment
ValueAssessment consumes the contract, answerability plan, and slice refs. It can reject or request refinement, but it cannot rewrite the selected question as a side effect.

## Review Checklist
- Question is inside slice boundary.
- Question is answerable with available or explicitly planned evidence.
- Claim ceiling is no broader than the slice and validated need.
- Required evidence and known gaps are visible to value assessment.
