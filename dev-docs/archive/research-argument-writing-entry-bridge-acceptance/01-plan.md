# 01 Plan

## Phase 1 - Contract Inventory
- Inspect existing research-argument shared bridge contracts, service capabilities, repository boundaries, and PaperProject gateway shape.
- Keep scope at backend service level unless route wiring is already present and cheap to verify.

## Phase 2 - Service Implementation
- Add service methods for:
  - seed workspace from title-card refs;
  - readiness verify;
  - promote to PaperProject with writing-entry and submission-risk sidecar refs.
- Keep `createPaperProject` contract unchanged and pass literature evidence ids through `initial_context`.

## Phase 3 - Tests
- Add unit coverage for:
  - seed trace refs;
  - not-ready readiness and promotion rejection;
  - ready branch promotion;
  - duplicate promotion idempotency;
  - sidecar projection readback.

## Phase 4 - Verification
- Run targeted research-argument service/repository tests.
- Run backend/shared typecheck if product code changes require it.
- Run governance sync/lint.

## Phase 5 - Handoff
- Update T-023 umbrella with this task as the active scoped implementation path if needed.
- Record remaining planner/UI gaps explicitly.
