# 01 Plan

## Phases
1. [x] Review `RunEvidenceUnit` and trace outputs from T-096/T-097.
2. [x] Define `ResultInterpretationPacket`.
3. [x] Define `ClaimCandidate`, `ClaimBoundaryGate`, and `ClaimTracePacket` usage.
4. [x] Define `ImplementationDossier`, readiness gate, and dossier statuses.
5. [x] Define upstream feedback triggers from claim ceiling, invalidated evidence, and unanswerable topic question.
6. [x] Define queryable readiness/lifecycle/trace fields required for gate, queue, and evaluation.
7. [x] Define `PaperImplementationWritingEntryPacket` projection contract.

## Review Before Next Flow
- AI harness can only propose interpretation/claim boundaries, not write readiness; authority writes remain in the result/claim/dossier service.
- Desktop can display dossier blockers and commands from read-models through columnized status, trace, gate, and count fields.
- Feedback events are emitted through T-093 `ImplementationFeedbackEvent`; T-098 does not mutate topic-selection authority.
- Downstream writing consumes only ready `ImplementationDossier` and derived `PaperImplementationWritingEntryPacket` projections.

## Verification
- Contract/schema tests passed.
- Gate tests cover overclaim, missing failed runs, missing trace, strong-claim confirmation, non-ready packet projection, memo-as-evidence, queryable readiness refs, and feedback-event triggers.
