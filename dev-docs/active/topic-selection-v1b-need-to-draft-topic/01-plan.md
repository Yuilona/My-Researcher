# 01 Plan

## Phase 1 - Contract Hold
- Track v1a output contract changes.
- Preserve the v1b target chain without implementation commitments.

Acceptance:
- [ ] v1b does not diverge from the parent design spec.
- [ ] v1b does not require v1a to produce objects outside its stage boundary.

## Phase 2 - Detailed Split After V1A
- Split v1b once v1a validates `ValidatedNeed`, trace, recheck, accepted risk, and evidence strength contracts.
- Create child tasks for slice, question contract, value assessment, and draft package.

Acceptance:
- [ ] Child tasks have non-overlapping authority objects.
- [ ] Each child task defines verification against v1a refs.

## Phase 3 - Stage Closure
- Produce a `TopicPackage(draft)` from a human-confirmed `ValidatedNeed`.
- Run trace/boundary checks and record package readiness status.
- Publish the v1c input bundle contract from the verified v1b outputs.

Acceptance:
- [ ] `TopicPackage(draft)` has explicit `package_readiness_status`.
- [ ] Package trace/boundary/readiness artifacts are sufficient for promotion gate input.
- [ ] v1c input contract is ready for detailed split.
