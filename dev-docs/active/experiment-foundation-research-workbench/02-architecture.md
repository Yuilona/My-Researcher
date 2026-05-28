# 02 Architecture

## UI Ownership
- The workbench remains a presentation and workflow surface; domain rules stay in shared contracts and backend services (T-076 persistence/API, T-077 execution adapters).
- Renderer must not become a hidden owner of experiment semantics. Validation in the renderer is a UX guardrail, not the source of truth.
- All record kinds and job statuses MUST be imported from `@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts`. Duplicating these constants in the renderer is forbidden.

## Information Architecture
- New top-level tabs under `实验基座` (target end-state after S4):
  1. `概览` (Overview, default) — counters + recent lists; new in S0/S0+.
  2. `资产库` (Asset Library) — sub-tabs Dataset / Benchmark / Baseline / Protocol / Model. Typed forms land progressively across S1 and S3. There is NO "Other" sub-tab and NO generic JSON CRUD top-level tab.
  3. `实验流` (Experiment Flow) — `RunRecipe`-anchored timeline; lands in S2.
  4. `候选晋升` (Promotion) — kept; no scope change.
  5. `论文绑定` (Paper Binding) — sidecar reverse drill; lands in S4.
- The T-078 5-tab IA (`资产/合同` / `Readiness` / `候选晋升` / `Recipe/Materialization` / `执行/证据`) is retired phase by phase as the new IA absorbs each surface:
  - `资产/合同` removed in S1 when `资产库` lands.
  - `Recipe/Materialization` and `执行/证据` removed in S2 when `实验流` lands.
  - `Readiness` removed in S2 once Overview's readiness deep-link and the experiment-flow node side panels cover per-target lookup.
  - `候选晋升` is the only legacy tab that survives unchanged (renamed if needed).
- Generic JSON record CRUD is never exposed as a top-level navigation surface. It survives only as an "Advanced JSON" disclosure inside a specific record's detail view, where the writer can clearly see which `record_kind:record_id` they are mutating. This eliminates the "Overview number disagrees with Registry tab field" dual-track that a permanent JSON tab would create.

## Module Layout
```
apps/desktop/src/renderer/modules/experiment-foundation/
  ExperimentFoundationModule.tsx        # tab shell; thin
  useExperimentFoundationController.ts  # shared selection/refresh; may split per-panel
  api.ts                                # unchanged; existing endpoints only
  types.ts                              # extended for new view models, no contract drift
  utils.ts                              # extended for typed form helpers
  overview/
    OverviewPanel.tsx
    useOverviewController.ts
  components/
    RefPicker.tsx                       # shared primitive
    StatusBadge.tsx                     # extracted for reuse
    JsonAdvancedPanel.tsx               # advanced JSON fallback
  assets/
    AssetLibraryPanel.tsx               # sub-tab shell
    DatasetAssetView.tsx                # S1
    BenchmarkAssetView.tsx              # S3
    BaselineAssetView.tsx               # S3
    ProtocolView.tsx                    # S3
    ModelAssetView.tsx                  # may stay list+Advanced-JSON for V1
  experiment-flow/
    ExperimentFlowPanel.tsx             # S2
    RunRecipeTimeline.tsx
    JobActionForms.tsx                  # typed submit/sync/cancel/collect
  paper-binding/
    PaperBindingPanel.tsx               # S4
  viz/
    SparklineSvg.tsx                    # S3 only; inline SVG, no deps
```

## Data Flow
- All reads go through the existing `listExperimentFoundationRecords` and `listExperimentFoundationJobs`. Overview composes counts from the same listings.
- All writes go through the existing `createExperimentFoundationRecord` / `upsertExperimentFoundationRecord` for record CRUD, and `/execution/jobs/**` for job actions. The typed forms compose the payload locally; the network shape is unchanged.
- Cross-tab selection (e.g. Overview deep-link to Execution) is held in the renderer's controller state, never persisted to localStorage or backend.

## RefPicker Contract
- Inputs: `refType: ExperimentFoundationRecordKind | 'desktop_workbench' | 'paper_project' | 'literature' | string`; `value: ExperimentFoundationRef | null`; `onChange(next: ExperimentFoundationRef | null)`.
- Behavior: when `refType` is a record kind known to the registry, type-ahead queries the list API with `record_kind=<refType>` and a `q` parameter (free-text filter on `record_id`); when `refType` is free (e.g. `desktop_workbench`), only manual entry is allowed.
- Array variant: `RefPickerList` for `*_refs[]` fields, with add/remove.
- The component does not enforce existence; it surfaces "unknown ref" as a soft warning if the typed-ahead query returns no match.

## Backend Ownership Inputs
- T-076 owns registry/readiness persistence and APIs.
- T-077 owns external job runtime state, execution adapter behavior, result collection, validation, and evidence candidate creation.
- This task MUST NOT extend Prisma tables, write-path REST handlers, response DTO shapes, or domain services. Two thin read-only extensions are sanctioned by the soft-preference rule:
  1. Query-parameter additions on existing GET endpoints (e.g. `q`, `order_by`, `limit`, scoped filter keys).
  2. New thin GET endpoints that surface already-persisted state with no DTO shape change and no new domain rules — the canonical example is `GET /experiment-foundation/readiness` for Overview observability.
- Shared contract additions are sanctioned ONLY for: (a) read-only status classification constants (typed `as const` tuples whose members are subsets of canonical enums, with schema tests that fail when the canonical enum is renamed without updating the classification); (b) thin list-response wrapper types and their JSON schemas for the newly sanctioned list endpoints — pagination wrappers around existing item DTOs only, no item-shape changes. Neither (a) nor (b) may introduce new states, transitions, or domain rules.
- Backend write paths, readiness rules, materialization generation, adapter execution, and result validation remain out of scope and out of bounds.

## UI Constraints
- Use `data-ui` + token-governed styling per repository UI freeze rule.
- Do not add or extend `apps/desktop/src/renderer/styles/**` or `app-layout.css`. Continue using `ui/styles/ui.css` and `ui/styles/desktop-runtime/**` as inherited.
- Tailwind use restricted to `B1-layout-only`.
- UI governance gate requires static `data-ui` attribute literals; dynamic attributes were rejected in T-078 review and must not regress.

## Key Risks
- IA migration breaks current automated/operator habits if the JSON fallback is not preserved. Mitigation: keep `资产库 → Other` covering every record kind, and keep `实验流 → Advanced JSON` for jobs.
- `RefPicker` overscope. Mitigation: hard cap on responsibilities — list-based type-ahead only, no graph navigation, no inline create.
- Visualization scope creep. Mitigation: S3 ships only inline SVG sparkline; richer charts are out of scope and require a new task.
- T-106 coordination drift. Mitigation: S5 references T-106 acceptance directly and updates that task's `00-overview.md` checkbox when the smoke command lands.
- Scope creep into paper-implementation surfaces. Mitigation: S4 strictly read-only and uses `paper_experiment_sidecar` records via the existing records API.

## Verification Strategy
- Static: typecheck, build, UI governance gate, project governance lint, git diff check after each phase.
- Behavioral: desktop smoke (Electron and/or Computer Use visual smoke) after S0, S1, S2, S3, S4 land. Memory repository config recommended (see T-078 pitfalls).
- Coordination: S5 closes T-106's UI smoke acceptance box and is verified by both this task's `04-verification.md` and T-106's verification log.
