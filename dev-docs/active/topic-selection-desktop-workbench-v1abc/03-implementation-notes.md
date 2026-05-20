# 03 Implementation Notes

## Status
- Current status: `planned`
- Last updated: 2026-05-19

## What changed
- 2026-05-19：创建 dev-docs 包；roadmap / 00–05 文档骨架就位；T-087 在 registry 中已存在但 feature/milestone 错挂 F-000/M-000，通过 `ctl-project-governance.mjs map` 重定位到 F-001/M-001/R-009 并 sync 重生成派生视图。
- 2026-05-19：Phase 0 Discovery 启动；后端路由清点 + `data-ui` 原语清点完成；与用户对齐 4 项关键决议（D1–D4）。
- 2026-05-19：Phase 0 收口；新增决议 D5–D8 + 修订 D2'（不扩 contract，用现有 role 组合）。
- 2026-05-19：Phase 1 Step 1 落地（feature-flag-gated 新 module 骨架 + Sidebar 题目卡选择器）：
  - `literature/shared/types.ts`：`TitleCardPrimaryTabKey` 扩为 `Legacy | Workbench` 并集；`TitleCardSubTabState` 加 v1a/v1b/v1c sub-tab；新增 `TitleCardV1aSubTabKey` / `TitleCardV1bSubTabKey` / `TitleCardV1cSubTabKey`
  - `literature/shared/constants.ts`：拆出 `titleCardLegacyTabs` + `titleCardWorkbenchTabs` 与对应 sub-tab maps；保留旧导出名 `titleCardTabs` / `titleCardSubTabsByTab` 指向 legacy 以维持向后兼容
  - `apps/desktop/src/renderer/modules/topic-workbench/`：新 module 目录结构（types / hooks / views / panels / api / context）
  - 新增 `useTitleCardList` hook（带 `enabled` 控制，避免 Sidebar 在非选题模块下空跑请求）
  - 新增 `OverviewView`（4 KPI 卡 + 题目卡列表 + 当前选中详情 + 3 段 stepper-style stage 入口）
  - 新增 `StagePlaceholderView`（v1a/v1b/v1c 各 surface 占位 + 计划承载内容 bullets，作为 IA 文档化的占位卡）
  - 新增 `QueueDrawer`（右侧常驻 / 折叠两态，4 类队列 tabs 切换；数据 Phase 5 接）
  - 新增 `TopicWorkbenchModule.tsx` 入口（按 `activePrimaryTab` 渲染 overview / stage placeholder + 右侧 QueueDrawer）
  - `shell/components/SidebarTitleCardSelector.tsx`：Sidebar 中渲染当前题目卡 dropdown，使用 `useTitleCardList(enabled=true)` 仅在 `activeModule === '选题管理'` AND flag-on 时挂载
  - `shell/components/Sidebar.tsx`：插入 selector 子组件，扩展 SidebarProps
  - `shell/types.ts`：`SidebarProps` 加 `topicWorkbenchEnabled / titleCardId / onTitleCardIdChange / titleCardListRefreshToken`
  - `App.tsx`：
    - 新增 `isTopicWorkbenchEnabled` helper（default-on，仅 `0`/`false` 关闭）
    - 新增 `titleCardId` 全局 state（D5 与 paper_id 对称）
    - `initialTitleCardSubTabs` 补 v1a/v1b/v1c 三个 stage 的初始 sub-tab
    - 按 flag 选择 `titleCardTabs` / `titleCardSubTabsByTab` 引用，Topbar 不动
    - `handleSelectTitleCardSubTab` 增加 v1a/v1b/v1c case
    - 选题管理模块 routing 块改为 `topicWorkbenchEnabled ? TopicWorkbenchModule : TitleCardManagementModule`
    - 透传 `titleCardId` / `onTitleCardIdChange` 等新 props 给 Sidebar
  - `pnpm -w typecheck` 通过（shared / backend / desktop 三档）

> Phase 1 Step 1 含义：用户在桌面端切到"选题管理"模块时，看到的是新 workbench 骨架（默认 flag-on），可在侧边栏切换 active title-card，能在 Topbar 看见 v1a/v1b/v1c 三段 stage tab + 各自 sub-tabs，stage 视图为带有"本 surface 将承载……"的占位卡，并有右侧 queue drawer。**视觉信息架构已落地，所有 reviewer card 与实数据接线留给 Phase 2/3/4。**

- 2026-05-19：Phase 1.5 收口（静态审视 + 修复 + Vite dev-server smoke）：
  - Sidebar `SidebarTitleCardSelector` 从 `<nav>` 内移到外面，避免被 `.sidebar-nav-zones` grid 模板压住
  - `selectorsection` 改用 `data-ui="section" data-padding="sm"`，不依赖未定义的 className
  - OverviewView stepper 三段从 `<button data-ui="card">` 重构为 `<article data-ui="card">` + 内嵌进入按钮，避免 button user-agent 样式与 card 样式叠加
  - `env.d.ts` 补 `VITE_TOPIC_WORKBENCH_V1ABC` 类型与默认开语义注释
  - Vite dev-server smoke：所有新模块 URL 200，TSX 转换通过
- 2026-05-19：Phase 1.6 落地（D1 后端只读 list endpoints，v1a only）：
  - `repositories/topic-selection-need-validation.repository.ts`：interface 加 `listNeedCandidatesByTitleCardId` + `listValidatedNeedsByTitleCardId`
  - `repositories/in-memory-topic-selection-need-validation-repository.ts`：两个对应实现
  - `repositories/prisma/prisma-topic-selection-need-validation-repository.ts`：两个对应实现（`findMany where: { titleCardId } orderBy createdAt desc`）
  - `repositories/topic-selection-evidence-map.repository.ts` + in-memory + prisma：`listEvidenceMapsByTitleCardId`
  - `repositories/topic-selection-search-resource.repository.ts` + in-memory + prisma：`listSearchPlansByTitleCardId`
  - 4 个 service 包装方法（纯 repository 透传，不动决策链语义）
  - `controllers/topic-selection-v1a-controller.ts`：4 个 handler（`listSearchPlansByTitleCard` / `listEvidenceMapsByTitleCard` / `listNeedCandidatesByTitleCard` / `listValidatedNeedsByTitleCard`）
  - `routes/topic-selection-v1a-routes.ts`：4 条 GET 路由 `/topic-selection/v1a/title-cards/:titleCardId/{search-plans|evidence-maps|need-candidates|validated-needs}`
  - `docs/context/api/openapi.yaml`：4 个 endpoint schema 描述 + 复用 `TopicSelectionV1aListResponse`
  - `docs/context/api/api-index.json`：regenerated（181 endpoints），verify pass
  - `apps/backend/src/routes/topic-selection-v1a-routes.integration.test.ts`：扩展现有端到端用例，新增对 4 个 list endpoint 的断言（response shape + title_card_id 过滤正确）
  - **测试结果**：`pnpm test --test-name-pattern v1a` 通过；workspace typecheck 通过；api-index drift verify pass
  - **v1b/v1c list endpoint 留给 Phase 3/4 入口前 JIT 补**

- 2026-05-19：Phase 2.1 落地（v1a 五个 surface reviewer card 实数据接线，read-only）：
  - 新增 `modules/topic-workbench/api/v1a.ts`：4 个 list endpoint 的类型化 client（消费 Phase 1.6 的 backend 路由）
  - 新增 `modules/topic-workbench/hooks/useV1aStageData.ts`：Promise.allSettled 并行拉 4 类记录，部分失败时保留成功 slice + 暴露首个错误
  - 新增 `modules/topic-workbench/cards/ReviewerCard.tsx`：design-spec §4039 红线模板，强制 5 段（结论/证据/反证/blocker+风险/下一步），所有 v1a/b/c reviewer card 必须基于此
  - 新增 v1a 5 张卡片（全部基于 ReviewerCard）：
    - `SeedOverviewCard.tsx`：从 TitleCard summary + v1a 4 类记录汇总当前阶段状态、blockers、下一步
    - `SearchPlanCard.tsx`：最新 SearchPlan + query intents / must-check / exclusion / 历史版本选择器
    - `EvidenceMapCard.tsx`：最新 EvidenceMap + unit_count 分组（support/challenge/baseline/context）+ stale 提示
    - `NeedCandidateReviewCard.tsx`：候选列表 + 选中详情，5 段全展开 + decision_status/lifecycle/prior_art/mechanism/speculative chips + confidence hint
    - `ValidatedNeedDecisionCard.tsx`：human-confirmed ValidatedNeed 详情 + 派生 pending_confirm 提示
  - 新增 `views/V1aStageView.tsx`：按 sub-tab 路由到 5 张卡 + 顶部状态条 + 底部"快速跳转"快捷栏
  - `TopicWorkbenchModule.tsx`：v1a stage tab 改为渲染 V1aStageView，v1b/v1c 继续走 StagePlaceholderView
  - 修正若干 enum 值（lifecycle_status / decision_status / search_plan_status 与 contracts SSOT 对齐）
  - **测试**：`pnpm typecheck` 通过；`pnpm build:renderer` 通过；Vite dev-server smoke 通过（所有新文件 200 OK，正常 TSX transform）
  - **下一步 Phase 2.2-2.5**：把 ReviewerCard 各 surface 的 "Phase 2.X 在此处接入..." 占位换成实际控件（SearchPlan revision/run 触发、EvidenceUnit drilldown drawer、NeedCandidate 回流按钮、ValidatedNeed human-confirm UI）

- 2026-05-19：Phase 2.5 落地（v1a 出口 human-confirm 端到端，反向优先）：
  - 后端：新增 `GET /topic-selection/v1a/need-candidates/:needCandidateId/validation-support-packets`（service / controller / route / OpenAPI / api-index 全链路），182 → 183 endpoints；扩展 v1a integration test 覆盖支持 packet 列表断言
  - 前端 API client：扩展 `api/v1a.ts`，新增 `listSupportPacketsByNeedCandidate` / `adjudicateNeed(needCandidateId, body)` / `publishV1bInputBundle(body)`，含 `AdjudicateNeedRequest` / `AdjudicateNeedResponse` / `PublishV1bInputBundleRequest` 类型
  - 前端组件：
    - 新增 `cards/AdjudicationConfirmDrawer.tsx`：design-spec §4039 红线 6 段强约束 confirm 表单 —— `validate` 路径必须填齐 6 段（确认范围 / 证据 / 反证 / blocker / accepted risk / downstream effect），按段独立校验，缺一不可提交；非-validate 路径（reject / park / merge / return_to_candidate / request_searchplan_recheck）切换为对应必填字段（rejected_reason / recheck reason / merge target id）
    - drawer 在打开时自动 fetch 候选的 support packets 并填充 picker，无 packet 时降级为文本输入 + 警示
    - 支持 loopback_target / required_actions（多行）/ gap_codes（多行）/ human_rationale 等附加字段
    - 提交成功后调用 `onSubmitted` 触发 v1a 数据 reload
  - `NeedCandidateReviewCard`：新增 `onAdjudicate` prop + "打开 adjudication confirm" 按钮（候选未产生 validated_need 时可用，已 confirm 后置灰）
  - `ValidatedNeedDecisionCard`：新增 `onPublished` prop + "发布 V1bInputBundle" 按钮 + 成功后显示 bundle id badge + 失败 inline 错误展示
  - `V1aStageView`：托管 drawer state（`adjudicating: NeedCandidateRecord | null`）；wire drawer + 半透明 overlay 关闭；adjudicate 完成 / V1bInputBundle 发布完成都触发 `reload()`
  - **测试**：v1a integration 3/3 pass（含新 support-packet 列表断言）；workspace typecheck 全绿；desktop build 通过；api-index drift verify pass
  - **v1a 端到端可走通**：reviewer 在桌面端可从 NeedCandidate → 打开 6 段 confirm → adjudicate validate → 后端创建 ValidatedNeed → 数据 reload → 在 ValidatedNeed surface 发布 V1bInputBundle

- 2026-05-19：Phase 2.5 后审：UI governance gate 修复（`python3 .ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run --mode minimal`）：
  - **首次审计**：42 errors（21 no-inline-style / 15 contract-enum / 3 contract-attr / 2 contract-tag-parse / 1 no-hardcoded-colors）
  - **修复策略**：
    - 抛弃右侧固定 drawer + overlay 模式：`QueueDrawer` 改为 inline `data-ui="card"` 面板渲染在 stage 内容之后；`AdjudicationConfirmDrawer` 改为 inline 卡片渲染在 V1aStageView 内（替代候选详情位置），不再使用 `position: fixed` / `rgba()` overlay
    - 删除所有 `style={{ ... }}` inline 属性（21 处）
    - `data-ui="text" data-tone="warning"` → `data-tone="muted"`（12 处），`data-tone="success"` → `data-tone="primary"`（2 处） —— text role 只允许 primary/secondary/muted/danger
    - `data-ui="toolbar" data-gap="N"` → `data-ui="stack" data-direction="row" data-gap="N" data-wrap="wrap"`（3 处） —— toolbar role 只允许 align/wrap
    - `data-variant={ ... ternary ... 'ready_for_validation' ... }` 触发 contract-dynamic 误报 → 拆为 `<AdjudicateButton>` 子组件，按 `isReady` 分支返回独立 `<button data-variant="primary">` / `<button data-variant="secondary">` 字面量；adjudication submit button 也改为按 canSubmit 分支
    - QueueDrawer JSDoc 中 `data-ui="card"`/`"drawer"` 字符串触发 contract-tag-parse → 重写注释
  - **最终审计**：`ui_gate run --mode minimal --fail-on errors` 通过（errors=0, warnings=0）
  - **回归**：workspace typecheck 通过；desktop build:renderer 通过；v1a integration test 3/3 通过；Vite dev-server smoke 通过（所有新文件 200 OK）
  - **被推迟的 UX 损失**：
    - QueueDrawer 不再常驻右侧 —— 改为列底面板；折叠态、宽度 56px 折叠图标列暂不可用
    - AdjudicationConfirmDrawer 不再以右侧 drawer 形式覆盖 —— 改为 inline 卡片（仍提供完整 6 段强约束），无半透明 overlay
    - 如要恢复 drawer/overlay 体验，需要走 `ui-governance-gate` RFC 流程申请扩展 `data-ui="drawer"` role + 对应 `data-ui="overlay"` token，或在 ui/approvals/ 下添加 `exception` 批准。当前选择优先合规，UX 升级留 v2。

- 2026-05-19：Phase 2.4 落地（NeedCandidate 完整 triage UI + readiness/packet 触发 + negative memory inline）：
  - 后端：新增 `GET /topic-selection/v1a/need-candidates/:needCandidateId/memory-suggestions`（service / controller / route / OpenAPI / api-index 全链路）；扩展 v1a integration test 覆盖 memory list 断言（candidate 触发 recheck adjudication 后 memory suggestion materialize，列表能查到）
  - 前端 API client：扩展 `api/v1a.ts`，新增 `listMemorySuggestionsByNeedCandidate` / `assessNeedCandidateReadiness(id)` / `createValidationSupportPacket(body)`
  - `AdjudicationConfirmDrawer`：新增 `initialDecision?: TopicSelectionNeedAdjudicationDecision` prop，支持快捷按钮预选 decision；useEffect 依赖加 initialDecision
  - `NeedCandidateReviewCard` 大幅扩展：
    - 新增 props `onAdjudicate(candidate, initialDecision?)` / `onMutated` —— 后者用于 readiness/packet 触发后刷新 v1a 数据
    - 新增 `TriageSection`：两个快捷按钮 "评估就绪度" + "创建 support packet"，状态化 (busy/error/message)；packet 创建自动透传最近一次的 readiness_assessment_id
    - 新增 `MemorySection`：候选挂载后自动 fetch `CandidateDecisionMemorySuggestion`，按时间倒序展示 suggestion_type / status badge + rationale；空态、loading、error 三态都有 inline 卡片
    - 新增 `QuickActionButton`：5 个 reject / return_to_candidate / request_searchplan_recheck / park / merge 快捷按钮，点击预选 decision 打开 AdjudicationConfirmDrawer；`data-variant` 拆为 secondary/danger 两个字面量分支以通过 UI governance 静态分析
    - 终态候选（已 result_validated_need_id / decision_status=rejected/merged）自动禁用所有快捷按钮
  - `V1aStageView`：新增 `initialDecision` state，wire `onAdjudicate(candidate, decision)`；drawer onClose / onSubmitted 都重置 initialDecision
  - **UI governance**：`ui_gate run --mode minimal --fail-on errors` 0 errors / 0 warnings（evidence: `.ai/.tmp/ui/t087-phase24-gate/`）
  - **测试**：v1a integration 3/3 通过（含新 memory-suggestions 列表断言）；workspace typecheck 全绿；desktop build:renderer 通过；api-index drift verify pass
  - **v1a 完整三脚架现已就位**：NeedCandidate triage（Phase 2.4）→ readiness/packet → adjudication 6 段 confirm（Phase 2.5）→ ValidatedNeed → V1bInputBundle publish

- 2026-05-19：Phase 2.2 + 2.3 落地（SearchPlan revision + EvidenceMap drilldown，v1a 链路前段完整收尾）：
  - 后端：新增 2 个 GET endpoints（service / controller / route / OpenAPI / api-index 全链路），整体来到 185 endpoints
    - `GET /topic-selection/v1a/title-cards/:titleCardId/search-plan-recheck-requests`：SearchPlan recheck request list by title-card
    - `GET /topic-selection/v1a/evidence-maps/:evidenceMapId/units`：EvidenceUnit list by evidence-map（驱动 Phase 2.3 drilldown）
    - repository 层新增 `listSearchPlanRecheckRequestsByTitleCardId`（接口 + in-memory + prisma）；evidence-map 复用现有 `listEvidenceUnitsByEvidenceMapId`
    - 扩展 v1a integration test：新增对两个新 endpoint 的断言（response shape、title-card/evidence-map 过滤正确）
  - 前端 API client：扩展 `api/v1a.ts`
    - `listSearchPlanRecheckRequestsByTitleCard(id)` / `getSearchPlanCoverageMatrix(id)` / `createSearchPlanRecheckRequest(body)`
    - `listEvidenceUnitsByEvidenceMap(id)` / `markEvidenceMapStale(id, body)`
  - `SearchPlanCard` Phase 2.2 扩展（新增 props `onMutated`）：
    - `RevisionForm`：内嵌表单，reason 必填 + gap_codes 多行可选 → `POST /search-plan-recheck-requests`；submit 后 inline 显示 created_id；按钮 variant 拆为 primary/secondary 字面量
    - `CoverageMatrixPanel`：toggle 展开/收起；展开后拉 coverage matrix，显示 6 个 summary count badge + 前 6 行 table（coverage_key / intent_type / latest_assessment.verdict）
    - `RecheckPanel`：自动拉 title-card 维度的 recheck request 列表，按时间倒序展示 status / target / reason / decision_summary；revision 提交后 token 递增自动 reload
  - `EvidenceMapCard` Phase 2.3 扩展（新增 props `onMutated`）：
    - `DrilldownPanel`：toggle 展开/收起；展开后拉 EvidenceUnit 全量并按 support/challenge/baseline/context 4 组渲染，每组前 5 条；`RoleBadge` 子组件按 role 字面量分支输出 `data-tone` 通过 UI gate 静态分析
    - `StaleForm`：当 freshness !== stale 时显示输入；提交 stale_reason_codes 多行 → `POST /evidence-maps/:id/stale`；danger 按钮；已 stale 时显示提示并禁用
  - `V1aStageView` 透传 `onMutated` 到 SearchPlanCard / EvidenceMapCard，mutation 后整张 v1a 数据 reload
  - **UI governance**：`ui_gate run --mode minimal --fail-on errors` 0 errors / 0 warnings（evidence: `.ai/.tmp/ui/t087-phase22-23-gate2/`）
  - **测试**：v1a integration 3/3 通过（含 2 个新 endpoint 断言）；workspace typecheck 全绿；desktop build:renderer 通过；api-index drift verify pass
  - **v1a 链路完整收尾**：Seed/SearchPlan/EvidenceMap/NeedCandidate/ValidatedNeed 五个 surface 均接入实数据 + 必要的交互动作（revision 触发、stale 标记、coverage matrix 查看、EvidenceUnit drilldown、quick triage、6 段 confirm、V1bInputBundle publish）；后续 Phase 3+ 可消费 V1bInputBundle 推进 v1b

- 2026-05-19：审计清理（命名漂移 / 死代码 / 过时占位）：
  - 文件改名：`cards/AdjudicationConfirmDrawer.tsx` → `AdjudicationConfirmForm.tsx`；`panels/QueueDrawer.tsx` → `QueuePanel.tsx`（实际为 inline 组件而非 drawer）；export 同步重命名，全部 imports 跟随更新
  - 文案修复：NeedCandidateReviewCard `Phase 2.3 在此处加 EvidenceUnit drilldown drawer` → `逐条 EvidenceUnit 见 EvidenceMap surface 的 drilldown 面板`；ValidatedNeedDecisionCard 空态文案 `Phase 2.5 在此处接入 human-confirm UI` → 指向 NeedCandidate surface 的人审入口（Phase 2.5 已落地）
  - 死代码删除：App.tsx 的 `_setTitleCardListRefreshTick` 与对应 state（仅作为 placeholder 从未被触发），Sidebar `titleCardListRefreshToken` 改为复用 `refreshTick`
  - UI gate / typecheck / build 全部通过

- 2026-05-19：Phase 3.1 落地（v1b 读层数据 + 4 个 surface 只读 reviewer card）：
  - 后端：4 个新 GET endpoint（service / controller / route / OpenAPI / api-index 全链路，到 189 endpoints）
    - `GET /topic-selection/v1b/title-cards/:id/research-slice-option-sets`
    - `GET /topic-selection/v1b/title-cards/:id/topic-question-candidate-sets`
    - `GET /topic-selection/v1b/title-cards/:id/topic-value-assessments`
    - `GET /topic-selection/v1b/title-cards/:id/topic-packages`
    - Repository 层：4 个 `list*ByTitleCardId` 方法（interface + in-memory + prisma），ValueAssessment/TopicPackage 用 `titleCardId @map("topicId")` 字段查询；service 层透传
    - 单元测试 stub repos 补齐新 interface（`StubValueAssessmentRepository` / `StubTopicPackageRepository` / `SeededTopicPackageRepository`）
    - v1b integration test 主流程扩展 4 个新 endpoint 断言（响应 shape + title-card 过滤正确）
  - 前端：
    - `api/v1b.ts`：4 个类型化 list client
    - `hooks/useV1bStageData.ts`：Promise.allSettled 并行拉 4 类记录，部分失败降级
    - 4 个 reviewer card 基于 `ReviewerCard` 5 段模板：
      - `SliceOptionSetCard`：option_count / recommended/selected / comparison_axes / human_review_triggers
      - `QuestionCandidateSetCard`：candidate_count / recommended_candidate_ids / hard_blockers / human_review_triggers
      - `ValueAssessmentCard`：hard_gates pass/fail（按 verdict 区分）/ dimension_scores / readiness_status / freshness / reviewer_objections / accepted_risk_refs
      - `TopicPackageCard`：title_candidates / contribution_summary / candidate_methods / evaluation_plan / key_risks / recheck_request_refs / package_readiness_status
    - `V1bStageView` 按 sub-tab (slice/question/value/package) 路由到对应卡 + 顶部状态条 + 底部"快速跳转"
    - `TopicWorkbenchModule` 接 V1bStageView（v1a → V1aStageView，v1b → V1bStageView，v1c 仍占位）
  - **UI governance**：0 errors / 0 warnings（evidence `.ai/.tmp/ui/t087-phase3-gate/`）
  - **测试**：v1b integration 主流程通过（含 4 新 endpoint 断言）；workspace typecheck 全绿；desktop build:renderer 通过；api-index drift verify pass
  - **下一步 Phase 3.2-3.5**：把 4 个 surface 的"Phase 3.X 在此处加 ..."占位换成实际控件（SliceSelectionDecision / QuestionSelectionDecision / ValueDispositionDecision human-confirm，及 V1cInputBundle publish）

- 2026-05-20：Phase 3.2-3.5 落地（v1b 链路完整收尾，4 个 surface 全部 interactive）：
  - 后端：新增 2 个 picker GET endpoint（service / controller / route / OpenAPI / api-index 全链路；191 endpoints 总）
    - `GET /topic-selection/v1b/research-slice-option-sets/:optionSetId/options`（驱动 Slice picker）
    - `GET /topic-selection/v1b/topic-question-candidate-sets/:candidateSetId/candidates`（驱动 Question picker）
  - 前端 API client（`api/v1b.ts`）扩展：
    - `listResearchSliceOptionsByOptionSet` / `listTopicQuestionCandidatesByCandidateSet`（picker drivers）
    - `submitSliceSelectionDecision(optionSetId, body)` / `submitQuestionSelectionDecision(candidateSetId, body)` / `submitValueDispositionDecision(assessmentId, body)` / `publishV1cInputBundle(packageId)`
    - 类型化 request 类型（`SubmitSliceSelectionRequest` / `SubmitQuestionSelectionRequest` / `SubmitValueDispositionRequest`）
  - 4 个 v1b reviewer card 加入 inline form 子组件，全部基于 design-spec §4039 红线（rationale 必填、按字面量分支输出 `data-variant` 通过 UI governance 静态分析）：
    - **Phase 3.2 `SliceSelectionForm`**（in SliceOptionSetCard）：4 个 decision（select / request_more_options / park / reject）；`select` 路径强制选 option（picker 自动拉 options）；rationale 必填；终态 option set（status=selected/rejected/superseded/parked 或已有 selected_option_id）禁用表单
    - **Phase 3.3 `QuestionSelectionForm`**（in QuestionCandidateSetCard）：6 个 decision（admit / admit_multiple / merge_then_admit / park / reject_all / no_admissible_candidate）；前 3 个路径强制勾选 candidate_ids（多选 checkbox，admit 单选 / admit_multiple+merge_then_admit 多选）；rationale 必填；终态 candidate set 禁用表单
    - **Phase 3.4 `ValueDispositionForm`**（in ValueAssessmentCard）：6 个 disposition（advance_to_package / refine_question / refine_slice / recheck_evidence_or_search / park / drop）；rationale 必填；required_actions 多行可选；已有 active_disposition_decision_id 时禁用表单
    - **Phase 3.5 `PublishV1cBundleAction`**（in TopicPackageCard）：单按钮发布 V1bToV1cInputBundle；成功 inline 显示 bundle id badge
  - `V1bStageView` 透传 `onMutated` 到 4 张卡，mutation 后 `reload()` 整张 v1b 数据
  - **UI governance**：`ui_gate run --mode minimal --fail-on errors` 0 errors / 0 warnings（evidence `.ai/.tmp/ui/t087-phase3-25-gate/`）
  - **测试**：v1b integration 主流程通过；workspace typecheck 全绿；desktop build:renderer 通过；api-index drift verify pass
  - **v1b 链路完整闭环**：reviewer 在桌面端可从 v1b 入口（已发布 V1bInputBundle）→ Slice human confirm → Question human confirm → Value disposition human confirm → TopicPackage(draft) 创建 → V1bToV1cInputBundle publish 进入 v1c

  状态：v1a + v1b 全部完成；下一步 Phase 4 v1c（PromotionGateCheck / HumanPromotionDecision / CommitmentProfile / PaperProjectBridge）即可让 reviewer 走完整链路到 paper-project。

- 2026-05-20：审计清理：
  - 修复 `V1bStageView` 的过时 doc 注释（Phase 3.2-3.5 改为 "已落地" 陈述）
  - 删除已不可达的 `StagePlaceholderView`（v1a/v1b/v1c 都接了真实 stage view，placeholder 完全冗余）
  - 删除 `types/index.ts` 中只被 placeholder 使用的 `StageId` 与 `StageSurfaceMap` 类型 + 对应不需要的 sub-tab key imports
  - TypeScript noUnusedLocals 静默通过；UI gate 0 errors / 0 warnings

- 2026-05-20：Phase 4 v1c 落地（晋升桥完整 interactive）：
  - 后端：3 个 list-by-title-card endpoint（service / controller / route / OpenAPI / api-index 全链路；到 194 endpoints）
    - `GET /topic-selection/v1c/title-cards/:id/promotion-gate-checks`
    - `GET /topic-selection/v1c/title-cards/:id/promotion-decisions`
    - `GET /topic-selection/v1c/title-cards/:id/paper-project-bridges`
    - Repository：3 个 `list*ByTitleCardId`（interface + in-memory + prisma）
    - v1c integration test 主流程扩展 3 新 endpoint 断言
  - 前端 API client（`api/v1c.ts`）：3 个 list helpers + read helpers（`getPromotionDecisionBundle` / `getPromotionCommitmentProfile` / `listDownstreamFeedbackByBridge`）+ 3 个 write helpers（`recordHumanPromotionDecision` / `createPaperProjectBridge` / `createPaperProjectIntakeFromBridge`）
  - 新增 `useV1cStageData` hook（Promise.allSettled 并行拉 3 类记录）
  - 5 个 v1c reviewer card 基于 ReviewerCard 5 段模板：
    - **PromotionGateCheckCard**（gate-check tab，read-only）：disposition / promote_allowed / blockers / warnings / required_actions / loopback_hints / accepted_risk_refs / recheck_request_refs
    - **HumanPromotionDecisionCard**（decision tab，interactive）：列出历史 PromotionDecision 摘要 + 内嵌 `RecordDecisionForm`：picker 自动绑定 gate_check + snapshot_hash，10 决策选择，promote-class 路径提示 commitment 由 agent 派生，reviewer 只 confirm decision + rationale + human_actor.actor_id
    - **PromotionCommitmentProfileCard**（commitment tab，read-only）：调用 `getPromotionDecisionBundle` 拉 7 字段 profile（scope / claim_ceiling / prohibited_claims / allowed_refinements / early_check_obligations / stop_conditions / reopen_conditions）
    - **PaperProjectBridgeCard**（bridge tab，interactive）：列出已有 bridge + 内嵌 `CreateBridgeForm`（从未生成 bridge 的 promote-class 决策中选）+ `IntakeAction`（idempotent 创建 PaperProjectIntake，title 可选）
    - **DownstreamFeedbackCard**（downstream tab，read-only）：bridge picker + 前 8 条 feedback append-only 时间线
  - 新增 `V1cStageView`：按 5 个 sub-tab 路由 + 顶部状态条 + 底部快速跳转
  - `TopicWorkbenchModule` 接 V1cStageView；清理 placeholder 分支
  - **UI governance**：`ui_gate run --mode minimal --fail-on errors` 0 errors / 0 warnings（evidence `.ai/.tmp/ui/t087-phase4-final/`）
  - **测试**：v1c integration 主流程通过（含 3 新 endpoint 断言）；workspace typecheck 全绿；desktop build:renderer 通过；api-index drift verify pass
  - **v1a + v1b + v1c 完整端到端**：reviewer 在桌面端可从空 title-card 一路走到 PaperProjectIntake 交接给论文管理模块

- 2026-05-20：Phase 5 横切落地（Queue 实数据，no new backend endpoint）：
  - 新增 `hooks/useWorkbenchQueues.ts`：复用 v1a/v1b/v1c list-by-title-card endpoints（Promise.allSettled，部分失败降级），按 design-spec §4018 派生 4 类队列：
    - **human-review**：v1a NeedCandidate(`ready_for_validation` + 无 ValidatedNeed) / v1b SliceOptionSet(`ready_for_selection` + 无 selected_option_id) / v1b QuestionCandidateSet(`ready_for_selection`) / v1b ValueAssessment(`ready`/`ready_with_accepted_risk` + 无 active disposition) / v1c GateCheck(无对应 PromotionDecision) / v1c PromotionDecision(bridge_eligible + status=current 但未生成 bridge)
    - **recheck**：v1a NeedCandidate.open_recheck_request_refs / v1b TopicPackage.recheck_request_refs / v1c GateCheck.recheck_request_refs
    - **blocker**：v1a NeedCandidate.unresolved_challenge_refs / v1b SliceOptionSet.requires_human_review / v1b QuestionCandidateSet.hard_blockers / v1b ValueAssessment.blocker_refs / v1b TopicPackage.blocker_refs / v1c GateCheck.blockers
    - **accepted-risk**：跨 v1a/v1b/v1c 所有 records 的 accepted_risk_refs（计数级；expiry 计算需 backend 支持，留 Phase 6）
  - 重写 `panels/QueuePanel.tsx`：4 个 tab 按钮（按 active 字面量分支输出 data-variant 通过 UI gate 静态分析），每个 tab 内展示 count badge + 前 6 项 deep-link 卡（label / caption / 跳转按钮）
  - 每个 queue item 携带 `(stage, subTab)`，QueuePanel 接收 `onSelectSecondaryTab` 直接跳转到 reviewer 当前 backlog 所在的 stage tab
  - 通过 `refreshToken` 复用模块 reload 信号，任何 stage 内提交后 queue 自动刷新
  - **UI governance**：`ui_gate run --mode minimal --fail-on errors` 0 errors / 0 warnings（evidence `.ai/.tmp/ui/t087-phase5-gate/`）
  - **测试**：workspace typecheck 全绿；desktop build:renderer 通过
  - **Phase 5 延后**：
    - **TraceDrilldownDrawer**（EvidenceUnit → ContentRef → source locator chain）需后端补 by-evidence-map / by-unit 的 ContentRef projection + 一个跨 stage 通用的 functional_lineage_link list endpoint；当前 reviewer 已能在 ReviewerCard 看到 refs 计数，足以做"哪些 refs 存在"的判断，但还无法逐 ref 钻入。Phase 6 收口前补足。
    - **AcceptedRisk strict form**（scope / reason / expiry / recheck_condition）：v1a POST `/accepted-risks` 已存在，但 v1b/v1c 没有对应 endpoint；需要 backend 统一 accepted-risk lifecycle 才能上 UI。Phase 6 评估。
    - **HumanOverride 强约束 UI**：design-spec §4040 要求 scope+reason+expiry+recheck_condition；当前 backend 没有 HumanOverride 模型（与 AcceptedRisk 共享），同样 Phase 6 评估。

- 2026-05-20：Phase 6 清理（dual-track 消除）：
  - 删除 legacy module 目录 `apps/desktop/src/renderer/modules/title-card-management/`（1816 行）+ entry file `TitleCardManagementModule.tsx`
  - 简化 `literature/shared/types.ts`：移除 `TitleCardLegacyPrimaryTabKey` / `TitleCardWorkbenchPrimaryTabKey` 二元 union + 旧 sub-tab key 类型（`TitleCardEvidenceSubTabKey` / `TitleCardEditorSubTabKey` / `TitleCardPromotionSubTabKey`），保留唯一 `TitleCardPrimaryTabKey = 'overview' | 'v1a' | 'v1b' | 'v1c'`；`TitleCardSubTabState` 只保留 3 个 stage 字段
  - 简化 `literature/shared/constants.ts`：删除 `titleCardLegacyTabs` / `titleCardLegacySubTabsByTab` / `titleCardWorkbenchTabs` / `titleCardWorkbenchSubTabsByTab`，`titleCardTabs` / `titleCardSubTabsByTab` 直接定义为 workbench 版本
  - 简化 `App.tsx`：删除 `isTopicWorkbenchEnabled` flag 函数 + `topicWorkbenchEnabled` useMemo + 三元 module 渲染分支 + 6 个 legacy sub-tab `switch case`；`initialTitleCardSubTabs` 只保留 v1a/v1b/v1c 默认；删除 `import { TitleCardManagementModule }`
  - 简化 `shell/types.ts` + `Sidebar.tsx`：移除 `topicWorkbenchEnabled` prop，selector 在 `activeModule === '选题管理'` 时直接渲染
  - 保留 `env.d.ts` 的 `VITE_TOPIC_WORKBENCH_V1ABC` 类型声明（external `.env` 文件兼容），但注释为 "retired in Phase 6, value no longer read"
  - **验证**：workspace typecheck 全绿；UI gate `0 errors / 0 warnings`（evidence `.ai/.tmp/ui/t087-phase6-cleanup/`）；desktop build:renderer 通过（bundle 略减小约 5KB）
  - **结果**：选题管理只剩一条代码路径（TopicWorkbenchModule + v1a/v1b/v1c stage views）；dual-track 风险归零

## Files/modules touched (high level)
> Phase 0 阶段尚未触碰应用代码。预期落地范围（与 roadmap "Project structure change preview" 一致）：

- `apps/desktop/src/renderer/modules/title-card-management/**`（重写）
- `apps/desktop/src/renderer/App.tsx`（active title-card 全局 state + feature flag）
- `apps/desktop/src/renderer/shell/components/{Sidebar,Topbar}.tsx`（题目卡选择器 / stage tab）
- `apps/desktop/src/renderer/literature/shared/{constants,types}.ts`（tab 定义重构）
- `apps/desktop/src/renderer/literature/shared/api.ts`（必要时补 v1a/b/c client helper）

## Decisions & tradeoffs

- **Decision**: 切片方式选"v1a/b/c 全量薄壳一次铺平"
  - Rationale: 后端能力已就绪，前端落后影响整体可用性；薄壳一次铺平能尽早暴露 contract 缺口
  - Alternatives considered: v1a 深做（推迟其他 stage UI 价值）；先做 v1c 晋升桥（用户决策可见性不够）；先做横切 queue/trace（缺 stage 视图依旧不可点击）

- **Decision**: 直接重写旧 7 tab CRUD/JSON 视图，不并存
  - Rationale: 旧视图引导用户填 raw JSON 与手敲 ID，与 design-spec §4039 红线冲突；保留会让 reviewer 误入歧途
  - Alternatives considered: 保留为 dev 入口（保留语义负担）；双 tab 并列（增加 UI 复杂度）

- **Decision**: active title-card 放在 Sidebar 全局选择器
  - Rationale: 与现有 paper_id 上下文模式对齐；多 stage tab 共享同一上下文避免每 tab 重选
  - Alternatives considered: 总揽 tab 内选择（每次回总揽切换不便）；Topbar breadcrumb（与现有 shell 设计偏离）

- **Decision**: v1 必须覆盖所有 human-confirmed 决策点 + 全量横切 panel
  - Rationale: design-spec §4039 明确人审 UI 不能退化为单按钮；横切（queue/trace/AcceptedRisk）是 reviewer 工作流的必要元素
  - Alternatives considered: human confirm 留 v2（v1 价值不闭环）；横切只做 queue + trace（AcceptedRisk 必须在 v1 提供）

- **Decision**: feature flag 兜底 + 旧 module Phase 6 才删
  - Rationale: 给真实用户/演练留回滚窗口；前 5 phase 可随时切回旧 module 对比
  - Alternatives considered: 直接删（无回滚）；永久 flag（增加维护负担）

- **Decision**: 不引入 URL hash 深链 v1（O6）
  - Rationale: 当前桌面 shell 不依赖路由；引入会带来 history / 状态恢复复杂度
  - Alternatives considered: 用 hash 实现人审通知跳转（v2 评估）

- **Decision D1**：本 UI 任务允许同步补**纯只读** GET list-by-title-card endpoints（不动 service 业务/contract）
  - Rationale: 后端原本按 "POST 创建 + work-queue 推动 + by-id 取" 设计，缺 reviewer workbench 必要的列表能力；用 work-queue + legacy `/title-cards/{id}/*` 兜底会让 UI 字段不全、保真度差，长期重写代价更高；只读 list endpoint 是 read 投影，零侵入
  - Alternatives considered: 另立后端子任务（UI 被阻塞）；前端用 work-queue + legacy 路由兜底（保真度差 + 后期重写）

- **Decision D2**（已被 D2' 取代）：Phase 1 同步在 `ui/contract` 补 `drawer / split / timeline / stepper` 原语
  - Rationale: 现有原语缺这 4 个 reviewer workbench 必要 building blocks；用 modal 顶 drawer 会丢"始终可见"的上下文体验；新原语只加 CSS + token，与现有 contract 体系完全一致
  - Alternatives considered: 用 modal+grid 顶替（drawer 体验大幅下降）；只在本模块内部用 className（违反 desktop UI freeze + `data-ui` 主线）

- **Decision D2'（修订 D2）**：本任务**不扩 contract**，4 个缺位原语用现有 role 组合实现
  - Rationale: 进一步 Discovery 发现 contract 扩展需要走 `ui-governance-gate` RFC + approval workflow（`ui_gate.py approval-approve` + `ui/approvals/<ts>-spec_change-<hash>.json`），与"本轮只做 UI/UX 改造"的范围/节奏冲突；用现有 role 组合可立即推进，等价度高
  - 实现映射：
    - `drawer` → `modal` + B1 layout-only Tailwind 定位（右侧全高、固定 width）；折叠态用 badge 计数代偿"始终可见"
    - `split-pane` → `grid cols=2` + 双 `card`
    - `timeline` → `list variant=rows` + `divider` + `badge`（时间/类型）
    - `stepper` → `tabs` + 数字 `badge`
  - Follow-up: 若后续有 RFC 窗口（如配合 T-078 desktop-workbench 一并升级），可补 contract 并把模块内组合换成真原语
  - Alternatives considered: 走完整 RFC + approval（时间成本高，与本轮节奏冲突）；只在模块内部 className（违反 desktop UI freeze）

- **Decision D3**：Topbar 改造为二级 tab（stage tab + dynamic sub-tab）
  - Rationale: 既能保持 Topbar tab 数量稳定（4 个 stage），又能按 stage 提供精确导航；与现有文献管理 module（auto-import sub-tab）模式对齐
  - Alternatives considered: 单层 12+ tab（拥挤）；侧边栏二级菜单（与现有 shell 不一致）

- **Decision D4**：Queue 放选题管理模块内**右侧常驻 drawer**，4 类队列以 drawer 内 tabs 切换
  - Rationale: 常驻 drawer 让 reviewer 始终能看到积压；模块内位置避免与 governance panel 混淆；折叠态只显示 4 个 badge 计数，节省空间
  - Alternatives considered: 总揽 sub-tab（stage tab 内看不到 queue 不便）；Topbar 全局 badge（跨 title-card 语义模糊）；并入 governance panel（与 paper_id 上下文混淆）

- **Decision D5**：active title-card 上升为 `App.tsx` 顶层 state，与 `paper_id` 对称
  - Rationale: 与现有 paper_id 模式一致；其他模块（写作中心 / 论文管理）未来可直接消费 active title-card；governance panel 跟随策略明确
  - Alternatives considered: 模块内 React context（无法跨模块消费）

- **Decision D6**：v1 可视化深度收口在"结构化列表 + table 对比 + JSON drilldown"
  - Rationale: 控制 Phase 2/3 工作量；reviewer 决策核心是判断而非可视化炫技；EvidenceUnit 用 table 分组（support/challenge/baseline/resource）已足够支撑判断；高保真可视化（claim grid / 雷达图）留 v2
  - Alternatives considered: 一次性做高保真可视化（30%+ 工作量增加 + 决策价值未必更高）；纯 list 点入详情（缺失对比能力）

- **Decision D7**：AcceptedRisk/HumanOverride 全字段强校 + PromotionGateCheck 逐项卡片
  - Rationale: design-spec §4040 明确 HumanOverride 不能退化为"继续"按钮；reviewer 必须看见 6 项 gate 的逐项 pass/fail+reason；强校保证 governance 链路可追溯
  - Alternatives considered: 软校（governance 链路弱化）；GateCheck summary（reviewer 决策面缺少颗粒度）

- **Decision D8**：Negative memory inline / flag 默认开 / 不引入 URL hash
  - Rationale: Memory 作为 NeedCandidate Review 卡的 inline 上下文区段，最贴近 reviewer 工作流；flag 默认开（dev+prod）便于即时验收，Phase 6 前旧 module 仅作为 flag-off 兜底；URL hash 引入要带 history/state-restore 复杂度，v1 不需要
  - Alternatives considered: Memory 独立 panel（reviewer 易忽略）；flag prod 灰度（节奏慢，验收周期长）；URL hash v1 引入（成本/收益不匹配）

## Deviations from plan
- (none yet)

## Known issues / follow-ups
- T-087 在 registry 当前位于 F-000/M-000，需要通过 `ctl-project-governance.mjs map` 移至 F-001/M-001/R-009 并跑 sync。
- Phase 0 Discovery 期间需要与 T-078 owner 对齐 Sidebar/Topbar 共享改造接口，避免合并冲突。
- 后端能力缺口（如有）需要在 Phase 0 映射表完成后转为单独后端任务（slug 待定）。

## Pitfalls / dead ends (do not repeat)
- 详见 `05-pitfalls.md`（append-only）。
