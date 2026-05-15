ALTER TABLE "TopicPackage"
  ADD COLUMN "v1bPackageVersion" TEXT,
  ADD COLUMN "v1bReadinessStatus" TEXT,
  ADD COLUMN "v1bSourceValueDispositionDecisionId" TEXT,
  ADD COLUMN "v1bSourceQuestionContractId" TEXT,
  ADD COLUMN "v1bSourceResearchSliceId" TEXT,
  ADD COLUMN "v1bSourceResearchSliceVersion" TEXT,
  ADD COLUMN "v1bValueReasoningMemoId" TEXT,
  ADD COLUMN "v1bTraceBoundaryCheckId" TEXT,
  ADD COLUMN "v1bReadinessAssessmentId" TEXT,
  ADD COLUMN "v1bToV1cInputBundleId" TEXT,
  ADD COLUMN "v1bTraceSnapshotId" TEXT,
  ADD COLUMN "v1bInputSnapshotId" TEXT,
  ADD COLUMN "v1bWorkflowRunId" TEXT,
  ADD COLUMN "v1bGateResultId" TEXT,
  ADD COLUMN "v1bTransitionAttemptId" TEXT,
  ADD COLUMN "v1bAuthorityRefs" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "v1bAuthorityPayload" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE "TopicSelectionPackageTraceBoundaryCheck" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicPackageId" TEXT NOT NULL,
  "valueDispositionDecisionId" TEXT NOT NULL,
  "topicValueAssessmentId" TEXT NOT NULL,
  "topicQuestionContractId" TEXT NOT NULL,
  "researchSliceId" TEXT NOT NULL,
  "checkStatus" TEXT NOT NULL,
  "packageRef" JSONB NOT NULL DEFAULT '{}',
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
  "recheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "missingRefCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "newRefCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "boundaryConflictCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "carryForwardCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "traceIssues" JSONB NOT NULL DEFAULT '[]',
  "boundaryIssues" JSONB NOT NULL DEFAULT '[]',
  "narrativeConsistency" JSONB NOT NULL DEFAULT '{}',
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionPackageTraceBoundaryCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTopicPackageReadinessAssessment" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicPackageId" TEXT NOT NULL,
  "valueDispositionDecisionId" TEXT NOT NULL,
  "packageTraceBoundaryCheckId" TEXT NOT NULL,
  "packageVersion" TEXT NOT NULL,
  "packageReadinessStatus" TEXT NOT NULL,
  "blockers" JSONB NOT NULL DEFAULT '[]',
  "warnings" JSONB NOT NULL DEFAULT '[]',
  "requiredActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "blockerRefs" JSONB NOT NULL DEFAULT '[]',
  "recheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "assessedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionTopicPackageReadinessAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionV1bToV1cInputBundle" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicPackageId" TEXT NOT NULL,
  "packageVersion" TEXT NOT NULL,
  "packageReadinessStatus" TEXT NOT NULL,
  "bundleStatus" TEXT NOT NULL,
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
  "packageSnapshot" JSONB NOT NULL DEFAULT '{}',
  "packageDraftInputSnapshot" JSONB NOT NULL DEFAULT '{}',
  "bundleHash" TEXT NOT NULL,
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionV1bToV1cInputBundle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TopicPackage_v1bSourceValueDispositionDecisionId_key"
  ON "TopicPackage"("v1bSourceValueDispositionDecisionId");
CREATE INDEX "TopicPackage_v1bReadinessStatus_idx" ON "TopicPackage"("v1bReadinessStatus");
CREATE INDEX "TopicPackage_v1bSourceQuestionContractId_idx" ON "TopicPackage"("v1bSourceQuestionContractId");
CREATE INDEX "TopicPackage_v1bSourceResearchSliceId_idx" ON "TopicPackage"("v1bSourceResearchSliceId");
CREATE INDEX "TopicPackage_v1bValueReasoningMemoId_idx" ON "TopicPackage"("v1bValueReasoningMemoId");
CREATE INDEX "TopicPackage_v1bTraceBoundaryCheckId_idx" ON "TopicPackage"("v1bTraceBoundaryCheckId");
CREATE INDEX "TopicPackage_v1bReadinessAssessmentId_idx" ON "TopicPackage"("v1bReadinessAssessmentId");
CREATE INDEX "TopicPackage_v1bToV1cInputBundleId_idx" ON "TopicPackage"("v1bToV1cInputBundleId");

CREATE INDEX "TopicSelectionPackageTraceBoundaryCheck_titleCardId_createdAt_idx"
  ON "TopicSelectionPackageTraceBoundaryCheck"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionPackageTraceBoundaryCheck_topicPackageId_idx"
  ON "TopicSelectionPackageTraceBoundaryCheck"("topicPackageId");
CREATE INDEX "TopicSelectionPackageTraceBoundaryCheck_valueDispositionDecisionId_idx"
  ON "TopicSelectionPackageTraceBoundaryCheck"("valueDispositionDecisionId");
CREATE INDEX "TopicSelectionPackageTraceBoundaryCheck_topicValueAssessmentId_idx"
  ON "TopicSelectionPackageTraceBoundaryCheck"("topicValueAssessmentId");
CREATE INDEX "TopicSelectionPackageTraceBoundaryCheck_topicQuestionContractId_idx"
  ON "TopicSelectionPackageTraceBoundaryCheck"("topicQuestionContractId");
CREATE INDEX "TopicSelectionPackageTraceBoundaryCheck_researchSliceId_idx"
  ON "TopicSelectionPackageTraceBoundaryCheck"("researchSliceId");
CREATE INDEX "TopicSelectionPackageTraceBoundaryCheck_checkStatus_idx"
  ON "TopicSelectionPackageTraceBoundaryCheck"("checkStatus");
CREATE INDEX "TopicSelectionPackageTraceBoundaryCheck_workflowRunId_idx"
  ON "TopicSelectionPackageTraceBoundaryCheck"("workflowRunId");
CREATE INDEX "TopicSelectionPackageTraceBoundaryCheck_gateResultId_idx"
  ON "TopicSelectionPackageTraceBoundaryCheck"("gateResultId");

CREATE INDEX "TopicSelectionTopicPackageReadinessAssessment_titleCardId_createdAt_idx"
  ON "TopicSelectionTopicPackageReadinessAssessment"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionTopicPackageReadinessAssessment_topicPackageId_idx"
  ON "TopicSelectionTopicPackageReadinessAssessment"("topicPackageId");
CREATE INDEX "TopicSelectionTopicPackageReadinessAssessment_valueDispositionDecisionId_idx"
  ON "TopicSelectionTopicPackageReadinessAssessment"("valueDispositionDecisionId");
CREATE INDEX "TopicSelectionTopicPackageReadinessAssessment_packageTraceBoundaryCheckId_idx"
  ON "TopicSelectionTopicPackageReadinessAssessment"("packageTraceBoundaryCheckId");
CREATE INDEX "TopicSelectionTopicPackageReadinessAssessment_packageReadinessStatus_idx"
  ON "TopicSelectionTopicPackageReadinessAssessment"("packageReadinessStatus");
CREATE INDEX "TopicSelectionTopicPackageReadinessAssessment_workflowRunId_idx"
  ON "TopicSelectionTopicPackageReadinessAssessment"("workflowRunId");
CREATE INDEX "TopicSelectionTopicPackageReadinessAssessment_gateResultId_idx"
  ON "TopicSelectionTopicPackageReadinessAssessment"("gateResultId");

CREATE INDEX "TopicSelectionV1bToV1cInputBundle_titleCardId_createdAt_idx"
  ON "TopicSelectionV1bToV1cInputBundle"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionV1bToV1cInputBundle_topicPackageId_idx"
  ON "TopicSelectionV1bToV1cInputBundle"("topicPackageId");
CREATE INDEX "TopicSelectionV1bToV1cInputBundle_packageReadinessStatus_idx"
  ON "TopicSelectionV1bToV1cInputBundle"("packageReadinessStatus");
CREATE INDEX "TopicSelectionV1bToV1cInputBundle_bundleStatus_idx"
  ON "TopicSelectionV1bToV1cInputBundle"("bundleStatus");
CREATE INDEX "TopicSelectionV1bToV1cInputBundle_bundleHash_idx"
  ON "TopicSelectionV1bToV1cInputBundle"("bundleHash");
CREATE INDEX "TopicSelectionV1bToV1cInputBundle_workflowRunId_idx"
  ON "TopicSelectionV1bToV1cInputBundle"("workflowRunId");
CREATE INDEX "TopicSelectionV1bToV1cInputBundle_gateResultId_idx"
  ON "TopicSelectionV1bToV1cInputBundle"("gateResultId");
