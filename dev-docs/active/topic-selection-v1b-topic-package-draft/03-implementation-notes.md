# 03 Implementation Notes

## 2026-05-14 - Split Creation
- Created as the final authority-object package for v1b.
- Owns the v1c handoff contract so v1c can stay promotion-focused.

## 2026-05-14 - Implementation
- Added shared T-058 contracts and exports for `TopicSelectionTopicPackageRecord`, `TopicSelectionPackageTraceBoundaryCheckRecord`, `TopicSelectionTopicPackageReadinessAssessmentRecord`, `TopicSelectionV1bToV1cInputBundleRecord`, and canonical package readiness statuses.
- Extended Prisma SSOT with v1b authority columns on `TitleCardPackage` plus sidecar tables for trace/boundary checks, readiness assessments, and v1b-to-v1c bundles.
- Added memory and Prisma repositories for T-058; the Prisma path creates package, sidecars, optional v1c bundle, and the value-disposition output patch in one transaction.
- Added `TopicSelectionV1bTopicPackageService` with `createDraftPackage`, `publishV1cInputBundle`, and `getDraftPackage`.
- Enforced hard preconditions before package creation: only active/current `advance_to_package` decisions with a T-060 handoff payload, no existing output package, and no workspace drift.
- Implemented deterministic narrative mapping from T-060 handoff fields only, preserving upstream value, question, slice, need, evidence, risk, blocker, memory, and recheck refs without creating new authority refs.
- Implemented trace/boundary/readiness checks for required refs, new evidence/need ref drift, prohibited-claim leakage, claim-ceiling consistency, and risk/blocker/recheck carry-forward.
- Ready packages publish a persisted v1c input bundle; `blocked` and `needs_revision` packages keep package/check/readiness records but do not create a v1c start.
- Live DB migration was not applied; only repo Prisma schema, migration SQL, generated Prisma client during typecheck, and generated DB context were updated.

## 2026-05-14 - Review Hardening
- Added runtime validation that the embedded T-060 `package_draft_input` refs and nested authority snapshots match the loaded active/current `ValueDispositionDecision` before any package creation is attempted.
- Deepened malformed-ref checks for inherited need/evidence/risk/memory/recheck refs plus boundary, assumption, and falsification carry-forward records.
- Moved T-058 control-plane record persistence behind the package repository boundary so Prisma writes input snapshot, workflow run, artifact refs, gate result, transition attempt, trace snapshot, package, sidecars, optional v1c bundle, and disposition output patch in a single transaction.
- Removed the direct `controlPlaneService` constructor dependency from the T-058 service; the service now builds control-plane records as part of one repository persistence payload.
- Extended in-memory and fake Prisma repositories to roll back control-plane side effects when package persistence fails.
