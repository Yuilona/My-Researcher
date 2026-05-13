# 02 Architecture

## Purpose
- 退役 desktop renderer legacy CSS 的本地入口，并把仍需维持现有视觉的兼容规则收口到 `ui/styles/ui.css` 入口下。

## Current-state architecture
- 运行时样式来源统一从 `ui/styles/ui.css` 进入：
  - contract/token layer: `ui/styles/tokens.css`、`ui/styles/contract.css`
  - desktop runtime compatibility bundle: `ui/styles/desktop-runtime/index.css`
- runtime compatibility bundle 当前仍覆盖这些界面簇：
  - `shell/*`
  - `literature-overview`
  - `literature-auto-import/*`
  - `literature-manual-import/*`
  - `modules-paper-writing`

## Retired renderer-local entry
- `apps/desktop/src/renderer/app-layout.css` 已删除。
- `apps/desktop/src/renderer/styles/**` 已移出 renderer 目录。
- `apps/desktop/src/renderer/main.tsx` 只导入 `ui/styles/ui.css`。
- 兼容 selector 的职责只有一个：在具体旧界面完成 `data-ui` 重写前维持当前 UI/UX。

## Hard-freeze rules
- 新功能、新模块不得恢复 `apps/desktop/src/renderer/styles/**` 或 `apps/desktop/src/renderer/app-layout.css`。
- 新 UI 必须优先使用：
  - `data-ui`
  - `ui/styles` token/contract
  - Tailwind `B1-layout-only`
- 若旧界面确需修改，应优先将修改归类为 selector 删除或 `data-ui` 迁移，而不是向 `ui/styles/desktop-runtime/**` 继续追加新规则。

## Ownership boundary
- `T-017`:
  - 历史前置拆分任务，已完成
  - 不再承担 retirement owner 角色
- `T-021`:
  - 负责 topic/title-card 工作台与 UI gate 覆盖修复
  - 不再承担 legacy CSS 退役主权
- `T-022`:
  - 完成 renderer-local legacy CSS 入口退役
  - 负责 import 删除、目录移除与 governance exclusion 收回

## Suggested future selector retirement order
- Wave A: `shell/*`
- Wave B: `modules-paper-writing.css`
- Wave C: `literature-overview.css`
- Wave D: `literature-auto-import/*`
- Wave E: `literature-manual-import/*`

## End-state definition
- `app-layout.css` 不存在。
- `apps/desktop/src/renderer/styles/**` 不存在。
- `ui/config/governance.json` 不再对 renderer styles 目录保持 exclusion。
- 剩余兼容 selector 只保留在 `ui/styles/desktop-runtime/**`，等待各 UI surface 后续按 contract/token 主线重写时删除。
