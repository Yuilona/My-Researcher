# 00 Overview

## Status
- State: planned
- Next step: Execute `T-065 topic-selection-v1c-downstream-feedback-recheck`.

## Parent Package
- Parent: `dev-docs/active/topic-selection-decision-chain-redesign/`
- Upstream stage: `dev-docs/active/topic-selection-v1b-need-to-draft-topic/`
- Role: v1c 阶段包，保留 draft package 到 paper project bridge 的授权边界。

## Goal
- 将 readiness-satisfied `TopicPackage(draft)` 通过 human-confirmed `PromotionDecision` 交接到 `PaperProjectBridge`。
- 明确 promotion gate、argument mini-check、commitment profile 和 bridge 的职责边界。

## Non-goals
- 不执行 PaperProject 的实验、写作或 research-argument 工作。
- 不用 LLM 自动批准 promotion。
- 不重跑 v1b value assessment，不在 v1c 中改写 `TopicPackage(draft)` authority。

## Stage Scope
- `PromotionInputSnapshot`
- `PromotionDecisionSupport`
- `PromotionDossier` as a reviewer-facing read model built from support inputs
- `PromotionGateCheck`
- `ArgumentReadinessMiniCheck`
- `HumanPromotionDecision`
- `PromotionDecision`
- `PromotionCommitmentProfile`
- `PaperProjectBridge`
- downstream feedback/recheck contract

## Child Tasks
- `T-061 topic-selection-v1c-promotion-input-snapshot` - done
- `T-062 topic-selection-v1c-promotion-gate-support` - done
- `T-063 topic-selection-v1c-human-promotion-decision-profile` - done
- `T-064 topic-selection-v1c-paper-project-bridge` - done
- `T-065 topic-selection-v1c-downstream-feedback-recheck` - planned
- `T-066 topic-selection-v1c-offline-evaluation-replay` - planned
- `T-067 topic-selection-v1c-http-api-closure` - planned

## Acceptance Criteria
- [x] v1b produces a package with explicit readiness state.
- [x] v1c input starts from `TopicSelectionV1bToV1cInputBundle` and does not require v1b to create PaperProject-owned objects.
- [x] v1c does not re-run v1b value assessment as a hidden gate.
- [x] promotion cannot bypass human confirmation.
- [x] non-promote promotion outcomes have typed loopback targets and required actions.
- [x] `PaperProjectBridge` preserves refs, snapshot hashes, conditions, and editable working-copy text.
- [ ] downstream feedback creates feedback/recheck records instead of mutating upstream authority.
- [ ] v1c API can drive `v1c input bundle -> promotion input -> gate support -> human decision -> bridge -> downstream feedback/recheck`.
- [ ] each step has explicit pre-next review inputs, closure status, and stop conditions.
