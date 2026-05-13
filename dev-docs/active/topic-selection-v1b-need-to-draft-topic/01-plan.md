# 01 Plan

## Phase 1 - Contract Closure
- Freeze v1b entry on `TopicSelectionV1aToV1bInputBundle`, not a bare `ValidatedNeed`.
- Require explicit intake readiness before slice planning.
- Reuse T-048 control-plane refs and T-051 risk/recheck/memory refs; do not redefine them locally.

Acceptance:
- [x] v1b does not diverge from the parent design spec.
- [x] v1b does not require v1a to produce objects outside its stage boundary.
- [x] v1b child packages have non-overlapping authority ownership.

## Phase 2 - Implementation Order
1. `T-055 topic-selection-v1b-intake-constraint-profile`
2. `T-057 topic-selection-v1b-research-slice`
3. `T-059 topic-selection-v1b-topic-question-contract`
4. `T-060 topic-selection-v1b-value-assessment`
5. `T-058 topic-selection-v1b-topic-package-draft`
6. `T-056 topic-selection-v1b-offline-evaluation-replay`
7. `T-054 topic-selection-v1b-http-api-closure`

Acceptance:
- [ ] Each child task implements its authority objects, repositories, service contract, and focused tests.
- [ ] Each handoff consumes refs from the previous package and rejects stale, missing, or out-of-scope refs.
- [ ] The vertical service smoke can produce `TopicPackage(draft)` from a real v1a input bundle.

## Phase 3 - Stage Closure
- Produce a `TopicPackage(draft)` from a human-confirmed `ValidatedNeed`.
- Run trace/boundary checks and record package readiness status.
- Publish the v1c input bundle contract from the verified v1b outputs.
- Run v1b replay metrics and HTTP/API smoke in memory and Prisma modes.

Acceptance:
- [ ] `TopicPackage(draft)` has explicit `package_readiness_status`.
- [ ] Package trace/boundary/readiness artifacts are sufficient for promotion gate input.
- [ ] v1c input contract is ready for detailed split.
