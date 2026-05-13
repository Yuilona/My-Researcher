# 05 Pitfalls

## Resolved risks

### P-001 Exception drift can be mistaken for compliance
- Symptom:
  - 团队把 `apps/desktop/src/renderer/styles` exclusion 误当成“旧 CSS 已合规”。
- Root cause:
  - UI gate 早期通过 exclusion 避开 legacy CSS 存量，而不是证明旧层已经迁移完成。
- What changed:
  - T-022 删除了 renderer-local `styles/**` 目录，并从 `ui/config/governance.json` 收回该 exclusion。
- Prevention:
  - 不再恢复 renderer-local legacy CSS 目录；剩余兼容 selector 只允许随对应 UI surface 重写逐步删除。

### P-002 Frozen layer can silently become the default escape hatch again
- Symptom:
  - 新模块或新需求又开始往旧样式目录里追加 class 和视觉规则。
- Root cause:
  - 若没有明确 owner 和硬冻结规则，legacy 层会重新变成默认扩展面。
- What changed:
  - 根 `AGENTS.md` 明确禁止重建 `apps/desktop/src/renderer/styles/**` 和 `apps/desktop/src/renderer/app-layout.css`。
- Prevention:
  - 新 UI 必须走 `data-ui` / token / contract；旧界面改动优先删除或替换 `ui/styles/desktop-runtime/**` 中的兼容 selector。

### P-003 app-layout.css can hide dependency sprawl
- Symptom:
  - 开发者以为自己没有直接 import legacy CSS，但实际上仍通过 `app-layout.css` 间接依赖这层。
- Root cause:
  - `app-layout.css` 是历史兼容聚合入口，隐含覆盖范围较大。
- What changed:
  - `app-layout.css` 已删除，desktop renderer 只导入 `ui/styles/ui.css`。
- Prevention:
  - 保持单入口；任何新样式入口都必须先更新 UI context 与 governance 文档。
