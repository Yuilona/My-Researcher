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


- [ ] S3: type Baseline / Benchmark / Protocol; inline SVG sparkline for evaluation facts.
- [ ] S4: read-only `PaperBindingPanel` with jump-to-flow.
- [ ] S5: land UI-driven full-flow smoke and update T-106 acceptance.

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
