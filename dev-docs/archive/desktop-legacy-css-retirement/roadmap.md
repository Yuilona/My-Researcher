# Desktop Legacy CSS Retirement Roadmap

## Decision
- Requirement + task: `R-010` + `T-022 desktop-legacy-css-retirement`
- Mapping: `M-001 > F-002 > R-010`
- Final goal: 退役 `apps/desktop/src/renderer/styles/**` 与 `apps/desktop/src/renderer/app-layout.css`，同时不改变现有 UI/UX。

## Why this is a separate task
- `T-017 frontend-normalizers-and-css-split-wave2` 完成了历史 CSS 聚合/拆分，但没有定义退役主权与冻结规则。
- `T-021 topic-management-workbench-ui` 负责把 UI gate 拉绿与覆盖 desktop renderer，不再承担 legacy CSS 的长期治理。
- T-022 负责删除 renderer-local legacy CSS 双入口，并收回 gate exclusion。

## Completed phases
1. Requirement/task bootstrap and governance mapping
2. Legacy compatibility layer declaration and freeze
3. CSS runtime relocation to `ui/styles/desktop-runtime/**`
4. `app-layout.css` and renderer `styles/**` deletion
5. Governance exclusion removal
6. Final verification and archive handoff

## Remaining non-blocking convergence
- `ui/styles/desktop-runtime/**` 中仍有兼容 selector，用于保持现有 UI/UX。
- 这些 selector 不阻塞 T-022 归档；后续应在对应 UI surface 的 `data-ui` 重写任务中逐步删除。

## Rollback
- 若迁移造成构建或视觉回归，恢复方式是重新引入 `ui/styles/desktop-runtime/index.css` 中的对应 import 或还原移动前 CSS 文件内容。
- 不应恢复 `apps/desktop/src/renderer/app-layout.css` 或 `apps/desktop/src/renderer/styles/**` 作为长期入口。
