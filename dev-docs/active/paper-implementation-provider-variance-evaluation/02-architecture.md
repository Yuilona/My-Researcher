# Architecture

## Boundary
| Area | Rule |
|---|---|
| AI authority | T-099 `AgentWorkflowHarnessRun` remains proposal-only; T-105 does not write domain authority. |
| Evaluation owner | T-105 owns provider variance metrics and artifacts. |
| Provider profile | Live provider execution is opt-in and must not be default CI. |
| Input | Fixed `ImplementationInputSnapshot` plus workflow spec/prompt/model profile. |
| Output | Evaluation report, quality signals, and optional queue blockers; no motive/claim/dossier writes. |
| Secrets | Provider credentials stay in environment/config; never in artifacts. |

## Proposed Flow
```text
ImplementationInputSnapshot
  -> ProviderVarianceRun(profile, workflow_type, repeat_count)
  -> AgentWorkflowHarness proposal-only execution
  -> ProposalArtifact validation
  -> Variance aggregation
  -> Evaluation report / quality signals
```

## Metrics
- Schema validity rate.
- Direct authority mutation attempt rate.
- Invalid or missing trace ref rate.
- Unsupported evidence/citation ref rate.
- Overclaim or scope-drift rate.
- Decision/proposal stability across repeated runs.
- Provider failure and timeout rate.
- Latency and token/cost summary where available.

## Hard Invariants
- Provider output cannot bypass T-099 proposal artifact validation.
- Provider output cannot directly create or mutate motive, validation, WorkOrder, run evidence, trace, claim, dossier, or writing packet authority.
- Live provider profiles must be explicit, opt-in, and separately reported.
- Deterministic fake-provider tests must be enough to close the task by default.
