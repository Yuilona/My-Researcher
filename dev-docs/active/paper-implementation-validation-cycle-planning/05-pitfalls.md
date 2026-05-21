# 05 Pitfalls

## Do Not Repeat
- Do not jump from motive gap directly to expensive experiment.
- Do not let feasibility probe output become confirmatory evidence.
- Do not bury budget/stop rules in free-text notes.
- Do not treat scope broadening as a local plan edit.
- Do not schedule validation cycles outside current portfolio constraints.
- Do not keep repeating low-information cycles without `loop_budget_review`.

## T-095 Guardrails Landed
- `ExperimentPlanLight` is planning-only and must not be treated as an experiment-foundation execution request.
- `ValidationCycle` completion is an assessment record only; it must not create claims, evidence, or motive evolution by side effect.
- Feedback candidates are local planning objects until explicit dispatch calls T-093 feedback event recording.
- Required gate and handoff fields are queryable columns; full refs may be duplicated in JSON payloads but must not become the only lookup surface.
- `research-argument` remains legacy/transition and is not part of validation planning authority.
- `trace_manifest_ref` must always point to TraceManifest authority; target refs belong in trace manifests and input snapshots, not in the trace-manifest reference slot.
- Validation planning must not bypass the T-094 evidence board: every cycle needs an explicit or current trace-ready board for the target motive version.
- T-096 handoff objects must preserve motive/cycle ownership; route and plan refs cannot be mixed across cycles.
