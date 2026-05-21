# 03 Implementation Notes

## 2026-05-20 - Task Package Created
- Created `T-098` for result interpretation, claim boundary, dossier readiness, and writing-entry projection.
- Depends on T-096 run evidence and T-097 trace kernel.
- No product code changes were made.

## Open Notes
- Keep dossier authority in `PaperImplementation`; downstream writing consumes projections only.

## 2026-05-21 - Backend Minimum Closure
- Added shared result/claim/dossier contracts and schema tests.
- Added Prisma persistence, migration, repository interface, in-memory repository, and Prisma repository for T-098 objects.
- Added `PaperImplementationResultClaimDossierService` with gates for failed/inconclusive run accounting, memo-as-evidence blocking, forbidden overclaim blocking, strong-claim human confirmation, ready dossier claim-trace completeness, and non-ready writing projection blocking.
- Added REST route/controller wiring and extended paper-implementation integration coverage from T-096 run evidence into T-098 result packet, claim candidate, ready dossier, and writing packet creation.
- Feedback events are delegated to T-093 `recordFeedbackEvent` with `paper_implementation` downstream source behavior preserved by the T-093 service.
- No `research-argument` authority path was introduced.

## 2026-05-21 - Review Fixes
- Renamed the PaperImplementation writing projection contract surface to `PaperImplementationWritingEntryPacket` and `paperImplementationWritingEntryPacketSchema`; aggregate shared exports expose legacy research-argument packet schema only as `researchArgumentWritingEntryPacketSchema`.
- Tightened result interpretation gates to require trusted `RunEvidenceUnit` inputs, required validation report refs when run evidence has validation reports, and metric refs for successful run evidence.
- Tightened claim support gates from memo-only rejection to a positive evidence allowlist: run evidence, citation candidates, and citable literature/source evidence.
- Tightened ready dossier gates so unresolved `blocker_refs` block readiness and every included `ClaimCandidate` must be explicitly admitted or rejected.

## Owner Decisions
- Result/claim/dossier authority writer: `PaperImplementationResultClaimDossierService`.
- Trace authority remains T-097; T-098 validates and references trace manifests/claim trace packets but does not redefine trace semantics.
- Experiment/run authority remains T-096; T-098 consumes `RunEvidenceUnit` only.
- Writing lane receives only `PaperImplementationWritingEntryPacket` projections from ready dossiers.
