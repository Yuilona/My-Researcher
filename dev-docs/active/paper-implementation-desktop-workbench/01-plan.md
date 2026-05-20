# 01 Plan

## Phases
1. Review backend command/read-model contracts from T-093 through T-099.
2. Define coarse workbench route/module placement under `论文管理`.
3. Define queue-first read model consumption and command surfaces.
4. Implement motive/evidence/portfolio, cycle/workorder, upstream feedback, trace, claim/dossier, and confirmation views as backend-backed panels.
5. Verify UI cannot bypass backend commands or style governance.

## Review Before Next Flow
- Confirm evaluation suite can exercise UI command paths or route-level substitutes.
- Confirm portfolio decisions, feedback events, and loop-budget review are exposed through backend queue/read-model contracts.
- Confirm no UI completion claim depends on mock-only readiness.

## Verification
- UI contract/gate checks.
- Playwright/screenshot checks when UI implementation begins.
- Governance check for `data-ui` and retired style-layer constraints.
