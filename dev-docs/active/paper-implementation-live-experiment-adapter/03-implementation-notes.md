# Implementation Notes

## 2026-05-24 - Task Package Opened
- Created `T-104 paper-implementation-live-experiment-adapter`.
- `T-103` is already occupied by `experiment-foundation-full-flow-validation-runner`, so this PaperImplementation follow-up uses `T-104`.
- Initial boundary: bridge PaperImplementation WorkOrders to existing experiment-foundation execution APIs; do not create a second trusted experiment/evidence path.
- Existing experiment-foundation execution service already exposes submit, sync, cancel, and collect operations, so T-104 should prefer service composition over new platform adapter semantics.
- Created sibling follow-up `T-105 paper-implementation-provider-variance-evaluation` for live LLM/provider variance; T-104 remains live experiment execution only.

## Current Decisions
- Default T-104 closure should remain deterministic/credential-free.
- Real cloud/external execution checks must be opt-in and reported separately.
- Live LLM/provider variance remains a separate follow-up task.
