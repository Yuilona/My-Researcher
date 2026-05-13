# 04 Verification

## 2026-05-13
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: registered this package as `T-044`.
- Check: `node .ai/scripts/ctl-project-governance.mjs map --task T-044 --feature F-001 --milestone M-001 --requirement R-009 --apply`.
- Result: mapped this package to `M-001 / F-001 / R-009`.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: coverage review against parent v1a contract.
- Result: explicit coverage added for title-card/topic-seed adapter, Literature -> TopicSelection contracts, cross-cutting control objects, and v1a->v1b input bundle.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: created six v1a implementation child packages and ran `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: packages registered as `T-047 topic-selection-v1a-evidence-map-strength`, `T-048 topic-selection-v1a-foundation-control-plane`, `T-049 topic-selection-v1a-need-validation`, `T-050 topic-selection-v1a-offline-evaluation-replay`, `T-051 topic-selection-v1a-recheck-risk-memory`, and `T-052 topic-selection-v1a-search-resource-evidence-inputs`.
- Check: mapped `T-047` through `T-052` to `M-001 / F-001 / R-009`, then reran governance sync.
- Result: registry and derived project views updated.
- Check: implementation contract review for v1a child-package coverage.
- Result: added `06-implementation-contract-review.md`; resolved ownership gaps for `QualitySignal`, `SearchPlanRecheckRequest`, generic human confirmation, trace lineage, v1b handoff, and offline replay sequencing.

## Pending Checks
- Review and start `T-048 topic-selection-v1a-foundation-control-plane` before product code changes.

## Stage Closure Checks
- A `ValidatedNeed` can be created only through `ValidateNeedAdjudicationResult.final_decision = validate`.
- Non-validate adjudication outcomes keep `output_validated_need_id = null`.
- Trace can be followed from `ValidatedNeed` to EvidenceUnit, SearchRun, SearchPlan, and literature snapshot.
- Recheck/risk/memory states are visible to gates and do not rewrite historical decisions.
- Offline evaluation/replay can report the v1a minimum metrics.
