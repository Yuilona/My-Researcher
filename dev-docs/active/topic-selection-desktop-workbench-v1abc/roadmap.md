# Topic Selection Desktop Workbench v1a/b/c — Roadmap

## Goal
- 把 `apps/desktop/src/renderer/modules/title-card-management/**` 重写为覆盖 v1a/v1b/v1c 全链路的 reviewer workbench 薄壳，可在桌面端完成所有 human-confirmed 决策点与横切（queue / trace / accepted risk / recheck）的查看与触发。

## Planning-mode context and merge policy
- Runtime mode signal: Unknown
- User confirmation when signal is unknown: not-needed（用户已明确接受非 Plan 模式产出 roadmap）
- Host plan artifact path(s): (none)
- Requirements baseline: (none，需求通过对话收集)
- Merge method: set-union
- Conflict precedence: latest user-confirmed > requirement.md > host plan artifact > model inference
- Repository SSOT output: `dev-docs/active/topic-selection-desktop-workbench-v1abc/roadmap.md`
- Mode fallback used: yes（非 Plan 默认）

## Input sources and usage
| Source | Path/reference | Used for | Trust level | Notes |
|---|---|---|---|---|
| User-confirmed instructions | 本次对话 Q&A | 目标/切片/横切深度/落地档位 | highest | 用户已就 4 个分叉拍板 |
| Archived design spec | `dev-docs/archive/topic-selection-decision-chain-redesign/06-design-spec.md` §3977 起 | UI 框架（Workspace / Decision Review / Queue / Trace / Settings） | high | 设计 SSOT，未被新文档替代 |
| Archived UI baseline | `dev-docs/archive/topic-management-workbench-ui/00-overview.md` | 现有 module 的语义出发点 | medium | 已 archive，仅作语义参考 |
| Backend acceptance | `dev-docs/active/topic-selection-backend-decision-chain-acceptance/` | 已对接的 v1a/b/c authority/workflow 对象清单 | high | 验证后端能力底座已完成 |
| Existing module code | `apps/desktop/src/renderer/modules/title-card-management/**` | 重写起点（将被覆盖） | medium | 7 tab CRUD 壳，仅做向后兼容参考，不沿用 |
| Existing API client | `apps/desktop/src/renderer/literature/shared/api.ts` `requestGovernance` | 网络层复用 | high | 沿用现有 governance 请求工具 |
| Existing tab/shell | `apps/desktop/src/renderer/literature/shared/constants.ts` `titleCardTabs` | Topbar tab 改造起点 | medium | 现 7 tab 将被 stage tab 替换 |
| Model inference | N/A | 填补 SearchPlan/EvidenceMap/Slice 等子组件颗粒度 | lowest | 标注为开放问题 |

## Non-goals
- 不重新设计 v1a/v1b/v1c 后端决策链路 / contract / 数据模型；后端按现状消费。
- 不实现 paper-project 下游执行、写作 agent、experiment automation 的 UI（属于 T-078 / 写作中心范围）。
- 不引入新的视觉系统或 design token，必须沿用现有 `data-ui` + token/contract 主线（`B1-layout-only` 范围内）。
- 不沿用任何 `apps/desktop/src/renderer/styles/**` 旧 compatibility layer。
- 不保留旧的 7 tab CRUD/JSON 编辑器作为运行时入口（删除）；调试改走 OpenAPI/REST 工具。
- 不承诺 SearchPlan / EvidenceMap / ResearchSlice / TopicQuestion 等内容的可视化高保真编辑器深度（v1 默认只读 + 关键字段表单，深度编辑留 v2）。
- 不做"全链路一张大图"作为日常入口（design spec UI 风险边界明确禁止）。

## Open questions and assumptions

### Open questions (answer before execution)
- Q1: Topbar 改造方式 —— 是把现有 `titleCardTabs` 直接替换为 `总揽 / v1a / v1b / v1c` 三段 stage tab + 子 tab，还是保留细粒度 7 tab 并在 Workspace 内分组？(默认推荐前者)
- Q2: "当前题目卡" 选择器在侧边栏的展示形态 —— 简单 dropdown / 题目卡列表面板 / 顶部 breadcrumb？是否随 active title-card 变化触发 governance panel 跟随？
- Q3: Queue Surfaces 的位置 —— 作为 module 内右侧 drawer / 作为 module 内独立 tab（"工作队列"）/ 提升到 Topbar 全局 badge？
- Q4: SearchPlan / EvidenceMap / ResearchSliceOptionSet / TopicQuestionCandidateSet 在 v1 是否需要专门的可视化（如 EvidenceMap 的 claim grid），还是先以结构化 read-only 列表 + JSON drilldown 收口？(默认推荐后者)
- Q5: AcceptedRisk / HumanOverride 的强约束 UI（scope / reason / expiry / recheck condition）在 v1 是否要严格按 design-spec §4040 实现，还是先做最小表单 + 警示文案？
- Q6: PromotionGateCheck 的 readiness / blocker / accepted risk / recheck impact 可视化粒度（design-spec §379）—— 是逐项 check 渲染卡片，还是先 summary + drilldown？
- Q7: 是否在本 v1 内将 negative memory（`CandidateDecisionMemory` / `DecisionMemoryEntry`）作为 reviewer card 的 inline 上下文区段；若是，需要前端额外读哪些 API？
- Q8: 删除现有 module 的回归风险评估 —— 是否需要保留一个旧 module 入口 1 个版本作为应急回滚？(默认推荐 feature-flag `VITE_TOPIC_WORKBENCH_V1ABC` 开关，旧 module 同分支不删但默认关闭。)
- Q9: 路由/状态管理 —— active title-card 是放进 App.tsx 全局 state（沿用 paper_id 模式），还是引入新的 context provider？多 stage 内深链（如直接打开某个 NeedCandidate id）是否需要 URL hash？

### Assumptions (if unanswered)
- A1: 后端 v1a/b/c HTTP 路由已覆盖前端所需的全部 authority/workflow 对象的列表/读取/创建/确认接口；缺失能力在 Phase 0 Discovery 中显式记录并视情况由后端先补。(risk: medium)
- A2: 现有 `requestGovernance` 已可消费所有 `/topic-selection/v1a|v1b|v1c/**` 与 `/title-cards/**` 路由；如鉴权/错误规范不一致，仅做本任务内的薄适配。(risk: low)
- A3: `data-ui` 体系已具备 reviewer card 所需的 badge / drawer / toolbar / grid / pre 等原语；缺位项在 02-architecture 阶段补一份 token 增补清单，不引入新的全局视觉系统。(risk: medium)
- A4: 现有 governance panel (`GovernancePanel`) 不需要为本任务变形，但 active title-card 与 paper_id 上下文需明确切换语义。(risk: low)
- A5: 选题管理模块的多语言/暗色主题沿用现有 theme 体系，不在本任务范围内额外做适配。(risk: low)

## Merge decisions and conflict log
| ID | Topic | Conflicting inputs | Chosen decision | Precedence reason | Follow-up |
|---|---|---|---|---|---|
| C1 | 切片粒度 | "v1a 深做" vs "v1a/b/c 全量薄壳" | 全量薄壳一次铺平 | latest user-confirmed | Phase 划分按 stage |
| C2 | 旧 7 tab CRUD 去留 | 保留 Dev 入口 vs 直接重写 | 直接重写覆盖 | latest user-confirmed | 删除 `TitleCardWorkflowView.tsx` 等旧文件，调试走 OpenAPI |
| C3 | active title-card 选择位置 | sidebar / overview / topbar | sidebar 新增选择器 | latest user-confirmed | 与 paper_id 共存，沿用全局 state 模式 |
| C4 | human confirm 覆盖度 | 仅读/读+写/读+写+confirm | 全 confirm 都进 v1 | latest user-confirmed | Phase 3 集中 confirm UI |
| C5 | 横切对象覆盖度 | 不做 / queue+trace / 全量 panel | 全量 panel/drawer 入口 | latest user-confirmed | Phase 4 集中横切 |

## Scope and impact
- Affected areas/modules:
  - `apps/desktop/src/renderer/modules/title-card-management/**`（重写）
  - `apps/desktop/src/renderer/App.tsx`（active title-card 全局状态、Topbar tab 切换）
  - `apps/desktop/src/renderer/shell/**`（Sidebar 增加题目卡选择器、可能 Topbar tab 重构）
  - `apps/desktop/src/renderer/literature/shared/constants.ts` / `types.ts`（`titleCardTabs` + `TitleCardPrimaryTabKey` 改造）
  - `apps/desktop/src/renderer/literature/shared/api.ts`（按需新增 v1a/b/c 路由的客户端封装；优先沿用 `requestGovernance`）
  - 共享 contracts：仅作为只读消费方，原则上不改 `packages/shared/**`。
- External interfaces/APIs:
  - 消费现有 `/title-cards/**` + `/topic-selection/v1a|v1b|v1c/**` REST 路由；预期不新增。
- Data/storage impact:
  - 无 DB 变更；不触碰 Prisma SSOT。
- Backward compatibility:
  - 现有 governance panel / 文献管理 / 论文管理 / 写作中心模块无破坏性影响；旧 `TitleCardManagementModule` 直接替换。
  - 通过 feature flag `VITE_TOPIC_WORKBENCH_V1ABC`（默认开启）控制新旧 module，留 1 个版本回滚窗口（见 Q8）。

## Consistency baseline for dual artifacts (if applicable)
- [x] Goal is semantically aligned with host plan artifact —— 无 host artifact，goal 与 design-spec §3977 一致。
- [x] Boundaries/non-goals are aligned —— 与 design-spec §4036 UI 风险边界一致。
- [x] Constraints are aligned —— 沿用 `data-ui` + token/contract，无 styles/** 复活。
- [x] Milestones/phases ordering is aligned —— 按 stage（v1a → v1b → v1c）+ 横切 顺序。
- [x] Acceptance criteria are aligned —— v1a 产出 ValidatedNeed 可在前端 human-confirm；v1c 可在前端触发 PaperProjectBridge。
- Intentional divergences:
  - design-spec 提到 v1 不强制 SearchPlan 独立 UI；本 roadmap 把 SearchPlan/EvidenceMap 也纳入薄壳只读层，对齐"全量薄壳"用户决策。

## Project structure change preview (may be empty)

### Existing areas likely to change (may be empty)
- Modify:
  - `apps/desktop/src/renderer/App.tsx`（active title-card 全局状态、Topbar tab 接线）
  - `apps/desktop/src/renderer/shell/components/Sidebar.tsx`（新增"当前题目卡"选择器）
  - `apps/desktop/src/renderer/shell/components/Topbar.tsx`（titleCardTabs 接线，按 stage 重排）
  - `apps/desktop/src/renderer/literature/shared/constants.ts`（`titleCardTabs` / `titleCardSubTabsByTab` 重定义）
  - `apps/desktop/src/renderer/literature/shared/types.ts`（`TitleCardPrimaryTabKey` 与 sub-tab 类型重定义）
  - `apps/desktop/src/renderer/literature/shared/api.ts`（按需补 v1a/b/c client helpers）
- Delete:
  - `apps/desktop/src/renderer/modules/title-card-management/TitleCardOverviewView.tsx`
  - `apps/desktop/src/renderer/modules/title-card-management/TitleCardWorkflowView.tsx`
  - `apps/desktop/src/renderer/modules/title-card-management/utils.ts`（按需替换）
  - `apps/desktop/src/renderer/modules/title-card-management/useTitleCardManagementController.ts`（重写）
  - `apps/desktop/src/renderer/modules/title-card-management/types.ts`（重写，对齐 v1a/b/c 对象模型）
- Move/Rename:
  - `TitleCardManagementModule.tsx` 保留入口名（避免破坏 App.tsx 调用），内部全量重构。

### New additions (landing points) (may be empty)
- New module(s) (preferred):
  - `apps/desktop/src/renderer/modules/title-card-management/views/`（按 stage 拆分：`OverviewView` / `V1aEvidenceToNeedView` / `V1bNeedToDraftTopicView` / `V1cPromotionBridgeView`）
  - `apps/desktop/src/renderer/modules/title-card-management/panels/`（横切 panel：`HumanReviewQueuePanel` / `RecheckQueuePanel` / `BlockerPanel` / `AcceptedRiskPanel` / `TraceDrilldownDrawer`）
  - `apps/desktop/src/renderer/modules/title-card-management/cards/`（reviewer cards：`NeedCandidateCard` / `ValidatedNeedConfirmCard` / `SliceSelectionCard` / `TopicQuestionSelectionCard` / `ValueDispositionCard` / `PromotionDecisionCard` 等）
  - `apps/desktop/src/renderer/modules/title-card-management/api/`（v1a/b/c client 封装层，按 stage 切分文件）
  - `apps/desktop/src/renderer/modules/title-card-management/context/ActiveTitleCardContext.tsx`（active title-card React context；与 App.tsx 全局 state 二选一，Phase 0 决策）
- New interface(s)/API(s) (when relevant):
  - 无新增后端 API；如 Discovery 阶段发现缺口，在 03-implementation-notes 中记录并升级为单独后端任务。
- New file(s) (optional):
  - `apps/desktop/src/renderer/modules/title-card-management/README.md`（模块约定 + 与 design-spec 的映射表，便于后续维护）

## Phases

1. **Phase 0 — Discovery & 信息架构对齐**
   - Deliverable: API 对象/路由清单 ✕ design-spec UI surface 映射表；active title-card 全局状态方案确认；feature flag 命名确认；Q1–Q9 决议。
   - Acceptance criteria: 02-architecture.md 草稿完成；后端缺口若有则形成单独任务条目；Topbar/Sidebar 改造草图（线框）与用户对齐。
2. **Phase 1 — Shell 改造 + active title-card 上下文**
   - Deliverable: 侧边栏题目卡选择器、Topbar 三段 stage tab + sub-tab、`ActiveTitleCardContext`、feature flag 接入；旧 module 在 flag 关闭时可访问，在 flag 开启时被新空骨架替代。
   - Acceptance criteria: `pnpm desktop:dev` 启动后可在两个 module 之间切换；选择 active title-card 后所有 stage tab 都能拿到 id；现有文献/论文/写作模块无回归。
3. **Phase 2 — v1a Evidence-to-Need Surfaces（薄壳读+confirm）**
   - Deliverable: Seed Overview / SearchPlan Panel（只读 + 触发 run）/ EvidenceMap drilldown（按 claim 列表）/ NeedCandidate Review / ValidatedNeed Decision；human-confirm UI 覆盖 ValidatedNeed。
   - Acceptance criteria: 可从空 title-card 经过 v1a 全部步骤产出 human-confirmed ValidatedNeed；回流动作（reject / revise / request search revision）按钮可触发对应后端路由；trace drilldown 可展开 EvidenceUnit/SearchRun。
4. **Phase 3 — v1b Need-to-Draft-Topic Surfaces**
   - Deliverable: ResearchSliceOptionSet 比较视图 + SliceSelectionDecision（human confirm）/ TopicQuestionCandidateSet + QuestionSelectionDecision（human confirm）/ TopicQuestionContract 摘要 / ValueAssessment + ValueDispositionDecision（human confirm）/ TopicPackage(draft) 摘要与 trace。
   - Acceptance criteria: 从 ValidatedNeed 一路到 TopicPackage(draft) 全程可在 UI 完成必需 human confirms；非成功出口（refine_slice / refine_question / recheck / park / drop）按钮可触发。
5. **Phase 4 — v1c Promotion Bridge Surfaces**
   - Deliverable: PromotionDecisionSupport / PromotionGateCheck readiness 视图 / HumanPromotionDecision（含 promote_with_conditions 强制 commitment 字段）/ PromotionCommitmentProfile / PaperProjectBridge 创建与 downstream feedback / recheck 入口。
   - Acceptance criteria: human-confirmed promote 才能成功创建 PaperProjectBridge，UI 明确拒绝缺失前置；commitment profile 字段全部可在 UI 填写；DownstreamFeedback / Recheck 列表可见。
6. **Phase 5 — 横切 panel / drawer 集中**
   - Deliverable: HumanReviewQueue / RecheckQueue / BlockerQueue / AcceptedRiskExpiryQueue 四类队列；TraceDrilldownDrawer（EvidenceUnit → ContentRef → source locator、FunctionalLineageLink、SearchRun provenance、LLMWorkflowRun/AgentReviewSession 摘要）；AcceptedRisk / HumanOverride 强约束表单（scope / reason / expiry / recheck condition）。
   - Acceptance criteria: 每个队列项可打开对应 stage 的 review surface；trace drawer 可在任意 stage 内被打开；AcceptedRisk 创建必须显式 scope+reason+expiry。
7. **Phase 6 — Verification、回归、文档与 flag 收口**
   - Deliverable: 桌面端集成测试或手测脚本；OpenAPI/contract drift 复查；feature flag 切换为默认开 + 旧 module 移除清单（仅在 sign-off 后落地）；README 与 design-spec 映射表归档。
   - Acceptance criteria: 04-verification.md / 05-pitfalls.md 完成；与 T-078 desktop-workbench 在 shell/sidebar 不冲突；用户接受验收。

## Step-by-step plan (phased)
> Keep each step small, verifiable, and reversible.

### Phase 0 — Discovery
- Objective:
  - 把 design-spec UI framework × 后端 v1a/b/c API/对象列表 × 现有 desktop shell 三者对齐，明确 active title-card 上下文、feature flag、Topbar 改造方式与 Q1–Q9 决议。
- Deliverables:
  - `dev-docs/active/topic-selection-desktop-workbench-v1abc/02-architecture.md`（草稿）
  - API ↔ UI 映射表（按 stage × surface 写成表格）
  - 线框草图（Topbar 三段 tab、Sidebar 题目卡选择器、横切 panel 布局）
- Verification:
  - Q1–Q9 全部有显式决议或落入 Assumptions
  - 后端能力缺口（如有）转成单独后端任务条目，roadmap 引用其 ID
- Rollback:
  - N/A（无代码改动）

### Phase 1 — Shell 改造 + active title-card 上下文
- Objective:
  - 让所有 stage tab 共享一个 active title-card 上下文；旧 module 通过 feature flag 兜底。
- Deliverables:
  - `Sidebar` 题目卡选择器 + 加载状态
  - `App.tsx` 与/或 `ActiveTitleCardContext` 提供 active title-card 上下文
  - Topbar `titleCardTabs` 重定义为 `总揽 / v1a 证据-需求 / v1b 切片-题目-价值-方案 / v1c 晋升`（具体命名以 02-architecture 为准）
  - feature flag `VITE_TOPIC_WORKBENCH_V1ABC`；新 module 空骨架；旧 module 在 flag off 时仍可用
- Verification:
  - `pnpm desktop:dev` 启动 / 类型检查通过 / 现有 e2e 或冒烟手测无回归
  - 切换 active title-card 后 stage tab 内拿到正确 id
- Rollback:
  - feature flag 关闭即恢复旧 module；构建 artifact 内旧文件仍在

### Phase 2 — v1a Evidence-to-Need Surfaces
- Objective:
  - 在前端打通 v1a 全部主流程与必需 human confirms。
- Deliverables:
  - Seed Overview 卡（intent / scope / stage / blockers / recheck 状态）
  - SearchPlan 只读 panel + run 触发 + revision 入口
  - EvidenceMap 列表 + EvidenceUnit drilldown（支持 / 反证 / baseline / resource 分组）
  - NeedCandidate reviewer card（unmet mechanism / support / challenge / already-solved risk / coverage gaps）
  - ValidatedNeed decision surface（human confirm + accept risk + block + loopback + park/drop）
  - 回流按钮接线（`ProposeSearchPlanRevision` 等）
- Verification:
  - v1a 集成手测通过：可从空 title-card 走到 human-confirmed ValidatedNeed
  - 至少一组 negative case：already_solved → reject + memory 创建 UI 可触发
- Rollback:
  - feature flag 关闭恢复旧 module；新 v1a 视图独立文件，可一键删除

### Phase 3 — v1b Need-to-Draft-Topic Surfaces
- Objective:
  - 打通 v1b 主链 + 4 处 human confirms。
- Deliverables:
  - ResearchSliceOptionSet 比较视图（option 卡片 + 推荐 + 选择确认）
  - TopicQuestionCandidateSet + QuestionSelectionDecision 表面
  - TopicQuestionContract 摘要 + answerability plan refs
  - ValueAssessment + ValueDispositionDecision（结构化 hard_gates / scored_dimensions / risk_penalty 表单，禁止 raw JSON 编辑）
  - TopicPackage(draft) 摘要 + trace boundary check 提示
- Verification:
  - v1b 集成手测通过：从 ValidatedNeed → TopicPackage(draft) 全程可在 UI 完成
  - 非成功出口（refine_slice / refine_question / recheck_evidence_or_search / park / drop）按钮接线正确
- Rollback:
  - 同 Phase 2

### Phase 4 — v1c Promotion Bridge Surfaces
- Objective:
  - 打通 v1c 主链 + HumanPromotionDecision + PaperProjectBridge 创建。
- Deliverables:
  - PromotionDecisionSupport / PromotionDossier 读视图
  - PromotionGateCheck readiness 卡（trace completeness / boundary consistency / open blocker / accepted risk / recheck impact / narrative consistency）
  - HumanPromotionDecision UI（promote / promote_with_conditions / merge_packages / refine_package / reassess_value / revise_question / revise_slice / recheck_evidence_or_search / park / drop）
  - PromotionCommitmentProfile 表单（scope / claim ceiling / non-negotiable boundaries / accepted risks / required early checks / allowed refinements / stop/reopen conditions）
  - PaperProjectBridge 创建 + downstream feedback / recheck 列表
- Verification:
  - 必须 human-confirmed `promote | promote_with_conditions` 才能创建 PaperProjectBridge，UI 明确拒绝缺失前置
  - 创建 bridge 后能在论文管理模块看到对应 paper_id（与现有论文模块联调）
- Rollback:
  - 同 Phase 2

### Phase 5 — 横切 panel / drawer
- Objective:
  - 落地 Queue + Trace + AcceptedRisk + HumanOverride 横切组件。
- Deliverables:
  - HumanReviewQueue / RecheckQueue / BlockerQueue / AcceptedRiskExpiryQueue 四类队列（默认按风险/阻断排序）
  - TraceDrilldownDrawer（EvidenceUnit → ContentRef → source locator / FunctionalLineageLink / SearchRun provenance / LLMWorkflowRun / AgentReviewSession 摘要 / RecheckEvent）
  - AcceptedRisk / HumanOverride 强约束表单
  - inline blocker / accepted-risk / recheck badge 接入 reviewer cards
- Verification:
  - 每个队列项可跳转到对应 stage review surface
  - trace drawer 可在所有 stage 内打开
  - 创建 AcceptedRisk 时强制 scope+reason+expiry，缺一不可
- Rollback:
  - 横切组件独立目录，删除即恢复无横切版本

### Phase 6 — Verification、回归、flag 收口
- Objective:
  - 收口验证，准备移除 feature flag 与旧 module。
- Deliverables:
  - `04-verification.md`：自动化（typecheck / unit / integration / contract drift）+ 手测脚本
  - `05-pitfalls.md`：记录已知陷阱（如 EvidenceUnit ↔ literature_id 映射 / commitment profile 必填规则）
  - flag 默认开 + 旧 module 移除 PR（拆为独立小 PR，sign-off 后合并）
  - 更新 `.ai/project/main/feature-map.md` 与 `task-index.md`
- Verification:
  - 自动化测试 / pnpm typecheck / 集成测试 / OpenAPI/context drift 检查全部通过
  - 与 T-078 desktop-workbench 联调无冲突（共享 sidebar / shell）
  - 用户接受验收
- Rollback:
  - 旧 module 文件在前 5 个 phase 都保留；Phase 6 移除前再做一次冷备份分支

## Verification and acceptance criteria
- Build/typecheck:
  - `pnpm -w typecheck` / `pnpm --filter @paper-engineering-assistant/desktop typecheck`
  - `pnpm --filter @paper-engineering-assistant/desktop build`
- Automated tests:
  - 复用现有 desktop renderer 单元测试位（如有 `*.test.ts` / `*.spec.ts`），新增覆盖 reviewer card / queue / context provider 的单元测试
  - 后端集成测试不变；如新增 client 封装层，加 contract-shape 单测
- Manual checks:
  - `pnpm desktop:dev` 后走 v1a → v1b → v1c 全流程冒烟脚本
  - 文献管理 / 论文管理 / 写作中心 模块回归点击
- Acceptance criteria:
  - v1a：可在 UI 内 human-confirm ValidatedNeed，回流到 SearchPlan 修订可工作
  - v1b：可在 UI 内 human-confirm SliceSelection / QuestionSelection / ValueDisposition；非成功出口按钮全部接线
  - v1c：可在 UI 内 human-confirm PromotionDecision 并创建 PaperProjectBridge；CommitmentProfile 字段强校验
  - 横切：4 类队列可用；TraceDrilldown 可打开；AcceptedRisk 必填项强校验
  - 旧 7 tab CRUD 视图与 raw JSON 表单已删除
  - 与 design-spec §3977 起的 UI 框架语义一致

## Risks and mitigations
| Risk | Likelihood | Impact | Mitigation | Detection | Rollback |
|---|---:|---:|---|---|---|
| 后端能力存在隐藏缺口（如某些 negative memory / recheck 接口未暴露） | medium | high | Phase 0 Discovery 强制做映射表，缺口转后端任务 | typecheck/集成测试报错；UI 占位卡 | 缺口未补前用 placeholder + 明显警告 badge |
| 全量薄壳粒度失控（每个对象都要 5 个字段编辑） | high | medium | 每 stage 严格按"读+必要 confirm+回流按钮"收口；深度编辑器留 v2 | code review 检查 reviewer card 行数与字段数 | 单 stage 独立目录，可逐 stage 退回旧 module |
| `data-ui` 体系缺乏 reviewer card 所需原语（drawer / queue list / split panel） | medium | medium | 02-architecture 阶段先做 token / data-ui 增补清单，复用现有；不引入新视觉系统 | `pnpm desktop:dev` 视觉冒烟 | 缺位 token 不上线，相关 surface 暂用现有 card 替代 |
| active title-card 上下文与现有 paper_id 上下文交互冲突 | medium | medium | Phase 1 显式定义二者语义边界并写入 02-architecture | governance panel / 论文管理点击回归 | feature flag 关闭 |
| 与 T-078 experiment-foundation-desktop-workbench 同时修 Sidebar/Topbar 造成冲突 | medium | medium | Phase 0 与 T-078 owner 对齐 Sidebar/Topbar 改造接口 | git 冲突 / typecheck | T-078 优先合入后我方 rebase |
| human-confirm UI 退化为"继续"按钮（design-spec §4039 明确禁止） | high | high | reviewer card 模板强制 5 段：结论 / 证据 / 反证 / blocker+risk / next actions | code review checklist | 不通过 review 不合并 |

## Optional detailed documentation layout (convention)
```
dev-docs/active/topic-selection-desktop-workbench-v1abc/
  roadmap.md              # 本文件 — 宏观规划
  00-overview.md          # 目标 / 非目标 / 范围
  01-plan.md              # Phases 拆解与里程碑
  02-architecture.md      # 信息架构、组件分层、API ↔ UI 映射表、line wire frame
  03-implementation-notes.md  # 执行偏差与决策日志
  04-verification.md      # 自动化 / 手测脚本 / 验收结论
  05-pitfalls.md          # 已知陷阱
```

## To-dos
- [ ] 与用户确认 Q1–Q9，沉淀到 02-architecture / 03-implementation-notes
- [ ] 与 T-078 desktop-workbench owner 对齐 Shell 共享改造接口
- [ ] 后端 API ↔ UI surface 映射表完成（Phase 0）
- [ ] feature flag 命名与默认值在 02-architecture 落地
- [ ] 是否触发 `create-dev-docs-plan` 创建完整 dev-docs 包（建议触发，理由：跨多 session、跨横切、依赖与 T-078 协调）
