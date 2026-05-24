# Roadmap

## Decision
Create `T-105 paper-implementation-provider-variance-evaluation` as a separate PaperImplementation infrastructure task. It must not be folded into `T-104`.

## Scope
T-105 evaluates real provider behavior for PaperImplementation AI proposal workflows. It measures whether live model outputs remain contract-valid, trace-aware, proposal-only, and resistant to overclaim drift.

### In Scope
- Provider variance runner or service slice.
- Deterministic fake-provider evaluation path.
- Optional live-provider profile with explicit credentials and skipped/blocked/passed reporting.
- Metrics and artifact schema for repeated runs.
- Integration with T-099 proposal artifact validation and T-101-style evaluation reports.

### Out Of Scope
- Live experiment execution adapter; owned by T-104.
- New authority writes from AI output.
- Default CI dependency on provider credentials.
- UI workbench changes unless needed to expose evaluation read-models.
- Writing ingestion or citation generation.

## Decision Points
| ID | Decision | Recommendation | Status |
|---|---|---|---|
| V1 | Should provider variance be inside T-104? | No; keep execution and AI evaluation separate. | confirmed |
| V2 | Is live provider evaluation required for default closure? | No; default uses deterministic fake providers. | proposed |
| V3 | What is the minimum metric set? | Schema validity, trace/ref validity, direct mutation attempts, overclaim rate, proposal stability, provider failure/latency. | proposed |
| V4 | Should provider output create quality signals? | Only for violations; never direct domain authority writes. | proposed |
| V5 | Should topic-selection provider canary be reused? | Reuse patterns only; do not inherit topic-selection semantics. | proposed |

## Recommended Execution Order
1. Audit T-099 and T-101 evaluation surfaces.
2. Define metrics and artifact schema.
3. Implement fake-provider variance runner.
4. Add optional live-provider profile.
5. Add guardrail and aggregation tests.
6. Update docs and governance.

## Completion Signal
T-105 is complete when provider variance can be evaluated repeatedly against fixed PaperImplementation input snapshots, default checks pass without credentials, and optional live-provider runs produce redacted artifacts without mutating authority state.
