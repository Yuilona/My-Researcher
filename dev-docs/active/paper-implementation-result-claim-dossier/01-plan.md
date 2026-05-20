# 01 Plan

## Phases
1. Review `RunEvidenceUnit` and trace outputs from T-096/T-097.
2. Define `ResultInterpretationPacket`.
3. Define `ClaimCandidate`, `ClaimBoundaryGate`, and `ClaimTracePacket` usage.
4. Define `ImplementationDossier`, readiness gate, and dossier statuses.
5. Define upstream feedback triggers from claim ceiling, invalidated evidence, and unanswerable topic question.
6. Define queryable readiness/lifecycle/trace fields required for gate, queue, and evaluation.
7. Define `WritingEntryPacket` projection contract.

## Review Before Next Flow
- Confirm AI harness can only propose interpretation/claim boundaries, not write readiness.
- Confirm desktop can display dossier blockers and commands from read-models.
- Confirm feedback events are emitted instead of mutating topic-selection authority when implementation results invalidate upstream assumptions.
- Confirm downstream writing consumes only dossier/packet projections.

## Verification
- Contract/schema tests.
- Gate tests for overclaim, missing failed runs, missing trace, strong-claim confirmation, stale packet, memo-as-evidence, missing queryable readiness refs, and feedback-event triggers.
