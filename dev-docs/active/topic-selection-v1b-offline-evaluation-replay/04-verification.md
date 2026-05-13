# 04 Verification

## 2026-05-14
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: registered this package as `T-056`.
- Check: `node .ai/scripts/ctl-project-governance.mjs map --project main --task T-056 --feature F-001 --milestone M-001 --requirement R-009 --apply`.
- Result: mapped this package to `M-001 / F-001 / R-009`.

## Pending
- Add tests for metric calculation and replay isolation.
- Seed first synthetic baseline after core contracts exist.
