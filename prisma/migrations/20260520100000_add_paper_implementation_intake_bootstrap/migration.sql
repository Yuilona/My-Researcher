CREATE TABLE "PaperImplementationIntakeSnapshot" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "paperProjectBridgeId" TEXT NOT NULL,
  "paperProjectBridgeRef" JSONB NOT NULL DEFAULT '{}',
  "bridgePayloadHash" TEXT NOT NULL,
  "promotionDecisionId" TEXT NOT NULL,
  "promotionDecisionRef" JSONB NOT NULL DEFAULT '{}',
  "promotionCommitmentProfileId" TEXT NOT NULL,
  "promotionCommitmentProfileRef" JSONB NOT NULL DEFAULT '{}',
  "promotionInputSnapshotId" TEXT NOT NULL,
  "promotionInputSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "promotionInputSnapshotHash" TEXT NOT NULL,
  "topicPackageId" TEXT NOT NULL,
  "packageVersion" TEXT NOT NULL,
  "sourceStatus" TEXT NOT NULL,
  "snapshotHashes" JSONB NOT NULL DEFAULT '{}',
  "sourceRefs" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "conditionRefs" JSONB NOT NULL DEFAULT '[]',
  "earlyCheckObligations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "workingCopyPayload" JSONB NOT NULL DEFAULT '{}',
  "workingCopyPayloadHash" TEXT NOT NULL,
  "sourceHandoff" JSONB NOT NULL DEFAULT '{}',
  "targetPaperProjectRef" JSONB,
  "intakeSnapshotHash" TEXT NOT NULL,
  "policyVersionId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "PaperImplementationIntakeSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationProject" (
  "id" TEXT NOT NULL,
  "intakeSnapshotId" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "paperProjectBridgeId" TEXT NOT NULL,
  "bridgePayloadHash" TEXT NOT NULL,
  "targetPaperProjectRef" JSONB,
  "lifecycleStatus" TEXT NOT NULL,
  "freshnessStatus" TEXT NOT NULL,
  "sourceStatus" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "policyVersionId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "PaperImplementationProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationFeedbackEvent" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "intakeSnapshotId" TEXT NOT NULL,
  "paperProjectBridgeId" TEXT NOT NULL,
  "feedbackType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "sourceObjectRefs" JSONB NOT NULL DEFAULT '[]',
  "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "runRefs" JSONB NOT NULL DEFAULT '[]',
  "recommendedUpstreamAction" TEXT NOT NULL,
  "feedbackStatus" TEXT NOT NULL,
  "downstreamTopicFeedbackRef" JSONB,
  "downstreamRecheckRequest" JSONB,
  "downstreamImpactSummary" JSONB,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "payload" JSONB NOT NULL DEFAULT '{}',
  "policyVersionId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "PaperImplementationFeedbackEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "piis_project_unique"
  ON "PaperImplementationIntakeSnapshot"("implementationProjectId");

CREATE INDEX "piis_bridge_created_idx"
  ON "PaperImplementationIntakeSnapshot"("paperProjectBridgeId", "createdAt" DESC);

CREATE INDEX "piis_bridge_hash_idx"
  ON "PaperImplementationIntakeSnapshot"("bridgePayloadHash");

CREATE INDEX "piis_promotion_decision_idx"
  ON "PaperImplementationIntakeSnapshot"("promotionDecisionId");

CREATE INDEX "piis_commitment_profile_idx"
  ON "PaperImplementationIntakeSnapshot"("promotionCommitmentProfileId");

CREATE INDEX "piis_input_snapshot_idx"
  ON "PaperImplementationIntakeSnapshot"("promotionInputSnapshotId");

CREATE INDEX "piis_input_hash_idx"
  ON "PaperImplementationIntakeSnapshot"("promotionInputSnapshotHash");

CREATE INDEX "piis_topic_package_idx"
  ON "PaperImplementationIntakeSnapshot"("topicPackageId");

CREATE INDEX "piis_source_status_idx"
  ON "PaperImplementationIntakeSnapshot"("sourceStatus");

CREATE INDEX "piis_policy_version_idx"
  ON "PaperImplementationIntakeSnapshot"("policyVersionId");

CREATE UNIQUE INDEX "pip_intake_snapshot_unique"
  ON "PaperImplementationProject"("intakeSnapshotId");

CREATE UNIQUE INDEX "pip_bridge_unique"
  ON "PaperImplementationProject"("paperProjectBridgeId");

CREATE INDEX "pip_title_created_idx"
  ON "PaperImplementationProject"("titleCardId", "createdAt" DESC);

CREATE INDEX "pip_bridge_hash_idx"
  ON "PaperImplementationProject"("bridgePayloadHash");

CREATE INDEX "pip_lifecycle_status_idx"
  ON "PaperImplementationProject"("lifecycleStatus");

CREATE INDEX "pip_freshness_status_idx"
  ON "PaperImplementationProject"("freshnessStatus");

CREATE INDEX "pip_source_status_idx"
  ON "PaperImplementationProject"("sourceStatus");

CREATE INDEX "pip_policy_version_idx"
  ON "PaperImplementationProject"("policyVersionId");

CREATE INDEX "pife_project_created_idx"
  ON "PaperImplementationFeedbackEvent"("implementationProjectId", "createdAt" DESC);

CREATE INDEX "pife_bridge_created_idx"
  ON "PaperImplementationFeedbackEvent"("paperProjectBridgeId", "createdAt" DESC);

CREATE INDEX "pife_feedback_type_idx"
  ON "PaperImplementationFeedbackEvent"("feedbackType");

CREATE INDEX "pife_severity_idx"
  ON "PaperImplementationFeedbackEvent"("severity");

CREATE INDEX "pife_status_idx"
  ON "PaperImplementationFeedbackEvent"("feedbackStatus");

CREATE INDEX "pife_upstream_action_idx"
  ON "PaperImplementationFeedbackEvent"("recommendedUpstreamAction");

CREATE INDEX "pife_policy_version_idx"
  ON "PaperImplementationFeedbackEvent"("policyVersionId");
