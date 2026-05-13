# 04 Verification

## 2026-05-13
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: registered this package as `T-045`.
- Check: `node .ai/scripts/ctl-project-governance.mjs map --task T-045 --feature F-001 --milestone M-001 --requirement R-009 --apply`.
- Result: mapped this package to `M-001 / F-001 / R-009`.

## 2026-05-14 Split Prep
- Check: v1a status and input-contract review.
- Result: v1a backend/service/API closure is complete; v1b can depend on `TopicSelectionV1aToV1bInputBundle`, T-048 control-plane refs, and T-051 risk/recheck/memory records.
- Check: created v1b child task bundles and ran `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: packages registered as `T-055 intake-constraint-profile`, `T-057 research-slice`, `T-059 topic-question-contract`, `T-060 value-assessment`, `T-058 topic-package-draft`, `T-056 offline-evaluation-replay`, and `T-054 http-api-closure`.
- Check: mapped `T-054` through `T-060` to `M-001 / F-001 / R-009`, then reran governance sync.
- Result: registry and derived project views updated.
- Check: v1b child-package implementation contract review.
- Result: added `06-implementation-contract-review.md`; resolved ownership gaps for intake/constraint profile, v1b replay, and v1c input bundle ownership.
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`.
- Result: passed; project hub and derived views are in sync after v1b split.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: coverage review against parent v1b contract.
- Result: explicit coverage added for ResearchConstraintProfile, planning/option/selection runs, topic-question formation/selection support objects, v1a inherited trace, and v1b->v1c input bundle.
- Check: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.

## Pending Checks
- Execute `T-057` against the T-055 handoff.

## 2026-05-14 T-055 Landing
- Check: v1b intake/constraint profile service landing.
- Result: `T-055` completed with shared contracts, repo-prisma persistence, in-memory and Prisma repository support, service methods, targeted service tests, Prisma validation/typecheck, and DB context refresh.
- Check: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` and `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`.
- Result: passed.
- Check: post-review hardening for T-055.
- Result: addressed schema/readiness mismatch, human decision validation, trace validation, accepted-risk usability, and explicit `park` readiness semantics before T-057 handoff.

## Stage Closure Checks
- `TopicPackage(draft)` is created only from `ValueDispositionDecision.advance_to_package`.
- `TopicPackage(draft)` has explicit `package_readiness_status`.
- Trace and boundary checks prevent new unmet needs, expanded boundaries, or unsupported claim strength.
- v1c can consume the package without re-running v1b value assessment.
