# Roadmap

## Summary
- Decision: `NEW_TASK`
- Task ID: `T-110`
- Slug: `experiment-foundation-research-workbench`
- Mapping: `M-001 > F-001 > R-012 > T-110`
- Parent task: `T-043 experiment-foundation-v1`
- Follows: `T-078 experiment-foundation-desktop-workbench` (V1 minimum closure, done)
- Coordinates with: `T-106 experiment-foundation-real-interaction-hardening` (open: UI-driven full-flow smoke)

## Why Now
- T-078 landed `实验基座` as a JSON-textarea operator workbench that is sufficient for backend contract verification but is not usable by researchers as a daily tool.
- The user's stated primary needs for the workbench are: (1) observe state of in-flight and planned experiments, (2) support human-in-the-loop operations effectively, (3) link in-flight or planned experiments to specific paper implementations.
- Secondary needs are: view baseline and benchmark catalogs, view experiment results with light visualization.
- T-043 V1 overview explicitly lists "typed CRUD/search UX beyond generic JSON registry" as follow-up scope; this task picks it up without expanding domain semantics.
- T-106 acceptance still has an open box for UI-driven full-flow smoke; the IA refactor here is the natural surface to land it on.

## Milestones
1. **S0 Overview shell** — new default landing page that surfaces in-flight/blocked/promoted state by reusing existing list APIs (first cut, used `record.status` proxy and renderer-side classification sets — both are removed by S0+).
2. **S0+ Dual-track cleanup** — lands before S1. Pulls status classifications into shared contract constants; adds a thin read-only `GET /experiment-foundation/readiness` endpoint; rewires Overview to read canonical signals. Removes the renderer-invented status sets. This is a non-optional follow-up to S0 to eliminate dual-track and semantic-drift risk before further IA work.
3. **S1 DatasetAsset typed form + reusable RefPicker** — first semantic editor under a restructured `资产库` tab; RefPicker is a shared primitive consumed by later milestones. Removes the legacy `资产/合同` top-level tab.
4. **S2 Experiment flow timeline** — replace the JSON-heavy execution tab with a `RunRecipe`-anchored timeline; contextualize submit/sync/cancel/collect into typed action panes. Removes the legacy `Recipe/Materialization`, `执行/证据`, and single-target `Readiness` top-level tabs.
5. **S3 Baseline/Benchmark typed views + light result visualization** — replicate the S1 form pattern for Baseline/Benchmark/Protocol; render `EvaluationFact` and `MetricObservation` as sortable tables with inline SVG sparkline; do not introduce new chart libraries.
6. **S4 Paper-binding reverse drill** — sidecar-driven `论文绑定` view enabling navigation from a paper project into its dependent experiments. Confirmed lower priority; lands after S0–S3.
7. **T-106 UI smoke landing** — implement the UI-driven full-flow smoke that walks Overview → Asset → Recipe → Execution → Evidence and verify error rendering and disabled states; coordinate with T-106 closure.

## Out Of Scope
- New experiment-foundation domain semantics, new shared contracts, new write-path REST endpoints, new Prisma tables.
- Readiness, adapter execution, materialization generation, result validation, or paper-claim semantics inside the renderer.
- Auto hyperparameter search, automated tuning, or any non-human-in-loop policy.
- TuningSession / TuningProposal / TuningDecision / TuningTrial UI (deferred to T-111+).
- Sidecar attach / write actions in the paper-binding view (kept on paper-implementation T-100).
- Replacing or refactoring `paper-implementation-desktop-workbench` (T-100) surfaces.
- Real Aliyun PAI-DLC credential and submission hardening (tracked separately).
- New chart/visualization library dependencies.

## Allowed within scope (soft)
- Thin read-only list query-parameter extensions (`q` / `order_by` / `limit` / scoped filter keys) on existing GET endpoints when needed to keep typed surfaces (notably `RefPicker`) usable. MUST NOT change response DTO shape or add domain rules.

## Top-level decisions (settled 2026-05-28)
- Backend boundary: soft preference. Two thin read-only extensions allowed — query-param additions on existing GET endpoints, AND new thin GET endpoints that surface already-persisted state without DTO shape change or new domain rules. Shared contract additions allowed only for read-only status classification constants whose members subset canonical enums.
- S4 paper binding: read-only reverse drill; attach stays in T-100.
- TuningSession UI: not in T-110.
- T-106 UI smoke: implementation lands in T-110 S5; acceptance checkbox owned by T-106; T-110 closure not gated on T-106's flip.
- Old T-078 5-tab IA: retired phase by phase as the new IA absorbs each surface. No permanent generic JSON CRUD navigation tab remains. Per-record "Advanced JSON" panels stay reachable from within a selected record's detail.
- Counter classifications: every "blocked/pending/fresh" classification used by Overview or any later panel imports from shared contract constants, not from renderer-local string sets. Overview's "blocked" counter reads canonical readiness reports, not `record.status` as a proxy.

## Risks
- IA migration risk: existing automated/operator flows depend on today's 5-tab structure; the new IA must keep generic JSON record editing reachable as an "advanced" panel so contract-frozen payloads stay writable.
- RefPicker scope creep: it must be a thin lookup over the generic `/records?record_kind=...` listing; resist turning it into a full graph browser.
- Scope creep into paper-implementation territory: S4 reverse drill must consume sidecar refs only; it must not duplicate paper-claim UI.
- Visualization scope creep: S3 must stay at table + inline SVG; richer charts are explicitly deferred.

## Rollback
- Each milestone (S0..S4) lands behind navigation entries and tab swaps that are reversible by leaving the existing `ExperimentFoundationModule.tsx` JSON panels in place as the "advanced" fallback.
- The new components live under a new directory tree; reverting any phase is a tab-list edit plus removal of the new directory.
