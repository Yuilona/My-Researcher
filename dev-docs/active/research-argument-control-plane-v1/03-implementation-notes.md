# 03 Implementation Notes

## Initial decisions
- 决定新建 `R-011`，而不是把该框架继续并入 `R-009`。
- 决定采用 umbrella task + child tasks，而不是单一大任务。
- 决定产品锚点放在 `title-card -> paper-project` 之间。
- 决定 `research-varify/` 只作为 intake 包保留，不作为长期 SSOT。
- 决定执行顺序固定为 `T-024 -> T-025 -> T-026/T-027 -> T-028`。
- 决定在现有 6 个任务内补 coverage 缺口，不新增 `T-029`。
- 决定本组补齐投稿前风险报告与写作交接输出，但不并入完整写作或 rebuttal 编排。
- 决定 `createPaperProject` 公共合同保持不变，handoff 采用 sidecar artifact。

## Dependency notes
- 依赖 `T-014` / `T-021` 提供稳定的 `title-card` 语义和 evidence/value 上游对象。
- 依赖既有 `paper-project` 合同作为 downstream container，不在本任务新增第二套 writing governance。
- 依赖 project governance hub 维护 requirement/task 映射与 derived views。
- 依赖 downstream writing lane 承接 Markdown/LaTeX、章节 diff、Prism/Overleaf 与 rebuttal。

## Current implementation hook
- `T-086` completed the backend-first bridge path after the original `T-026` placeholder was archived.
- Runtime coverage now includes title-card seed, readiness verify, PaperProject gateway promotion, writing-entry sidecar refs, submission-risk sidecar refs, and idempotent duplicate promotion.
- Desktop review surface and planner/critic generation remain future scoped tasks, not active child work.

## 2026-05-20 - Superseded By PaperImplementation
- `research-argument` is now marked as a legacy/transition asset.
- It should not receive new authority writes, readiness gates, desktop surfaces, planner/critic runtime, or independent child tasks.
- Useful capabilities should be absorbed or replaced by `PaperImplementation`:
  - readiness dimensions and deterministic checks;
  - claim/evidence coverage ideas;
  - `WritingEntryPacket` as a possible downstream projection;
  - `SubmissionRiskReport` as a possible dossier/risk projection;
  - repository/test lessons for migration.
- Remaining assets should be removed after replacement via a dedicated decommission task.
