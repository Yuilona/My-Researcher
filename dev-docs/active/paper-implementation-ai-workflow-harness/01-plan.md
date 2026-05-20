# 01 Plan

## Phases
1. Review shared topic-selection runtime patterns and domain-neutral extraction points.
2. Define `ImplementationHarness` policy pack, runtime bindings, invariants, audit refs, and quality signal refs.
3. Define `ContextCompiler`, implementation workflow registry, and snapshot contract.
4. Define harness run, audit, artifact, validation, gate result, transition attempt, and queue-suggestion contracts.
5. Implement proposal-only adapters for initial workflows.
6. Verify isolation, invariant enforcement, and no-authority-write behavior.

## Review Before Next Flow
- Confirm UI command surfaces can distinguish agent proposals from authority state.
- Confirm evaluation suite can replay harness runs.
- Confirm flow-node tasks call shared runtime governance contracts instead of local harness variants.
- Confirm gate failures, trace failures, and accepted-risk expiry surface through `DecisionWorkQueueItem` candidates.
- Confirm no workflow imports topic-selection business node contracts.

## Verification
- Unit/contract tests for execution modes, run modes, provenance, schema validation, and forbidden output.
- Scenario tests for mock/codex/provider separation, authority-write bypass attempts, missing input snapshot, missing trace, gate failure queueing, and harness invariant violations.
