# 04 Verification

## 2026-05-13
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: registered this package as `T-046`.
- Check: `node .ai/scripts/ctl-project-governance.mjs map --task T-046 --feature F-001 --milestone M-001 --requirement R-009 --apply`.
- Result: mapped this package to `M-001 / F-001 / R-009`.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: coverage review against parent v1c contract.
- Result: explicit coverage added for PromotionInputSnapshot, package trace/boundary input, non-promote loopbacks, bridge creation restriction, and downstream feedback/recheck contract.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.

## Pending Checks
- Revisit after v1b closure to confirm v1c input contracts.

## Stage Closure Checks
- `PaperProjectBridge` is created only after human-confirmed `PromotionDecision`.
- Promotion gate records blockers, accepted risks, argument mini-check outputs, and recheck state.
- Bridge payload carries refs, snapshot hashes, policy version, and editable working-copy text.
- Downstream feedback creates feedback/recheck records rather than modifying upstream authority.
