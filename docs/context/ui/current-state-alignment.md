# UI Current-State Alignment (desktop-runtime-current-first)

## 结论（当前执行口径）

- 本仓库 UI 文档采用 `desktop-runtime-current-first`。
- 当前执行以 `effective_profile=desktop-hybrid-v1` 为准，目标治理以 `target_profile=b1-token-only-target` 为准。
- `T-022` 已退役 renderer-local legacy CSS 双入口；剩余兼容 selector 只作为运行时兼容层存在于 `ui/styles/desktop-runtime/**`。

## 当前实现事实（as-is）

1. 运行时栈
   - 桌面壳层：Electron。
   - 渲染层：React + Vite + TypeScript。
2. 样式来源
   - 全局入口：`ui/styles/ui.css`。
   - token/contract：`ui/styles/tokens.css`、`ui/styles/contract.css`。
   - desktop runtime compatibility bundle：`ui/styles/desktop-runtime/index.css`。
   - `apps/desktop/src/renderer/app-layout.css` 与 `apps/desktop/src/renderer/styles/**` 不再存在。
3. 主题机制
   - 主题模式：`system | light | dark`。
   - 解析主题：`morethan.light | morethan.dark`。
   - 生效方式：`document.documentElement[data-theme]`。
4. 桌面启动行为
   - dev 启动时窗口初始隐藏。
   - 用户点击 Dock/桌面应用图标后，窗口居中并聚焦显示。
5. 治理面板开关
   - 环境变量：`VITE_ENABLE_GOVERNANCE_PANELS=1` 可默认开启。
   - 不设置时默认关闭，可在 UI 会话内临时切换。
6. 样式分层现状
   - `ui/styles/ui.css` 承载 reset、token、contract 与 desktop runtime compatibility bundle。
   - `ui/styles/desktop-runtime/**` 继续覆盖 shell、literature overview、auto import、manual import、paper/writing 等旧界面簇，以保持当前 UI/UX 不变。

## 目标治理口径（to-be）

1. Tailwind 维持 `B1-layout-only`。
2. 主题维持 `token-only`。
3. 新 UI 回到 `data-ui` / token / contract 主线，不得恢复 renderer-local legacy CSS 双入口。
4. 后续旧界面重写时，逐步删除 `ui/styles/desktop-runtime/**` 中对应 selector。
5. UI governance gate 覆盖 desktop renderer，且不再需要 `apps/desktop/src/renderer/styles` exclusion。

## 偏差清单（含证据）

1. D-001 Runtime compatibility selectors still power pre-data-ui screens（高）
   - 证据：`ui/styles/desktop-runtime/index.css`、`ui/styles/desktop-runtime/README.md`
   - 影响：当前可运行且 UI/UX 不变，但旧界面仍未全部改写为 contract/token 主线。
   - 后续入口：在对应 UI surface 的迁移任务中删除或替换 selector；不要恢复 `app-layout.css` 或 renderer `styles/**` 目录。

## 验证命令（可复现）

```bash
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs touch --repo-root /Volumes/DataDisk/Project/My-Researcher
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict --repo-root /Volumes/DataDisk/Project/My-Researcher

test ! -e /Volumes/DataDisk/Project/My-Researcher/apps/desktop/src/renderer/app-layout.css
test ! -e /Volumes/DataDisk/Project/My-Researcher/apps/desktop/src/renderer/styles

rg -n "app-layout\\.css|apps/desktop/src/renderer/styles" \
  /Volumes/DataDisk/Project/My-Researcher/apps/desktop/src/renderer \
  /Volumes/DataDisk/Project/My-Researcher/ui/config/governance.json

python3 /Volumes/DataDisk/Project/My-Researcher/.ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run \
  --repo-root /Volumes/DataDisk/Project/My-Researcher \
  --run-id t022-retirement-final \
  --evidence-root /Volumes/DataDisk/Project/My-Researcher/.ai/.tmp/ui \
  --mode full
```

## 收敛建议（仅建议，不在本任务实施）

1. 后续旧界面改造按 `shell -> paper/writing -> literature overview -> auto import -> manual import` 的顺序拆分。
2. 每完成一个 surface 的 `data-ui` 重写，删除 `ui/styles/desktop-runtime/**` 中对应 selector。
3. 新功能继续走 `data-ui` / token / contract 主线，不向 compatibility bundle 添加新语义。
