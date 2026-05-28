# 03 Implementation Notes

## 2026-05-28 — Task package created
- Created task bundle under `dev-docs/active/experiment-foundation-research-workbench/` as a follow-up to `T-078 experiment-foundation-desktop-workbench` (done) and parent `T-043 experiment-foundation-v1`.
- Trigger: T-078 closed the JSON-textarea minimum-closure workbench; user-stated primary needs (state observation, human-in-loop operation, experiment↔paper binding) require an IA refactor that T-078 did not include.
- Confirmed alignment with the user during planning:
  - UI form factor: lift from JSON-first to researcher-facing IA with typed asset forms and a flow-centric timeline.
  - Sprint entrypoint: DatasetAsset typed form (S1).
  - RefPicker is built as a reusable primitive alongside S1.
  - Overview page (S0) is the default landing tab.
  - Reverse-drill from paper-project (S4) is needed but deferred until S0–S3 land.
- Scope guardrails carried forward from T-078:
  - JSON CRUD path must remain reachable as the advanced fallback so contract-frozen payloads stay writable.
  - Shared contract enums are imported only; never duplicated in renderer code.
  - Renderer never owns readiness, validation, materialization, or adapter execution semantics.
  - `data-ui` attributes must remain static literals to keep the UI governance gate passing.
- No code changes landed in this revision. Next step: confirm sprint scope with the user and begin S0 implementation.

## Open Decisions
- Whether to split the existing `useExperimentFoundationController` into per-panel controllers (`useOverviewController`, `useAssetController`, `useFlowController`, `useBindingController`) or keep a single controller with view-scoped slices. Default plan in 02-architecture is to split when a panel adds non-trivial state; leave others alone.
- Final navigation Chinese labels: `概览` / `资产库` / `实验流` / `Readiness` / `候选晋升` / `论文绑定`. Pending user confirmation if any label should change.

## 2026-05-28 — Top-level decisions revised (dual-track + semantic-drift cleanup)
Settled with user after S0 first cut surfaced two risks: (1) using `record.status` as a proxy for `readiness_report.readiness_status` creates a dual-track that diverges over time; (2) renderer-side `*_STATUSES` classification sets silently drift when the backend enums evolve.

Revised decisions (these supersede the corresponding earlier items in the next section):

1. **Backend boundary — soft preference now covers two patterns.**
   - Pattern A (unchanged): thin query-parameter additions on existing GET endpoints.
   - Pattern B (newly sanctioned): thin new GET endpoints that surface already-persisted state with no DTO shape change and no new domain rules. Canonical example: `GET /experiment-foundation/readiness` for Overview observability.
   - Pattern C (newly sanctioned, contract-side): read-only status classification constants added to shared contracts, whose members subset existing canonical enums. Schema tests enforce the subset relationship so backend renames break the build.
   - Reflected in: `00-overview.md`, `02-architecture.md`, `roadmap.md`, `05-pitfalls.md`.

2. **Old T-078 5-tab IA — retired phase by phase, no permanent fallback.**
   - `资产/合同` removed in S1; `Recipe/Materialization` + `执行/证据` + single-target `Readiness` removed in S2; `候选晋升` survives unchanged.
   - Generic JSON record CRUD is never exposed as a top-level navigation surface. It survives only as an "Advanced JSON" disclosure inside a specific record's detail view.
   - Rationale: a permanent JSON CRUD tab keeps the old `record.status` operator mental model alive in parallel with the new Overview signals — exactly the dual-track risk we are eliminating.
   - Reflected in: `00-overview.md`, `01-plan.md` (S1 + S2 acceptance), `02-architecture.md`, `05-pitfalls.md`, `roadmap.md`.

3. **Overview counters — canonical sources only.**
   - "blocked" counter reads canonical readiness reports via the new thin GET endpoint, filtered by shared `EXPERIMENT_FOUNDATION_READINESS_BLOCKED_STATUSES`.
   - "pending promotion" and "fresh evidence" counters continue to use the existing `/records` endpoint with a `status` filter, but the status values come from shared `EXPERIMENT_FOUNDATION_PROMOTION_PENDING_STATUSES` and `EXPERIMENT_FOUNDATION_EVIDENCE_FRESH_STATUSES` constants. No renderer-side string set remains.
   - Reflected in: `00-overview.md` Acceptance Criteria, `01-plan.md` S0+ phase, `05-pitfalls.md`.

## 2026-05-28 — Top-level decisions settled with user
Recorded for downstream-session continuity. These are the load-bearing decisions that shape T-110 scope:

1. **Backend boundary — soft preference, not hard freeze.**
   - Decision: T-110 MAY add read-only list query parameters (`q`, `order_by`, `limit`, scoped filter keys) to existing GET endpoints when typed surfaces (notably `RefPicker`) need them.
   - Rationale: hard freeze would force `RefPicker` to client-side filter 50-row slices, which degrades with asset growth.
   - Boundary: write paths, response DTO shapes, domain rules, and Prisma tables remain frozen.
   - Reflected in: `00-overview.md` (Non-Goals, Boundary Contract), `02-architecture.md` (Backend Ownership Inputs), `05-pitfalls.md`.

2. **S4 paper binding — read-only reverse drill.**
   - Decision: T-110 paper-binding view lists `paper_experiment_sidecar` records and provides jump-to-flow. It does not expose attach/write actions.
   - Rationale: preserves T-100 ownership of sidecar attach path; avoids forcing a backend write API.
   - Boundary: if the user later requests bidirectional binding, open a follow-up task (likely a paper-implementation surface, not a T-110 expansion).
   - Reflected in: `00-overview.md` (Boundary Contract), `01-plan.md` (Phase S4), `05-pitfalls.md`.

3. **TuningSession — out of scope for T-110.**
   - Decision: TuningSession / TuningProposal / TuningDecision / TuningTrial UI is not in this task; it is deferred to T-111+.
   - Rationale: backend has no canonical persistence for these objects yet; building UI would force backend co-design and break decision 1's spirit.
   - Reflected in: `00-overview.md` (Non-Goals), `roadmap.md` (Out Of Scope), `05-pitfalls.md`.

4. **T-106 UI smoke — co-owned, merged delivery.**
   - Decision: T-110 S5 implements and lands the UI-driven full-flow smoke. T-106 owns the acceptance checkbox. T-110 closure does not gate on T-106 flipping that box.
   - Operational: T-110 S5 documents the smoke command in both `dev-docs/active/experiment-foundation-research-workbench/04-verification.md` and `dev-docs/active/experiment-foundation-real-interaction-hardening/00-overview.md`. When this task lands S5, the next governance sync surfaces T-106 as ready to close its checkbox.
   - Reflected in: `00-overview.md` (Acceptance Criteria note), `01-plan.md` (Phase S5 ownership note + split acceptance).

## Follow-up TODOs (actionable)
- [x] S0: scaffold `OverviewPanel`, wire counters, add deep-links.
- [x] S0 side-task: extract `StatusBadge` (and `statusTone` helper) into `components/StatusBadge.tsx` so OverviewPanel and future panels reuse a single source.
- [x] S0+ side-task: extract `JsonAdvancedPanel` into `components/JsonAdvancedPanel.tsx` (landed during S1 since the typed form needs it as the "Advanced JSON" disclosure).
- [x] S1: implement `RefPicker` and `RefPickerList`.
- [x] S1: type DatasetAsset form against shared `dataset_asset` record contract.
- [x] S1: retire `资产/合同` top-level tab; replace with `资产库` parent + sub-tabs (Dataset typed, Benchmark/Baseline/Protocol list+Advanced JSON).
- [ ] S2 known-debt (carried from S1 review):
  - Move `created_at` / `updated_at` stamping into the backend service so the renderer can omit timestamps from typed-form payloads. Today `DatasetAssetView.buildPayloadFromDraft` stamps ISO `now()` on the renderer side because the shared schemas require these fields and the existing service does not auto-fill. This is a borderline domain leak (mechanical bookkeeping, not a rule) but should be moved to the service layer for cleanliness when S2/S3 lands.
  - Scaffold a renderer test runner (vitest) under `apps/desktop` and add starter unit tests for `RefPicker` debounce/clear, `useAssetKindController` filter ref behavior, and `DatasetAssetView.buildPayloadFromDraft` validation branches. There is currently no renderer test infrastructure at all; S1 introduced ~1100 lines of new renderer code without coverage.
- [x] S2: implement `RunRecipeTimeline` and typed `JobActionForms`.

## 2026-05-29 — S2 Experiment flow + IA cutover landed
Implemented S2 per `01-plan.md`. The legacy 5-tab JSON-textarea IA from T-078 is now fully retired except for `候选晋升` (Promotion), which the plan kept by design.

Key deltas:

- **New `components/ReadinessInspector.tsx`** — `data-ui="modal"` drawer. Opened via the `openReadinessInspector(kind, id)` callback now living at the module level; consumed by the Overview deep-link (`goToReadiness`) and by per-stage "查看 readiness" buttons in the flow timeline. Drives reads/writes directly via the existing `getLatestExperimentFoundationReadiness` / `checkExperimentFoundationReadiness` API client. Replaces the legacy single-target `Readiness` tab.
- **New `experiment-flow/JobActionForms.tsx`** — typed Submit / Sync / Cancel / Collect forms. Submit and Cancel enforce renderer-side validation for required fields (`idempotency_key`, `reason`, refs) since the shared schemas mark them required. Source refs and requested_by refs use `RefPicker` / `RefPickerList`. Cancel CTA renders an explicit `data-variant="danger"` branch to satisfy the UI gate's static-literal rule (S2 review pitfall recorded in 05).
- **New `experiment-flow/useExperimentFlowController.ts`** — owns the 10-stage records load, the job list/selection, and the 4 typed job action callables. Eager loads all stages on mount; Collect additionally re-fetches `experiment_result`, `result_validation_report`, and `evidence_candidate` since those records often only appear after a successful collect.
- **New `experiment-flow/RunRecipeTimeline.tsx`** — vertical stage cards. Each card renders status badge, key refs/hash, Advanced JSON disclosure, and (for kinds that support readiness reports) a "查看 readiness" button that opens the inspector. The job stage card embeds the typed action forms in a 2-column grid.
- **New `experiment-flow/ExperimentFlowPanel.tsx`** — runs the flow controller, exposes the `run_recipe` selector and the timeline.
- **`useExperimentFoundationController` rewritten to be Promotion-only.** Removed: all readiness state and actions, all job state and actions, all *Payload textarea state, all record editor state, `recipeFilters` / `evidenceFilters`, `loadJobs` / `selectJobById` / `submitJob` / `syncJob` / `cancelJob` / `collectJob`. Kept: candidateFilters / records / selectedRecord / loadRecords / promotion state and actions / cleanup useEffect / skip ref. New args: `onOpenReadinessInspector` / `onRequestFlowJobPreselect`. `goToReadiness` now calls the inspector callback (no panel switch). `goToJob` switches to `'flow'` tab and signals preselect via the App-level `pendingFlowJobId` state (consumed advisory only in S2; the flow controller does not yet auto-select).
- **`ExperimentFoundationModule.tsx` rewritten.** Removed: `ReadinessPanel`, `RecipePanel`, `ExecutionPanel`, `JobFilters`, `JobTable`, `RecordEditor`, `JsonViewer`. Kept: `PromotionPanel`, `RecordTable`, `RecordKindSelect`, `JsonEditor`, `StatusLine` (all still used by Promotion). Module now owns `readinessOpen` / `readinessTarget` / `pendingFlowJobId` state and mounts `<ReadinessInspector>` at the module level.
- **`constants.ts`** — `experimentFoundationTabs` cut from 6 to 4: 概览 / 资产库 / 实验流 / 候选晋升.
- **`types.ts`** — `ExperimentFoundationPanelKey` cut from 6 to 4 union members.
- **`utils.ts`** — removed 8 now-dead exports (`defaultSubmitJobJson` / `defaultCancelJobJson` / `defaultCollectJobJson` / `defaultSourceRefsJson` / `evidenceRecordKinds` / `recipeRecordKinds` / `experimentFoundationTrainingAdapterKinds` / `experimentFoundationExternalJobStatuses`).
- **`App.tsx`** — unchanged at the panel-state layer; `flow` is a valid `ExperimentFoundationPanelKey` so no Topbar code change was needed beyond constants/type updates.

### Decisions made while implementing S2
- The flow panel eagerly loads all 10 stages on mount instead of lazily loading per scroll. Trade-off: 10 parallel network calls per visit vs. higher latency when users scroll into each card. Eager is acceptable for V1; revisit if records-per-kind grows substantially.
- Submit-form preset extraction is best-effort. When a `run_recipe` is selected, the renderer reads `run_recipe_hash` from the payload as a default for `training_task_spec_hash`. This is a UX convenience, not authoritative — the user can override.
- `pendingFlowJobId` is advisory in S2: it lights up after Overview `goToJob`, the module switches to the flow tab, and the sentinel auto-clears via a 0ms timeout. The flow controller does not currently auto-select the job because the controller mounts fresh inside the panel and would need to take a "preselect" prop. Marked as a follow-up: wire the preselect prop into `ExperimentFlowPanel` so deep-links land directly on the job (recorded as S3+ known-debt in this section's TODOs).
- The PromotionPanel is intentionally still JSON-textarea-driven. The plan keeps it unchanged through S4; typing the promotion request/result is a S5/follow-up scope item.

### S2 known-debt — closed before commit
- ~~Wire `pendingFlowJobId` through `ExperimentFlowPanel`~~ → closed. `ExperimentFlowPanel` now accepts `preselectJobId` + `onPreselectConsumed` props. When `jobsStatus === 'success'` and `preselectJobId` is set, the panel selects the matching job locally (no network if it's already in the current page) or falls back to `selectJobById(id)` for an out-of-page target, then calls `onPreselectConsumed` so the App-level sentinel clears. The previous 0ms-timeout occupancy effect in the module is gone.
- ~~Per-stage cursor pagination~~ → closed. `FlowStageState` gained `nextCursor: string | null`. The controller exposes `loadMoreStage(key)` alongside `refreshStage(key)`; both go through a shared `loadStagePage(key, mode)` private callable. Default per-stage limit is now `FLOW_STAGE_PAGE_SIZE = 10` (down from the API default of 50). Each timeline card surfaces a "加载更多" button when its `nextCursor` is non-null. The `RecordListFilters` shape and the `listExperimentFoundationRecords` client both accept `limit` + `cursor`; the backend's `/records` endpoint already exposed both.
- ~~Untyped `run_recipe_hash` access~~ → closed. New `modules/experiment-foundation/payloads.ts` exposes typed payload accessors: `getRunRecipePayload`, `getTrainingTaskSpecPayload`, `getMaterializeTrainingTaskSpecRequestPayload`, `getExperimentResultPayload`. Each accessor enforces a kind-check then casts to the contract interface. The SubmitJobForm preset now reads `recipe.run_recipe_hash` through `getRunRecipePayload(...)`. Same trust model as the rest of the typed views (backend AJV honors the schema on writes).


- [x] S3: type Baseline / Benchmark / Protocol; inline SVG sparkline for evaluation facts.

## 2026-05-29 — S3 Baseline/Benchmark/Protocol typed + Facts + Sparkline + scaffold extraction
Implemented S3 per `01-plan.md`. The 资产库 now has 5 sub-tabs (Dataset/Benchmark/Baseline/Protocol/Facts); Benchmark / Baseline / Protocol are typed forms (no more GenericAssetKindView fallback). Facts is a new sub-tab with three sortable sections + a sparkline visualization for MetricObservation.

Key deliverables:

- **payloads.ts** extended with 6 new typed accessors: `getBaselineAssetPayload`, `getBenchmarkAssetPayload`, `getEvaluationProtocolPayload`, `getEvaluationFactPayload`, `getMetricObservationPayload`, `getComparisonObservationPayload`. Same trust-model as the S2 accessors.
- **assets/BaselineAssetView.tsx** — typed form for `baseline_asset` (9 typed fields + Advanced JSON extras).
- **assets/BenchmarkAssetView.tsx** — typed form for `benchmark_asset` (11 typed fields).
- **assets/EvaluationProtocolView.tsx** — typed form for `evaluation_protocol`. The 8 free-shape policy/aggregation/comparison/etc. blocks render as editable `JsonAdvancedPanel` cards; the rest are typed.
- **assets/FactsView.tsx** — Facts sub-tab. Three sections (EvaluationFact / MetricObservation / ComparisonObservation), each a sortable table (column-click toggles direction). The MetricObservation section exposes a `metric_definition_ref` dropdown that drives an inline-SVG sparkline of numeric values over `created_at`, with latest/min/max/n chips beside the chart.
- **viz/SparklineSvg.tsx** — pure inline SVG. Computes path + last-point dot from `{x, y}` points. No external chart library.

**Scaffold extraction (post-review of duplication across 4 typed views)** — the review pass after first-draft S3 surfaced ~1500 lines of near-identical code across Dataset/Baseline/Benchmark/Protocol. Closed before commit:

- **assets/useTypedAssetDraft.ts** — shared hook owning controller wiring, draft state, `previousRecordIdRef` (so refresh of the SAME record does not stomp in-progress edits), `basePayload` tracking for round-tripping extras, `update` / `replaceDraft` / `handleNew` / `handleSave` lifecycle, and renderer-side validation routing.
- **assets/asset-helpers.ts** — `asStringArray` / `asRefArray` / `asString` / `asEnum` / `trimAndCompact` / `preserveCreatedAt`. Previously duplicated in each view.
- **components/AssetFilterToolbar.tsx** — shared "status filter + 刷新 + 新建" toolbar.
- **components/StringListEditor.tsx** — extracted from Dataset/Baseline.
- **components/MutationFeedback.tsx** — extracted success/error caption pair (kept static literal tones to satisfy the UI gate).

Each typed view now is purely declarative: declares its `Draft` shape, `BLANK`, `derive`, `build`, and the JSX field layout. Boilerplate per view dropped from ~470 lines avg to ~325 lines avg (≈30% reduction). Adding a 5th typed view (e.g. when `base_model_asset` lands) now means writing only the field-specific code.

- **assets/GenericAssetKindView.tsx deleted** — no remaining callers after S3 lands. The S1 placeholder is gone.
- **constants.ts** — `experimentFoundationAssetSubTabs` and `experimentFoundationAssetSubTabKeys` grew to 5 entries (added `facts`).

### S3 known-debt — none open
- Carried-forward S2 known-debt (renderer-stamped `created_at` / `updated_at`): still deferred but now centralised in `preserveCreatedAt(base)`. When the backend service starts auto-stamping, this helper changes in one place.
- Renderer test infrastructure (vitest scaffold) still absent. Recorded as a known follow-up since S1; no S3 code change without coverage was substantial enough to escalate.

### Decisions made while implementing S3
- The Facts sub-tab keeps three independent `selected` states (one per section). Cross-section coordination (e.g. "selecting a fact also highlights its observations") is out of scope for V1 visualization. Marked for re-evaluation when the user reports needing it.
- Sparkline X-axis sort uses lexicographic string compare on ISO timestamps. ISO 8601 is sortable, so this works. If a future caller passes non-ISO strings (e.g. arbitrary run_recipe_id), the chart order will be alphabetic; doc'd in the component header.
- Non-numeric `MetricObservation.value` entries silently skip the sparkline (`readNumericValue` returns null). The table still shows their other fields. Could surface a warning later if needed.
- All four typed forms preserve `created_at` from `basePayload` on edit via `preserveCreatedAt(base)`. New records still get a renderer-side `new Date().toISOString()`; centralising this leaves a single site to flip when backend stamping lands.
- [x] S4: read-only `PaperBindingPanel` with jump-to-flow.

## 2026-05-29 — S4 PaperBindingPanel (sidecar reverse drill) landed
Implemented S4 per `01-plan.md`. The `论文绑定` Tab is a strictly read-only surface that lists `paper_experiment_sidecar` records grouped by `paper_project_id`, surfaces the sidecar's full trace chain, and exposes a "跳到 实验流" button that preselects the matching `run_recipe`.

Key deltas:

- **`types.ts`** — `ExperimentFoundationPanelKey` extended with `'binding'`.
- **`constants.ts`** — `experimentFoundationTabs` grew from 4 to 5; the new `{ key: 'binding', label: '论文绑定' }` slot lives between `flow` and `promotion`.
- **`payloads.ts`** — added `getPaperExperimentSidecarPayload`.
- **`api.ts`** — added `getExperimentFoundationRecord(kind, id)` thin wrapper over the existing `GET /experiment-foundation/records/:kind/:id` endpoint. Required by the run_recipe preselect fallback.
- **`experiment-flow/useExperimentFlowController.ts`** — exposed `selectRunRecipeById(recordId)` + `selectRunRecipeStatus` + `selectRunRecipeError`. Mirrors the existing job preselect lifecycle.
- **`experiment-flow/ExperimentFlowPanel.tsx`** — accepts `preselectRunRecipeId` + `onPreselectRunRecipeConsumed`. Same in-page → single-record fetch fallback pattern as the job preselect.
- **`binding/PaperBindingPanel.tsx`** — new panel. Owns its own fetch state (no shared controller; binding is a leaf panel). Filters by `paper_project_id` partial match, groups by exact `paper_project_id`, renders a sortable grouped list. The detail pane shows nine ref summaries (run_recipe / dataset_version_lock / evaluation_protocol_lock / benchmark_asset / training_task_spec / materialization_result / optional external_job / and five ref arrays: result / validation_report / evidence_candidate / evaluation_fact / paper_table_fact_set) plus a full payload `JsonAdvancedPanel`. Jump-to-flow button uses the sidecar's `run_recipe_ref.ref_id`.
- **`ExperimentFoundationModule.tsx`** — owns the `pendingFlowRunRecipeId` sentinel and `handleJumpToFlowRunRecipe(id)` bridge. Switches activePanel to `'flow'` after raising the sentinel; the flow panel consumes and clears.
- **`smoke-e2e.mjs`** — assertions extended: `binding` tab label + activePanel routing; `<PaperBindingPanel>` mount + `handleJumpToFlowRunRecipe` + `pendingFlowRunRecipeId`; PaperBindingPanel reads `paper_experiment_sidecar` / `paper_project_id` / `getPaperExperimentSidecarPayload`; boundary check that the binding panel does NOT import `createExperimentFoundationRecord` / `upsertExperimentFoundationRecord` / `decideExperimentFoundationPromotion` (write paths stay in paper-implementation); flow controller exposes `selectRunRecipeById`; flow panel accepts the new preselect props; payloads exports `getPaperExperimentSidecarPayload`.

### S4 known-debt — none open
- Considered but explicitly NOT done: cursor pagination for the sidecar list. Reasoning: paper_experiment_sidecar volume per workspace is bounded (a few per paper × small number of active papers ≪ 50 default limit). The `paper_project_id` filter input handles search. Adding cursor here would complicate the grouped rendering for no current user benefit. This is YAGNI, not debt; if the workspace grows enough that 50 is hit in practice, the existing flow-controller cursor pattern is easy to drop in.
- Carried-forward from S2 (`preserveCreatedAt(base)` centralisation) and S5 (headless browser automation, full job lifecycle in smoke) still apply; not new with S4.

### Decisions made while implementing S4
- The binding panel is a leaf — it does NOT plug into `useExperimentFoundationController`. The shared controller is Promotion-only post-S2; binding has its own minimal fetch state because its model (group by paper_project_id) doesn't overlap with promotion's record-editor model.
- Jump-to-flow uses the sidecar's `run_recipe_ref.ref_id` (the record's id), not its hash. The flow controller's `selectRunRecipeById` fetches via `GET /records/run_recipe/:id`. If the run_recipe was deleted upstream while a sidecar still references it, the fetch returns 404 and the flow panel surfaces `selectRunRecipeStatus = 'error'`. Acceptable: the sidecar's trace chain still renders fully in the binding panel, only the jump becomes a dead link.
- `paper_project_id` shown as `(unknown paper)` if the payload fails the typed cast. This is defensive; the typed accessor returns null only when the record kind mismatches (which shouldn't happen since we query exactly `paper_experiment_sidecar`).
- [x] S5: land UI-driven full-flow smoke and update T-106 acceptance.

## 2026-05-29 — S5 UI-driven full-flow smoke landed (closes T-106 open checkbox)
Implemented S5 by extending `apps/desktop/scripts/smoke-e2e.mjs`. Both T-106's open acceptance ("UI-driven full-flow smoke covers registry, readiness, job submit/sync/cancel/collect, result/evidence detail, and error rendering without renderer-owned domain semantics") and T-110's S5 step are now satisfied.

### Strategy
- The repo does not have headless-browser tooling (Playwright/Puppeteer not installed). Introducing one would be a separate infrastructure task. The existing smoke harness boots a memory-backed backend + the desktop dev server and then runs (1) source-level static assertions on key components and (2) backend API exercises. That matches what T-106's UI Flow Contract actually asks the proof to verify ("backend APIs remain the source of decisions; renderer must not invent statuses; the user can walk the flow").
- Therefore S5 extends the existing harness rather than introduces a new browser-driven track.

### Coverage by the contract's 6 steps
- Step 1 (open 实验基座): asserts `coreNavItems` order, `<ExperimentFoundationModule>` mount, and Topbar's `aria-label="实验基座标签页"`.
- Step 2 (registry create/upsert + list/detail refresh): maps to the post-cutover 资产库 IA. Asserts the 5 sub-tab labels, the 5 typed-view mounts under `AssetLibraryPanel`, and the shared scaffold contract (every typed view uses `useTypedAssetDraft<...>` + `<AssetFilterToolbar>` + `<MutationFeedback>` + `<JsonAdvancedPanel>`). Backend POST `/records` for `dataset_asset` exercises canonical create + list refresh.
- Step 3 (readiness check + blockers): asserts `<ReadinessInspector>` mounted at module level (replaces the legacy single-target Readiness tab); the inspector is a `data-ui="modal"` and wires both `getLatestExperimentFoundationReadiness` + `checkExperimentFoundationReadiness`; the inspector has a `data-tone="danger"` branch. Backend POST `/readiness/check`, then GET `/readiness?status=blocked&limit=10` confirms the S0+ thin list endpoint returns the typed shape and that all entries actually have `readiness_status === 'blocked'`. GET `/readiness?status=not_a_status` returns 400 (canonical enum gate).
- Step 4 (recipe / materialization): `useExperimentFlowController` covers the 10 canonical stages including `recipe_draft` / `run_recipe` / `materialize_request` / `materialization_result` / `training_task_spec`; timeline reads payloads via `getRunRecipePayload(...)`; pagination plumbing (`FLOW_STAGE_PAGE_SIZE`, `loadMoreStage`, `nextCursor`) is asserted.
- Step 5 (submit / sync / cancel / collect + result/evidence): each form (`SubmitJobForm` / `SyncJobForm` / `CancelJobForm` / `CollectJobForm`) declared in `JobActionForms.tsx` and mounted by `<RunRecipeTimeline>`. Sync / Cancel / Collect gated on `disabled={!hasSelectedJob}`. Cancel CTA renders `data-variant="danger"` literal (per the S2 UI gate fix). Backend POST `/execution/jobs/submit` with empty body returns 400 (validation surface).
- Step 6 (malformed payload + error rendering): `data-tone="danger"` branches asserted in `OverviewPanel` + `ReadinessInspector` + `JobActionForms`. Backend POST `/records` with empty payload returns 4xx.

### Boundary audits also covered
- Renderer must not own backend / materialization semantics. Smoke asserts `fetch(` / `buildApp(` / `PrismaClient` / `child_process` / `new Ajv` / `LocalScriptAdapter` / `AliyunPaiDlcAdapter` / `TrainingPlatformAdapter` are NOT present in renderer sources.
- Renderer must not invent status classifications. Smoke asserts `OverviewPanel` reads `listExperimentFoundationReadinessReports` (canonical readiness reports, not record.status) and that the four shared classification constants (`EXPERIMENT_FOUNDATION_READINESS_BLOCKED_STATUSES` / `EXPERIMENT_FOUNDATION_ASSET_CANDIDATE_ATTENTION_STATUSES` / `EXPERIMENT_FOUNDATION_EVIDENCE_CANDIDATE_REVIEW_STATUSES` / `EXPERIMENT_FOUNDATION_EXTERNAL_TRAINING_JOB_IN_FLIGHT_STATUSES`) are imported from shared, not re-declared.
- Typed payload accessor surface: smoke asserts `payloads.ts` exports all 10 accessors.
- Sparkline must remain inline SVG: smoke rejects any `import 'recharts'` or `import 'd3'` in `SparklineSvg.tsx`.

### Decisions made while implementing S5
- Did NOT introduce headless-browser automation. Browser-driven coverage is documented as a follow-up below.
- Did NOT exercise a full submit→collect job lifecycle in smoke. Memory backend with LocalScript would need fixture wiring beyond S5 scope; instead the smoke asserts the endpoints exist by sending an empty body and expecting 400, which proves the route is registered and validation is alive. Job lifecycle is covered by T-106's deterministic hardening runner separately.
- Updated T-106's `00-overview.md` to flip the acceptance checkbox and reference the smoke command. Updated T-106's `02-architecture.md` UI Flow Contract section with a step-to-mount mapping so the legacy contract names stay anchored to the new IA.

### Follow-ups (out of S5)
- Headless-browser automation (Playwright). The current smoke is source + API; it does not actually drive the rendered DOM. Adding browser-driven coverage would catch render-time bugs (e.g. an effect that throws under specific data conditions). Tracked here as known-debt; revisit when the workbench grows surfaces that source assertions cannot meaningfully cover.
- Full submit→sync→collect job lifecycle in smoke (currently asserts endpoints exist via 400 responses; does not exercise success path against LocalScript). Lower priority since the T-106 deterministic hardening runner covers this on the backend side.

## 2026-05-28 — S1 DatasetAsset typed form + RefPicker landed
Implemented S1 per `01-plan.md` with the scope adjusted to match the actual shared contract for `DatasetAsset` (the canonical fields are `name / aliases / description / source_refs / task_types / schema_summary / default_version_id / catalog_status`, not the version/location/mirror fields that the original plan optimistically listed).

Key deltas:

- New `components/RefPicker.tsx` exposing `RefPicker` (single ref) and `RefPickerList` (array variant). Type-ahead is backed by the existing `/records?record_kind=...` endpoint with a 220ms debounce and a 20-result page cap. Free `refType` values (e.g. `desktop_workbench`, `literature_record` for source_refs) skip the candidate lookup. If a typed `ref_id` does not match a recent candidate, the component renders a soft "未匹配候选" hint and lets the backend take the final say — it never blocks submission.
- New `components/JsonAdvancedPanel.tsx` providing a collapsible "高级 JSON" disclosure usable both as a read-only viewer and as an editable textarea. Used by the typed form for `schema_summary` (free-shape) and by the generic asset views for the whole payload.
- New `assets/useAssetKindController.ts` is a per-record-kind controller used by every sub-tab inside the asset library. Filter and selection state reset on `recordKind` change so sub-tab switching cannot pollute another sub-tab's state (the analog of T-078's post-review fix at the sub-tab level).
- New `assets/DatasetAssetView.tsx` is the first researcher-facing typed surface: typed fields for `dataset_asset_id` (locked on edit), `name`, `description`, `catalog_status` (enum select from shared `EXPERIMENT_FOUNDATION_DATASET_CATALOG_STATUSES`), `aliases` and `task_types` (small string-list editors), `source_refs` (RefPickerList), `default_version` (RefPicker constrained to `dataset_version`), and `schema_summary` (Advanced JSON). Any contract fields the form does not yet cover are surfaced read-only under "高级 JSON（未 typed 字段）" so frozen payloads round-trip without loss.
- New `assets/GenericAssetKindView.tsx` is the placeholder typed-form for Benchmark / Baseline / Protocol sub-tabs: list + record_id input + Advanced JSON payload editor. It uses the same `useAssetKindController`. Real typed forms for these three kinds are S3 work.
- New `assets/AssetLibraryPanel.tsx` is the sub-tab shell (4 sub-tabs: Dataset / Benchmark / Baseline / Protocol). Model is deliberately absent: `base_model_*` exists only as a candidate kind in V1; the canonical `base_model_asset` is V1 follow-up scope.
- `ExperimentFoundationModule.tsx`: removed the local `RegistryPanel`, `RegistryFilters`, `RegistryFilters` helpers, and the unused `RecordEditor` shape. The renamed `资产库` tab now renders `<AssetLibraryPanel />`.
- `useExperimentFoundationController.ts`: removed `registryFilters`, `setRegistryFilters`, `initialRegistryFilters`. The `activeRecordFilters` memo now falls through to `candidateFilters` (used by Promotion / no-panel cases), and the `activatePanel` switch no longer references the retired `'registry'` key. Promotion / Recipes / Execution panels continue to use the shared controller as before; Overview and the new Assets tab own their fetch state through their own controllers.
- `types.ts`: `ExperimentFoundationPanelKey` `'registry' → 'assets'`.

### Decisions made while implementing S1
- DatasetAsset typed form does not stamp `created_at` on edit — it preserves the original from the selected record and updates `updated_at` only. New records receive both timestamps from the renderer (ISO now) since the backend's schema requires them; future S2/S3 may move this to the backend instead. Recorded as a follow-up known-debt above.
- `default_version` is a `RefPicker` constrained to `dataset_version` even though `default_version_id` is contractually just a string id, not a ref. The renderer-side RefPicker stores `{ref_type: 'dataset_version', ref_id: ...}` for UX continuity; only the `ref_id` portion is written into the payload.
- The 01-plan field list (canonical_name / version_label / family / etc.) was inaccurate — those fields live on `DatasetVersion`, `DatasetLocation`, and `DatasetMirror`, not on `DatasetAsset`. S1 acceptance was updated in 04-verification to match the actual contract.
- Model sub-tab is deferred until a canonical `base_model_asset` record kind ships (V1 follow-up scope per T-043).
- `useAssetKindController.createRecord` keeps a `_recordId` parameter for API symmetry with `upsertRecord`, even though the backend derives the id from the payload — kept underscore-prefixed so TS6133 doesn't fire and call sites stay uniform. **Updated 2026-05-28 post-review:** the signature was tightened to `createRecord(payload)` so the API matches reality; both call sites updated.

## 2026-05-28 — S1 post-review fixes
Self-review of the S1 implementation surfaced six concrete issues; all but two were fixed before moving on. The two deferred items are tracked above under "S2 known-debt".

1. **Draft preservation in `DatasetAssetView` and `GenericAssetKindView`** — the prior `useEffect([controller.selectedRecord])` overwrote the in-progress draft whenever the selectedRecord reference changed (e.g. after `refresh()` returned a new object for the same record id). Fix: hold the previously seen `record_id` in a ref and only re-derive the draft when the id actually changes. Saving the same record (upsert returns the canonical version with the same id) now preserves the user's in-progress edits; switching to another record or to "新建" still triggers a clean derivation.
2. **Auto-fetch on every filter keystroke in `useAssetKindController`** — `refresh` previously depended on `filters.status`, so each character typed into the status filter input triggered a network request. Fix: hold `filters` in a ref; `refresh` reads `filtersRef.current` and only `recordKind` remains as a `useCallback` dependency. Filter edits update local state for the controlled input; the user must click "刷新" (or change sub-tab) to refetch.
3. **Wasted `loadRecords` / `loadJobs` on panels that don't consume them** — the main controller previously fired `loadRecords` on every render where `loadRecords` identity changed (which is every `activePanel` flip). Overview, Assets, and Readiness panels do not consume `controller.records`; Overview/Assets/Readiness also don't need `controller.jobs`. Fix: guard the `useEffect` so `loadRecords` runs only on Promotion / Recipes / Execution, and `loadJobs` runs only on Execution. Eliminates an extra round-trip on first mount (default activePanel is `overview`) and on every navigation that doesn't touch the shared list.
4. **`RefPicker` invariant: `value.ref_type` MUST land inside `allowedRefTypes`** — when a caller passed mismatched `refType="X"` and `allowedRefTypes=["Y"]`, the internal select could end up displaying an out-of-options value. Fix: in both the initial state and the external-value-sync `useEffect`, prefer the incoming `value.ref_type` only when it is in the allowlist (or when there is no allowlist), otherwise fall back to the first allowlist entry.
5. **`useAssetKindController.createRecord(_recordId, payload)` → `createRecord(payload)`** — the unused `_recordId` was a vestigial parameter from a misread of the backend behavior (the service derives the id from the payload). Both call sites updated.
6. **`JsonAdvancedPanel` editable/onChange coupling** — `editable: true` previously did not require an `onChange`, allowing a silent downgrade to readonly. Fix: the prop type is now a discriminated union — `editable: true` requires `onChange`; `editable: false` (or omitted) forbids `onChange`. Compiler enforces it at every call site.

Verification: desktop typecheck + build PASS after these fixes; UI gate + UI test suite + smoke + governance lint all re-run green.

## 2026-05-28 — S0 Overview shell landed
Implemented S0 per `01-plan.md`. Key deltas:

- Added `apps/desktop/src/renderer/modules/experiment-foundation/overview/OverviewPanel.tsx` and `overview/useOverviewController.ts`. The controller does two parallel calls (`listExperimentFoundationRecords` with no `record_kind` filter, `listExperimentFoundationJobs` with no filters) and derives 4 counters + 3 short lists from the returned at-most-50-row slices.
- Counter buckets:
  - `进行中 jobs` = job_status ∈ `{submitted, queued, running, cancelling}` (covers the in-flight set from `EXPERIMENT_FOUNDATION_EXTERNAL_TRAINING_JOB_STATUSES`).
  - `阻塞记录` = record.status ∈ `{blocked, failed, invalid, stale}`.
  - `待晋升候选` = `record_kind` endsWith `_candidate` AND status ∈ `{needs_info, manual_review_required, accepted_partial, pending, pending_review}`.
  - `可用 evidence` = `record_kind == 'evidence_candidate'` AND status ∈ `{valid, fresh, passed, ready}`.
- Lists cap at 5 items each. The Overview snapshot explicitly notes the 50-row sampling caveat in caption text.
- Added `components/StatusBadge.tsx` and removed the duplicated `StatusBadge` / `statusTone` from `ExperimentFoundationModule.tsx`. This was a planned S1 extraction; doing it in S0 saved an inline copy in OverviewPanel.
- Extended `useExperimentFoundationController` with `goToJob` / `goToReadiness` / `goToPromotion` deep-link callbacks. `goToJob` activates the execution panel and calls the existing `selectJobById`; `goToReadiness` activates readiness and presets target kind/id; `goToPromotion` activates promotion, narrows `candidateFilters.recordKind` to the candidate's kind when it is in the promotable set, and presets `promotionCandidateId`.
- Changed default `activePanel` from `'registry'` to `'overview'` and added the `overview` key to `ExperimentFoundationPanelKey`.
- `panelTabs` now leads with `{ key: 'overview', label: '概览' }`; all existing tabs and their behavior remain untouched.

### Decisions made while implementing S0
- Counter "blocked readiness" was reframed as "blocked records" because there is no list-readiness endpoint. The current implementation reads `record.status` across all kinds returned by `/records` (no `record_kind` filter), which is a valid read of the existing endpoint and respects the soft-backend rule. If accuracy beyond 50 rows is needed later, S2/S3 can either page or request a thin read-only `q`/`limit` extension on the existing GET.
- `OverviewPanel` does NOT mutate or own any cross-tab state itself. All deep-link side-effects are concentrated in `useExperimentFoundationController.goTo*` so behavior remains testable from the controller in isolation.
- Section subheadings use `data-variant="label"`. First attempt used `h4` and was correctly rejected by the UI governance gate — the text role contract permits only `body | caption | label | h1 | h2 | h3`. Recorded in `05-pitfalls.md`.
