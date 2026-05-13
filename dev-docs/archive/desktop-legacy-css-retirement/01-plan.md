# 01 Plan

## Phases
1. Requirement/task bootstrap and ownership reset
2. Declare and freeze the renderer-local legacy CSS layer
3. Retire renderer-local CSS entrypoints without UI/UX changes
4. Remove governance exclusion
5. Final verification and archive handoff

## Completed steps
- Phase 1:
  - 在 `.ai/project/main/registry.yaml` 新增 `R-010 Desktop legacy CSS retirement and governance freeze`。
  - 创建 `dev-docs/active/desktop-legacy-css-retirement/` 任务包，并通过 governance sync 生成 `T-022`。
  - 明确 `T-017` 是历史前置拆分任务，`T-021` 不再承担 legacy CSS 退役主权。
- Phase 2:
  - 在根 `AGENTS.md`、UI context 与任务文档中写清旧路径的冻结和退役口径。
  - 明确新 UI 继续走 `data-ui` / token / contract / Tailwind `B1-layout-only`。
- Phase 3:
  - 将原 `apps/desktop/src/renderer/styles/**` 内容移动到 `ui/styles/desktop-runtime/**`。
  - 新增 `ui/styles/desktop-runtime/index.css`，保持原 CSS 聚合顺序。
  - 通过 `ui/styles/ui.css` 加载 desktop runtime compatibility bundle。
  - 删除 `apps/desktop/src/renderer/app-layout.css`，并移除 `apps/desktop/src/renderer/main.tsx` 对它的导入。
- Phase 4:
  - 从 `ui/config/governance.json` 删除 `apps/desktop/src/renderer/styles` exclusion。
  - 更新 UI context，记录剩余兼容 selector 的真实位置和后续收敛方式。
- Phase 5:
  - 跑 desktop typecheck/build、UI gate、UI suite、project governance sync/lint。
  - 验证旧 renderer CSS 入口不存在，且没有活动代码继续引用。

## Deliverables
- `apps/desktop/src/renderer/app-layout.css` 删除。
- `apps/desktop/src/renderer/styles/**` 删除。
- `ui/styles/desktop-runtime/**` 保存当前运行所需兼容 CSS，避免 UI/UX 改动。
- `ui/styles/ui.css` 成为 desktop renderer 唯一样式入口。
- `ui/config/governance.json` 不再保留旧 styles 目录 exclusion。
- T-022 文档标记为 done，等待归档。

## Acceptance
- [x] `R-010` / `T-022` 已可在 project hub 中看到。
- [x] renderer-local legacy CSS 双入口已退役。
- [x] 现有视觉规则迁移后仍按原顺序加载。
- [x] 新开发规则固定为不能恢复旧入口，必须走 `data-ui` / token / contract。
- [x] 最终验证通过后归档。
