# 00 Overview

## Status
- State: planned
- Parent task: `T-043 experiment-foundation-v1`
- Next step: consume the stable T-076 registry/readiness API and T-077 execution job/result/evidence APIs to implement the desktop workbench.

## Goal
- Add the desktop `实验基座` workbench below `文献管理`, exposing asset registry, readiness, recipe, job/result, evaluation fact, and sidecar workflows without owning experiment semantics in the UI.

## Non-goals
- Do not recreate `apps/desktop/src/renderer/styles/**` or `app-layout.css`.
- Do not invent UI-only domain state that differs from shared contracts.
- Do not implement training or adapter logic in the renderer.

## Responsibilities
- Add navigation entry and route/view structure.
- Build data-ui/token-governed workbench surfaces.
- Consume backend APIs for assets, readiness, recipes, jobs, results, evidence, and sidecars.
- Consume T-077 job submit/sync/cancel/collect status and result/evidence outputs; do not reimplement adapter execution in the renderer.
- Provide scan-friendly operational views and guarded actions.

## Boundary
- Owns desktop presentation and interaction.
- Consumes shared contracts and backend API.
- Does not own persistence, adapter execution, or paper claim semantics.

## Done Means
- `实验基座` appears below `文献管理`.
- UI smoke and governance checks pass.
- No legacy CSS dependency is added.
