# 01 Plan

## Phase S0+ — Dual-track cleanup (lands before S1)

### Rationale
- S0 first cut introduced renderer-side status classification sets (`BLOCKED_RECORD_STATUSES`, etc.) and used `record.status` as a proxy for readiness. Two risks: (1) dual-track between `record.status` and canonical `readiness_report.readiness_status`; (2) semantic drift as backend status enums evolve while renderer-side sets stay stale. Both are unacceptable per the task's principles.
- Settled 2026-05-28 with user: do not paper over with documentation; pull the classifications into shared contracts and read aggregate counts from canonical sources before starting S1.

### Steps
1. Extend `packages/shared/src/research-lifecycle/experiment-foundation-contracts.ts` with read-only classification constants — each constant is a typed `as const` tuple whose members MUST be subsets of an existing canonical enum:
   - `EXPERIMENT_FOUNDATION_READINESS_BLOCKED_STATUSES` — subset of canonical `readiness_status` values that count as blocked.
   - `EXPERIMENT_FOUNDATION_PROMOTION_PENDING_STATUSES` — subset of candidate status values that count as pending review.
   - `EXPERIMENT_FOUNDATION_EVIDENCE_FRESH_STATUSES` — subset of `evidence_candidate.status` values that count as fresh.
2. Add schema tests asserting each new constant is a subset of its canonical enum, so future enum renames break the build.
3. Add backend `GET /experiment-foundation/readiness?status=<blocked|...>&target_kind=...&limit=...&cursor=...`. Read-only; no DTO shape change; uses the new shared constants for `status` enum validation. Add a route schema, controller method, service method, and repository `listReadinessReports` method. Cover with one route integration test and one repository unit test.
4. Renderer: add `listExperimentFoundationReadinessReports` in `api.ts`; rewrite `overview/useOverviewController.ts` to import the three classification constants from shared and to read the "blocked" counter + list from the new readiness endpoint (filtered by `EXPERIMENT_FOUNDATION_READINESS_BLOCKED_STATUSES`). Drop the three renderer-side `*_STATUSES` sets.
5. Update the Overview "阻塞记录" list to render readiness report rows with `readiness_status` and link to the Readiness tab via `goToReadiness(target_kind, target_id)`.

### Acceptance
- Shared package builds and schema tests pass; renaming any classified status without updating the shared constant breaks the schema test.
- Backend `GET /experiment-foundation/readiness` returns reports filterable by status and target_kind; integration test passes.
- Overview "阻塞" counter and list read from the readiness endpoint exclusively; `record.status` is no longer consulted for the blocked bucket.
- Overview "待晋升候选" and "可用 evidence" counters use the shared classification sets; no renderer-side string set remains in `overview/`.
- `grep` for `_STATUSES = ` inside `apps/desktop/src/renderer/modules/experiment-foundation/` returns zero matches.

## Phase S0 — Overview shell as default landing page

### Steps
1. Add a new `OverviewPanel` component under `apps/desktop/src/renderer/modules/experiment-foundation/overview/`.
2. Extend `useExperimentFoundationController` (or split into `useOverviewController`) to expose aggregated counters and short lists pulled from existing `listExperimentFoundationRecords` and `listExperimentFoundationJobs` endpoints; do NOT add new endpoints.
3. Make Overview the default `activePanel` (replacing `registry`). Update `panelTabs` to lead with Overview while keeping all current tabs.
4. Add deep-link callbacks: clicking a recent job goes to Execution tab with that job preselected; clicking a blocked readiness goes to Readiness tab with target preset; clicking a candidate goes to Promotion tab with candidate preset.

### Acceptance
- Overview is the default tab.
- Four counter cards render: `jobs.running`, `readiness.blocked`, `promotion.pending`, `evidence.fresh`.
- Three lists render with at most five items each: recent jobs, recent readiness reports with non-success status, recent promotion candidates.
- Deep links navigate to the correct downstream tab with the correct selection state.
- No new API endpoint is introduced; no new shared contract field is consumed.

## Phase S1 — DatasetAsset typed form + reusable RefPicker

### Steps
1. Create `apps/desktop/src/renderer/modules/experiment-foundation/components/RefPicker.tsx`. Inputs: `refType` (constrained to record kinds via shared enum, plus a "free" mode for `desktop_workbench` etc.), `refId` (free text with type-ahead candidates loaded via the records list API). Output: `{ ref_type, ref_id }`. Provide an array variant for `*_refs[]` fields.
2. Restructure the `资产/合同` tab into a `资产库` parent with sub-tabs per record kind: Dataset / Benchmark / Baseline / Protocol / Model. The old `资产/合同` top-level tab is removed; no permanent generic JSON CRUD tab is exposed. Record kinds not yet typed (Benchmark/Baseline/Protocol/Model and any tail) render a list+detail view; "Advanced JSON" is reachable only inside a selected record's detail.
3. Implement DatasetAsset typed form. Source of truth for field layout: shared contract for `dataset_asset` record kind. Required structured fields: `record_id`, `canonical_name`, `version_label`, `family`, `status`. Structured nested fields: `dataset_locations[]`, `mirrors[]`, `checksum_manifest_ref`, `split_protocol_ref`, `processing_recipe_ref`, `data_policy_ref`, `traceability_refs[]`. Unknown fields collapse into an "Advanced JSON" panel that round-trips through the existing PUT.
4. Wire DatasetAsset create/edit through the same `createExperimentFoundationRecord` / `upsertExperimentFoundationRecord` API; the form composes the payload locally.
5. Add field-level validation: required-fields, ref-shape, hash-format. Validation is renderer-side guardrails only; backend remains the source of truth.

### Acceptance
- DatasetAsset list view shows columns: `canonical_name`, `version_label`, `family`, `status`, `updated_at`.
- DatasetAsset detail/edit renders typed fields; switching to "Advanced JSON" inside the detail panel shows the raw payload.
- `RefPicker` is consumed at least once inside DatasetAsset (e.g. `checksum_manifest_ref`); the component is exported and ready for S2/S3 reuse.
- Switching DatasetAsset sub-tab does not pollute filters of other record kinds (panel-scoped filters per T-078 post-review fix stay intact).
- The legacy `资产/合同` top-level tab is removed in this phase. No top-level generic JSON CRUD tab remains.

## Phase S2 — Experiment flow timeline

### Steps
1. Add an `ExperimentFlowPanel` keyed by a selected `run_recipe` `record_id` (or a `training_task_spec` for orphan flows). The selector reuses the records list with `record_kind=run_recipe`.
2. Render a vertical timeline with stages: `recipe_draft` → `run_recipe` → `materialize_training_task_spec_request` → `training_task_materialization_result` → `training_task_spec` → `external_training_job` → `experiment_result` → `result_validation_report` → `evidence_candidate` → `paper_experiment_sidecar`. Stages that have no matching record render as `pending` placeholders.
3. Each node shows status badge, key hash, key refs, and a "view raw" disclosure. Each node may expose context actions:
   - `external_training_job` node: Submit / Sync / Cancel / Collect, replacing the textarea editors with typed forms backed by `RefPicker`.
   - `evidence_candidate` and `paper_experiment_sidecar`: jump-to-paper (S4 placeholder, disabled until S4 lands).
4. Disable each action when prerequisite record is missing or stale. Surface backend error messages inline; do not duplicate readiness logic.

### Acceptance
- Selecting a `run_recipe` populates the timeline.
- Submit / Sync / Cancel / Collect typed forms call the same `/execution/jobs/**` endpoints as today and accept the same payload shapes.
- Disabled states reflect missing prerequisite records, not renderer-owned domain rules.
- Generic JSON job submit/sync/cancel/collect remains reachable via an "Advanced JSON" panel for the selected job (panel sits inside the timeline's job node detail, not as a top-level tab).
- The legacy `Recipe/Materialization` and `执行/证据` top-level tabs are removed in this phase. The legacy single-target `Readiness` tab is also removed once Overview's readiness list deep-links work — its only function was per-target lookup, which becomes a side panel on the relevant timeline node.

## Phase S3 — Baseline/Benchmark typed views + light visualization

### Steps
1. Replicate the DatasetAsset typed-form pattern for `baseline_asset` and `benchmark_asset` (read-first, edit-second). Reuse `RefPicker`.
2. Add a list+detail view for `evaluation_protocol` matching the same pattern.
3. Render `evaluation_fact`, `metric_observation`, and `comparison_observation` as sortable tables. Add an inline SVG sparkline for numeric metric series grouped by `metric_definition_ref` over `run_recipe` or `external_job` axis.
4. Keep all visualization within shared `data-ui` primitives and inline SVG; do not import a chart library.

### Acceptance
- Baseline / Benchmark / Protocol have typed list+detail views.
- Sparkline renders for any metric with at least two `metric_observation` records.
- No chart-library dependency is added to `apps/desktop/package.json`.

## Phase S4 — Paper binding reverse drill

### Steps
1. Add a `论文绑定` tab. List `paper_experiment_sidecar` records, grouped by `paper_project_ref`.
2. Selecting a sidecar populates a read-only summary of its `run_recipe_ref`, `experiment_result_ref`, `evidence_candidate_ref`, and trace chain. A "jump to experiment flow" button preselects the corresponding `run_recipe` in S2.
3. Do not introduce a write path for sidecar records here; binding remains owned by paper-implementation surfaces.

### Acceptance
- Sidecar records are reachable and groupable.
- Jump-to-flow correctly selects the upstream `run_recipe`.
- No write or attach action is exposed in this surface.

## Phase S5 — UI-driven full-flow smoke (delivered for T-106)

### Ownership note
- This phase produces the smoke that closes T-106's open "UI-driven full-flow smoke" acceptance. T-110 implements and lands the smoke command, but the acceptance checkbox lives on T-106's `00-overview.md`. T-110 closure is not gated on T-106 flipping that box.

### Steps
1. Add or extend desktop smoke (likely under `apps/desktop/**/smoke:e2e`) to walk: Overview → Asset (Dataset typed form) → Experiment Flow (selected `run_recipe`) → Execution actions → Evidence detail.
2. Cover at least one error rendering case (e.g. invalid `checksum_manifest_ref` shape on submit) and one disabled-state case (e.g. Submit disabled without a selected materialization).
3. Document the smoke entrypoint command in T-106's `00-overview.md` (handoff section) and in T-110's `04-verification.md`. If T-106 chooses to fold it into its hardening runner, that wiring happens inside T-106.

### Acceptance (T-110 side)
- Smoke command exists, is documented in both `dev-docs/active/experiment-foundation-research-workbench/04-verification.md` and `dev-docs/active/experiment-foundation-real-interaction-hardening/00-overview.md`.
- Smoke command passes locally with the memory repository configuration.

### Acceptance (T-106 side)
- T-106 ticks its "UI-driven full-flow smoke" acceptance box independently, citing this smoke command.

## Cross-phase Acceptance Criteria
- Each phase ends with a green run of:
  - `pnpm --filter @paper-engineering-assistant/desktop typecheck`
  - `pnpm --filter @paper-engineering-assistant/desktop build`
  - `python3 .ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run --mode full`
  - `node .ai/tests/run.mjs --suite ui`
  - `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e`
  - `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
  - `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
  - `git diff --check`
- Each phase appends a verification entry in `04-verification.md` and (if applicable) a pitfall in `05-pitfalls.md`.

## Review Gate
- Do not start S1 implementation until S0 lands and the Overview-as-default-tab decision is verified by smoke.
- Do not start S2 until `RefPicker` is exported and consumed inside S1, so S2 inherits a stable primitive.
- Confirm S4 priority with the user before starting; current alignment is "needed but deferred".
- Sprint sizing target: each phase ≤ 1 sprint (S0 ≈ 0.5 sprint).
