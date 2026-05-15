CREATE TABLE "TopicSelectionPromotionDecisionSupport" (
  "id" TEXT NOT NULL,
  "supportRunKey" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "promotionInputSnapshotId" TEXT NOT NULL,
  "promotionInputSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "promotionInputSnapshotHash" TEXT NOT NULL,
  "topicPackageId" TEXT NOT NULL,
  "packageVersion" TEXT NOT NULL,
  "supportGenerationMode" TEXT NOT NULL,
  "supportStatus" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "reviewerQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "riskNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "recheckNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sourceRefs" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "blockerRefs" JSONB NOT NULL DEFAULT '[]',
  "recheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "memorySuggestionRefs" JSONB NOT NULL DEFAULT '[]',
  "warnings" JSONB NOT NULL DEFAULT '[]',
  "llmDraftPayload" JSONB,
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionPromotionDecisionSupport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionPromotionDossier" (
  "id" TEXT NOT NULL,
  "supportRunKey" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "promotionDecisionSupportId" TEXT NOT NULL,
  "promotionInputSnapshotId" TEXT NOT NULL,
  "topicPackageId" TEXT NOT NULL,
  "packageVersion" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "reviewerPacketArtifactRef" JSONB NOT NULL DEFAULT '{}',
  "dossierPayload" JSONB NOT NULL DEFAULT '{}',
  "sourceRefs" JSONB NOT NULL DEFAULT '[]',
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionPromotionDossier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionArgumentReadinessMiniCheck" (
  "id" TEXT NOT NULL,
  "supportRunKey" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "promotionDecisionSupportId" TEXT NOT NULL,
  "promotionInputSnapshotId" TEXT NOT NULL,
  "checkStatus" TEXT NOT NULL,
  "checkItems" JSONB NOT NULL DEFAULT '[]',
  "blockers" JSONB NOT NULL DEFAULT '[]',
  "warnings" JSONB NOT NULL DEFAULT '[]',
  "requiredActions" JSONB NOT NULL DEFAULT '[]',
  "earlyCheckObligations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sourceRefs" JSONB NOT NULL DEFAULT '[]',
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionArgumentReadinessMiniCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionPromotionGateCheck" (
  "id" TEXT NOT NULL,
  "supportRunKey" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "promotionDecisionSupportId" TEXT NOT NULL,
  "promotionDossierId" TEXT NOT NULL,
  "argumentReadinessMiniCheckId" TEXT NOT NULL,
  "promotionInputSnapshotId" TEXT NOT NULL,
  "promotionInputSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "promotionInputSnapshotHash" TEXT NOT NULL,
  "disposition" TEXT NOT NULL,
  "promoteAllowed" BOOLEAN NOT NULL,
  "blockers" JSONB NOT NULL DEFAULT '[]',
  "warnings" JSONB NOT NULL DEFAULT '[]',
  "requiredActions" JSONB NOT NULL DEFAULT '[]',
  "loopbackHints" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "blockerRefs" JSONB NOT NULL DEFAULT '[]',
  "recheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "memorySuggestionRefs" JSONB NOT NULL DEFAULT '[]',
  "sourceRefs" JSONB NOT NULL DEFAULT '[]',
  "snapshotHashes" JSONB NOT NULL DEFAULT '{}',
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "traceSnapshotId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionPromotionGateCheck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tspds_support_run_key_key"
  ON "TopicSelectionPromotionDecisionSupport"("supportRunKey");

CREATE INDEX "tspds_title_created_idx"
  ON "TopicSelectionPromotionDecisionSupport"("titleCardId", "createdAt" DESC);

CREATE INDEX "tspds_input_snapshot_id_idx"
  ON "TopicSelectionPromotionDecisionSupport"("promotionInputSnapshotId");

CREATE INDEX "tspds_input_snapshot_hash_idx"
  ON "TopicSelectionPromotionDecisionSupport"("promotionInputSnapshotHash");

CREATE INDEX "tspds_topic_package_idx"
  ON "TopicSelectionPromotionDecisionSupport"("topicPackageId");

CREATE INDEX "tspds_generation_mode_idx"
  ON "TopicSelectionPromotionDecisionSupport"("supportGenerationMode");

CREATE INDEX "tspds_workflow_run_idx"
  ON "TopicSelectionPromotionDecisionSupport"("workflowRunId");

CREATE UNIQUE INDEX "tspd_support_run_key_key"
  ON "TopicSelectionPromotionDossier"("supportRunKey");

CREATE INDEX "tspd_title_created_idx"
  ON "TopicSelectionPromotionDossier"("titleCardId", "createdAt" DESC);

CREATE INDEX "tspd_support_id_idx"
  ON "TopicSelectionPromotionDossier"("promotionDecisionSupportId");

CREATE INDEX "tspd_input_snapshot_id_idx"
  ON "TopicSelectionPromotionDossier"("promotionInputSnapshotId");

CREATE INDEX "tspd_topic_package_idx"
  ON "TopicSelectionPromotionDossier"("topicPackageId");

CREATE UNIQUE INDEX "tsarmc_support_run_key_key"
  ON "TopicSelectionArgumentReadinessMiniCheck"("supportRunKey");

CREATE INDEX "tsarmc_title_created_idx"
  ON "TopicSelectionArgumentReadinessMiniCheck"("titleCardId", "createdAt" DESC);

CREATE INDEX "tsarmc_support_id_idx"
  ON "TopicSelectionArgumentReadinessMiniCheck"("promotionDecisionSupportId");

CREATE INDEX "tsarmc_input_snapshot_id_idx"
  ON "TopicSelectionArgumentReadinessMiniCheck"("promotionInputSnapshotId");

CREATE INDEX "tsarmc_check_status_idx"
  ON "TopicSelectionArgumentReadinessMiniCheck"("checkStatus");

CREATE UNIQUE INDEX "tspgc_support_run_key_key"
  ON "TopicSelectionPromotionGateCheck"("supportRunKey");

CREATE INDEX "tspgc_title_created_idx"
  ON "TopicSelectionPromotionGateCheck"("titleCardId", "createdAt" DESC);

CREATE INDEX "tspgc_support_id_idx"
  ON "TopicSelectionPromotionGateCheck"("promotionDecisionSupportId");

CREATE INDEX "tspgc_dossier_id_idx"
  ON "TopicSelectionPromotionGateCheck"("promotionDossierId");

CREATE INDEX "tspgc_mini_check_id_idx"
  ON "TopicSelectionPromotionGateCheck"("argumentReadinessMiniCheckId");

CREATE INDEX "tspgc_input_snapshot_id_idx"
  ON "TopicSelectionPromotionGateCheck"("promotionInputSnapshotId");

CREATE INDEX "tspgc_input_snapshot_hash_idx"
  ON "TopicSelectionPromotionGateCheck"("promotionInputSnapshotHash");

CREATE INDEX "tspgc_disposition_idx"
  ON "TopicSelectionPromotionGateCheck"("disposition");

CREATE INDEX "tspgc_promote_allowed_idx"
  ON "TopicSelectionPromotionGateCheck"("promoteAllowed");

CREATE INDEX "tspgc_workflow_run_idx"
  ON "TopicSelectionPromotionGateCheck"("workflowRunId");

CREATE INDEX "tspgc_gate_result_idx"
  ON "TopicSelectionPromotionGateCheck"("gateResultId");
