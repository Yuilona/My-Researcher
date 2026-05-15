CREATE TABLE "TopicSelectionHumanPromotionDecision" (
  "id" TEXT NOT NULL,
  "humanConfirmedDecisionId" TEXT NOT NULL,
  "humanPromotionDecisionKey" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "promotionGateCheckId" TEXT NOT NULL,
  "promotionGateCheckRef" JSONB NOT NULL DEFAULT '{}',
  "promotionInputSnapshotId" TEXT NOT NULL,
  "promotionInputSnapshotHash" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "decisionClass" TEXT NOT NULL,
  "actor" JSONB NOT NULL DEFAULT '{}',
  "decisionTimestamp" TIMESTAMPTZ(6) NOT NULL,
  "confirmedSnapshotHash" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "conditions" JSONB NOT NULL DEFAULT '[]',
  "requiredActions" JSONB NOT NULL DEFAULT '[]',
  "loopbackTarget" TEXT,
  "loopbackRefs" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "allowedRefinements" JSONB NOT NULL DEFAULT '[]',
  "stopConditions" JSONB NOT NULL DEFAULT '[]',
  "reopenConditions" JSONB NOT NULL DEFAULT '[]',
  "sourceRefs" JSONB NOT NULL DEFAULT '[]',
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "traceSnapshotId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "policyVersionId" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionHumanPromotionDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionPromotionDecision" (
  "id" TEXT NOT NULL,
  "promotionDecisionStatus" TEXT NOT NULL,
  "currentPromotionInputSnapshotKey" TEXT,
  "humanPromotionDecisionId" TEXT NOT NULL,
  "humanConfirmedDecisionId" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "promotionGateCheckId" TEXT NOT NULL,
  "promotionInputSnapshotId" TEXT NOT NULL,
  "promotionInputSnapshotHash" TEXT NOT NULL,
  "gateDisposition" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "decisionClass" TEXT NOT NULL,
  "bridgeEligible" BOOLEAN NOT NULL,
  "promotionCommitmentProfileId" TEXT,
  "loopbackTarget" TEXT,
  "requiredActions" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "conditions" JSONB NOT NULL DEFAULT '[]',
  "sourceRefs" JSONB NOT NULL DEFAULT '[]',
  "snapshotHashes" JSONB NOT NULL DEFAULT '{}',
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionPromotionDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionPromotionCommitmentProfile" (
  "id" TEXT NOT NULL,
  "promotionDecisionId" TEXT NOT NULL,
  "humanPromotionDecisionId" TEXT NOT NULL,
  "humanConfirmedDecisionId" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "promotionGateCheckId" TEXT NOT NULL,
  "promotionInputSnapshotId" TEXT NOT NULL,
  "promotionInputSnapshotHash" TEXT NOT NULL,
  "topicPackageId" TEXT NOT NULL,
  "packageVersion" TEXT NOT NULL,
  "scope" JSONB NOT NULL DEFAULT '{}',
  "claimCeiling" TEXT NOT NULL,
  "prohibitedClaims" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "conditions" JSONB NOT NULL DEFAULT '[]',
  "allowedRefinements" JSONB NOT NULL DEFAULT '[]',
  "earlyCheckObligations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "stopConditions" JSONB NOT NULL DEFAULT '[]',
  "reopenConditions" JSONB NOT NULL DEFAULT '[]',
  "sourceRefs" JSONB NOT NULL DEFAULT '[]',
  "snapshotHashes" JSONB NOT NULL DEFAULT '{}',
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionPromotionCommitmentProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tshpd_decision_key_key"
  ON "TopicSelectionHumanPromotionDecision"("humanPromotionDecisionKey");

CREATE INDEX "tshpd_title_created_idx"
  ON "TopicSelectionHumanPromotionDecision"("titleCardId", "createdAt" DESC);

CREATE INDEX "tshpd_human_confirmed_idx"
  ON "TopicSelectionHumanPromotionDecision"("humanConfirmedDecisionId");

CREATE INDEX "tshpd_gate_check_idx"
  ON "TopicSelectionHumanPromotionDecision"("promotionGateCheckId");

CREATE INDEX "tshpd_input_snapshot_idx"
  ON "TopicSelectionHumanPromotionDecision"("promotionInputSnapshotId");

CREATE INDEX "tshpd_decision_idx"
  ON "TopicSelectionHumanPromotionDecision"("decision");

CREATE INDEX "tshpd_decision_class_idx"
  ON "TopicSelectionHumanPromotionDecision"("decisionClass");

CREATE INDEX "tshpd_policy_version_idx"
  ON "TopicSelectionHumanPromotionDecision"("policyVersionId");

CREATE UNIQUE INDEX "tspd_current_input_snapshot_key"
  ON "TopicSelectionPromotionDecision"("currentPromotionInputSnapshotKey");

CREATE INDEX "tspd_decision_title_created_idx"
  ON "TopicSelectionPromotionDecision"("titleCardId", "createdAt" DESC);

CREATE INDEX "tspd_decision_human_promotion_idx"
  ON "TopicSelectionPromotionDecision"("humanPromotionDecisionId");

CREATE INDEX "tspd_decision_human_confirmed_idx"
  ON "TopicSelectionPromotionDecision"("humanConfirmedDecisionId");

CREATE INDEX "tspd_decision_gate_check_idx"
  ON "TopicSelectionPromotionDecision"("promotionGateCheckId");

CREATE INDEX "tspd_decision_input_snapshot_idx"
  ON "TopicSelectionPromotionDecision"("promotionInputSnapshotId");

CREATE INDEX "tspd_decision_input_hash_idx"
  ON "TopicSelectionPromotionDecision"("promotionInputSnapshotHash");

CREATE INDEX "tspd_decision_kind_idx"
  ON "TopicSelectionPromotionDecision"("decision");

CREATE INDEX "tspd_decision_class_idx"
  ON "TopicSelectionPromotionDecision"("decisionClass");

CREATE INDEX "tspd_decision_bridge_eligible_idx"
  ON "TopicSelectionPromotionDecision"("bridgeEligible");

CREATE UNIQUE INDEX "tspcp_promotion_decision_key"
  ON "TopicSelectionPromotionCommitmentProfile"("promotionDecisionId");

CREATE INDEX "tspcp_title_created_idx"
  ON "TopicSelectionPromotionCommitmentProfile"("titleCardId", "createdAt" DESC);

CREATE INDEX "tspcp_human_promotion_idx"
  ON "TopicSelectionPromotionCommitmentProfile"("humanPromotionDecisionId");

CREATE INDEX "tspcp_human_confirmed_idx"
  ON "TopicSelectionPromotionCommitmentProfile"("humanConfirmedDecisionId");

CREATE INDEX "tspcp_gate_check_idx"
  ON "TopicSelectionPromotionCommitmentProfile"("promotionGateCheckId");

CREATE INDEX "tspcp_input_snapshot_idx"
  ON "TopicSelectionPromotionCommitmentProfile"("promotionInputSnapshotId");

CREATE INDEX "tspcp_topic_package_idx"
  ON "TopicSelectionPromotionCommitmentProfile"("topicPackageId");
