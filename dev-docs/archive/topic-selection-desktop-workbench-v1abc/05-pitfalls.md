# 05 Pitfalls (do not repeat)

This file exists to prevent repeating mistakes within this task.

## Do-not-repeat summary (keep current)
- 不要让 human-confirmed reviewer card 退化为单按钮 confirm（design-spec §4039 红线）。
- 不要让用户填 raw JSON 表示 hard_gates / scored_dimensions / risk_penalty / CommitmentProfile；必须结构化。
- 不要复活 `apps/desktop/src/renderer/styles/**` 旧 compatibility layer；新代码走 `data-ui` + token/contract（AGENTS.md "Desktop UI Freeze"）。
- 不要在前端绕过后端 gate（即便前端校验失败也不能 patch 出 bypass 路径）。
- 不要在模块内部直接 import `prisma/` 或后端服务文件。
- 不要把 active title-card 与 paper_id 上下文混淆；它们语义不同，governance panel 跟随策略需明确。
- 不要为每个 v1a/b/c 对象起独立全屏页面（design-spec §4036 风险边界）。
- 不要在 v1 引入 URL hash 深链；当前 shell 不依赖路由。

## Pitfall log (append-only)

<!-- 执行期间累积；每条按以下模板：
### YYYY-MM-DD - 简短标题
- Symptom:
- Context:
- What we tried:
- Why it failed (or current hypothesis):
- Fix / workaround (if any):
- Prevention (how to avoid repeating it):
- References (paths/commands/log keywords):
-->
