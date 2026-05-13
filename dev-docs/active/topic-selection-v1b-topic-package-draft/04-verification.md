# 04 Verification

## 2026-05-14
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: registered this package as `T-058`.
- Check: `node .ai/scripts/ctl-project-governance.mjs map --project main --task T-058 --feature F-001 --milestone M-001 --requirement R-009 --apply`.
- Result: mapped this package to `M-001 / F-001 / R-009`.

## Pending
- Add schema tests for package and v1c input bundle.
- Add service tests for package creation, readiness blockers, and v1c bundle publication.
