ALTER TABLE "TopicValueAssessment"
  ADD COLUMN "v1bSourceQuestionContractId" TEXT,
  ADD COLUMN "v1bSourceResearchSliceId" TEXT,
  ADD COLUMN "v1bSourceResearchSliceVersion" TEXT,
  ADD COLUMN "v1bAssessmentRunId" TEXT,
  ADD COLUMN "v1bInputSnapshotId" TEXT,
  ADD COLUMN "v1bReasoningMemoId" TEXT,
  ADD COLUMN "v1bActiveDispositionDecisionId" TEXT,
  ADD COLUMN "v1bReadinessStatus" TEXT,
  ADD COLUMN "v1bFreshnessStatus" TEXT;

CREATE TABLE "TopicSelectionAssessTopicValueRun" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicQuestionContractId" TEXT NOT NULL,
  "topicQuestionId" TEXT NOT NULL,
  "researchSliceId" TEXT NOT NULL,
  "researchSliceVersion" TEXT NOT NULL,
  "topicValueAssessmentId" TEXT,
  "valueReasoningMemoId" TEXT,
  "status" TEXT NOT NULL,
  "triggeredBy" TEXT NOT NULL,
  "topicQuestionRef" JSONB NOT NULL DEFAULT '{}',
  "topicQuestionContractRef" JSONB NOT NULL DEFAULT '{}',
  "answerabilityPlanRef" JSONB NOT NULL DEFAULT '{}',
  "researchSliceRef" JSONB NOT NULL DEFAULT '{}',
  "selectionDecisionRef" JSONB NOT NULL DEFAULT '{}',
  "validatedNeedRefs" JSONB NOT NULL DEFAULT '[]',
  "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "memorySuggestionRefs" JSONB NOT NULL DEFAULT '[]',
  "recheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "workflowProfileKey" TEXT NOT NULL,
  "workflowProfileVersion" TEXT,
  "providerId" TEXT,
  "modelId" TEXT,
  "promptTemplateId" TEXT,
  "promptTemplateVersion" TEXT,
  "topicValueInputSnapshotId" TEXT,
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "qualityFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "failureReason" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionAssessTopicValueRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTopicValueAssessmentInputSnapshot" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicQuestionContractId" TEXT NOT NULL,
  "topicQuestionId" TEXT NOT NULL,
  "researchSliceId" TEXT NOT NULL,
  "researchSliceVersion" TEXT NOT NULL,
  "topicQuestionRef" JSONB NOT NULL DEFAULT '{}',
  "topicQuestionContractRef" JSONB NOT NULL DEFAULT '{}',
  "answerabilityPlanRef" JSONB NOT NULL DEFAULT '{}',
  "researchSliceRef" JSONB NOT NULL DEFAULT '{}',
  "validatedNeedRefs" JSONB NOT NULL DEFAULT '[]',
  "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "needRefs" JSONB NOT NULL DEFAULT '[]',
  "boundaryRefs" JSONB NOT NULL DEFAULT '[]',
  "assumptionRefs" JSONB NOT NULL DEFAULT '[]',
  "falsificationConditions" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "memorySuggestionRefs" JSONB NOT NULL DEFAULT '[]',
  "recheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "questionContract" JSONB NOT NULL DEFAULT '{}',
  "answerabilityPlan" JSONB NOT NULL DEFAULT '{}',
  "researchSliceSnapshot" JSONB NOT NULL DEFAULT '{}',
  "snapshotHash" TEXT NOT NULL,
  "controlPlaneInputSnapshotId" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionTopicValueAssessmentInputSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionValueReasoningMemo" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicValueAssessmentId" TEXT NOT NULL,
  "topicQuestionContractId" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  "valueThesis" TEXT NOT NULL,
  "significance" TEXT NOT NULL,
  "originality" TEXT NOT NULL,
  "claimLeverage" TEXT NOT NULL,
  "reviewerRisks" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "effortToValue" TEXT NOT NULL,
  "strategicFit" TEXT NOT NULL,
  "negativeMemoryCheck" TEXT NOT NULL,
  "evidenceBackedRationale" TEXT NOT NULL,
  "topObjections" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "uncertainty" TEXT NOT NULL,
  "dispositionBridge" TEXT NOT NULL,
  "requiresCriticReview" BOOLEAN NOT NULL DEFAULT false,
  "criticTriggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "citedRefs" JSONB NOT NULL DEFAULT '[]',
  "createdByWorkflowRunId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionValueReasoningMemo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionValueDispositionDecision" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicValueAssessmentId" TEXT NOT NULL,
  "topicQuestionContractId" TEXT NOT NULL,
  "valueReasoningMemoId" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "decidedBy" TEXT NOT NULL,
  "decisionRationale" TEXT NOT NULL,
  "requiredActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "loopbackTargetRef" JSONB,
  "blockingContexts" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "blockerRefs" JSONB NOT NULL DEFAULT '[]',
  "packageDraftInput" JSONB,
  "outputTopicPackageId" TEXT,
  "status" TEXT NOT NULL,
  "isCurrent" BOOLEAN NOT NULL DEFAULT true,
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionValueDispositionDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTopicValueEvidenceRef" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicValueAssessmentId" TEXT NOT NULL,
  "topicQuestionContractId" TEXT NOT NULL,
  "evidenceRef" JSONB NOT NULL DEFAULT '{}',
  "evidenceRefType" TEXT NOT NULL,
  "evidenceRefId" TEXT NOT NULL,
  "evidenceRole" TEXT NOT NULL,
  "valueUse" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionTopicValueEvidenceRef_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TopicValueAssessment_v1bSourceQuestionContractId_idx" ON "TopicValueAssessment"("v1bSourceQuestionContractId");
CREATE INDEX "TopicValueAssessment_v1bSourceResearchSliceId_idx" ON "TopicValueAssessment"("v1bSourceResearchSliceId");
CREATE INDEX "TopicValueAssessment_v1bAssessmentRunId_idx" ON "TopicValueAssessment"("v1bAssessmentRunId");
CREATE INDEX "TopicValueAssessment_v1bInputSnapshotId_idx" ON "TopicValueAssessment"("v1bInputSnapshotId");
CREATE INDEX "TopicValueAssessment_v1bReasoningMemoId_idx" ON "TopicValueAssessment"("v1bReasoningMemoId");
CREATE INDEX "TopicValueAssessment_v1bActiveDispositionDecisionId_idx" ON "TopicValueAssessment"("v1bActiveDispositionDecisionId");
CREATE INDEX "TopicValueAssessment_v1bReadinessStatus_idx" ON "TopicValueAssessment"("v1bReadinessStatus");
CREATE INDEX "TopicValueAssessment_v1bFreshnessStatus_idx" ON "TopicValueAssessment"("v1bFreshnessStatus");

CREATE INDEX "TopicSelectionAssessTopicValueRun_titleCardId_createdAt_idx" ON "TopicSelectionAssessTopicValueRun"("titleCardId", "createdAt" DESC);
CREATE INDEX "TSAssessRun_contract_idx" ON "TopicSelectionAssessTopicValueRun"("topicQuestionContractId");
CREATE INDEX "TSAssessRun_question_idx" ON "TopicSelectionAssessTopicValueRun"("topicQuestionId");
CREATE INDEX "TopicSelectionAssessTopicValueRun_researchSliceId_idx" ON "TopicSelectionAssessTopicValueRun"("researchSliceId");
CREATE INDEX "TopicSelectionAssessTopicValueRun_topicValueAssessmentId_idx" ON "TopicSelectionAssessTopicValueRun"("topicValueAssessmentId");
CREATE INDEX "TopicSelectionAssessTopicValueRun_valueReasoningMemoId_idx" ON "TopicSelectionAssessTopicValueRun"("valueReasoningMemoId");
CREATE INDEX "TopicSelectionAssessTopicValueRun_status_idx" ON "TopicSelectionAssessTopicValueRun"("status");
CREATE INDEX "TopicSelectionAssessTopicValueRun_workflowRunId_idx" ON "TopicSelectionAssessTopicValueRun"("workflowRunId");
CREATE INDEX "TopicSelectionAssessTopicValueRun_gateResultId_idx" ON "TopicSelectionAssessTopicValueRun"("gateResultId");

CREATE INDEX "TopicSelectionTopicValueAssessmentInputSnapshot_titleCardId_createdAt_idx" ON "TopicSelectionTopicValueAssessmentInputSnapshot"("titleCardId", "createdAt" DESC);
CREATE INDEX "TSValueInputSnapshot_contract_idx" ON "TopicSelectionTopicValueAssessmentInputSnapshot"("topicQuestionContractId");
CREATE INDEX "TSValueInputSnapshot_question_idx" ON "TopicSelectionTopicValueAssessmentInputSnapshot"("topicQuestionId");
CREATE INDEX "TopicSelectionTopicValueAssessmentInputSnapshot_researchSliceId_idx" ON "TopicSelectionTopicValueAssessmentInputSnapshot"("researchSliceId");
CREATE INDEX "TopicSelectionTopicValueAssessmentInputSnapshot_snapshotHash_idx" ON "TopicSelectionTopicValueAssessmentInputSnapshot"("snapshotHash");
CREATE INDEX "TopicSelectionTopicValueAssessmentInputSnapshot_controlPlaneInputSnapshotId_idx" ON "TopicSelectionTopicValueAssessmentInputSnapshot"("controlPlaneInputSnapshotId");

CREATE INDEX "TopicSelectionValueReasoningMemo_titleCardId_createdAt_idx" ON "TopicSelectionValueReasoningMemo"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionValueReasoningMemo_topicValueAssessmentId_idx" ON "TopicSelectionValueReasoningMemo"("topicValueAssessmentId");
CREATE INDEX "TopicSelectionValueReasoningMemo_topicQuestionContractId_idx" ON "TopicSelectionValueReasoningMemo"("topicQuestionContractId");
CREATE INDEX "TopicSelectionValueReasoningMemo_recommendation_idx" ON "TopicSelectionValueReasoningMemo"("recommendation");
CREATE INDEX "TopicSelectionValueReasoningMemo_requiresCriticReview_idx" ON "TopicSelectionValueReasoningMemo"("requiresCriticReview");
CREATE INDEX "TopicSelectionValueReasoningMemo_createdByWorkflowRunId_idx" ON "TopicSelectionValueReasoningMemo"("createdByWorkflowRunId");

CREATE INDEX "TopicSelectionValueDispositionDecision_titleCardId_createdAt_idx" ON "TopicSelectionValueDispositionDecision"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionValueDispositionDecision_topicValueAssessmentId_idx" ON "TopicSelectionValueDispositionDecision"("topicValueAssessmentId");
CREATE INDEX "TopicSelectionValueDispositionDecision_topicQuestionContractId_idx" ON "TopicSelectionValueDispositionDecision"("topicQuestionContractId");
CREATE INDEX "TopicSelectionValueDispositionDecision_valueReasoningMemoId_idx" ON "TopicSelectionValueDispositionDecision"("valueReasoningMemoId");
CREATE INDEX "TopicSelectionValueDispositionDecision_decision_idx" ON "TopicSelectionValueDispositionDecision"("decision");
CREATE INDEX "TopicSelectionValueDispositionDecision_status_idx" ON "TopicSelectionValueDispositionDecision"("status");
CREATE INDEX "TopicSelectionValueDispositionDecision_isCurrent_idx" ON "TopicSelectionValueDispositionDecision"("isCurrent");
CREATE UNIQUE INDEX "TSValueDisposition_current_assessment_uidx"
  ON "TopicSelectionValueDispositionDecision"("topicValueAssessmentId")
  WHERE "isCurrent" = true;
CREATE INDEX "TopicSelectionValueDispositionDecision_workflowRunId_idx" ON "TopicSelectionValueDispositionDecision"("workflowRunId");
CREATE INDEX "TopicSelectionValueDispositionDecision_gateResultId_idx" ON "TopicSelectionValueDispositionDecision"("gateResultId");

CREATE INDEX "TopicSelectionTopicValueEvidenceRef_titleCardId_idx" ON "TopicSelectionTopicValueEvidenceRef"("titleCardId");
CREATE INDEX "TopicSelectionTopicValueEvidenceRef_topicValueAssessmentId_idx" ON "TopicSelectionTopicValueEvidenceRef"("topicValueAssessmentId");
CREATE INDEX "TopicSelectionTopicValueEvidenceRef_topicQuestionContractId_idx" ON "TopicSelectionTopicValueEvidenceRef"("topicQuestionContractId");
CREATE INDEX "TopicSelectionTopicValueEvidenceRef_evidenceRefType_evidenceRefId_idx" ON "TopicSelectionTopicValueEvidenceRef"("evidenceRefType", "evidenceRefId");
CREATE INDEX "TopicSelectionTopicValueEvidenceRef_evidenceRole_idx" ON "TopicSelectionTopicValueEvidenceRef"("evidenceRole");
