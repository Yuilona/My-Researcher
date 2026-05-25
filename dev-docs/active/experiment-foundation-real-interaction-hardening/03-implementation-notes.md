# T-106 Implementation Notes

## 2026-05-24: Task Package Creation
- Created T-106 as the post-V1 experiment-foundation hardening task.
- The task starts in `planned` state and is intentionally decision-first.
- No product code, shared contracts, Prisma schema, REST routes, desktop UI, or runner code changed during task creation.

## 2026-05-25: Phase 1 Matrix
- Confirmed D1 through D8 and moved T-106 to `in-progress`.
- Added `06-hardening-matrix.md` as the Phase 1 executable matrix and fixture inventory.
- Phase 1 remains documentation-only: no harness command, test implementation, product code, shared contract, Prisma, API, or desktop UI changed.
- The next implementation target is Phase 2 LocalScript robustness.

## 2026-05-25: Phase 2 LocalScript Robustness
- Added targeted deterministic tests in `apps/backend/src/services/experiment-foundation-execution-service.unit.test.ts`.
- Covered `EF-H-008` and strengthened `EF-H-009`:
  - LocalScript disabled outside `NODE_ENV=test` unless explicitly enabled.
  - Execution root escape via `output_contract.working_directory` is rejected.
  - Shell metacharacter arguments stay literal under `shell=false`.
  - Non-terminal collect is rejected with a gate error.
  - Timeout reaches failed terminal status and collect produces partial validation without evidence.
  - Repeated collect returns existing refs without duplicate stage/partial/result refs.
  - Existing idempotent submit and idempotency-conflict checks remain in the same suite.
- No product code changes were needed; the existing LocalScript adapter behavior satisfied the Phase 2 matrix after tests were added.
- Review follow-up:
  - Restored topic-selection T-107/T-108 task packages after confirming they are owned by a separate task stream and must not be deleted during T-106 work.
  - Added `afterEach` cleanup for LocalScript temp execution roots created by the execution-service tests.

## Decision Backlog
- D1: confirmed one task with phase gates; split child tasks only after concrete hardening findings or large independent work appears.
- D2: confirmed default `gate-only` plus `local fake provider`, with true external canary as a first-class explicit opt-in lane for real connectivity and minimum real-flow validation.
- D3: confirmed define-only for now. T-106 should specify the user-like workbench flow and acceptance contract, but concrete UI automation can wait until backend/API and runner hardening lanes stabilize.
- D4: confirmed deterministic LocalScript robustness matrix; cover allowlist, root containment, `shell=false`, timeout, cancellation, idempotency, partial/invalid collect, and redaction, with stress/load out of default scope.
- D5: confirmed seam tests in T-106. Cross-flow coverage should verify refs/hashes/sidecars and no-copy/no-claim-leak behavior without moving PaperImplementation or bridge product ownership.
- D6: confirmed memory plus disposable local Postgres validation. Persistence hardening should prove automation-facing usability for paper-implementation handoff, not mutate the normal developer schema or run long DB stress by default.
- D7: confirmed standalone T-106 hardening command first; hook into T-103 only after the command contract is stable and does not change default full-flow semantics.
- D8: confirmed synthetic deterministic fixtures by default. Controlled local real fixtures and true external samples are explicit opt-in only, with refs/hashes/summaries/cleanup artifacts and no checked-in raw data, model weights, checkpoints, credentials, raw logs, or unredacted provider payloads.
