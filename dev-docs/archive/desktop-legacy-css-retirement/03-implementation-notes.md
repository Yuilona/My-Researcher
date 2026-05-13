# 03 Implementation Notes

## Initial decisions
- 决定新建 `R-010 / T-022`，而不是继续把 legacy CSS 退役工作混入 `T-021`。
- 决定把 `apps/desktop/src/renderer/styles/**` 的官方身份固定为 frozen legacy compatibility layer。
- 决定 `app-layout.css` 继续作为唯一 legacy 聚合入口，直到后续迁移波次逐步删除 import。
- 决定本 tranche 只做“声明边界 + 硬冻结”，不做视觉迁移和样式删除。
- 决定冻结规则以“文档 + 治理口径”落地，不在本 tranche 引入 diff-based CI 阻断器。

## Final migration decisions
- 决定用保守迁移完成 T-022：不改 DOM 与 selector，不改变现有 UI/UX，只移动 CSS 所在层级和导入入口。
- 将原 `apps/desktop/src/renderer/styles/**` 内容移动到 `ui/styles/desktop-runtime/**`。
- 新增 `ui/styles/desktop-runtime/index.css` 作为 desktop runtime compatibility bundle。
- `ui/styles/ui.css` 负责导入该 bundle；`apps/desktop/src/renderer/main.tsx` 不再导入 `app-layout.css`。
- 删除 `apps/desktop/src/renderer/app-layout.css` 与 renderer-local `styles` 目录。
- 从 `ui/config/governance.json` 收回 `apps/desktop/src/renderer/styles` exclusion。
- 修正 `apps/desktop/scripts/smoke-e2e.mjs` 的种子请求：`POST /paper-projects` 已以 `title_card_id` 作为 canonical origin，smoke 脚本不再发送旧的 `topic_id`。

## Dependency notes
- 依赖 `T-017 frontend-normalizers-and-css-split-wave2` 提供的历史聚合边界。
- 依赖 `T-021 topic-management-workbench-ui` 已完成的 desktop renderer gate coverage 与 legacy styles exclusion。
- 后续若要消除剩余兼容 selector，应归入对应 UI surface 的 `data-ui` 重写任务，而不是恢复 renderer legacy CSS 目录。

## Tranche notes
- 最终实现边界是：
  - 新 requirement / task 注册
  - repo docs / UI context / README / AGENTS 统一口径
  - renderer legacy CSS 双入口删除
  - 运行时 CSS 改由 `ui/styles/ui.css` 聚合
  - governance exclusion 收回
- 明确保留的非目标是：
  - 视觉重设计
  - 大规模修改 selector / class 语义
  - 把每个旧界面一次性重写为 `data-ui`
