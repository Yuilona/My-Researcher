# 02 Architecture

## Context & current state
- 后端：`apps/backend/src/routes/topic-selection-{v1a,v1b,v1c}-routes.ts` + `apps/backend/src/services/topic-selection-*.ts` + Prisma SSOT + `docs/context/api/openapi.yaml`，决策链全部具备能力底座（参见 T-068 acceptance）。
- 桌面端：`apps/desktop/src/renderer/modules/title-card-management/**` 是 T-021 archived 留下的 7 tab CRUD/JSON 壳，对接旧 `/title-cards/{id}/{needs|research-questions|value-assessments|packages|promotion-decisions}` 简化路由。
- 设计 SSOT：`dev-docs/archive/topic-selection-decision-chain-redesign/06-design-spec.md` §3977 起。
- UI 风格约束：`AGENTS.md` 中"Desktop UI Freeze (MUST)" — `data-ui` + token/contract，Tailwind 限 `B1-layout-only`，禁止复活 `apps/desktop/src/renderer/styles/**`。

## Proposed design

### Components / modules
- **Shell 层**
  - `apps/desktop/src/renderer/shell/components/Sidebar.tsx`：新增"当前题目卡"选择器（下拉 + 加载态 + 空态 + 与 paper_id 共存）
  - `apps/desktop/src/renderer/shell/components/Topbar.tsx`：`titleCardTabs` 改造为 `总揽 / v1a / v1b / v1c`
  - `apps/desktop/src/renderer/App.tsx`：托管 `ActiveTitleCardContext.Provider`；接 feature flag `VITE_TOPIC_WORKBENCH_V1ABC`
- **模块层**：`apps/desktop/src/renderer/modules/title-card-management/`
  - `TitleCardManagementModule.tsx`：入口（保留文件名以兼容 App.tsx 调用），内部全量重写
  - `context/ActiveTitleCardContext.tsx`：选中题目卡 id / detail / refresh / 切换
  - `views/`：`OverviewView.tsx` / `V1aEvidenceToNeedView.tsx` / `V1bNeedToDraftTopicView.tsx` / `V1cPromotionBridgeView.tsx`
  - `cards/`：reviewer cards（详见 01-plan.md）
  - `panels/`：横切 panel（HumanReviewQueue / RecheckQueue / BlockerQueue / AcceptedRiskExpiryQueue / EvidenceMapPanel / DownstreamFeedbackPanel / RecheckImpactPanel）
  - `drawer/`：`TraceDrilldownDrawer.tsx`
  - `api/`：v1a / v1b / v1c client 封装（沿用 `requestGovernance`）
  - `hooks/`：`useTitleCardList` / `useV1aStageData` / `useV1bStageData` / `useV1cStageData` / `useQueues` / `useTrace`

### Interfaces & contracts

#### 复用现有后端 REST（无新增）
基础路径前缀：`/title-cards/{title_card_id}/topic-selection/v1a|v1b|v1c/...`（具体路径在 Phase 0 Discovery 通过 `docs/context/api/api-index.json` 锁定，缺口补到下表）。

**v1a authority / workflow 对象**
| UI Surface | 主要对象 | 备注 |
|---|---|---|
| Seed Overview | `TopicSeed` / TitleCard intent | 只读 |
| SearchPlan Panel | `SearchPlan` / `SearchRun` | 创建/编辑可触发 run；接收 `ProposeSearchPlanRevision` |
| EvidenceMap Drilldown | `EvidenceMap` / `EvidenceUnit` / `ContentRef` | 仅展示 + drilldown |
| NeedCandidate Review | `NeedCandidate` / `ValidationDecisionSupportPacket` | reject / revise / request search revision |
| ValidatedNeed Decision | `ValidatedNeed` / `ValidateNeedAdjudicationResult` / `HumanConfirmedDecision` | 必须 human-confirmed |
| Decision Memory | `CandidateDecisionMemory` / `DecisionMemoryEntry` | inline 上下文区段；可单独 panel |

**v1b authority / workflow 对象**
| UI Surface | 主要对象 | 备注 |
|---|---|---|
| ResearchSlice 选项比较 | `PlanResearchSliceRun` / `ResearchSliceOptionSet` / `ResearchSliceOption` | 推荐 + 选择 confirm |
| Slice 选择决议 | `SliceSelectionDecision` / `SliceSelectionReviewSession` | human-confirmed |
| Slice authority | `ResearchSlice` | 只读快照 |
| Question candidate | `FormTopicQuestionRun` / `TopicQuestionCandidateSet` / `TopicQuestionCandidate` | 比较 + 选择 |
| Question 选择决议 | `TopicQuestionSelectionDecision` / `QuestionFormationReviewSession` | human-confirmed |
| Question contract | `TopicQuestion` / `TopicQuestionContract` | 只读 |
| Value 评估 | `TopicValueAssessment` + `ValueReasoningMemo` | hard_gates / scored_dimensions / risk_penalty 结构化表单 |
| Value disposition | `ValueDispositionDecision` | human-confirmed；advance_to_package / refine / park / drop |
| Topic package | `TopicPackage(draft)` | trace boundary check 展示 |

**v1c authority / workflow 对象**
| UI Surface | 主要对象 | 备注 |
|---|---|---|
| Promotion 输入 | `PromotionInputSnapshot` / `PromotionDecisionSupport` / `PromotionDossier` | 只读 |
| Gate check | `PromotionGateCheck` / `ArgumentReadinessMiniCheck` / `PackageTraceBoundaryCheck` | 逐项 pass/fail |
| Human 决议 | `HumanPromotionDecision` / `PromotionDecision` | human-confirmed |
| Commitment | `PromotionCommitmentProfile` | 7 字段强校验 |
| Bridge | `PaperProjectBridge` | 仅 promote/promote_with_conditions 才创建 |
| Downstream | `DownstreamFeedback` / `RecheckEvent` / `RecheckImpact` / `RecheckResolution` | append-only |

**横切对象**
- `AcceptedRisk`（scope / reason / expiry / recheck condition）
- `HumanOverride`（scope / reason / expiry / accepted risk ref）
- `BlockerPolicy` 当前生效状态
- `ChainTransitionAttempt` 历史
- `LLMWorkflowRun` / `AgentReviewSession` / `ArtifactRef` 摘要（trace drawer 内）

#### Data models / schemas
- 不动 `prisma/schema.prisma`；不动 `packages/shared/**` contracts。
- 前端 TypeScript 类型：从 `docs/context/api/openapi.yaml` + `docs/context/db/schema.json` 抽取、声明在 `modules/title-card-management/types/` 下；严格只读复用，不复制语义。

#### Events / jobs
- 不引入新 event。前端通过 `requestGovernance` 同步触发；后端原有事件投递不变。

### Boundaries & dependency rules
- **Allowed dependencies**：
  - 模块内 → `literature/shared/api.ts`（`requestGovernance`）
  - 模块内 → `literature/shared/types.ts`（公用 UI 类型）
  - 模块内 → `shell/components/*`（仅 Sidebar/Topbar 接线，反向不依赖模块内部）
  - reviewer card → 模块 `api/` 与 `hooks/`
- **Forbidden dependencies**：
  - 不依赖 Prisma / 后端服务文件
  - 不依赖 `literature/**` 业务逻辑（除 shared 工具外）
  - reviewer card / panel 之间不直接相互导入，必要 cross-stage 跳转通过 context + tab 路由

## Data migration (if applicable)
- N/A：不涉及 DB / contract 迁移。
- 仅前端文件结构迁移：旧 `TitleCardOverviewView.tsx` / `TitleCardWorkflowView.tsx` / `useTitleCardManagementController.ts` / `types.ts` / `utils.ts` 在 Phase 6 前 feature flag off 兜底，Phase 6 移除。

## Non-functional considerations
- **Security/auth/permissions**：沿用 `requestGovernance` 现有鉴权；不暴露任何新身份/凭据。CommitmentProfile 类强校验在前端做，但后端依然是 SoT，前端校验失败不能绕过后端 gate。
- **Performance**：
  - active title-card 切换时按 stage 懒加载（不在 module mount 时一次性拉全部 v1a/b/c 数据）
  - 队列 panel 默认 25 条分页 + 服务端排序参数
  - EvidenceMap / Trace drawer 按需打开，drilldown 用懒加载
- **Observability**：
  - 沿用现有 `pushLiteratureFeedback`-style 顶部反馈
  - 关键 human-confirm 动作在前端打 console + 通过 governance event delivery 后端记录（不需要前端新增 telemetry）

## Phase 0 Discovery 发现与决议

### Discovery: 后端 GET 列表能力缺口（关键）
现有 v1a/v1b/v1c 路由几乎全是 POST 创建动作，**缺乏"按 title-card 列出该 stage authority/workflow 对象"的 list endpoint**：

| stage | 当前可用 GET | UI 需要但缺失 |
|---|---|---|
| v1a | `work-queue/open` + 各 by-id + `coverage-matrix` + `need-validation-bundle` | list-by-titleCard：SearchPlan / SearchRun / EvidenceMap / NeedCandidate / ValidatedNeed |
| v1b | `topic-packages/:id` + offline-evaluation | list-by-titleCard：IntakeSnapshot / ResearchConstraintProfile / SliceOptionSet / SliceSelectionDecision / QuestionCandidateSet / QuestionSelectionDecision / ValueAssessment / ValueDisposition / TopicPackage(draft) |
| v1c | dossier / decision / bridge / feedback / recheck by-id | list-by-titleCard：PromotionInputSnapshot / DecisionSupport / GateCheck / HumanPromotionDecision / PromotionDecision / CommitmentProfile / PaperProjectBridge |

**决议（D1）**：本 UI 任务允许同步补**纯只读** GET list endpoints，不动 service 业务逻辑/contract。每个 endpoint 形如：

```
GET /topic-selection/v1a/title-cards/:titleCardId/search-plans
GET /topic-selection/v1a/title-cards/:titleCardId/evidence-maps
GET /topic-selection/v1a/title-cards/:titleCardId/need-candidates
GET /topic-selection/v1a/title-cards/:titleCardId/validated-needs
GET /topic-selection/v1b/title-cards/:titleCardId/intake-snapshots
GET /topic-selection/v1b/title-cards/:titleCardId/research-slice-option-sets
GET /topic-selection/v1b/title-cards/:titleCardId/topic-question-candidate-sets
GET /topic-selection/v1b/title-cards/:titleCardId/topic-value-assessments
GET /topic-selection/v1b/title-cards/:titleCardId/topic-packages
GET /topic-selection/v1c/title-cards/:titleCardId/promotion-decisions
GET /topic-selection/v1c/title-cards/:titleCardId/paper-project-bridges
```

实现策略：在对应 service 层加 `listByTitleCardId(titleCardId)` 只读包装；route 仅做参数校验 + service 调用 + DTO 投影；不写 Prisma 查询新逻辑（复用仓储的现有过滤）。OpenAPI / api-index 自动 drift。

### Discovery: `data-ui` contract 缺位原语
现有 contract：`alert / badge / button / card / divider / empty-state / field / form / grid / icon-button / input / link / list / modal / page / section / select / stack / tab / table / tabs / text / textarea / toolbar`。

**决议（D2'，修订 D2）**：本任务**不扩 contract**（避免 `ui-governance-gate` RFC + approval workflow 与本轮节奏冲突），4 个缺位原语用现有 role 组合实现：

| 缺位 | 用现有 role 实现 | 备注 |
|---|---|---|
| drawer | `modal` + B1 layout-only Tailwind 定位为右侧全高 | 折叠态用 `badge` 计数代偿"始终可见" |
| split-pane | `grid cols=2` + 双 `card` | 等价 |
| timeline | `list variant=rows` + `divider` + `badge` | 等价 |
| stepper | `tabs` + 数字 `badge` | 等价 |

Follow-up：v2 评估走 `ui-governance-gate` RFC 升级到真原语。

### 决议（D3）：Topbar 二级 tab
- 一级：`总揽 / v1a 证据-需求 / v1b 切片-题目-价值-方案 / v1c 晋升`
- 二级（动态按 stage 变化）：
  - 总揽：单层，无 sub-tab
  - v1a：`Seed / SearchPlan / EvidenceMap / NeedCandidate / ValidatedNeed`
  - v1b：`Slice / Question / Value / Package`
  - v1c：`GateCheck / Decision / Commitment / Bridge / Downstream`

类型重构方向：`TitleCardPrimaryTabKey = 'overview' | 'v1a' | 'v1b' | 'v1c'`；sub-tab 类型按 stage 分组。

### 决议（D4）：Queue 位置
模块内**右侧常驻 drawer**，4 类队列以 drawer 内 tabs 切换；active title-card 变化时跟随。drawer 自身可折叠，折叠时仅显示 4 个 badge 计数。

### 仍待 Phase 0 收口的开放问题（合并到下一轮 Q）
- O-Q2：active title-card 全局 state 放 `App.tsx` 还是模块内 context（影响其他模块是否能消费）
- O-Q4：EvidenceMap / SliceOptionSet / QuestionCandidateSet 可视化深度（是否做比较表/grid）
- O-Q5：AcceptedRisk / HumanOverride 强约束 UI（是否 v1 全字段强校验）
- O-Q6：PromotionGateCheck 渲染粒度（逐项卡 vs summary+drilldown）
- O-Q7：Negative memory（CandidateDecisionMemory）是否在 v1 作为 reviewer card inline 上下文
- O-Q8：feature flag 默认值（dev 开/prod 灰度 vs 全开）
- O-Q9：URL hash 深链 v1 是否引入
