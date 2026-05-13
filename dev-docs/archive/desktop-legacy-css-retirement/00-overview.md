# 00 Overview

## Status
- State: archived
- Next step: 后续若要消除剩余兼容 selector，应在具体 UI surface 重写任务中按 `data-ui` / token / contract 路线处理，不再恢复 renderer legacy CSS 双入口。

## Goal
- 退役 `apps/desktop/src/renderer/styles/**` 与 `apps/desktop/src/renderer/app-layout.css` 这条 renderer legacy CSS 双入口。
- 在不改变现有 UI/UX 的前提下，将既有运行时 CSS 聚合到 `ui/styles/ui.css` 主入口下。
- 收回 UI governance gate 对 renderer legacy styles 目录的临时 exclusion，使桌面 renderer 不再依赖被排除的旧样式目录。

## Non-goals
- 不做视觉重设计。
- 不在本任务中重写每个旧界面的 DOM / selector 语义。
- 不改变 backend / OpenAPI / shared contracts。
- 不把已迁移出的兼容 selector 当作新功能扩展面。

## Context
- 桌面端过去通过 `apps/desktop/src/renderer/app-layout.css` 聚合 legacy feature CSS，并覆盖 shell、文献管理、论文管理与写作中心等现有界面。
- `T-017 frontend-normalizers-and-css-split-wave2` 已把部分历史样式拆成更清晰的聚合入口，但当时目标是维持兼容运行，不是开始退役。
- `T-021 topic-management-workbench-ui` 已把 UI gate 拉绿；本任务进一步收回旧 styles 目录 exclusion。
- 本任务采用“入口退役 + 运行规则迁移”的保守方式：原 CSS 文件移动到 `ui/styles/desktop-runtime/**` 并由 `ui/styles/ui.css` 加载，以保持 UI/UX 不变。

## Acceptance Criteria
- [x] 新 requirement `R-010` 与新任务 `T-022` 已注册到 project hub。
- [x] `apps/desktop/src/renderer/app-layout.css` 已删除，renderer 不再单独导入 legacy CSS 聚合入口。
- [x] `apps/desktop/src/renderer/styles/**` 已移出 renderer 目录，现有运行样式由 `ui/styles/desktop-runtime/**` 经 `ui/styles/ui.css` 加载。
- [x] `ui/config/governance.json` 已收回 `apps/desktop/src/renderer/styles` exclusion。
- [x] 根 `AGENTS.md` 和 UI context 已更新为“禁止重建 legacy renderer styles/app-layout 入口”。
- [x] 不改变现有桌面运行视觉行为。
