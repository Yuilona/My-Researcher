# 00 Overview

## Status
- State: done
- Next step: Start v1c planning from `TopicSelectionV1bToV1cInputBundle`.

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
- 不把 `TopicPackage(draft)` 当作 promotion-ready。
- 不在 v1b 内实现完整 PaperProject planning、writing agent、实验执行或 v1c bridge。

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

## Child Tasks
- `T-055 topic-selection-v1b-intake-constraint-profile` - done
- `T-057 topic-selection-v1b-research-slice` - done
- `T-059 topic-selection-v1b-topic-question-contract` - done
- `T-060 topic-selection-v1b-value-assessment` - done
- `T-058 topic-selection-v1b-topic-package-draft` - done
- `T-056 topic-selection-v1b-offline-evaluation-replay` - done
- `T-054 topic-selection-v1b-http-api-closure` - done

## Acceptance Criteria
- [x] v1a output contract for `ValidatedNeed` and `TopicSelectionV1aToV1bInputBundle` is stable enough for v1b detailed split.
- [x] v1b child tasks are created only after v1a backend/service/API closure.
- [x] v1b stage can produce a trace-ready `TopicPackage(draft)`.
- [x] v1c input bundle is explicit: package readiness, trace/boundary checks, value decision, accepted risks, blockers, and recheck state.
