# 04 Verification

## Executed checks

- [pass] `node -e "JSON.parse(require('fs').readFileSync('docs/context/ui/ui-spec.json','utf8')); JSON.parse(require('fs').readFileSync('ui/config/governance.json','utf8')); console.log('json ok')"`
  - Result: `json ok`
- [pass] `test ! -e apps/desktop/src/renderer/styles && test ! -e apps/desktop/src/renderer/app-layout.css`
  - Result: old renderer CSS entries are absent.
- [pass] `rg -n "app-layout\\.css|apps/desktop/src/renderer/styles|@import './styles/'" apps/desktop/src/renderer ui/config -S`
  - Result: no matches in active renderer code or governance config.
- [pass] `pnpm --filter @paper-engineering-assistant/desktop run typecheck`
  - Result: renderer/main TypeScript compile passes.
- [pass] `pnpm --filter @paper-engineering-assistant/desktop build`
  - Result:
    - renderer Vite production build passes
    - main TypeScript build passes
- [pass] `pnpm --filter @paper-engineering-assistant/desktop smoke:e2e`
  - Initial result:
    - failed because the smoke seed still posted `topic_id` to `POST /paper-projects`.
    - current API contract requires `title_card_id`.
  - Fix:
    - updated `apps/desktop/scripts/smoke-e2e.mjs` to seed `title_card_id: 'TITLE-CARD-DESKTOP-SMOKE'`.
  - Final result:
    - `[desktop-smoke] PASS`
- [pass] `node .ai/tests/run.mjs --suite ui`
  - Result:
    - `ui-system-bootstrap`, `ui-governance-gate`, `ui-governance-gate-approval-order`, `ui-style-intake-from-image` all pass.
- [pass] `python3 .ai/skills/features/ui/ui-governance-gate/scripts/ui_gate.py run --repo-root . --run-id t022-retirement-final-approved --evidence-root .ai/.tmp/ui --mode full`
  - Result:
    - report path: `.ai/.tmp/ui/t022-retirement-final-approved/ui-gate-report.md`
    - `Errors: 0`, `Warnings: 0`
    - `spec_status=OK`, `exception_status=OK`

## Approval records

- `ui/approvals/20260512T225936Z-exception-45927a09.json`
  - Approves the governance config fingerprint after removing `apps/desktop/src/renderer/styles` exclusion.
- `ui/approvals/20260512T225955Z-spec_change-608142c7.json`
  - Approves the UI spec/style entry fingerprint after routing desktop runtime CSS through `ui/styles/ui.css`.

## Acceptance focus

- `apps/desktop/src/renderer/app-layout.css` no longer exists.
- `apps/desktop/src/renderer/styles/**` no longer exists.
- `apps/desktop/src/renderer/main.tsx` imports only `ui/styles/ui.css` for styling.
- `ui/config/governance.json` no longer excludes the old renderer styles directory.
- Runtime CSS order is preserved through `ui/styles/desktop-runtime/index.css`.
- T-022 archived after project governance sync/lint.
