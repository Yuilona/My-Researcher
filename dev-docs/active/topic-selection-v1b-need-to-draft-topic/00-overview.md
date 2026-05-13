# 00 Overview

## Status
- State: planned
- Next step: Wait for v1a input contracts to stabilize, then split v1b into implementation child tasks.

## Parent Package
- Parent: `dev-docs/active/topic-selection-decision-chain-redesign/`
- Upstream stage: `dev-docs/active/topic-selection-v1a-evidence-to-need/`
- Role: v1b 阶段包，保留 need-to-draft-topic 的边界合同。

## Goal
- 将 human-confirmed `ValidatedNeed` 收束为 `TopicPackage(draft)`。
- 明确 `ResearchSlice`、`TopicQuestionContract`、`TopicValueAssessment`、`ValueDispositionDecision` 和 `TopicPackage(draft)` 的阶段边界。
- 继承 v1a trace、risk、memory、recheck 和 evidence-strength 合同，而不重新证明 need 是否成立。

## Non-goals
- 不重新证明 unmet need 是否成立。
- 不创建 `PromotionDecision` 或 `PaperProjectBridge`。
- 不在 v1a 完成前细拆实施子包。

## Stage Scope
- `ResearchConstraintProfile`
- `PlanResearchSliceRun`
- `ResearchSliceOptionSet`
- `SliceSelectionDecision`
- `ResearchSlice`
- `FormTopicQuestionRun`
- `TopicQuestionCandidateSet`
- `TopicQuestionSelectionDecision`
- `TopicQuestion`
- `TopicQuestionContract`
- `TopicQuestionAnswerabilityPlan`
- `TopicValueAssessment`
- `ValueReasoningMemo`
- `ValueDispositionDecision`
- `TopicPackage(draft)`

## Planned Future Child Tasks
- `topic-selection-v1b-research-slice`
- `topic-selection-v1b-topic-question-contract`
- `topic-selection-v1b-value-assessment`
- `topic-selection-v1b-topic-package-draft`

## Acceptance Criteria
- [ ] v1a output contract for `ValidatedNeed` is stable enough for v1b detailed split.
- [ ] v1b child tasks are created only after v1a closure.
- [ ] v1b stage can produce a trace-ready `TopicPackage(draft)`.
- [ ] v1c input bundle is explicit: package readiness, trace/boundary checks, value decision, accepted risks, blockers, and recheck state.
