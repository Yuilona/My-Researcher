# Implementation Notes

## 2026-05-24 - Task Package Opened
- Created `T-105 paper-implementation-provider-variance-evaluation`.
- This task is intentionally separate from `T-104 paper-implementation-live-experiment-adapter`.
- T-104 owns live experiment execution through WorkOrder and experiment-foundation.
- T-105 owns live LLM/provider variance evaluation for PaperImplementation AI proposal workflows.
- Default closure must stay credential-free; live provider runs are opt-in evidence.

## Current Decisions
- T-105 should start as an evaluation/runner package, not a new authority package.
- Reuse T-099 proposal-only harness and T-101 evaluation concepts.
- Do not copy topic-selection provider-canary semantics directly; only reuse proven artifact and metric patterns where they fit PaperImplementation.
