# 05 Pitfalls

## Do Not Repeat
- Do not promote interpretation text to evidence.
- Do not hide counter evidence or failed runs from claim trace.
- Do not let packet projection become authority.
- Do not mark dossier ready before trace completeness.
- Do not silently lower or broaden upstream topic assumptions from result interpretation.
- Do not bury dossier readiness, lifecycle, or claim trace refs inside JSON-only fields.

## Landed Guardrails
- `ResultInterpretationPacket` accepts only trusted `RunEvidenceUnit` refs and must preserve available validation report refs plus metrics for successful run evidence.
- `support_refs` on `ClaimCandidate` are evidence allowlisted; memo/summary/interpretation refs and workflow/control refs are rejected.
- Ready dossiers require included claim trace packets for every included claim candidate.
- Ready dossiers reject unresolved blockers and require each included claim candidate to be explicitly admitted or rejected.
- Failed, cancelled, negative, and inconclusive runs must remain explicitly accounted for before ready dossier creation.
- Strong claims require explicit human confirmation before admission.
- Writing packets require a ready dossier and matching projection policy; they cannot change readiness or evidence state.
- Shared aggregate exports use `paperImplementationWritingEntryPacketSchema` and `researchArgumentWritingEntryPacketSchema`; no unprefixed aggregate `writingEntryPacketSchema` should be used.
- Result/claim feedback dispatch uses T-093 feedback authority rather than direct topic-selection mutation.
