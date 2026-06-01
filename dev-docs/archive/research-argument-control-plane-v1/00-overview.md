# 00 Overview

## Status
- State: done
- Mode: decommissioned
- Next step: archived by T-113; do not continue UI review surface, planner/critic generation, readiness, or writing-entry work under `research-argument`.

## Supersession Notice
- As of 2026-05-20, `research-argument` is no longer an independent authority domain.
- `PaperImplementation` is the forward authority for motive versions, validation cycles, claim trace, dossier readiness, and writing-prep decisions.
- Existing `research-argument` docs are historical archive material only.
- Current contracts, persistence, services, and tests are removed by `T-113 paper-implementation-legacy-authority-cleanup`.

## Goal
- Historical goal, retained for context:
- 为仓库建立一条新的 pre-writing research argument control plane 主线，协调 `title-card` 上游证据链与 `paper-project` 下游写作容器之间的 research convergence。
- 完整覆盖 research-argument 这一需求切片，并补齐投稿前风险报告与写作交接输出。
- 通过 umbrella task 固定子任务拆分、执行顺序、跨任务边界、验证口径与 handoff 方式。

## Non-goals
- 不在 `T-023` 直接实现所有运行时模块；具体实现归各 child task 负责。
- 不重写 `T-014` / `T-021` 的 `title-card` 公开语义。
- 不重写现有 `paper-project` version-spine / writing-package 合同。
- 不在本轮推进 V2/V3 学习型排序、MCTS rollout 或写作层打通。
- 不并入 Markdown/LaTeX 编辑、章节 diff apply、Prism/Overleaf 执行面。
- 不在本组内完成 rebuttal 生成与响应编排。

## Context
- `research-varify/` 提供了完整的 research argument framework、data schema、planner spec 与 control-plane UI 输入，但当前尚未落入仓库正式 SSOT。
- 现有主线分成两段：
  - `T-014` / `T-021`：`title-card` 侧 evidence / need / question / value / package / promotion
  - `T-003` 及后续实现：`paper-project` 侧 version spine / stage gates / writing package
- 本任务在二者之间新增一层 `ArgumentObjectGraph + AbstractState + readiness / decision / bridge`，避免 title-card 和 paper-project 直接硬耦合。
- 对照 `requirements.md`，当前这一组任务原始版本只覆盖了 pre-writing 骨架；本轮修订后需显式补齐：
  - `Baseline / Protocol / ReproItem / Run / Artifact / Boundary / ReportProjection`
  - `SubmissionRiskReport`
  - `WritingEntryPacket`
  - `RuleEngine` 和 reviewer-facing 报告投影

## Acceptance criteria (high level)
- [x] `dev-docs/active/research-argument-control-plane-v1/` 包含 `roadmap + 00~05 + .ai-task.yaml`。
- [x] `T-024` 到 `T-028` 的 child task bundle 已创建。
- [x] 项目治理映射已预留到 `R-011`。
- [x] `T-024` 完成 canonical docs、glossary/context 与 shared contracts，并已归档。
- [x] `T-025` 完成 graph/state V1 基座，并已归档。
- [x] `T-026` / `T-027` / `T-028` 已从 active pending stub 收束到本 umbrella backlog；它们未实施、未验证，不再被视为独立 active work。
- [x] 已做新的 product/engineering 决策：先以 `T-086` 实现 backend-first writing-entry bridge，不推进 UI 或 planner。
- [x] 已生成并完成新的 scoped implementation plan：`dev-docs/active/research-argument-writing-entry-bridge-acceptance/`。
- [x] 2026-05-20 supersession decision recorded: do not continue `research-argument` as independent authority.
- [x] Future work, if needed, must be scoped as `PaperImplementation` migration/replacement/decommission work.

## Child-task ownership
- Completed:
  - `T-024`: docs / context / shared domain contracts
  - `T-025`: persistence / repository / synthesizer / read models
  - `T-086`: backend-first title-card seed, readiness verify, PaperProject writing-entry bridge, sidecar refs
- Consolidated pending backlog:
  - `T-027`: desktop control plane, risk report review, handoff packet preview
  - `T-028`: planner / critic / rule engine / risk-report assembly / async execution enhancement
- Current rule:
  - Do not reopen `T-026` / `T-027` / `T-028` as independent active tasks.
  - Do not create new `research-argument` UI/planner/critic child tasks.
  - If a useful capability resumes, create it under `PaperImplementation` as migration, replacement, projection, or decommission work.
