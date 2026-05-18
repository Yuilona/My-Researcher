# 01 Plan

> 完整 roadmap 见 `roadmap.md`；本文件是落地执行视图，按 phase 列里程碑、产物与 DoD。

## Phases

1. **Phase 0 — Discovery & 信息架构对齐**
2. **Phase 1 — Shell 改造 + active title-card 上下文**
3. **Phase 2 — v1a Evidence-to-Need Surfaces**
4. **Phase 3 — v1b Need-to-Draft-Topic Surfaces**
5. **Phase 4 — v1c Promotion Bridge Surfaces**
6. **Phase 5 — 横切 panel / drawer 集中**
7. **Phase 6 — Verification、回归、flag 收口**

## Detailed steps

### Phase 0 — Discovery & 信息架构对齐
- [ ] 与用户确认 roadmap Q1–Q9 决议，沉淀到 `02-architecture.md`
- [ ] 与 T-078 `experiment-foundation-desktop-workbench` owner 对齐 Sidebar/Topbar 共享改造接口
- [ ] 产出 API ↔ UI surface 映射表（stage × surface × 路由 × 字段），缺口转后端任务
- [ ] 产出 Sidebar `当前题目卡` 选择器、Topbar stage tab、reviewer card 与横切 panel 的线框（low-fi 即可）
- [ ] 确认 feature flag 命名（roadmap 暂用 `VITE_TOPIC_WORKBENCH_V1ABC`）与默认值（推荐 dev/prod 都默认开，旧 module 走 flag off 兜底）

### Phase 1 — Shell 改造 + active title-card 上下文
- [ ] `Sidebar` 新增"当前题目卡"选择器（加载 + 切换 + 空态）
- [ ] `App.tsx` / `ActiveTitleCardContext` 提供全局 active title-card；与 paper_id 语义边界写入 02-architecture
- [ ] `literature/shared/constants.ts` / `types.ts` 中 `titleCardTabs` / `TitleCardPrimaryTabKey` 重定义为 `总揽 / v1a 证据-需求 / v1b 切片-题目-价值-方案 / v1c 晋升` + sub-tab
- [ ] `Topbar` 接线新 stage tab；保证旧模块在 flag off 时仍可访问
- [ ] feature flag 接入 `App.tsx` 顶层路由
- [ ] DoD：`pnpm desktop:dev` 启动后两个模块互不影响；选择 active title-card 后所有 stage tab 拿到正确 id

### Phase 2 — v1a Evidence-to-Need Surfaces
- [ ] `cards/SeedOverviewCard.tsx`（intent / scope / stage / blockers / recheck）
- [ ] `cards/SearchPlanCard.tsx`（coverage intent / must-check / exclusion / source pool；只读 + 触发 run + revision 入口）
- [ ] `panels/EvidenceMapPanel.tsx` + `drawer/EvidenceUnitDrilldown.tsx`（支持 / 反证 / baseline / resource）
- [ ] `cards/NeedCandidateReviewCard.tsx`（statement / unmet mechanism / support / challenge / already-solved risk / coverage gaps）
- [ ] `cards/ValidatedNeedDecisionCard.tsx`（human confirm / accept risk / block / loopback / park / drop，5 段必显示：结论 / 证据 / 反证 / blocker+risk / next actions）
- [ ] `api/v1a.ts` client helpers（SearchPlan / SearchRun / EvidenceMap / EvidenceUnit / NeedCandidate / ValidationDecisionSupportPacket / ValidatedNeed / CandidateDecisionMemory）
- [ ] DoD：可从空 title-card 走到 human-confirmed `ValidatedNeed`；至少一组 negative case（already_solved → reject + memory）UI 可触发

### Phase 3 — v1b Need-to-Draft-Topic Surfaces
- [ ] `cards/ResearchSliceOptionSetCard.tsx`（option 比较表 + 推荐 + 选择 confirm；非成功出口按钮）
- [ ] `cards/TopicQuestionCandidateSetCard.tsx`（candidate diff + answerability hint + selection confirm）
- [ ] `cards/TopicQuestionContractCard.tsx`（contract 摘要 + answerability plan refs，只读）
- [ ] `cards/ValueAssessmentCard.tsx`（结构化 hard_gates / scored_dimensions / risk_penalty 表单，禁止 raw JSON 编辑）
- [ ] `cards/ValueDispositionDecisionCard.tsx`（advance_to_package / refine / park / drop）
- [ ] `cards/TopicPackageDraftCard.tsx`（trace boundary check + narrative 一致性提示）
- [ ] `api/v1b.ts` client helpers
- [ ] DoD：从 ValidatedNeed → TopicPackage(draft) 全程可在 UI 完成必需 human confirms；非成功出口接线

### Phase 4 — v1c Promotion Bridge Surfaces
- [ ] `cards/PromotionDecisionSupportCard.tsx`（dossier 摘要 + 上游 refs）
- [ ] `cards/PromotionGateCheckCard.tsx`（trace completeness / boundary consistency / open blocker / accepted risk / recheck impact / narrative consistency，逐项 pass/fail + reason）
- [ ] `cards/HumanPromotionDecisionCard.tsx`（promote / promote_with_conditions / merge_packages / refine_package / reassess_value / revise_question / revise_slice / recheck / park / drop）
- [ ] `cards/PromotionCommitmentProfileCard.tsx`（scope / claim ceiling / non-negotiable boundaries / accepted risks / required early checks / allowed refinements / stop-reopen conditions 全部强校验）
- [ ] `cards/PaperProjectBridgeCard.tsx`（创建 + bridge 元数据 + 上游 refs / snapshot hash 显示）
- [ ] `panels/DownstreamFeedbackPanel.tsx` + `panels/RecheckImpactPanel.tsx`
- [ ] `api/v1c.ts` client helpers
- [ ] DoD：human-confirmed `promote | promote_with_conditions` + 完整 CommitmentProfile 才能创建 `PaperProjectBridge`；论文管理模块能看到生成的 paper_id

### Phase 5 — 横切 panel / drawer 集中
- [ ] `panels/HumanReviewQueuePanel.tsx`（按 stage 聚合 + 风险/阻断排序）
- [ ] `panels/RecheckQueuePanel.tsx`
- [ ] `panels/BlockerQueuePanel.tsx`
- [ ] `panels/AcceptedRiskExpiryQueuePanel.tsx`
- [ ] `drawer/TraceDrilldownDrawer.tsx`（EvidenceUnit → ContentRef → source locator / FunctionalLineageLink / SearchRun provenance / LLMWorkflowRun / AgentReviewSession / RecheckEvent）
- [ ] `cards/AcceptedRiskFormCard.tsx`（scope / reason / expiry / recheck condition 全必填）
- [ ] `cards/HumanOverrideFormCard.tsx`（scope / reason / expiry / accepted risk 全必填）
- [ ] reviewer cards 接入 inline blocker / accepted-risk / recheck badge
- [ ] DoD：每个队列项可跳转到对应 stage review surface；trace drawer 可在所有 stage 内打开；AcceptedRisk / HumanOverride 缺字段不可提交

### Phase 6 — Verification、回归、flag 收口
- [ ] `04-verification.md`：自动化（typecheck / unit / integration / contract drift）+ 手测脚本
- [ ] `05-pitfalls.md`：执行中累计的陷阱
- [ ] feature flag 默认开 + 旧 module 删除 PR（独立小 PR）
- [ ] 更新 `.ai/project/main/feature-map.md` / `task-index.md` / `dashboard.md`
- [ ] 与 T-078 联调点击回归
- [ ] DoD：自动化测试全绿；用户接受验收；旧 module 已移除或在 flag-off 分支冷备

## Risks & mitigations

- **Risk: 后端能力存在隐藏缺口**（如 negative memory / 某 recheck 接口未暴露）
  - Mitigation: Phase 0 强制做 API ↔ UI 映射表；缺口转单独后端任务并在 03-implementation-notes 引用其 ID。
- **Risk: 全量薄壳粒度失控**（每对象 5 个字段编辑器）
  - Mitigation: 每 stage 严格按"读 + 必要 confirm + 回流按钮"收口；深度编辑器明确留 v2。
- **Risk: `data-ui` 缺少 reviewer card / drawer / queue 等原语**
  - Mitigation: 02-architecture 做 token 增补清单，复用现有；不引入新视觉系统。
- **Risk: active title-card 与 paper_id 上下文语义冲突**
  - Mitigation: 02-architecture 明确二者边界；governance panel 跟随策略写清楚。
- **Risk: 与 T-078 desktop-workbench 同时改 Sidebar/Topbar**
  - Mitigation: Phase 0 与 owner 对齐接口；约定先合 T-078 再 rebase。
- **Risk: human-confirm UI 退化为单按钮 confirm（design-spec §4039 红线）**
  - Mitigation: reviewer card 模板强制 5 段；code review checklist；不通过不合并。
