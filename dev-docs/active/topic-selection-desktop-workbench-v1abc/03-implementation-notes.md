# 03 Implementation Notes

## Status
- Current status: `planned`
- Last updated: 2026-05-19

## What changed
- 2026-05-19：创建 dev-docs 包；roadmap / 00–05 文档骨架就位；T-087 在 registry 中已存在但 feature/milestone 错挂 F-000/M-000，将通过 `ctl-project-governance.mjs map` 重定位到 F-001/M-001/R-009。

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

## Deviations from plan
- (none yet)

## Known issues / follow-ups
- T-087 在 registry 当前位于 F-000/M-000，需要通过 `ctl-project-governance.mjs map` 移至 F-001/M-001/R-009 并跑 sync。
- Phase 0 Discovery 期间需要与 T-078 owner 对齐 Sidebar/Topbar 共享改造接口，避免合并冲突。
- 后端能力缺口（如有）需要在 Phase 0 映射表完成后转为单独后端任务（slug 待定）。

## Pitfalls / dead ends (do not repeat)
- 详见 `05-pitfalls.md`（append-only）。
