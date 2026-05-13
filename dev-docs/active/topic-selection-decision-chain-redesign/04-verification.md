# 04 Verification

## 2026-05-11
- Check: `dev-docs/AGENTS.md` Decision Gate reviewed.
- Result: task meets create conditions because it is complex, design-heavy, and likely multi-session.
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- Result: passed; registry and generated project views updated.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` after SearchPlan independent-object doc update.
- Result: passed.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` after correcting auto-pull/SearchPlan dependency direction.
- Result: passed.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` after adding key nodes and the topic-decision flowchart.
- Result: passed.

## 2026-05-13
- Check: targeted `rg` scan for removed legacy terms covering old publishability naming, optional promotion mini-check wording, coverage-matrix authority wording, value-stage promotion wording, old NeedCandidate composite state, and the former coverage view object name.
- Result: no matches; targeted simple semantic cleanup terms are removed.
- Check: targeted multiline `rg` scan for a conceptual chain that jumps from `SearchPlan` directly to `EvidenceMap`.
- Result: no matches; high-level conceptual chain no longer skips `SearchRun`.
- Check: `git diff --stat -- dev-docs/active/topic-selection-decision-chain-redesign`
- Result: documentation-only changes across the task bundle.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Check: targeted `rg` scan for `ValidatedNeed` adjudication schema drift after adding `ValidateNeedAdjudicationResult`.
- Result: no remaining direct candidate-to-validated-need transition wording in the task bundle; no legacy source validation decision id field; non-validate outcomes are scoped to `ValidateNeedAdjudicationResult.final_decision` with `output_validated_need_id=null`.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` after `ValidatedNeed` adjudication-result sync.
- Result: latest rerun passed.
- Check: targeted `rg` scan for offline evaluation / replay terms and legacy system-evaluation wording.
- Result: `OfflineEvaluationDataset`, `OfflineEvaluationCase`, `OfflineEvaluationRun`, `OfflineEvaluationMetricResult`, `ReplayDiff`, and all required v1a metrics are present; stale Chinese system-evaluation wording is absent from the task bundle.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` after offline evaluation / replay sync.
- Result: passed.
- Check: targeted `rg` scan for recheck storm-control and EvidenceStrengthAssessment trigger/cache terms.
- Result: `Recheck storm control`, event admission, propagation budget, rerun throttling, storm-control audit decisions, `assessment_cache_key`, trigger/non-trigger rules, reuse/cache rules, and invalidation rules are present.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` after recheck and EvidenceStrengthAssessment clarification.
- Result: passed.
- Check: created stage child packages for v1a/v1b/v1c and ran `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: stage packages registered as `T-044 topic-selection-v1a-evidence-to-need`, `T-045 topic-selection-v1b-need-to-draft-topic`, and `T-046 topic-selection-v1c-promotion-bridge`.
- Check: mapped `T-044`, `T-045`, and `T-046` to `M-001 / F-001 / R-009`, then reran governance sync.
- Result: registry and derived project views updated.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` after stage package registration.
- Result: passed.
- Check: review of v1a/v1b/v1c stage package coverage against the parent design contract.
- Result: patched stage packages to cover entry adapters, cross-cutting control objects, v1a->v1b input bundle, v1b planning/selection support objects, v1b->v1c input bundle, promotion input snapshot, non-promote loopbacks, and downstream feedback/recheck.
- Check: targeted `rg` scan for cross-stage handoff terms including v1b/v1c input bundles, title-card adapter, Literature -> TopicSelection contract, planning objects, promotion input snapshot, and downstream feedback/recheck.
- Result: required handoff terms are present in the stage packages.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` after stage package coverage review.
- Result: passed.
- Check: created v1a implementation child packages under `topic-selection-v1a-evidence-to-need` and ran project governance sync/map.
- Result: child packages registered and mapped to `M-001 / F-001 / R-009`: `T-047 evidence-map-strength`, `T-048 foundation-control-plane`, `T-049 need-validation`, `T-050 offline-evaluation-replay`, `T-051 recheck-risk-memory`, `T-052 search-resource-evidence-inputs`.
- Check: v1a implementation child-package contract review.
- Result: v1a child-package coverage is complete after clarifying shared ownership for runtime quality signals, recheck request handling, generic human confirmation, trace lineage, v1b handoff, and offline replay sequencing in `topic-selection-v1a-evidence-to-need/06-implementation-contract-review.md`.

## Pending
- None for the `topic-selection-decision-chain-redesign` task bundle.
