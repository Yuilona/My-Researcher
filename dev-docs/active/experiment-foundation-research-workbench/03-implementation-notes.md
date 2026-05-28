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
- [x] S0 side-task: extract `StatusBadge` (and `statusTone` helper) into `components/StatusBadge.tsx` so OverviewPanel and future panels reuse a single source. `JsonAdvancedPanel` extraction stays deferred to S1 since no S0 surface needs it yet.
- [ ] S1: implement `RefPicker` and `RefPickerList`.
- [ ] S1: type DatasetAsset form against shared `dataset_asset` record contract.
- [ ] S1: extract `JsonAdvancedPanel` from `ExperimentFoundationModule.tsx` to back the typed form's "Advanced JSON" toggle.
- [ ] S2: implement `RunRecipeTimeline` and typed `JobActionForms`.
- [ ] S3: type Baseline / Benchmark / Protocol; inline SVG sparkline for evaluation facts.
- [ ] S4: read-only `PaperBindingPanel` with jump-to-flow.
- [ ] S5: land UI-driven full-flow smoke and update T-106 acceptance.

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
