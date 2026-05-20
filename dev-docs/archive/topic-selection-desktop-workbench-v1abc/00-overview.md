# 00 Overview

## Status
- State: planned
- Task ID: `T-087`
- Feature / Milestone / Requirement: `F-001` / `M-001` / `R-009`
- Roadmap: `dev-docs/active/topic-selection-desktop-workbench-v1abc/roadmap.md`
- Next step: Phase 0 Discovery — 与用户对齐 Q1–Q9，与 T-078 owner 对齐 Shell 共享改造接口，产出 API ↔ UI 映射表与 Topbar/Sidebar 线框。

## Goal
- 把 `apps/desktop/src/renderer/modules/title-card-management/**` 重写为覆盖 v1a / v1b / v1c 全链路的 reviewer workbench 薄壳，使所有 human-confirmed 决策点和横切（queue / trace / accepted risk / human override）可在桌面端完成。

## Non-goals
- 不重新设计 v1a/v1b/v1c 后端 contract / 数据模型 / 决策链。
- 不实现 paper-project 下游执行、写作 agent、experiment automation 的 UI（归 T-078 与写作中心范围）。
- 不引入新的视觉系统或 design token；沿用 `data-ui` + token/contract 主线，禁止复活 `apps/desktop/src/renderer/styles/**`。
- 不保留旧 7 tab CRUD/JSON 编辑器作为运行时入口（删除）；调试走 OpenAPI/REST 工具。
- 不承诺 SearchPlan / EvidenceMap / ResearchSliceOptionSet / TopicQuestionCandidateSet 等的高保真可视化编辑器（v1 限定只读 + 必要表单 + drilldown）。
- 不做"全链路一张大图"作为日常入口（design-spec §4036 风险边界）。

## Context
- 后端 v1a/v1b/v1c 决策链已通过 T-068 acceptance、T-079 resource sampling、T-082/T-084/T-085 真实数据演练，HTTP/services/Prisma/OpenAPI 全部具备能力底座。
- 现有 `TitleCardManagementModule` 是 T-021 archived 留下的 7 tab CRUD/JSON 壳，对接的是旧 `/title-cards/{id}/{needs|research-questions|value-assessments|packages|promotion-decisions}` 简化路由，不暴露 v1a SearchPlan / EvidenceMap、v1b SliceOptionSet / QuestionCandidateSet / ValueDisposition、v1c PromotionGateCheck / CommitmentProfile / PaperProjectBridge / DownstreamFeedback / Recheck 等 authority/workflow 对象。
- 设计 SSOT 是 `dev-docs/archive/topic-selection-decision-chain-redesign/06-design-spec.md` §3977 起的 reviewer workbench UI 框架（Workspace / Decision Review / Queue / Trace / Settings）。
- 与 T-078 `experiment-foundation-desktop-workbench` 共享 desktop shell，需在 Phase 0 与其 owner 对齐 Sidebar / Topbar 改造接口避免冲突。

## Acceptance criteria (high level)
- [ ] v1a：可在 UI 内 human-confirm `ValidatedNeed`；SearchPlan revision / EvidenceMap recheck / NeedCandidate reject/revise/request-revision 回流可触发。
- [ ] v1b：可在 UI 内 human-confirm `SliceSelectionDecision` / `TopicQuestionSelectionDecision` / `ValueDispositionDecision`；非成功出口（refine_slice / refine_question / recheck / park / drop）按钮接线。
- [ ] v1c：可在 UI 内 human-confirm `HumanPromotionDecision` 并创建 `PaperProjectBridge`；`PromotionCommitmentProfile` 字段强校验；CommitmentProfile 不完整时 promote 必失败。
- [ ] 横切：HumanReviewQueue / RecheckQueue / BlockerQueue / AcceptedRiskExpiryQueue 四类队列可用；TraceDrilldownDrawer 可在任意 stage 内打开；AcceptedRisk / HumanOverride 创建必须 scope+reason+expiry/recheck condition 全填。
- [ ] 旧 7 tab CRUD/JSON 表单已删除；新模块走 feature flag `VITE_TOPIC_WORKBENCH_V1ABC`，Phase 6 收口前可回滚。
- [ ] `pnpm typecheck` / desktop build / 现有 e2e 或冒烟无回归；与 T-078 desktop-workbench 在 Sidebar/Topbar 改造上无 git/语义冲突。
- [ ] design-spec §4039 红线：human-confirmed UI 必须显示确认范围 / 证据 / 反证 / blocker / accepted risk / downstream effect；reviewer card 不得退化为单按钮 confirm。
