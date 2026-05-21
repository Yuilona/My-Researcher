# 02 Architecture

## Contract Boundary
| Item | Contract |
|---|---|
| Input objects | `RunEvidenceUnit`, validation reports, evaluation facts, trace manifests, motive/assertion refs |
| Output objects | `ResultInterpretationPacket`, `ClaimCandidate`, `ClaimTracePacket`, `ImplementationDossier`, `ImplementationFeedbackEvent` candidates, `PaperImplementationWritingEntryPacket` projection |
| Authority writer | result/claim/dossier service through `StateWriter` |
| Gates | result interpretation, claim boundary, claim trace, dossier readiness, export confirmation, upstream feedback no-overwrite check |
| Trace | support/challenge/scope/citation/artifact/internal interpretation lineage |
| Handoff | T-099 can propose changes; T-100 can display dossier readiness; writing lane consumes packet projection |

## Contract Review
- Claim support must trace to run evidence, citation candidates, or citable literature/source evidence; memo, summary, interpretation, decision, motive, and validation-control refs cannot be support evidence.
- Result interpretation only accepts trusted `RunEvidenceUnit` inputs and must carry available validation report refs and metric refs before claim handoff.
- Dossier readiness runs after trace completeness.
- Ready dossiers cannot contain unresolved blockers, and every included claim candidate must be explicitly admitted or rejected.
- Packet regeneration is deterministic from dossier version and projection policy.
- Dossier and claim read-models must expose queryable lifecycle/readiness and trace refs for queue, gate, and evaluation checks.
- Implementation findings can request upstream recheck via `ImplementationFeedbackEvent`, but cannot overwrite topic-selection authority.

## Landed Backend Surface
- Shared contract: `paper-implementation-result-claim-dossier-contracts.ts`.
- Persistence authority tables: `PaperImplementationResultInterpretationPacket`, `PaperImplementationClaimCandidate`, `PaperImplementationDossier`, `PaperImplementationWritingEntryPacket`.
- Service: `PaperImplementationResultClaimDossierService`.
- REST endpoints:
  - `POST/GET /paper-implementation/projects/:implementation_project_id/result-interpretation-packets`
  - `GET /paper-implementation/projects/:implementation_project_id/result-interpretation-packets/:result_interpretation_packet_id`
  - `POST/GET /paper-implementation/projects/:implementation_project_id/claim-candidates`
  - `GET /paper-implementation/projects/:implementation_project_id/claim-candidates/:claim_candidate_id`
  - `POST/GET /paper-implementation/projects/:implementation_project_id/implementation-dossiers`
  - `GET /paper-implementation/projects/:implementation_project_id/implementation-dossiers/:dossier_id`
  - `POST /paper-implementation/projects/:implementation_project_id/implementation-dossiers/:dossier_id/writing-entry-packets`
  - `GET /paper-implementation/projects/:implementation_project_id/writing-entry-packets`
  - `POST /paper-implementation/projects/:implementation_project_id/result-claim-feedback-events`

## Authority Rules
- `ResultInterpretationPacket` is interpretation of run evidence; it is never evidence or citation material.
- `ClaimCandidate` support refs are positive-allowlisted to evidence-bearing refs; generic workflow/control objects are rejected.
- `ImplementationDossier` readiness is the writing-prep authority boundary.
- `PaperImplementationWritingEntryPacket` is a projection from a ready dossier; it cannot override readiness, dossier hash, trace, or claim trace state.
- Aggregate shared exports keep legacy research-argument packet schemas under `researchArgumentWritingEntryPacketSchema`; PaperImplementation uses `paperImplementationWritingEntryPacketSchema`.
