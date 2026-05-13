# 04 Verification

## 2026-05-14
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: registered this package as `T-057`.
- Check: `node .ai/scripts/ctl-project-governance.mjs map --project main --task T-057 --feature F-001 --milestone M-001 --requirement R-009 --apply`.
- Result: mapped this package to `M-001 / F-001 / R-009`.

## Pending
- Add contract/schema tests.
- Add service tests for slice option generation, selection, rejection, refinement, and stale intake blockers.
