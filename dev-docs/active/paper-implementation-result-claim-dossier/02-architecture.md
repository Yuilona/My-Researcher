# 02 Architecture

## Contract Boundary
| Item | Contract |
|---|---|
| Input objects | `RunEvidenceUnit`, validation reports, evaluation facts, trace manifests, motive/assertion refs |
| Output objects | `ResultInterpretationPacket`, `ClaimCandidate`, `ClaimTracePacket`, `ImplementationDossier`, `ImplementationFeedbackEvent` candidates, `WritingEntryPacket` projection |
| Authority writer | result/claim/dossier service through `StateWriter` |
| Gates | result interpretation, claim boundary, claim trace, dossier readiness, export confirmation, upstream feedback no-overwrite check |
| Trace | support/challenge/scope/citation/artifact/internal interpretation lineage |
| Handoff | T-099 can propose changes; T-100 can display dossier readiness; writing lane consumes packet projection |

## Contract Review
- Claim support must trace to run evidence or citable literature, not interpretation text.
- Dossier readiness runs after trace completeness.
- Packet regeneration is deterministic from dossier version and projection policy.
- Dossier and claim read-models must expose queryable lifecycle/readiness and trace refs for queue, gate, and evaluation checks.
- Implementation findings can request upstream recheck via `ImplementationFeedbackEvent`, but cannot overwrite topic-selection authority.
