# 04 Verification

> Phase 6 收口前可逐步补充；本文件先列计划，执行后填写实际结论。

## Phase 1 / Phase 1.5 实测结论（2026-05-19）

### Build & typecheck
- `pnpm --filter @paper-engineering-assistant/desktop typecheck`：**pass**（renderer + main 双 tsconfig）
- `pnpm --filter @paper-engineering-assistant/desktop build:renderer`：**pass**（98 modules，gzip JS 133 KB / CSS 16 KB）
- `pnpm -w typecheck`：**pass**（shared / backend / desktop 三档）

### 静态审视发现 + 修复
1. **Sidebar selector 与 grid 模板冲突** — `.sidebar-nav-zones` 使用 `display: grid; grid-template-rows: minmax(0, 7fr) minmax(0, 3fr)`，selector 嵌在 grid 内会被压。**修复**：把 `SidebarTitleCardSelector` 移到 `<nav>` 之外，作为 `.sidebar-pane` 的独立 flex 子元素；其内部用 `data-ui="section" data-padding="sm"` + inline `flexShrink: 0`，不再依赖未定义的 `sidebar-nav-zone-titlecard` className。
2. **Stage stepper button-as-card 视觉冲突** — `<button data-ui="card">` 让 button user-agent 样式与 card border/background 叠加。**修复**：OverviewView 的三段 stepper 重构为 `<article data-ui="card">` 容器 + 内嵌 `<button data-ui="button" data-variant="secondary">` 进入按钮，语义和视觉都更干净。
3. **`<select data-ui="select">` 宽度** — 默认 `inline-block`，dropdown 在 Sidebar 内可能不充满宽度。**修复**：inline `style={{ width: '100%' }}`（layout-only）。
4. **新模块 `display: flex`** — `<section className="module-dashboard topic-workbench-shell" style={{ display: 'flex', gap: 16 }}>` 在 `.module-dashboard` 之上加 flex 容器，QueueDrawer 用 `flex-shrink: 0` + 固定 width 320；主区 `flex: 1, min-width: 0` 防溢出。inline style 全部 layout-only，符合 B1 boundary。
5. **`VITE_TOPIC_WORKBENCH_V1ABC` 类型** — 补 `apps/desktop/src/renderer/env.d.ts` 中的 `ImportMetaEnv` 定义并注释默认开语义。

### Vite dev-server smoke（2026-05-19）
- `pnpm --filter @paper-engineering-assistant/desktop dev:renderer --port 5189` 启动成功（86ms ready）
- HTTP GET `/`：200，serve index.html，React HMR runtime 注入
- HTTP GET `/src/renderer/modules/topic-workbench/TopicWorkbenchModule.tsx`：200，TSX → JS transform 成功（18958 bytes）
- HTTP GET `/src/renderer/shell/components/Sidebar.tsx`：200，含新增的 `SidebarTitleCardSelector` import
- 结论：模块图解析、TSX transform、HMR pipeline 全部通过；no Vite-side transform errors

### Phase 6 清理（dual-track 消除，2026-05-20）
- 删除 `apps/desktop/src/renderer/modules/title-card-management/**`（1816 行）+ `TitleCardManagementModule.tsx`
- 合并 `titleCardLegacy*` / `titleCardWorkbench*` 二元导出 → 唯一 `titleCardTabs` / `titleCardSubTabsByTab`
- `App.tsx` 删除 flag/三元/legacy sub-tab cases；`Sidebar.tsx` 删除 `topicWorkbenchEnabled` prop
- 保留 `VITE_TOPIC_WORKBENCH_V1ABC` env type 声明（外部 `.env` 兼容），但注释为 retired
- 选题管理只剩一条代码路径（TopicWorkbenchModule）；no dual-track
- `pnpm -w typecheck` pass · `desktop build:renderer` pass · UI gate **0 errors / 0 warnings**（evidence: `.ai/.tmp/ui/t087-phase6-cleanup/`）

### Phase 5 横切 Queue 实数据接线（2026-05-20）
- 新增 `hooks/useWorkbenchQueues.ts` + 重写 `QueuePanel`（no new backend endpoint，复用 v1a/v1b/v1c list-by-title-card 数据）
- 4 类队列派生（design-spec §4018）：human-review / recheck / blocker / accepted-risk；每项可一键跳转对应 stage sub-tab
- 延后到 Phase 6 评估：TraceDrilldownDrawer（缺 by-unit ContentRef projection + functional_lineage_link list）、AcceptedRisk 强约束 form（v1b/v1c 缺 endpoint）、HumanOverride（无 backend 模型）
- `pnpm -w typecheck` pass · `desktop build:renderer` pass · UI gate **0 errors / 0 warnings**（evidence: `.ai/.tmp/ui/t087-phase5-gate/`）

### Phase 4 v1c 完整 interactive（2026-05-20）
- 新增后端 endpoints（共 194 endpoints）：
  - `GET /topic-selection/v1c/title-cards/:id/promotion-gate-checks`
  - `GET /topic-selection/v1c/title-cards/:id/promotion-decisions`
  - `GET /topic-selection/v1c/title-cards/:id/paper-project-bridges`
- 5 个 v1c reviewer card：GateCheck（read）/ HumanPromotionDecision（interactive 10 出口）/ CommitmentProfile（read 7 字段）/ PaperProjectBridge（create + intake）/ DownstreamFeedback（read append-only）
- 删除 `StagePlaceholderView` + `StageId`/`StageSurfaceMap` 死代码
- `pnpm -w typecheck` pass · `desktop build:renderer` pass · `api-index verify --strict` pass · v1c integration 主流程通过 · UI gate **0 errors / 0 warnings**（evidence: `.ai/.tmp/ui/t087-phase4-final/`）

### Phase 3.2-3.5 v1b 完整 interactive（2026-05-20）
- 新增后端 endpoints（共 191 endpoints）：
  - `GET /topic-selection/v1b/research-slice-option-sets/:id/options`
  - `GET /topic-selection/v1b/topic-question-candidate-sets/:id/candidates`
- 4 个 v1b reviewer card 加入 inline form：
  - **SliceSelectionForm**：4 decision · select 路径强制 picker · rationale 必填 · 终态禁用
  - **QuestionSelectionForm**：6 decision · admit/admit_multiple/merge_then_admit 强制 candidate 多选 · rationale 必填
  - **ValueDispositionForm**：6 disposition · rationale 必填 · 已有 active disposition decision 禁用
  - **PublishV1cBundleAction**：单按钮发布 V1bToV1cInputBundle
- `pnpm -w typecheck` pass · `desktop build:renderer` pass · `api-index verify --strict` pass · v1b integration 主流程通过 · UI gate **0 errors / 0 warnings**（evidence: `.ai/.tmp/ui/t087-phase3-25-gate/`）

### Phase 3.1 v1b 读层 + 4 个只读 reviewer card（2026-05-19）
- 新增后端 endpoints（共 189 endpoints）：
  - `GET /topic-selection/v1b/title-cards/:id/research-slice-option-sets`
  - `GET /topic-selection/v1b/title-cards/:id/topic-question-candidate-sets`
  - `GET /topic-selection/v1b/title-cards/:id/topic-value-assessments`
  - `GET /topic-selection/v1b/title-cards/:id/topic-packages`
- v1b integration test 主流程扩展 4 新 endpoint 断言；单元测试 stub repos 补齐新接口
- 前端：4 张 v1b reviewer card（SliceOptionSetCard / QuestionCandidateSetCard / ValueAssessmentCard / TopicPackageCard）+ V1bStageView 路由 + TopicWorkbenchModule 接线
- `pnpm -w typecheck` pass · `desktop build:renderer` pass · `api-index verify --strict` pass · UI gate **0 errors / 0 warnings**（evidence: `.ai/.tmp/ui/t087-phase3-gate/`）

### 审计清理（2026-05-19）
- AdjudicationConfirmDrawer → AdjudicationConfirmForm；QueueDrawer → QueuePanel（实际已是 inline 组件，名称对齐实现）
- 修复 NeedCandidate / ValidatedNeed 卡内过时的 "Phase 2.X 在此处接入..." 占位
- 删除 App.tsx 内死代码 `_setTitleCardListRefreshTick`
- UI gate / typecheck / build 全部通过

### Phase 2.2 + 2.3 SearchPlan revision + EvidenceMap drilldown（2026-05-19）
- 新增后端 endpoints（共 185 endpoints）：
  - `GET /topic-selection/v1a/title-cards/:id/search-plan-recheck-requests`
  - `GET /topic-selection/v1a/evidence-maps/:id/units`
- v1a integration test 扩展断言：
  - EvidenceMap 创建后立刻拉 `/units`，断言至少一条 EvidenceUnit 且 evidence_map_id 过滤正确
  - 触发 recheck adjudication + queue 后拉 `/search-plan-recheck-requests`，断言至少一条且 title_card_id 过滤正确
- 前端：
  - `SearchPlanCard` 加 `RevisionForm`（reason 必填）+ `CoverageMatrixPanel`（toggle + summary badges + table 前 6 行）+ `RecheckPanel`（自动拉 title-card 维度列表）
  - `EvidenceMapCard` 加 `DrilldownPanel`（4 组 role 分组 + 前 5 条）+ `StaleForm`（freshness != stale 时可标记）
  - `RoleBadge` 子组件按 role 字面量分支输出 `data-tone`
- `pnpm -w typecheck` pass · `desktop build:renderer` pass · `api-index verify --strict` pass · UI gate **0 errors / 0 warnings**（evidence: `.ai/.tmp/ui/t087-phase22-23-gate2/`）

### Phase 2.4 NeedCandidate 完整 triage + memory inline（2026-05-19）
- 新增后端 `GET /topic-selection/v1a/need-candidates/:needCandidateId/memory-suggestions`：v1a integration test 已加断言（recheck candidate adjudicate → materialize memory → 列表能查到该候选的 memory_suggestion）
- 前端组件：
  - `TriageSection` —— 评估就绪度 / 创建 support packet 两键，状态化反馈，失败 inline 显示
  - `MemorySection` —— 候选加载时自动拉 memory，按时间倒序展示 suggestion_type / status / rationale
  - `QuickActionButton`（5 个）—— 预选 return_to_candidate / request_searchplan_recheck / park / merge / reject 直接打开 AdjudicationConfirmDrawer 对应路径；终态候选自动禁用
- `pnpm -w typecheck` pass · `desktop build:renderer` pass · `api-index verify --strict` pass · UI gate **0 errors / 0 warnings**（evidence: `.ai/.tmp/ui/t087-phase24-gate/`）

### Phase 2.5 后审：UI governance gate（2026-05-19）
- 工具：`python3 .ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run --mode minimal --fail-on errors`
- 首次审计：**42 errors**（21 no-inline-style / 15 contract-enum / 3 contract-attr / 2 contract-tag-parse / 1 no-hardcoded-colors）
- 修复后审计：**0 errors / 0 warnings**（evidence: `.ai/.tmp/ui/t087-phase25-fix2/`）
- 关键变更：
  - 抛弃右侧固定 drawer + overlay → 全部改为 inline `data-ui="card"` 面板（QueueDrawer / AdjudicationConfirmDrawer 都在主区列底/列中渲染）
  - 全文删除 `style={{...}}` inline attr（21 处）+ `rgba(...)` 硬编码颜色
  - `text data-tone` 仅用 primary/secondary/muted/danger
  - `toolbar` 不带 `data-gap`，需间距改用 `stack data-direction=row`
  - 动态 `data-variant` 改写为字面量分支（`<Button data-variant="primary">` vs `<Button data-variant="secondary">`）

### Phase 2.5 v1a 出口 human-confirm 实测（2026-05-19）
- 后端新增 `GET /topic-selection/v1a/need-candidates/:needCandidateId/validation-support-packets`：v1a integration test 已加断言（packet 列表过滤正确）
- 端到端流程在测试夹具中走通：candidate → readiness → support packet → adjudicate(validate) → ValidatedNeed 出现 → publish V1bInputBundle
- adjudication 表单红线（仅前端，未自动化）：
  - validate 路径 6 段必填，每段独立 inline 校验
  - reject 路径强制 rejected_reason + rationale
  - request_searchplan_recheck 路径强制 recheck reason
  - merge 路径强制 merge_target_need_candidate_id
- `pnpm -w typecheck` pass · `desktop build:renderer` pass · `api-index verify --strict` pass（183 endpoints）

### Phase 1.6 后端 list endpoints 实测（2026-05-19）
- 4 新 endpoint（v1a）：
  - `GET /topic-selection/v1a/title-cards/:titleCardId/search-plans`
  - `GET /topic-selection/v1a/title-cards/:titleCardId/evidence-maps`
  - `GET /topic-selection/v1a/title-cards/:titleCardId/need-candidates`
  - `GET /topic-selection/v1a/title-cards/:titleCardId/validated-needs`
- 测试：扩展 `topic-selection-v1a-routes.integration.test.ts` 端到端用例，在已有 v1a 全流程之后断言 4 个 list endpoint
  - 响应 shape：`{ items: Array<{ title_card_id, ... }> }`
  - 过滤正确：所有 items 的 `title_card_id` === 测试 titleCardId
  - 至少一项：SearchPlan / EvidenceMap / NeedCandidate 必非空（已在前序创建）；ValidatedNeed 因 adjudication 路径决定可能为空，只断言数组形状
- `pnpm --filter @paper-engineering-assistant/backend test --test-name-pattern v1a`：**3/3 pass**
- `node .ai/scripts/ctl-api-index.mjs verify --strict`：**up-to-date**（181 endpoints）
- `pnpm -w typecheck`：**pass**

### 仍待真实运行验证（Phase 6 前必跑）
- [ ] `pnpm desktop:dev` 启动后视觉冒烟：
  - [ ] Sidebar 中"当前题目卡"selector 在 macOS chrome / 普通 chrome 两种 mode 下排版正确
  - [ ] 三段 stage stepper 卡片在窄屏（≤ 960px）下是否优雅换行
  - [ ] QueueDrawer 折叠态宽度 56px 在 macOS chrome 右侧不挤压 stage 内容
  - [ ] `data-ui="select"` 在暗色主题下文字可见
  - [ ] 切换到非"选题管理"模块时 Sidebar selector 不出现、不发起 fetch
  - [ ] `VITE_TOPIC_WORKBENCH_V1ABC=0` 时回到旧 module，旧 7 tab 完整可用
- [ ] 后端 `/title-cards` 返回为空时 Overview 空态文案展示正确
- [ ] 后端 `/title-cards` 返回 5–10 张题目卡时 dropdown 体验合理

## Automated checks
- `pnpm -w typecheck`（必跑）
- `pnpm --filter @paper-engineering-assistant/desktop typecheck`
- `pnpm --filter @paper-engineering-assistant/desktop build`
- 现有桌面 renderer 单元测试套件（如 `*.test.ts` / `*.spec.ts`）
- 新增覆盖：
  - reviewer card 渲染 / human-confirm 表单字段必填校验单测
  - `ActiveTitleCardContext` 切换语义单测
  - v1a/b/c API client 形状测试（schema shape 与 OpenAPI 对齐）
- 后端 contract drift：`docs/context/api/api-index.json` / `openapi.yaml` 不应被本任务改动；CI 已有 drift 检查应保持绿。

## Manual smoke checks

### Phase 1 冒烟（Shell + active title-card）
- [ ] `pnpm desktop:dev` 启动；侧边栏题目卡选择器可见，加载/空态正确
- [ ] 切换 active title-card，stage tab 内可拿到正确 id
- [ ] feature flag off 时旧 module 可访问，文献/论文/写作模块无回归

### Phase 2 冒烟（v1a）
- [ ] 选定空 title-card → 创建/接受 SearchPlan → 触发 SearchRun → EvidenceMap 出现 EvidenceUnit
- [ ] NeedCandidate Review 卡可 reject / revise / request search revision
- [ ] ValidatedNeed Decision 卡可 human-confirm；reviewer card 显示结论/证据/反证/blocker/next actions 5 段
- [ ] negative case：already_solved → reject + CandidateDecisionMemory 创建可在 UI 触发

### Phase 3 冒烟（v1b）
- [ ] 选定 human-confirmed ValidatedNeed → 看到 SliceOptionSet 推荐 → 选择 confirm
- [ ] TopicQuestionCandidateSet 比较 + 选择 confirm
- [ ] ValueAssessment 表单结构化填写（hard_gates / scored_dimensions / risk_penalty），不允许 raw JSON
- [ ] ValueDispositionDecision 可 advance_to_package / refine / park / drop
- [ ] TopicPackage(draft) 摘要可见 trace boundary check 结果

### Phase 4 冒烟（v1c）
- [ ] PromotionGateCheck 逐项 pass/fail 可见
- [ ] CommitmentProfile 缺字段时 promote 按钮禁用
- [ ] human-confirm promote → 创建 PaperProjectBridge，论文管理模块可看到对应 paper_id
- [ ] DownstreamFeedback / Recheck panel 显示 append-only 记录

### Phase 5 冒烟（横切）
- [ ] 4 类队列可用；按风险/阻断排序
- [ ] 任意 stage 内打开 TraceDrilldownDrawer，可看到 EvidenceUnit/SearchRun/LLMWorkflowRun 摘要
- [ ] AcceptedRisk / HumanOverride 缺字段不可提交
- [ ] reviewer cards 显示 inline blocker / accepted-risk / recheck badge

### Phase 6 联调
- [ ] 与 T-078 desktop-workbench 在 Sidebar/Topbar 改造上无冲突
- [ ] feature flag 默认开，旧 module 删除分支可独立合入

## Rollout / Backout

### Rollout
1. Phase 1 合并后 feature flag 默认关，灰度开启
2. Phase 2–5 各 phase 单独合并 PR，feature flag 一直可用
3. Phase 6 验收通过后 flag 默认开 + 旧 module 删除 PR

### Backout
- 任一 phase 出问题：设置 `VITE_TOPIC_WORKBENCH_V1ABC=false` 重启即恢复旧 module
- Phase 6 删除旧 module 后若仍需回滚：从分支 `archive/title-card-management-pre-v1abc` 恢复
