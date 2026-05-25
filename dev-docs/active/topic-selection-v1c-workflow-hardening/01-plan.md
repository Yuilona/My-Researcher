# Plan

## Phase 1 - Current-State Mapping
- Inventory v1c contracts, routes, services, repositories, tests, scripts, archived packages, and active downstream acceptance docs.
- Map each v1c node to the v1a normalization dimensions:
  - automatically callable;
  - frozen input snapshot;
  - authority writer;
  - deterministic-only or invocation slot;
  - blockers and warnings;
  - replay/idempotency;
  - handoff output.

## Phase 2 - Promotion Authority Policy
- Reconfirm human/delegated authority for promotion decisions.
- Define any Codex/provider semantic-review role as advisory only.
- Tighten gate support and promotion dossier semantics so model-like review cannot bypass deterministic promotion constraints.

## Phase 3 - Bridge And Handoff Hardening
- Verify `PaperProjectBridge` creation uses stable refs, idempotency, and no direct PaperProject side effect.
- Normalize paper-project intake handoff as a downstream boundary contract.
- Ensure downstream feedback/recheck produces append-only typed signals.

## Phase 4 - WorkflowHarness Scenarios
- Add or refine scenarios for:
  - promote;
  - promote with conditions;
  - non-promote;
  - stale package/gate input;
  - duplicate bridge creation;
  - downstream feedback loopback;
  - replay/idempotency.
- Include provider/Codex semantic-review canary only where node policy permits a model-like reviewer.

## Phase 5 - Review And Cleanup
- Check active/archived v1c docs for semantic drift.
- Remove or mark stale compatibility scripts/tests if they imply a second v1c path.
- Record verification and readiness for archival.

## Initial Test Matrix
