# 00 Overview

## Status
- State: in-progress
- Next step: 作为母包维护总体架构和跨阶段不变量；v1a 和 v1b backend/service/API 已闭环，v1c 现在应从稳定的 `TopicSelectionV1bToV1cInputBundle` 拆实施子包。

## Goal
- 创建并维护一个面向“完善选题链路”的母包。
- 基于原始 `automated_topic_notes.md`，重构为更鲁棒的 LLM-led / human-in-the-loop 选题决策设计。
- 保留原设计中 Evidence-first、Falsification、Value gate、TopicPackage、Promotion gate 等核心原则。
- 弱化“自动选题”表述，强调“结构化研究决策质量”。
- 作为 v1a/v1b/v1c 阶段子包的设计 SSOT，承载术语、不变量、跨阶段接口和路线。

## Non-goals
- 不在本任务包阶段直接实现代码。
- 不追求全自动选题或一键立项。
- 不用新设计否定已落地的 `title-card` 主链；本任务先做设计层升级与 gap map。
- 不把人的判断降级为形式化确认按钮。

## Context
- `automated_topic_notes.md` 已形成旧版语义主线；本任务将其升级为 `TopicSeed -> SearchPlan -> SearchRun -> EvidenceMap -> NeedCandidate -> ValidateNeedAdjudicationResult -> ValidatedNeed -> ResearchSlice -> TopicQuestion -> TopicValueAssessment -> TopicPackage -> PromotionDecision`。
- 当前实现已落地 `title-card`、evidence basket、NeedReview、ResearchQuestion、ValueAssessment、Package、PromotionDecision 等主链能力。
- 现有风险主要不在“缺少标题生成”，而在检索偏差、伪 gap、EvidenceMap 污染、反证不足、value gate 校准不足、promotion 前 readiness 不足。
- 本轮用户明确：系统不需要完成全自动选题；关键节点可以由人在回路中参与。

## Child Stage Packages
- `dev-docs/active/topic-selection-v1a-evidence-to-need/`：从 seed/search/evidence 到 human-confirmed `ValidatedNeed`。
- `dev-docs/active/topic-selection-v1b-need-to-draft-topic/`：从 `ValidatedNeed` 到 `TopicPackage(draft)`。
- `dev-docs/active/topic-selection-v1c-promotion-bridge/`：从 readiness-satisfied draft package 到 `PaperProjectBridge`。

## Design Direction
- 将主语从“自动化选题模块”调整为“选题决策链路”。
- LLM 主要负责高吞吐认知劳动：检索扩展、抽取、归纳、聚类、反证、比较、改写、风险枚举。
- 人主要负责责任性判断：研究兴趣、资源边界、真实需求是否成立、研究切口是否合理、价值是否值得投入、是否晋升。
- 每个关键判断必须可追溯到证据、反证、LLM 推断与人工确认记录。

## Acceptance Criteria
- [x] 任务包创建在 `dev-docs/active/topic-selection-decision-chain-redesign/`。
- [x] 任务包包含标准 `roadmap.md`、`00~05` 文件。
- [x] 任务包包含独立设计说明 `06-design-spec.md`。
- [x] 母包已拆出 v1a/v1b/v1c 阶段子包。
- [x] `roadmap.md` 记录讨论中的 open questions、milestones 与决策。
- [x] `06-design-spec.md` 明确新版链路、对象模型、gate、回流路径与人机分工。
- [ ] 后续完成 current implementation gap map。
- [x] 后续完成 v1a 内部实施子包拆分。
- [x] v1b implementation child packages are split with an implementation contract review.
- [x] v1b closed the need-to-draft-topic path through HTTP/API, replay baseline, Prisma smoke, and v1c input bundle handoff.
