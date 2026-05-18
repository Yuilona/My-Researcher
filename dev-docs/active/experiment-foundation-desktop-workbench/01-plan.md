# 01 Plan

## Phases
1. Add `实验基座` nav entry below `文献管理`.
2. Add API client hooks and contract-driven view models.
3. Build asset registry/readiness views.
4. Build recipe/job/result/evidence/sidecar views.
5. Add UI governance, smoke, and responsive checks.

## Acceptance Criteria
- UI consumes backend contracts without duplicating domain rules.
- Workbench exposes guarded actions for register, review, readiness, recipe generation, materialization, job sync, result validation, and sidecar binding.
- No legacy CSS path is recreated or extended.
- Desktop smoke confirms nav placement and core workflows.

## Review Gate
- Do not start until API surfaces are stable.
- Before handoff, run UI governance checks and browser smoke verification.
