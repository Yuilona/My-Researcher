# T-100 Paper Implementation Desktop Workbench

## Status
- State: planned
- Parent task: `T-091 paper-implementation-full-landing`
- Mapping: `M-001 > F-001 > R-013`
- Flow node: queue-first desktop workbench
- Next step: start after backend command/read-model contracts exist.

## Goal
- Expose `PaperImplementationWorkbench` under `论文管理`.
- Provide queue-first decision/action surfaces for human review, trace repair, blockers, failed runs, stale recheck, loop-budget review, upstream feedback, portfolio decisions, and accepted risk expiry.
- Let users inspect and command implementation workflows without entering a writing editor.

## Non-goals
- Do not implement paper body writing, LaTeX editing, Prism/Overleaf execution, submission, or rebuttal flows.
- Do not duplicate experiment-foundation asset registry or execution console.
- Do not synthesize readiness in client state.

## Acceptance Criteria
- [ ] Workbench consumes backend read-models and emits backend commands.
- [ ] Queue item detail shows source refs, trace, gate result, blockers, risks, stale/hash status, and actions.
- [ ] Portfolio decision and upstream feedback items are displayed as backend queue/read-model items, not client-only state.
- [ ] Confirmation surfaces capture scoped confirmation records only.
- [ ] UI follows repo `data-ui` + token/contract path.
