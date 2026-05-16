# 01 Schema Diff Preview

## Added
- `TopicSelectionDownstreamTopicFeedback`

## Key Fields
- `paperProjectBridgeId`
- bridge lineage refs: `paperProjectBridgeRef`, `sourcePromotionDecisionRef`, `promotionCommitmentProfileRef`, `promotionInputSnapshotRef`
- feedback refs: `downstreamSourceKind`, `downstreamSourceRef`, `sourceFeedbackRefs`, `observedBlockerRefs`
- typed routing: `feedbackSignal`, `classification`, `recheckRequest`, `impactSummary`
- generic recheck refs: `recheckEventRef`, `recheckImpactRef`, `decisionWorkQueueItemRef`
- replay/grouping: `feedbackFingerprint`

## Guards
- `feedbackFingerprint` is intentionally not unique.
- No `PaperProject` table is created or updated.
- No upstream topic-selection authority table is altered.

