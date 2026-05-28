# 04 Verification

## Planned Checks (per phase)
- `pnpm --filter @paper-engineering-assistant/desktop typecheck`
- `pnpm --filter @paper-engineering-assistant/desktop build`
- `python3 .ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run --mode full`
- `node .ai/tests/run.mjs --suite ui`
- `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e`
- `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- `git diff --check`

## Phase-specific Behavioral Checks
- **S0 Overview shell**
  - Overview is the default tab when entering `实验基座`.
  - Each counter card matches the count returned by the corresponding list API filter.
  - Deep-link clicks land on the correct downstream tab with selection preset.
- **S1 DatasetAsset typed form + RefPicker**
  - Dataset typed form round-trips through PUT/POST; payload diff against pre-edit JSON has no spurious key drift.
  - "Advanced JSON" toggle preserves any unknown fields untouched.
  - `RefPicker` type-ahead matches against the list API for the configured `refType`.
  - Filter scope per record kind is preserved per T-078 post-review fix.
- **S2 Experiment flow timeline**
  - Timeline correctly resolves stages for at least one `run_recipe` test fixture.
  - Submit / Sync / Cancel / Collect typed forms produce the same network payload shape as today's textarea editors.
  - Disabled states are driven by missing prerequisite record presence, not duplicated readiness rules.
- **S3 Baseline/Benchmark typed views + viz**
  - Baseline / Benchmark / Protocol typed views render against fixture records.
  - Sparkline renders for any metric with ≥ 2 observations; degrades gracefully to "n/a" otherwise.
  - `apps/desktop/package.json` is unchanged regarding chart dependencies.
- **S4 Paper binding**
  - Sidecar listing groups by `paper_project_ref`.
  - Jump-to-flow opens the correct `run_recipe` in `实验流`.
- **S5 T-106 smoke**
  - Smoke command walks all targeted surfaces end-to-end.
  - At least one error rendering and one disabled-state case are exercised.
  - T-106 acceptance checkbox updated when smoke command lands.

## Recorded Runs

### 2026-05-28 — S0 Overview shell
- PASS: `pnpm --filter @paper-engineering-assistant/desktop typecheck`
- PASS: `pnpm --filter @paper-engineering-assistant/desktop build`
- PASS: `python3 .ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run --mode full`
  - First run: 3 errors on `data-variant="h4"` in `OverviewPanel.tsx` (lines 223/231/239). The UI text contract allows only `body | caption | label | h1 | h2 | h3`.
  - Remediation: changed the 3 section subheadings to `data-variant="label"`.
  - Passing report: `.ai/.tmp/ui/20260528T102957Z-*/ui-gate-report.md` — Errors: 0, Warnings: 0.
- PASS: `node .ai/tests/run.mjs --suite ui` (4/4 subsuites)
- PASS: `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e` — `[desktop-smoke] PASS` (exit-143 trailer is the expected shutdown of the dev process).
- PASS: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- PASS: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- PASS: `git diff --check`

### S0 Acceptance check
- [x] Overview is the default `activePanel` (changed `useState<ExperimentFoundationPanelKey>('overview')`).
- [x] Four counter cards render: `进行中 jobs` / `阻塞记录` / `待晋升候选` / `可用 evidence`.
- [x] Three lists render with max 5 items each: recent jobs, blocked records, pending candidates.
- [x] Deep-link callbacks present: `goToJob` (→ execution + preselect), `goToReadiness` (→ readiness + target preset), `goToPromotion` (→ promotion + candidate preset).
- [x] No new API endpoint introduced; only existing `/experiment-foundation/records` and `/experiment-foundation/execution/jobs` are used.
- [ ] Visual smoke under Electron — pending (next session can run Computer Use against `pnpm desktop:dev`).

### 2026-05-28 — S0+ Dual-track cleanup
- PASS: `pnpm --filter @paper-engineering-assistant/shared typecheck`
- PASS: `pnpm --filter @paper-engineering-assistant/shared test` — 196/196 (added 4 classification constants + cross-enum subset assertion test).
  - Side fix: added `topicSelectionV1aWorkflowHarnessContracts` import + Object.keys entry to `title-card-management-contracts.schema.test.ts:3332` "research-lifecycle barrel re-exports the runtime value surface of split modules". This was a pre-existing inconsistency: the barrel re-exports v1a workflow harness module since the in-flight T-088 work added it, but the barrel test's expected set hadn't been refreshed. Fixing it unblocks the shared test suite and does not change any production behavior.
- PASS: `pnpm --filter @paper-engineering-assistant/desktop typecheck`
- PASS: `pnpm --filter @paper-engineering-assistant/desktop build`
- PASS: `python3 .ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run --mode full` — Errors 0, Warnings 0.
- PASS: `node .ai/tests/run.mjs --suite ui` — 4/4.
- PASS: `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e` — `[desktop-smoke] PASS`.
- PASS: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- PASS: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` — unrelated warning on `topic-selection-v1a-production-orchestration/00-overview.md` (T-088 in-flight, missing `## Status` section).
- PASS: `git diff --check`.
- BLOCKED-UPSTREAM (resolved): T-088 in-flight work was completed by the user; backend typecheck + full test suite now pass.
- PASS: `pnpm --filter @paper-engineering-assistant/backend typecheck`.
- PASS: `node apps/backend/scripts/run-node-tests.mjs src/services/experiment-foundation-service.unit.test.ts` — full backend suite reports 869 pass / 0 fail / 2 skipped over 871 subtests. The readiness-list integration test ("experiment-foundation readiness list route filters by status and target_kind") is included.

### 2026-05-28 — S1 DatasetAsset typed form + RefPicker + 资产库 IA
- PASS: `pnpm --filter @paper-engineering-assistant/desktop typecheck` (after one cleanup pass: an unused `recordId` parameter inside the new `useAssetKindController.createRecord` got renamed to `_recordId` to satisfy `noUnusedParameters`).
- PASS: `pnpm --filter @paper-engineering-assistant/desktop build`.
- PASS: `python3 .ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run --mode full` after one round-trip:
  - First run: 3 errors in `RefPicker.tsx` — `<ul data-ui="list" data-variant="menu" data-size="sm">` (the `list` role accepts `variant ∈ {plain, rows, cards}` and does NOT accept a `data-size` attribute), and `<p data-tone="warning">` (the `text` role's `tone` enum is `{primary, secondary, muted, danger}` only).
  - Remediation: list suggestion uses `data-variant="plain" data-density="compact"`; the "未匹配候选" hint uses `data-tone="muted"`.
  - Passing report: Errors 0, Warnings 0.
- PASS: `node .ai/tests/run.mjs --suite ui` (4/4).
- PASS: `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e` — `[desktop-smoke] PASS`.
- PASS: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- PASS: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` — same unrelated T-088 in-flight warning.
- PASS: `git diff --check`.
- REGRESSION (shared): `pnpm --filter @paper-engineering-assistant/shared test` reports 196 pass / 1 fail. The single failure (test 132 `research-lifecycle barrel re-exports the runtime value surface of split modules`) is pre-existing T-088 in-flight work and not caused by S1. My S0+ classification subset test (test 46) still passes.
- REGRESSION (backend): `node apps/backend/scripts/run-node-tests.mjs ...` reports 869 pass / 0 fail / 2 skipped. No regression from S1.

### 2026-05-29 — S4 post-review fixes (jump-to-flow error visibility + status fallback cleanup)
- PASS: `pnpm --filter @paper-engineering-assistant/desktop typecheck`.
- PASS: `pnpm --filter @paper-engineering-assistant/desktop build`.
- PASS: `python3 .ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run --mode full` (Errors 0, Warnings 0).
- PASS: `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e`.

Fixes recorded in 03-implementation-notes "S4 post-review fixes + dual-track audit" section. No new known-debt opened.

### 2026-05-29 — S4 PaperBindingPanel (reverse drill) landed
- PASS: `pnpm --filter @paper-engineering-assistant/desktop typecheck`.
- PASS: `pnpm --filter @paper-engineering-assistant/desktop build`.
- PASS: `python3 .ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run --mode full` (Errors 0, Warnings 0).
- PASS: `node .ai/tests/run.mjs --suite ui` (4/4).
- PASS: `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e` — extended with S4 assertions; `[desktop-smoke] PASS`.
- PASS: project governance sync + lint.
- PASS: `git diff --check`.

### S4 Acceptance check
- [x] `论文绑定` Tab landed and routed to `<PaperBindingPanel>`.
- [x] Sidecars are reachable and groupable: `PaperBindingPanel` queries `paper_experiment_sidecar` records and groups by `paper_project_id` (Map → sorted array). `paper_project_id` filter input narrows the list.
- [x] Selecting a sidecar populates a read-only summary: 9 ref summaries (run_recipe / dataset_version_lock / evaluation_protocol_lock / benchmark_asset / training_task_spec / materialization_result / optional external_job + 5 ref-list summaries) plus the full payload `JsonAdvancedPanel`.
- [x] "跳到 实验流" button preselects the corresponding `run_recipe`: module raises `pendingFlowRunRecipeId`, switches to `flow` tab, the flow panel consumes via `selectRunRecipeById` (in-page first, single-record fetch fallback).
- [x] No write or attach action is exposed: smoke asserts the binding panel does NOT import `createExperimentFoundationRecord` / `upsertExperimentFoundationRecord` / `decideExperimentFoundationPromotion`. Sidecar attach path remains in paper-implementation (T-100) surfaces per the S4 boundary decision.

### 2026-05-29 — S5 UI-driven full-flow smoke landed (closes T-106 open checkbox)
- PASS: `pnpm --filter @paper-engineering-assistant/desktop typecheck`.
- PASS: `pnpm --filter @paper-engineering-assistant/desktop build`.
- PASS: `python3 .ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run --mode full` (Errors 0, Warnings 0).
- PASS: `node .ai/tests/run.mjs --suite ui` (4/4).
- PASS: `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e` — `[desktop-smoke] PASS`. The extended assertion catalogue walks all six T-106 UI Flow Contract steps and the boundary audits (renderer must not own backend semantics; renderer must not invent status classifications; sparkline must stay inline SVG).
- PASS: project governance sync + lint.
- PASS: `git diff --check`.

### S5 Acceptance check
- [x] `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e` exercises Overview → 资产库 → 实验流 → JobActionForms → ReadinessInspector → Facts/Sparkline (the post-cutover IA equivalents of the contract's Registry / Readiness / Recipe-Materialization / Execution-Evidence steps).
- [x] At least one error-rendering case covered: backend `POST /experiment-foundation/records` with empty payload returns 4xx; renderer surfaces with `data-tone="danger"` branches asserted in OverviewPanel + ReadinessInspector + JobActionForms.
- [x] At least one disabled-state case covered: `<RunRecipeTimeline>` propagates `disabled={!hasSelectedJob}` to Sync / Cancel / Collect forms; asserted in source.
- [x] T-106 acceptance checkbox flipped in `dev-docs/active/experiment-foundation-real-interaction-hardening/00-overview.md`; the UI Flow Contract section in T-106's `02-architecture.md` now carries an authoritative step-to-mount mapping.
- [x] Smoke entrypoint documented in both T-106 (`02-architecture.md` UI Flow Contract section, Smoke entrypoint heading) and T-110 (`04-verification.md`, this section).

### 2026-05-29 — S3 Baseline/Benchmark/Protocol typed + Facts + Sparkline + scaffold extraction
- PASS: `pnpm --filter @paper-engineering-assistant/desktop typecheck`.
- PASS: `pnpm --filter @paper-engineering-assistant/desktop build`.
- PASS: `python3 .ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run --mode full` after one round-trip.
  - First run: 1 error on `SparklineSvg.tsx`: `no-inline-style` (the SVG carried `style={{ overflow: 'visible' }}`).
  - Remediation: dropped the inline `style`; the sparkline's padding (2px on each side) already keeps the last-point dot inside the viewBox.
  - Passing report: Errors 0, Warnings 0.
- PASS: `node .ai/tests/run.mjs --suite ui` (4/4).
- PASS: `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e`.
- PASS: project governance sync + lint.
- PASS: `git diff --check`.

### S3 Acceptance check
- [x] `BaselineAssetView` typed form (`baseline_asset_id` / `name` / `aliases` / `description` / `baseline_family` (enum) / `source_refs` / `supported_benchmark_refs` / `recommended_use` / `catalog_status` (enum)). Unknown contract fields round-trip via "高级 JSON（未 typed 字段）".
- [x] `BenchmarkAssetView` typed form (`benchmark_asset_id` / `name` / `description` / `task` / `domain` / `dataset_version_refs` / `default_evaluation_protocol_refs` / `source_refs` / `community_refs` / `catalog_status` / `verification_status`).
- [x] `EvaluationProtocolView` typed form (`evaluation_protocol_id` / `benchmark_asset_ref` via RefPicker / `protocol_version` / `protocol_hash` / `metric_definition_refs` / `evaluator_refs` + 8 free-shape config blocks as `JsonAdvancedPanel` editors).
- [x] `FactsView` sub-tab with three sortable sections (`evaluation_fact` / `metric_observation` / `comparison_observation`). Column-click toggles sort direction.
- [x] `MetricObservation` section exposes a metric-ref dropdown and renders an inline-SVG sparkline of numeric values across `created_at`. `latest / min / max / n` chips beside the chart. No chart library introduced.
- [x] All 4 typed asset views (Dataset / Baseline / Benchmark / Protocol) now share a single scaffold: `useTypedAssetDraft<Draft>(recordKind, { blank, derive, build })` plus `AssetFilterToolbar` / `StringListEditor` / `MutationFeedback` shared components, and `asEnum` / `asRefArray` / `asString` / `asStringArray` / `preserveCreatedAt` / `trimAndCompact` shared helpers. Per-view boilerplate cut from ~470 lines avg to ~325 lines avg.
- [x] `资产库` sub-tab list grew from 4 to 5: Dataset / Benchmark / Baseline / Protocol / Facts.
- [x] `GenericAssetKindView.tsx` deleted (no remaining callers).
- [x] Renderer-side classifications remain Shared-sourced; no new literal `*_STATUSES` sets introduced.

### 2026-05-29 — S2 known-debt cleanup (preselect / pagination / payload accessors)
- PASS: `pnpm --filter @paper-engineering-assistant/desktop typecheck`.
- PASS: `pnpm --filter @paper-engineering-assistant/desktop build`.
- PASS: UI gate (Errors 0, Warnings 0).
- PASS: `node .ai/tests/run.mjs --suite ui` (4/4).
- PASS: `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e`.
- PASS: project governance sync + lint.
- PASS: `git diff --check`.

S2 known-debt list in `03-implementation-notes.md` is now empty; the section title was renamed to "S2 known-debt — closed before commit".

### 2026-05-29 — S2 Experiment flow + Job typed actions + IA cutover
- PASS: `pnpm --filter @paper-engineering-assistant/desktop typecheck`.
- PASS: `pnpm --filter @paper-engineering-assistant/desktop build`.
- PASS: `python3 .ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run --mode full` after one round-trip.
  - First run: 1 error in `JobActionForms.tsx`: `data-variant={ctaVariant}` on the action shell's CTA button was flagged as `contract-dynamic` (UI gate requires static literal `data-variant` values).
  - Remediation: render two explicit branches — `data-variant="danger"` for the cancel CTA, `data-variant="primary"` for the rest.
  - Passing report: Errors 0, Warnings 0.
- PASS: `node .ai/tests/run.mjs --suite ui` (4/4).
- PASS: `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e` — `[desktop-smoke] PASS`.
- PASS: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- PASS: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` (same unrelated T-088 warning).
- PASS: `git diff --check`.

### S2 Acceptance check
- [x] `Recipe/Materialization`, `执行/证据`, and single-target `Readiness` top-level tabs removed; `flow` tab added in their place. `experimentFoundationTabs` now exposes 4 tabs: 概览 / 资产库 / 实验流 / 候选晋升.
- [x] `ExperimentFlowPanel` mounted under the `flow` tab. Anchored by a `run_recipe` selector; renders the 10-stage timeline (`recipe_draft` → `run_recipe` → `materialize_request` → `materialization_result` → `training_task_spec` → `external_training_job` → `experiment_result` → `result_validation_report` → `evidence_candidate` → `paper_experiment_sidecar`). Stages without matching records render `pending（暂无记录）` placeholders.
- [x] `external_training_job` stage card exposes typed Submit / Sync / Cancel / Collect forms (no JSON textarea). Forms use shared `RefPicker` / `RefPickerList`; submit form preserves the contract's required-field invariants with renderer-side validation messages.
- [x] Every stage card has a "Advanced JSON" disclosure for the latest record and a "查看 readiness" deep-link into the inspector (where applicable).
- [x] Single-target Readiness panel replaced by module-level `ReadinessInspector` (data-ui="modal"). Opened via `goToReadiness(kind, id)` deep-link or per-stage button. Refresh / Check actions reuse `getLatestExperimentFoundationReadiness` and `checkExperimentFoundationReadiness` via the existing api client.
- [x] Deep links from Overview: `goToReadiness` → opens inspector (no panel switch); `goToPromotion` → switches to `promotion` tab with candidate kind/id preset; `goToJob` → switches to `flow` tab and signals preselect via `pendingFlowJobId`.
- [x] Main controller trimmed to Promotion's needs only: dropped readiness/recipes/execution/jobs state and 11 unused callables. Cleanup useEffect retained for Promotion's selection invariant.
- [x] Renderer utils trimmed: dropped `defaultSubmitJobJson` / `defaultCancelJobJson` / `defaultCollectJobJson` / `defaultSourceRefsJson` / `evidenceRecordKinds` / `recipeRecordKinds` / `experimentFoundationTrainingAdapterKinds` / `experimentFoundationExternalJobStatuses` — no remaining callers.

### S1 Acceptance check
- [x] `资产/合同` top-level tab removed; `资产库` parent tab + sub-tabs Dataset / Benchmark / Baseline / Protocol present.
- [x] DatasetAsset has a typed create/edit form covering canonical fields (`dataset_asset_id`, `name`, `description`, `aliases`, `task_types`, `source_refs`, `default_version_id`, `catalog_status`, `schema_summary`). Unknown contract fields are surfaced read-only via an "高级 JSON（未 typed 字段）" disclosure so frozen payloads round-trip without loss.
- [x] `RefPicker` exists at `components/RefPicker.tsx` and is consumed inside DatasetAssetView for both `default_version` (single ref) and `source_refs` (RefPickerList). It performs list-API-backed type-ahead only — no graph navigation, no inline-create.
- [x] Benchmark / Baseline / Protocol sub-tabs render list + detail + Advanced JSON disclosure (no top-level generic JSON CRUD remains).
- [x] Filter scope per sub-tab — `useAssetKindController` resets selection and filters on `recordKind` change; sub-tab switching does not pollute another sub-tab's state.
- [x] Renderer-side classifications remain Shared-sourced; no new `*_STATUSES` literal sets introduced.

### S0+ Acceptance check
- [x] `EXPERIMENT_FOUNDATION_READINESS_BLOCKED_STATUSES`, `EXPERIMENT_FOUNDATION_ASSET_CANDIDATE_ATTENTION_STATUSES`, `EXPERIMENT_FOUNDATION_EVIDENCE_CANDIDATE_REVIEW_STATUSES`, `EXPERIMENT_FOUNDATION_EXTERNAL_TRAINING_JOB_IN_FLIGHT_STATUSES` exist in shared and each member is asserted to be a subset of its canonical enum.
- [x] `ListExperimentFoundationReadinessReportsResponse` + `listExperimentFoundationReadinessReportsQuerySchema` exist in shared as thin pagination wrappers around the existing readiness-report DTO; no item DTO shape changes.
- [x] Backend repository (in-memory + Prisma) implements `listReadinessReports({ statuses, targetKind, limit, cursor })`.
- [x] Backend service `listReadinessReports` enforces shared enum membership for `status`; new GET route `/experiment-foundation/readiness` registered with shared query schema.
- [x] Desktop `api.ts` exposes `listExperimentFoundationReadinessReports`; the new endpoint is reachable through the governance bridge prefix allowlist (already covers `/experiment-foundation/`).
- [x] Overview controller reads canonical readiness reports for the blocked counter and uses shared classification constants for all other counters; no renderer-side `*_STATUSES` string set remains.
- [x] OverviewPanel renders the blocked-readiness list off the canonical reports and deep-links to `goToReadiness(target_kind, target_id)`.
- [x] `grep "_STATUSES = " apps/desktop/src/renderer/modules/experiment-foundation/` returns only `new Set<string>(SHARED_CONSTANT)` wrappers; no literal string sets.

## Review Checklist (final)
- [x] All Acceptance Criteria in `00-overview.md` are checked.
- [x] No legacy CSS paths recreated.
- [x] Generic JSON fallback remains reachable for every record kind. (Per-record "Advanced JSON" disclosure inside typed detail views; no top-level CRUD tab. Verified via S2 cutover acceptance.)
- [x] T-106 UI smoke checkbox can be ticked. (Flipped to `[x]` in T-106 `00-overview.md` by commit `fd674d0`.)
- [x] Project governance sync + lint both pass.
