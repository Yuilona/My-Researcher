# Roadmap

## Decision
Create `T-104 paper-implementation-live-experiment-adapter` as the next PaperImplementation infrastructure task. `T-103` is unavailable because it already owns `experiment-foundation-full-flow-validation-runner`.

## Scope
T-104 turns the existing PaperImplementation WorkOrder control plane into a live execution bridge by composing with experiment-foundation execution services.

### In Scope
- PaperImplementation service/controller/route layer for live experiment submission and status collection.
- Idempotent WorkOrder-to-external-job submission.
- Sync/collect/cancel commands that call experiment-foundation execution services.
- Monitor intake and run evidence ingestion using T-102 target-specific run evidence traces.
- Deterministic in-memory or fake adapter tests.
- Documentation and governance evidence.

### Out Of Scope
- Live LLM/provider variance evaluation.
- New cloud SDK support beyond existing experiment-foundation adapters.
- UI workbench changes unless a minimal read-model endpoint is required.
- Claim/dossier/writing ingestion changes.
- `research-argument` decommissioning.

## Decision Points
| ID | Decision | Recommendation | Status |
|---|---|---|---|
| L1 | Which task ID? | Use `T-104`; `T-103` is occupied. | confirmed |
| L2 | Where does adapter authority live? | PaperImplementation owns orchestration; experiment-foundation owns execution artifacts. | proposed |
| L3 | Is a new Prisma model required? | Start with existing WorkOrder/harness/external-job fields; add schema only if idempotency or queryability has a real gap. | proposed |
| L4 | How is final run evidence trusted? | Through `RunMonitorIntake -> RunEvidenceUnit` only, with target-specific trace. | proposed |
| L5 | Should real cloud execution be default? | No; default tests use deterministic fakes, external canary is opt-in. | proposed |
| L6 | Should adapter create result interpretation or claims? | No; T-098 remains the only owner. | proposed |
| L7 | Should this include provider variance? | No; split into `T-105 paper-implementation-provider-variance-evaluation`. | confirmed |

## Recommended Execution Order
1. Audit current experiment-foundation execution API and PaperImplementation WorkOrder fields.
2. Decide whether existing contracts are enough or add a narrow adapter command contract.
3. Implement service composition and route commands.
4. Add deterministic adapter tests and route tests.
5. Re-run PaperImplementation result/claim/dossier regression tests.
6. Update task docs and governance.

## Completion Signal
T-104 is complete when an admitted WorkOrder can be submitted to experiment-foundation execution, synced/collected, and converted into trusted run evidence through the existing monitor/evidence ledger path without creating any parallel authority or default live-cloud dependency.
