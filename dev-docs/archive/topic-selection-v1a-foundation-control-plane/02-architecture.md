# 02 Architecture

## Boundary
This package owns shared control-plane mechanics. It does not own topic-selection business objects.

## Core Flow
```text
BuildInputSnapshot
  -> DeterministicGate
  -> WorkflowHarness(if needed)
  -> ReadinessGateResult
  -> TransitionPolicyDecision
  -> HumanGate/OverridePolicy(if needed)
  -> StateWriter
  -> ChainTransitionAttempt
```

## Authority Objects
- `ContextPolicyVersion`
- `InputSnapshot`
- `ArtifactRef`
- `LLMWorkflowRun`
- `ReadinessGateResult`
- `TransitionPolicyVersion`
- `WorkflowProfilePolicy`
- `ChainTransitionAttempt`
- `QualitySignal`
- `FunctionalLineageLink`
- `TraceSnapshot`
- `HumanConfirmedDecision`

## Required Fields
- Identity: stable ids, workspace/title-card refs where applicable.
- Provenance: actor, workflow profile, policy version, input snapshot ref, artifact refs.
- Gate: result, blockers, warnings, required actions, loopback target, human review flag, accepted risk refs.
- Transition: source ref, target ref, transition key, policy version, result, reason, created state writes.
- Trace: source refs, target refs, functional relation type, snapshot hash, object refs, and artifact refs.
- Quality signal: target ref, stage, check type, verdict, issue codes, recommended action, blocking transition keys, refs, confidence, workflow run ref, and artifact refs.
- Human confirmation: target ref, decision type, actor, rationale/artifact refs, policy version, and resulting authority object refs.

## Invariants
- LLM workflow output cannot directly write authority state.
- Deterministic gates run before LLM readiness assessment for critical transitions.
- State-axis writes must not collapse lifecycle, decision, review, freshness, execution, or permission into one overloaded status.
- Artifact payloads can be large, but authority records must keep refs and checksums.
- Raw `QualitySignal` cannot directly create UI tasks, recheck impacts, memory entries, accepted risks, or state writes; downstream packages must consume control-plane-derived decisions.
- `HumanConfirmedDecision` is a generic human-gate record. Business packages decide which authority object requires it.

## Downstream Consumers
- Search/resource/evidence inputs use it for SearchPlan/SearchRun gates.
- EvidenceMap/strength uses it for extraction and assessment workflows.
- Need validation uses it for readiness and adjudication.
- Recheck/risk/memory consumes gate and transition results.
- Offline evaluation/replay reads snapshots, workflow runs, and artifacts.
