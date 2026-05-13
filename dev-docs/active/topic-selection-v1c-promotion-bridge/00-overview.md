# 00 Overview

## Status
- State: planned
- Next step: Wait for v1b package readiness contract to stabilize, then split v1c into implementation child tasks.

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
- 不在 v1b 完成前细拆实施子包。

## Stage Scope
- `PromotionInputSnapshot`
- `PromotionDecisionSupport`
- `PromotionGateCheck`
- `ArgumentReadinessMiniCheck`
- `HumanPromotionDecision`
- `PromotionDecision`
- `PromotionCommitmentProfile`
- `PaperProjectBridge`
- downstream feedback/recheck contract

## Planned Future Child Tasks
- `topic-selection-v1c-promotion-gate`
- `topic-selection-v1c-promotion-decision-profile`
- `topic-selection-v1c-paper-project-bridge`
- `topic-selection-v1c-downstream-feedback-recheck`

## Acceptance Criteria
- [ ] v1b produces a package with explicit readiness state.
- [ ] promotion cannot bypass human confirmation.
- [ ] non-promote promotion outcomes have typed loopback targets and required actions.
- [ ] `PaperProjectBridge` preserves refs, snapshot hashes, conditions, and editable working-copy text.
- [ ] downstream feedback creates feedback/recheck records instead of mutating upstream authority.
