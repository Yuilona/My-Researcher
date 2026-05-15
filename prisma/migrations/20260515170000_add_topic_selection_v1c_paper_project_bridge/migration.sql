CREATE TABLE "TopicSelectionPaperProjectBridge" (
  "id" TEXT NOT NULL,
  "bridgeStatus" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "sourcePromotionDecisionId" TEXT NOT NULL,
  "sourcePromotionDecisionRef" JSONB NOT NULL DEFAULT '{}',
  "humanPromotionDecisionRef" JSONB NOT NULL DEFAULT '{}',
  "humanConfirmedDecisionRef" JSONB NOT NULL DEFAULT '{}',
  "promotionCommitmentProfileId" TEXT NOT NULL,
  "promotionCommitmentProfileRef" JSONB NOT NULL DEFAULT '{}',
  "promotionGateCheckRef" JSONB NOT NULL DEFAULT '{}',
  "promotionInputSnapshotId" TEXT NOT NULL,
  "promotionInputSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "promotionInputSnapshotHash" TEXT NOT NULL,
  "topicPackageId" TEXT NOT NULL,
  "packageVersion" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "conditions" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "allowedRefinements" JSONB NOT NULL DEFAULT '[]',
  "earlyCheckObligations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "stopConditions" JSONB NOT NULL DEFAULT '[]',
  "reopenConditions" JSONB NOT NULL DEFAULT '[]',
  "sourceRefs" JSONB NOT NULL DEFAULT '[]',
  "snapshotHashes" JSONB NOT NULL DEFAULT '{}',
  "workingCopyPayload" JSONB NOT NULL DEFAULT '{}',
  "workingCopyPayloadHash" TEXT NOT NULL,
  "bridgePayloadHash" TEXT NOT NULL,
  "paperProjectIntakeRef" JSONB,
  "targetPaperProjectRef" JSONB,
  "sourcePromotionHandoff" JSONB NOT NULL DEFAULT '{}',
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "traceSnapshotId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "policyVersionId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionPaperProjectBridge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tsppb_source_promotion_decision_key"
  ON "TopicSelectionPaperProjectBridge"("sourcePromotionDecisionId");

CREATE INDEX "tsppb_title_created_idx"
  ON "TopicSelectionPaperProjectBridge"("titleCardId", "createdAt" DESC);

CREATE INDEX "tsppb_bridge_status_idx"
  ON "TopicSelectionPaperProjectBridge"("bridgeStatus");

CREATE INDEX "tsppb_commitment_profile_idx"
  ON "TopicSelectionPaperProjectBridge"("promotionCommitmentProfileId");

CREATE INDEX "tsppb_input_snapshot_idx"
  ON "TopicSelectionPaperProjectBridge"("promotionInputSnapshotId");

CREATE INDEX "tsppb_input_hash_idx"
  ON "TopicSelectionPaperProjectBridge"("promotionInputSnapshotHash");

CREATE INDEX "tsppb_topic_package_idx"
  ON "TopicSelectionPaperProjectBridge"("topicPackageId");

CREATE INDEX "tsppb_policy_version_idx"
  ON "TopicSelectionPaperProjectBridge"("policyVersionId");
