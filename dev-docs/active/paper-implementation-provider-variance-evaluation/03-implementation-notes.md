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
- V2 confirmed: live provider evaluation is not required for default closure. Default closure uses deterministic fake-provider scenarios; real provider runs are explicit opt-in canaries with credential preflight and skipped/blocked/passed reporting.
- V3 confirmed: metrics are minimal, flow-oriented, and consumer-owned. T-105 measures whether provider outputs can safely and consistently advance the PaperImplementation automation workflow through contract validity, handoff readiness, authority violation, traceability violation, claim safety violation, workflow stability, human review burden, and provider operability. A metric without a concrete workflow decision consumer is diagnostic only and must not enter the closure gate.
- V4 confirmed: T-105 may create evaluation artifacts, quality signals, decision queue blockers, and provider/profile recommendations as governance signals. It must not create or mutate PaperImplementation domain authority.
- V5 confirmed: T-105 may reuse topic-selection provider canary infrastructure patterns, but must not inherit topic-selection business semantics, node policies, ref allowlists, output shape, or success criteria.

## 2026-05-24 - Implementation Closed
- Added provider variance shared contracts and schema tests.
- Extended the T-099 AI workflow harness vocabulary with `evaluation_report` proposal artifacts and provider-variance quality signal types. This is a string-contract extension only; no Prisma schema change was introduced.
- Added `PaperImplementationProviderVarianceEvaluationService`.
- Added `POST /paper-implementation/projects/:implementation_project_id/provider-variance-evaluations/run`.
- Deterministic fake-provider cases are executed by the existing T-099 `createAgentWorkflowHarnessRun` path, so schema, reference, trace, direct-authority-mutation, proposal artifact, quality signal, and decision queue behavior remain owned by the harness.
- Live provider profiles are represented only as preflight results in T-105. Disabled profiles are `skipped`; explicitly enabled live profiles are `blocked` because real provider execution is outside the default deterministic lane.
- The aggregate variance report is returned by the service/route and used as evaluation evidence. It is not persisted as a new authority object.
- No DB migration was needed. Existing harness run, proposal artifact, quality signal, and decision queue queryable fields cover T-105's closure path.
