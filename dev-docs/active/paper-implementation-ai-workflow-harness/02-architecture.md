# 02 Architecture

## Contract Boundary
| Item | Contract |
|---|---|
| Input objects | implementation read-model refs, `ImplementationInputSnapshot`, workflow registry |
| Output objects | `ImplementationHarness`, `ContextCompiler` output, harness run, validated proposal artifact, audit/provenance refs, `GateResult`, `TransitionAttempt` draft, `DecisionWorkQueueItem` candidates, quality signals |
| Authority writer | none for agent outputs; `StateWriter` invocation contract is defined but domain services apply state after gates |
| Gates | harness invariants, schema, reference, trace, natural-language field role, run-mode isolation, proposal-only output |
| Trace | prompt/input/output artifact refs and source refs; no hidden reasoning as business artifact |
| Handoff | T-100 displays proposals/queue items; T-101 evaluates replay/variance/adversarial behavior |

## Contract Review
- Runtime infrastructure is shared; implementation semantics are domain-owned.
- Agents can create work-order drafts but cannot admit or execute real work orders.
- Human confirmation cannot be satisfied by model output.
- `ImplementationHarness` enforces input snapshot, trace manifest, artifact refs, failed-run retention, exploratory/confirmatory separation, and memo-as-evidence prohibition.
- `ContextCompiler` must record included refs, excluded refs, freshness constraints, and evidence rules before any LLM workflow runs.
- Harness can emit quality signals and queue candidates, but it cannot abandon motives, promote claims, or mark dossier readiness.
