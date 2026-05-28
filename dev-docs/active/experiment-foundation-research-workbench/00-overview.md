# T-110 Experiment Foundation Research Workbench

## Status
- State: in-progress
- Active phase: S1 DatasetAsset typed form + reusable RefPicker
- Task ID: `T-110`
- Mapping: `M-001 > F-001 > R-012 > T-110`
- Parent task: `T-043 experiment-foundation-v1`
- Follows: `T-078 experiment-foundation-desktop-workbench` (V1 minimum closure)
- Coordinates with: `T-106 experiment-foundation-real-interaction-hardening` (open UI smoke acceptance)
- Trigger: T-078 closed the JSON-textarea minimum-closure workbench; this task evolves it into a research-facing tool aligned with the user's primary needs (observation, human-in-loop operation, experiment↔paper binding).

## Goal
- Upgrade the desktop `实验基座` workbench from an operator-grade JSON bridge to a researcher-grade workbench that surfaces experiment state, supports human-in-the-loop actions on assets and runs, and exposes the relationship between in-flight experiments and paper implementations.
- Land typed semantic editing for the most-used reusable assets (starting with `DatasetAsset`). Unfrozen or advanced fields remain reachable through an "Advanced JSON" panel inside a selected record's detail view; the generic JSON CRUD is no longer exposed as a top-level navigation tab.
- Retire the T-078 5-tab JSON-textarea IA phase by phase as the new IA absorbs each surface; do not leave the old tabs in place as a permanent fallback.
- Introduce a reusable `RefPicker` primitive that later milestones consume; avoid open-coded ref inputs.
- Replace the JSON-heavy execution tab with a `RunRecipe`-anchored experiment timeline that contextualizes submit/sync/cancel/collect.
- Provide light, dependency-free visualization for evaluation facts to support secondary needs (view baseline/benchmark, view results).
- Close the open T-106 UI-driven full-flow smoke acceptance criterion by landing it on the new IA.

## Non-Goals
- Do not add new experiment-foundation domain semantics, write-path REST endpoints, or DB tables. Two forms of read-only backend extension are allowed under the soft-preference rule: (1) thin query-parameter additions on existing GET endpoints (e.g. `q`, `order_by`, `limit`, scoped filter keys); (2) thin new GET endpoints that surface already-persisted state with no DTO shape change and no new domain rules — used in support of cross-flow observability such as Overview counters. Shared contract additions are also allowed when limited to status classification constants/sets that codify existing enum membership (no new states, no new domain rules) — this is the only sanctioned way to eliminate renderer-side semantic drift.
- Do not move readiness rules, adapter execution, materialization generation, result validation, or paper-claim semantics into the renderer.
- Do not introduce auto hyperparameter search or any unattended tuning policy.
- Do not redesign `paper-implementation-desktop-workbench` (T-100); paper-binding view consumes sidecar refs only.
- Do not add new chart/visualization library dependencies; result views must use tables plus inline SVG.
- Do not recreate `apps/desktop/src/renderer/styles/**` or `app-layout.css`; styling stays on `data-ui` + tokens.
- Do not retain a permanent generic JSON CRUD navigation tab. Per-record "Advanced JSON" panels (visible only after selecting a record) remain available for unfrozen/advanced fields.
- Do not introduce real Aliyun PAI-DLC credential handling in this task.

## Boundary Contract
- Owns desktop presentation, navigation, and renderer-local state.
- Consumes shared `@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts` enums and types only; never duplicates them.
- Consumes existing backend APIs: `/experiment-foundation/records`, `/experiment-foundation/readiness/**`, `/experiment-foundation/candidates/:candidate_id/promotion`, `/experiment-foundation/execution/jobs/**`. Write-path endpoints are not changed by this task. Two thin read-only backend extensions are permitted: list query-parameter additions on existing GET endpoints, and new thin GET endpoints that expose already-persisted state without DTO shape change or new domain rules (the readiness list endpoint for Overview is the primary instance).
- Reads `paper_experiment_sidecar` records via the same `/records` API. Writing or attaching sidecar records remains in paper-implementation surfaces; T-110 paper-binding view is strictly read + navigate.
- Does not own persistence, adapter execution, readiness rules, validation rules, or paper-claim semantics.

## Acceptance Criteria
- [ ] An Overview page exists and is the default landing for `实验基座`; it shows in-flight job count, blocked readiness count, pending promotion candidate count, and a recent evidence list. "blocked readiness count" reads the canonical readiness report list (via a thin read-only GET endpoint, not via `record.status` proxy). All status classifications (blocked / pending / fresh) are imported from shared contract constants — no renderer-side status string sets.
- [ ] DatasetAsset has a typed create/edit form with field-level validation, structured `dataset_locations`, `mirrors`, and `*_ref` fields driven by a reusable `RefPicker` component.
- [ ] `RefPicker` is consumed by at least one non-Dataset surface (S2 or S3) to prove reusability.
- [ ] Experiment flow tab renders a timeline for a selected `RunRecipe` covering materialization → task spec → external job → result → evidence with state badges and ref summaries.
- [ ] Submit / sync / cancel / collect actions are surfaced as typed buttons on the relevant timeline node, with structured field forms replacing the textarea JSON editors for these requests.
- [ ] Baseline, Benchmark, and Protocol have typed list+detail views; their typed edit forms may reuse the Dataset pattern or remain JSON-fallback per phase plan, but no surface regresses below the current T-078 capability.
- [ ] `EvaluationFact` and `MetricObservation` are rendered as a sortable table plus inline SVG sparkline without adding chart-library dependencies.
- [ ] A `论文绑定` view exists, lists `paper_experiment_sidecar` records, and supports navigating into the experiment flow for a selected sidecar.
- [ ] The T-078 5-tab IA is retired phase by phase as the new IA absorbs each surface; no permanent generic JSON CRUD navigation tab remains by S2 cutover.
- [ ] An "Advanced JSON" panel inside the selected record's detail view remains available for unfrozen/advanced fields (write path unchanged).
- [ ] No renderer-side `*_STATUSES` sets exist for cross-kind status classification; every classification used by Overview or any later panel imports from `@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts`.
- [ ] UI uses `data-ui` and token-governed styling; no entries are added under `apps/desktop/src/renderer/styles/**` or `app-layout.css`.
- [ ] UI governance gate, desktop typecheck/build, desktop smoke, project governance lint, and `git diff --check` all pass for the landed state.

> Note: the UI-driven full-flow smoke is co-owned with T-106. The implementation is delivered as part of S5 in this task, but the acceptance checkbox lives on T-106's `00-overview.md`. T-110 closure does not block on T-106's acceptance flip; T-110 only requires that S5's smoke command is reproducible and documented.

## Done Means
- All Acceptance Criteria boxes are checked.
- `00-overview.md` reflects done status, `04-verification.md` records each command run with PASS/FAIL, and `05-pitfalls.md` records lessons from the work.
- Project governance lint passes; task is archived via `update-dev-docs-for-handoff` with status=done.
