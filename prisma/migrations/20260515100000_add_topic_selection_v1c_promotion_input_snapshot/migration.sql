CREATE TABLE "TopicSelectionPromotionInputSnapshot" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "v1bToV1cInputBundleId" TEXT NOT NULL,
  "topicPackageId" TEXT NOT NULL,
  "packageVersion" TEXT NOT NULL,
  "closureStatus" TEXT NOT NULL,
  "stopConditionCode" TEXT,
  "requiredActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "blockers" JSONB NOT NULL DEFAULT '[]',
  "warnings" JSONB NOT NULL DEFAULT '[]',
  "checkDetails" JSONB NOT NULL DEFAULT '[]',
  "bundleHash" TEXT NOT NULL,
  "packageSnapshotHash" TEXT NOT NULL,
  "packageDraftInputSnapshotHash" TEXT NOT NULL,
  "promotionInputSnapshotHash" TEXT NOT NULL,
  "sourceBundleRef" JSONB NOT NULL DEFAULT '{}',
  "promotionInputSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "topicPackageRef" JSONB NOT NULL DEFAULT '{}',
  "packageTraceBoundaryCheckRef" JSONB NOT NULL DEFAULT '{}',
  "packageReadinessAssessmentRef" JSONB NOT NULL DEFAULT '{}',
  "topicValueAssessmentRef" JSONB NOT NULL DEFAULT '{}',
  "valueReasoningMemoRef" JSONB NOT NULL DEFAULT '{}',
  "valueDispositionDecisionRef" JSONB NOT NULL DEFAULT '{}',
  "topicQuestionRef" JSONB NOT NULL DEFAULT '{}',
  "topicQuestionContractRef" JSONB NOT NULL DEFAULT '{}',
  "answerabilityPlanRef" JSONB NOT NULL DEFAULT '{}',
  "researchSliceRef" JSONB NOT NULL DEFAULT '{}',
  "validatedNeedRefs" JSONB NOT NULL DEFAULT '[]',
  "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "blockerRefs" JSONB NOT NULL DEFAULT '[]',
  "memorySuggestionRefs" JSONB NOT NULL DEFAULT '[]',
  "recheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "readinessCheckRefs" JSONB NOT NULL DEFAULT '[]',
  "replacementBundleRef" JSONB,
  "sourceBundleSnapshot" JSONB NOT NULL DEFAULT '{}',
  "packageSnapshot" JSONB NOT NULL DEFAULT '{}',
  "packageDraftInputSnapshot" JSONB NOT NULL DEFAULT '{}',
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "traceSnapshotId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionPromotionInputSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TopicSelectionPromotionInputSnapshot_v1bToV1cInputBundleId_key"
  ON "TopicSelectionPromotionInputSnapshot"("v1bToV1cInputBundleId");

CREATE INDEX "TopicSelectionPromotionInputSnapshot_titleCardId_createdAt_idx"
  ON "TopicSelectionPromotionInputSnapshot"("titleCardId", "createdAt" DESC);

CREATE INDEX "TopicSelectionPromotionInputSnapshot_topicPackageId_idx"
  ON "TopicSelectionPromotionInputSnapshot"("topicPackageId");

CREATE INDEX "TopicSelectionPromotionInputSnapshot_closureStatus_idx"
  ON "TopicSelectionPromotionInputSnapshot"("closureStatus");

CREATE INDEX "TopicSelectionPromotionInputSnapshot_bundleHash_idx"
  ON "TopicSelectionPromotionInputSnapshot"("bundleHash");

CREATE INDEX "TopicSelectionPromotionInputSnapshot_promotionInputSnapshotHash_idx"
  ON "TopicSelectionPromotionInputSnapshot"("promotionInputSnapshotHash");

CREATE INDEX "TopicSelectionPromotionInputSnapshot_workflowRunId_idx"
  ON "TopicSelectionPromotionInputSnapshot"("workflowRunId");

CREATE INDEX "TopicSelectionPromotionInputSnapshot_gateResultId_idx"
  ON "TopicSelectionPromotionInputSnapshot"("gateResultId");
