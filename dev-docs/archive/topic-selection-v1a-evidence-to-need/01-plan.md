# 01 Plan

## Phase 1 - Stage Boundary
- Confirm v1a starts at a title-card/topic seed and concrete literature snapshot.
- Confirm v1a ends at human-confirmed `ValidatedNeed`.
- Keep v1b/v1c objects as downstream contracts only.

Acceptance:
- [ ] v1a boundary is reflected in child task scopes.
- [ ] No v1b/v1c active gate is pulled into v1a implementation.

## Phase 2 - Child Task Split
- Create implementation child tasks for:
  - foundation/control plane
  - search/resource/evidence inputs
  - EvidenceMap/evidence strength
  - need validation
  - recheck/risk/memory
  - offline evaluation/replay

Acceptance:
- [x] Child task bundles exist.
- [x] Ownership and dependency order are explicit.

## Phase 3 - Implementation Sequencing
- Start with shared foundation and search/evidence inputs.
- Implement EvidenceMap and evidence strength before need validation.
- Add recheck/risk/memory and offline evaluation once the first vertical path exists.
- Use `06-implementation-contract-review.md` as the execution gate for package ordering and cross-package contracts.
- Treat `T-048` as the first implementation gate; downstream packages must consume its shared context, trace, gate, quality-signal, and transition contracts instead of redefining local equivalents.

Acceptance:
- [ ] v1a has an executable vertical slice plan.
- [ ] Verification can run without v1b/v1c dependencies.
- [ ] `T-048` contract review is complete before downstream product code changes.

## Phase 4 - Stage Closure
- Verify one or more `ValidatedNeed` records can be produced with trace, gate, recheck, memory, and evaluation artifacts.
- Publish the v1b input bundle contract from the verified v1a outputs.
- Update parent package with lessons learned and v1b input contract changes.
- Re-run the implementation contract review after the first vertical slice and update unresolved handoff risks.

Acceptance:
- [ ] v1a closure evidence is recorded in `04-verification.md`.
- [ ] v1b input bundle can be consumed without re-proving need existence.
- [ ] v1b stage package is ready for detailed implementation splitting.
