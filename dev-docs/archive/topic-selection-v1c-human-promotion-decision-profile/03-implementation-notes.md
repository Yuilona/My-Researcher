# 03 Implementation Notes

## Current Position
- Implemented after T-062.
- This package is the authorization boundary for v1c and now hands current promote-class decisions to T-064 through a bridge handoff only.

## 2026-05-15 Implementation
- Added shared contract `topic-selection-v1c-human-promotion-decision-contracts` with canonical decisions, promote/non-promote classes, typed loopback target, `HumanPromotionDecision`, `PromotionDecision`, `PromotionCommitmentProfile`, `PromotionDecisionBundle`, and `PromotionBridgeHandoff` schemas.
- Added Prisma SSOT models and migration for `TopicSelectionHumanPromotionDecision`, `TopicSelectionPromotionDecision`, and `TopicSelectionPromotionCommitmentProfile`; `PromotionDecision.currentPromotionInputSnapshotKey` enforces one current decision per `promotion_input_snapshot_id`.
- Added memory and Prisma repositories that persist T-063 authority records plus control-plane records and existing `TopicSelectionHumanConfirmedDecision` in the same transaction.
- Added `TopicSelectionV1cHumanPromotionDecisionService` consuming only T-062 `PromotionGateHandoff`, rejecting stale gates, workspace drift, non-human actors, snapshot hash mismatch, promote attempts on non-ready gates, and duplicate current decisions.
- Extended T-062 read surface with latest gate handoff lookup by `promotion_input_snapshot_id`; T-062 dossier payload now carries the source snapshot excerpt T-063 freezes into the commitment profile.
- Added shared schema tests and T-063 backend unit tests for promote, promote-with-conditions, non-promote loopback, stale/currentness, repository round-trip, and migration constraints.

## 2026-05-15 Follow-up Hardening
- Tightened `PromotionCondition` so `promote_with_conditions` must carry a concrete owner, non-empty source refs, non-empty early-check obligations, and a typed required action with refs/reason.
- Removed the `unspecified_claim_ceiling` fallback; promote-class commitment profiles now fail if the T-062 dossier handoff does not expose a claim ceiling.
- Tightened `PromotionBridgeHandoff` schema so nested `promotion_decision` must be current, promote-class, bridge-eligible, and linked to a non-null commitment profile.
- Added repository-level current-decision conflict mapping so Prisma `currentPromotionInputSnapshotKey` races surface as `VERSION_CONFLICT` instead of raw `P2002`.

## Watch Points
- Do not create a bridge inside the promotion-decision transaction unless T-064 explicitly owns that transaction later.
- Do not let `promote_with_conditions` omit concrete condition details.
- Do not synthesize claim ceilings in T-063; missing claim ceilings must loop back to T-062/T-061 evidence.
- Do not allow stale gate checks to support current promotion decisions.
- T-064 must still create `PaperProjectBridge`; T-063 only returns a handoff and records `created_bridge=false` in control-plane artifacts.
