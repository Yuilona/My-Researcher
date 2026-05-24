# Implementation Notes

## 2026-05-24 - Task Package Opened
- Created `T-104 paper-implementation-live-experiment-adapter`.
- `T-103` is already occupied by `experiment-foundation-full-flow-validation-runner`, so this PaperImplementation follow-up uses `T-104`.
- Initial boundary: bridge PaperImplementation WorkOrders to existing experiment-foundation execution APIs; do not create a second trusted experiment/evidence path.
- Existing experiment-foundation execution service already exposes submit, sync, cancel, and collect operations, so T-104 should prefer service composition over new platform adapter semantics.
- Created sibling follow-up `T-105 paper-implementation-provider-variance-evaluation` for live LLM/provider variance; T-104 remains live experiment execution only.

## Current Decisions
- L2 confirmed: T-104 is an orchestration adapter. PaperImplementation owns WorkOrder and evidence admission; experiment-foundation owns execution artifacts. T-104 composes existing services and must not introduce a new authority root or direct persistence path.
- L3 confirmed: do not add Prisma fields by default. Implementation must explicitly check submit idempotency, external job lookup, latest sync visibility, and final evidence lookup; schema may change only after a concrete queryability/idempotency gap is proven.
- L4 confirmed: use option A for final trusted evidence. T-104 pre-allocates `run_evidence_unit_id`, creates or requires a complete `TraceManifest` targeting `run_evidence_unit:<id>`, then calls `recordRunMonitorIntake`; the WorkOrder service remains the final gate.
- L5 confirmed: default verification is deterministic and credential-free. Real cloud/external execution is opt-in canary only, with preflight, redacted artifacts, and skipped/blocked/passed reporting separate from default pass/fail.
- L6 confirmed: T-104 stops at trusted `RunEvidenceUnit` and monitor/evidence ledger closure. It may return handoff refs/next actions, but T-098 remains the only owner for result interpretation, claim, dossier, and writing packet creation.
- L7 confirmed: T-104 excludes live LLM/provider variance. Provider variance is owned by `T-105 paper-implementation-provider-variance-evaluation`.
- Default T-104 closure should remain deterministic/credential-free.
- Real cloud/external execution checks must be opt-in and reported separately.
- Live LLM/provider variance remains a separate follow-up task.
