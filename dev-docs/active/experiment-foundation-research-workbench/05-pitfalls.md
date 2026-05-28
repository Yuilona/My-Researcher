# 05 Pitfalls

## Inherited from T-078 (do not re-introduce)
- Do not create or extend `apps/desktop/src/renderer/styles/**` or `app-layout.css`.
- Do not duplicate backend domain rules in renderer state. Readiness, validation, materialization generation, and adapter execution stay in backend/shared.
- Do not copy `EXPERIMENT_FOUNDATION_RECORD_KINDS`, `EXPERIMENT_FOUNDATION_TRAINING_ADAPTER_KINDS`, or `EXPERIMENT_FOUNDATION_EXTERNAL_TRAINING_JOB_STATUSES` into the renderer. Always import from `@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts`.
- Do not let panels share a single `record_kind` filter. Each operation surface keeps its own filter scope (T-078 post-review fix).
- Do not expose `asset_candidate_triage_report` as a promotion target.
- UI governance gate requires static `data-ui` attribute literals. Dynamic `data-tone={...}` failed the gate during T-078 and must stay expressed through explicit render branches.
- Use memory repository config when running desktop smoke if the local Postgres has not applied experiment-foundation migrations; otherwise registry list can show backend `INTERNAL_ERROR` unrelated to the renderer.

## Do Not Repeat (new for T-110)
- Do not retain a permanent generic JSON CRUD navigation tab. Frozen contract payloads remain writable through a per-record "Advanced JSON" disclosure panel inside the selected record's detail view — never as a top-level tab. Reason: a permanent JSON tab creates a dual-track display ("Overview number disagrees with Registry tab field") that erodes operator trust.
- Do not classify status strings in the renderer. Any "which statuses count as blocked/pending/fresh" decision MUST live in shared contract constants (`EXPERIMENT_FOUNDATION_*_STATUSES`) whose membership is verified by schema tests against the canonical enum. Reason: renderer-side string sets silently drift when the backend renames or adds states.
- Do not read `record.status` as a proxy for `readiness_report.readiness_status`. They are independent backend signals and will diverge; if Overview or any panel needs a "blocked" count, it MUST query the canonical readiness list endpoint.
- Do not let `RefPicker` grow into a graph browser or inline-create panel. It is a list-API-backed type-ahead, nothing more.
- Do not add a charting library for S3 visualization. Inline SVG sparkline only. Any need for richer charts is a new task.
- Do not write or attach `paper_experiment_sidecar` records from the binding view. That write path stays in paper-implementation surfaces.
- Do not move the `实验基座` nav placement. It must remain below `文献管理` per `DP-01`.
- Do not introduce new Prisma tables, write-path REST endpoints, item-DTO shape changes, or domain services in this task. Two thin read-only backend extensions are sanctioned: (1) list query-parameter additions on existing GET endpoints; (2) new thin GET endpoints that surface already-persisted state. Shared contract additions are sanctioned for: (a) read-only status classification constants whose members subset existing canonical enums; (b) thin list-response wrapper types and JSON schemas for the sanctioned list endpoints — wrappers around existing item DTOs only, no item-shape changes. Any other unmet UX requirement that needs backend change is a follow-up task.
- Do not expose any sidecar attach/write action from the `论文绑定` view. T-110 paper-binding is strictly read + jump-to-flow; the attach path stays in paper-implementation (T-100) surfaces.
- Do not surface TuningSession / TuningProposal / TuningDecision / TuningTrial UI in this task. They are explicit follow-up scope (T-111+).

## Resolved Issues

### 2026-05-28 — `data-variant="h4"` rejected by UI governance gate (S0)
- Symptom: First S0 gate run failed with 3 `contract-enum` errors against `OverviewPanel.tsx` (`Role text attribute data-variant invalid value: h4`).
- Root cause: The UI contract at `ui/contract/contract.json` restricts the `text` role's `data-variant` enum to `body | caption | label | h1 | h2 | h3`. `h4` is not in the contract.
- What was tried: A direct rename to `data-variant="label"` for the 3 affected section subheadings.
- Fix: Section subheadings render as `<p data-ui="text" data-variant="label" data-tone="primary">`.
- Prevention: When introducing new text hierarchy, look up the allowed `data-variant` set in `ui/contract/contract.json` before writing the component. Do not assume `h4`/`h5`/`h6` exist just because they exist in HTML semantics.

### 2026-05-29 — Dynamic `data-variant={ctaVariant}` rejected (S2)
- Symptom: UI gate failed in `JobActionForms.tsx:52` with `contract-dynamic`: "Attribute data-variant is dynamic but contains no analyzable string literals."
- Root cause: the action shell component accepted `ctaVariant?: 'primary' | 'danger'` and threaded it straight into `<button data-variant={ctaVariant}>`. Even with a tight union type, the UI gate's static analyzer can't see through the variable.
- Fix: render two explicit JSX branches — `data-variant="danger"` for the cancel CTA, `data-variant="primary"` for the rest.
- Prevention: same rule as S0's `data-tone` dynamic regression — for any `data-ui` enum attribute, render a conditional with explicit literal strings instead of binding a variable. The S0 pitfall covered tone; this one extends it to variant.

### 2026-05-28 — `data-variant="menu"` and `data-size` on `list`; `data-tone="warning"` on `text` (S1)
- Symptom: First S1 UI gate run failed with 3 errors in `RefPicker.tsx`: `<ul data-ui="list" data-variant="menu" data-size="sm">` produced both a `contract-enum` error on `variant` and a `contract-attr` error because the `list` role does not accept `data-size`; `<p data-ui="text" data-tone="warning">` produced a `contract-enum` error because the `text` role's `tone` enum is `{primary, secondary, muted, danger}` only.
- Root cause: muscle memory from `select`/`button` roles which both expose `data-size`. The `list` role exposes `density` and `variant ∈ {plain, rows, cards}` only. The `text` role does not have a `warning` tone — only `danger` for hard errors and `muted`/`secondary` for soft hints.
- Fix: suggestion list now uses `data-variant="plain" data-density="compact"`; the "未匹配候选" soft hint uses `data-tone="muted"`.
- Prevention: cross-check `ui/contract/contract.json` for the target role's `attrs` block before introducing new components. The pattern "this role accepts `data-size`" is **NOT** consistent across roles. The `text` role's tone enum is the tightest in the contract and most likely to need a re-think for soft warnings — prefer `muted` + caption variant, not `warning` + body variant.

### 2026-05-28 — Forward reference of `selectJobById` in `goToJob` (S0)
- Symptom: Initial `goToJob` was placed directly after `activatePanel` and referenced a non-existent `selectJobByIdInternal` (a placeholder I introduced before the real definition). TypeScript caught the missing identifier at typecheck.
- Root cause: I tried to attach a `useCallback` deep-link helper before the function it depended on existed in the file.
- Fix: Moved `goToJob` to be defined immediately after `selectJobById`, depending on the stable `useCallback` reference of `selectJobById`.
- Prevention: Define controller helpers after the dependencies they wrap. Do not introduce placeholder identifiers expecting to bind them later in the same hook body.
