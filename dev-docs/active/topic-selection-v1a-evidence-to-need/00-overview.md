# 00 Overview

## Status
- State: planned
- Next step: Review the first implementation package, `topic-selection-v1a-foundation-control-plane`, before product code changes.

## Parent Package
- Parent: `dev-docs/active/topic-selection-decision-chain-redesign/`
- Role: v1a 阶段包，承接母包中的 evidence-to-need 设计并组织后续实施子包。

## Goal
- 建立 `TopicSeed -> LiteratureResourcePoolSnapshot -> SearchPlan -> SearchRun -> EvidenceMap/EvidenceUnit -> NeedCandidate -> ValidateNeedAdjudicationResult -> ValidatedNeed` 的最小可验收闭环。
- v1a 的成功出口是 human-confirmed `ValidatedNeed`，并具备 trace、gate、recheck、risk、memory 和 offline evaluation baseline。

## Non-goals
- 不实现 `ResearchSlice`、`TopicQuestion`、`TopicValueAssessment`、`TopicPackage(draft)` 或 `PromotionDecision`。
- 不创建 PaperProject bridge。
- 不做完整 UI anti-rubber-stamp 设计；UI 后续单独讨论。
- 不实现全链自动调度、全 workspace recheck storm propagation 或全量 EvidenceStrengthAssessment 预计算。

## Stage Scope
- Entry adapters: title-card/topic seed adapter, plus Literature -> TopicSelection snapshot/content/source-health contracts.
- Foundation/control plane: context policy、input snapshot、artifact、workflow run、readiness gate、transition attempt。
- Search/evidence inputs: literature snapshot、SearchPlan、SearchRun、coverage child records。
- Evidence layer: EvidenceMap、EvidenceUnit、evidence strength assessment trigger/cache/stale rules。
- Need validation: NeedCandidate、readiness、decision support packet、adjudication result、ValidatedNeed。
- Cross-cutting quality: recheck/risk/memory、offline evaluation/replay baseline。

## Planned Child Tasks
- `T-048 topic-selection-v1a-foundation-control-plane`
- `T-052 topic-selection-v1a-search-resource-evidence-inputs`
- `T-047 topic-selection-v1a-evidence-map-strength`
- `T-049 topic-selection-v1a-need-validation`
- `T-051 topic-selection-v1a-recheck-risk-memory`
- `T-050 topic-selection-v1a-offline-evaluation-replay`

## Acceptance Criteria
- [x] v1a implementation child tasks are created with non-overlapping ownership.
- [x] Each child task has clear inputs, outputs, authority objects, and verification.
- [ ] v1a can be verified end-to-end with at least one human-confirmed `ValidatedNeed`.
- [ ] v1b input bundle is explicit: `ValidatedNeed`, adjudication result, support packet, evidence/search snapshots, trace, risks, gaps, memory, and recheck status.
- [ ] v1a offline evaluation/replay produces a first baseline for the agreed minimum metrics.
