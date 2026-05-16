CREATE TABLE "TopicSelectionDownstreamTopicFeedback" (
  "id" TEXT NOT NULL,
  "feedbackFingerprint" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "paperProjectBridgeId" TEXT NOT NULL,
  "paperProjectBridgeRef" JSONB NOT NULL DEFAULT '{}',
  "sourcePromotionDecisionRef" JSONB NOT NULL DEFAULT '{}',
  "promotionCommitmentProfileRef" JSONB NOT NULL DEFAULT '{}',
  "promotionInputSnapshotId" TEXT NOT NULL,
  "promotionInputSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "promotionInputSnapshotHash" TEXT NOT NULL,
  "topicPackageId" TEXT NOT NULL,
  "packageVersion" TEXT NOT NULL,
  "downstreamSourceKind" TEXT NOT NULL,
  "downstreamSourceRef" JSONB NOT NULL DEFAULT '{}',
  "sourceFeedbackRefs" JSONB NOT NULL DEFAULT '[]',
  "observedBlockerRefs" JSONB NOT NULL DEFAULT '[]',
  "feedbackSignal" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "requiredAction" TEXT,
  "classification" JSONB NOT NULL DEFAULT '{}',
  "recheckRequest" JSONB,
  "impactSummary" JSONB NOT NULL DEFAULT '{}',
  "recheckEventRef" JSONB,
  "recheckImpactRef" JSONB,
  "decisionWorkQueueItemRef" JSONB,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "payload" JSONB NOT NULL DEFAULT '{}',
  "policyVersionId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionDownstreamTopicFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tsdtf_bridge_created_idx"
  ON "TopicSelectionDownstreamTopicFeedback"("paperProjectBridgeId", "createdAt" DESC);

CREATE INDEX "tsdtf_fingerprint_idx"
  ON "TopicSelectionDownstreamTopicFeedback"("feedbackFingerprint");

CREATE INDEX "tsdtf_signal_idx"
  ON "TopicSelectionDownstreamTopicFeedback"("feedbackSignal");

CREATE INDEX "tsdtf_source_kind_created_idx"
  ON "TopicSelectionDownstreamTopicFeedback"("downstreamSourceKind", "createdAt" DESC);

CREATE INDEX "tsdtf_severity_idx"
  ON "TopicSelectionDownstreamTopicFeedback"("severity");

CREATE INDEX "tsdtf_topic_package_idx"
  ON "TopicSelectionDownstreamTopicFeedback"("topicPackageId");

CREATE INDEX "tsdtf_policy_version_idx"
  ON "TopicSelectionDownstreamTopicFeedback"("policyVersionId");
