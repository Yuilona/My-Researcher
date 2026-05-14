ALTER TABLE "TopicQuestion"
  ADD COLUMN "v1bResearchSliceId" TEXT,
  ADD COLUMN "v1bResearchSliceVersion" TEXT,
  ADD COLUMN "v1bSourceCandidateSetId" TEXT,
  ADD COLUMN "v1bSourceCandidateId" TEXT,
  ADD COLUMN "v1bSelectionDecisionId" TEXT,
  ADD COLUMN "v1bActiveQuestionContractId" TEXT,
  ADD COLUMN "v1bQuestionType" TEXT,
  ADD COLUMN "v1bQuestionStatus" TEXT;

CREATE TABLE "TopicSelectionFormTopicQuestionRun" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "researchSliceId" TEXT NOT NULL,
  "researchSliceVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "triggeredBy" TEXT NOT NULL,
  "researchSliceRef" JSONB NOT NULL DEFAULT '{}',
  "sliceSelectionDecisionRef" JSONB NOT NULL DEFAULT '{}',
  "sourceOptionSetRef" JSONB NOT NULL DEFAULT '{}',
  "sourceOptionRef" JSONB NOT NULL DEFAULT '{}',
  "validatedNeedRef" JSONB NOT NULL DEFAULT '{}',
  "v1bIntakeSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "researchConstraintProfileRef" JSONB NOT NULL DEFAULT '{}',
  "readinessAssessmentRef" JSONB NOT NULL DEFAULT '{}',
  "evidenceMapRef" JSONB NOT NULL DEFAULT '{}',
  "searchRunRef" JSONB NOT NULL DEFAULT '{}',
  "searchPlanRef" JSONB NOT NULL DEFAULT '{}',
  "literatureSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "memorySuggestionRefs" JSONB NOT NULL DEFAULT '[]',
  "recheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "gapCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "workflowProfileKey" TEXT NOT NULL,
  "workflowProfileVersion" TEXT,
  "providerId" TEXT,
  "modelId" TEXT,
  "promptTemplateId" TEXT,
  "promptTemplateVersion" TEXT,
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "questionFrameId" TEXT,
  "candidateSetId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "qualityFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "failureReason" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionFormTopicQuestionRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionQuestionFrame" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "formTopicQuestionRunId" TEXT NOT NULL,
  "researchSliceId" TEXT NOT NULL,
  "researchSliceVersion" TEXT NOT NULL,
  "sourceValidatedNeedRefs" JSONB NOT NULL DEFAULT '[]',
  "targetSetting" TEXT NOT NULL,
  "targetCommunity" TEXT NOT NULL,
  "objectScope" TEXT NOT NULL,
  "taskScope" TEXT NOT NULL,
  "interventionOrApproach" TEXT NOT NULL,
  "comparisonBaseline" TEXT NOT NULL,
  "observableOutcome" TEXT NOT NULL,
  "assumptionRefs" JSONB NOT NULL DEFAULT '[]',
  "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "framePayload" JSONB NOT NULL DEFAULT '{}',
  "checksum" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionQuestionFrame_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTopicQuestionCandidateSet" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "formTopicQuestionRunId" TEXT NOT NULL,
  "questionFrameId" TEXT NOT NULL,
  "researchSliceId" TEXT NOT NULL,
  "researchSliceVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "candidateCount" INTEGER NOT NULL,
  "recommendedCandidateIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "admissionReadiness" JSONB NOT NULL DEFAULT '{}',
  "hardBlockers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "humanReviewTriggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "generationNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionTopicQuestionCandidateSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTopicQuestionCandidate" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "candidateSetId" TEXT NOT NULL,
  "questionFrameId" TEXT NOT NULL,
  "researchSliceId" TEXT NOT NULL,
  "researchSliceVersion" TEXT NOT NULL,
  "candidateOrdinal" INTEGER NOT NULL,
  "candidateKey" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "mainQuestion" TEXT NOT NULL,
  "subQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "questionType" TEXT NOT NULL,
  "contributionHypothesis" TEXT NOT NULL,
  "sourceValidatedNeedRefs" JSONB NOT NULL DEFAULT '[]',
  "answerabilityVerdict" TEXT NOT NULL,
  "answerabilityPlanPayload" JSONB NOT NULL DEFAULT '{}',
  "boundaryCheckPayload" JSONB NOT NULL DEFAULT '{}',
  "traceabilityCheckPayload" JSONB NOT NULL DEFAULT '{}',
  "expectedClaim" TEXT NOT NULL,
  "fallbackClaim" TEXT NOT NULL,
  "maxClaimStrength" TEXT NOT NULL,
  "observableSuccessCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "falsificationConditionsPayload" JSONB NOT NULL DEFAULT '[]',
  "riskNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "blockers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "objections" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "humanReviewTriggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionTopicQuestionCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTopicQuestionSelectionDecision" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "candidateSetId" TEXT NOT NULL,
  "formTopicQuestionRunId" TEXT NOT NULL,
  "researchSliceId" TEXT NOT NULL,
  "researchSliceVersion" TEXT NOT NULL,
  "inputSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "decision" TEXT NOT NULL,
  "decidedBy" TEXT NOT NULL,
  "selectionPolicyVersion" TEXT NOT NULL,
  "admittedCandidateIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdTopicQuestionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "mergedCandidateGroups" JSONB NOT NULL DEFAULT '[]',
  "hardGateResults" JSONB NOT NULL DEFAULT '[]',
  "admissionReview" JSONB NOT NULL DEFAULT '{}',
  "candidateRelationships" JSONB NOT NULL DEFAULT '{}',
  "priorityOrder" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "rejectedCandidateReasons" JSONB NOT NULL DEFAULT '[]',
  "blockingContexts" JSONB NOT NULL DEFAULT '[]',
  "decisionRationale" TEXT NOT NULL,
  "requiresHumanReview" BOOLEAN NOT NULL,
  "humanReviewTriggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "confidence" DOUBLE PRECISION,
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionTopicQuestionSelectionDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTopicQuestionContract" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicQuestionId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "answerabilityPlanId" TEXT NOT NULL,
  "sourceResearchSliceId" TEXT NOT NULL,
  "sourceResearchSliceVersion" TEXT NOT NULL,
  "sourceCandidateId" TEXT NOT NULL,
  "selectionDecisionId" TEXT NOT NULL,
  "inputSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "contractHash" TEXT NOT NULL,
  "mainQuestion" TEXT NOT NULL,
  "questionType" TEXT NOT NULL,
  "contributionHypothesis" TEXT NOT NULL,
  "targetSetting" TEXT NOT NULL,
  "targetCommunity" TEXT NOT NULL,
  "expectedClaim" TEXT NOT NULL,
  "fallbackClaim" TEXT NOT NULL,
  "maxClaimStrength" TEXT NOT NULL,
  "evaluationRoute" TEXT NOT NULL,
  "claimCeiling" TEXT NOT NULL,
  "prohibitedClaims" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "requiredEvidenceCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "allowedRefinements" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "stopReopenConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "riskNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL,
  "createdByWorkflowRunId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionTopicQuestionContract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTopicQuestionAnswerabilityPlan" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicQuestionId" TEXT NOT NULL,
  "topicQuestionContractId" TEXT NOT NULL,
  "answerabilityVerdict" TEXT NOT NULL,
  "datasetsOrResources" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "metrics" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "baselines" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "ablationsOrComparisons" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "evaluationSetting" TEXT NOT NULL,
  "dependencyRisks" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "openDependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "knownGaps" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "requiredEvidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionTopicQuestionAnswerabilityPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTopicQuestionNeedRef" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicQuestionId" TEXT NOT NULL,
  "topicQuestionContractId" TEXT NOT NULL,
  "validatedNeedRef" JSONB NOT NULL DEFAULT '{}',
  "validatedNeedRefType" TEXT NOT NULL,
  "validatedNeedRefId" TEXT NOT NULL,
  "sourceNeedCandidateRef" JSONB,
  "role" TEXT NOT NULL,
  "inheritedFromResearchSliceId" TEXT NOT NULL,
  "coverageNote" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionTopicQuestionNeedRef_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTopicQuestionEvidenceRef" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicQuestionId" TEXT NOT NULL,
  "topicQuestionContractId" TEXT NOT NULL,
  "evidenceRef" JSONB NOT NULL DEFAULT '{}',
  "evidenceRefType" TEXT NOT NULL,
  "evidenceRefId" TEXT NOT NULL,
  "evidenceRole" TEXT NOT NULL,
  "mappedQuestionPart" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "sourceLocatorSnapshot" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionTopicQuestionEvidenceRef_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTopicQuestionBoundaryRef" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicQuestionId" TEXT NOT NULL,
  "topicQuestionContractId" TEXT NOT NULL,
  "researchSliceBoundaryId" TEXT NOT NULL,
  "boundaryKind" TEXT NOT NULL,
  "questionPart" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionTopicQuestionBoundaryRef_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTopicQuestionAssumptionRef" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicQuestionId" TEXT NOT NULL,
  "topicQuestionContractId" TEXT NOT NULL,
  "assumptionType" TEXT NOT NULL,
  "statement" TEXT NOT NULL,
  "sourceAssumptionId" TEXT,
  "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "riskLevel" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionTopicQuestionAssumptionRef_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTopicQuestionFalsificationCondition" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "topicQuestionContractId" TEXT NOT NULL,
  "conditionType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "statement" TEXT NOT NULL,
  "triggerEvidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "triggerSourceRefs" JSONB NOT NULL DEFAULT '[]',
  "relatedContractFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "expectedAction" TEXT NOT NULL,
  "checkTiming" TEXT NOT NULL,
  "confidence" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TopicSelectionTopicQuestionFalsificationCondition_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TopicQuestion_v1b_slice_idx" ON "TopicQuestion"("v1bResearchSliceId");
CREATE INDEX "TopicQuestion_v1b_candidate_set_idx" ON "TopicQuestion"("v1bSourceCandidateSetId");
CREATE INDEX "TopicQuestion_v1b_candidate_idx" ON "TopicQuestion"("v1bSourceCandidateId");
CREATE INDEX "TopicQuestion_v1b_selection_idx" ON "TopicQuestion"("v1bSelectionDecisionId");
CREATE INDEX "TopicQuestion_v1b_active_contract_idx" ON "TopicQuestion"("v1bActiveQuestionContractId");
CREATE INDEX "TopicQuestion_v1b_question_type_idx" ON "TopicQuestion"("v1bQuestionType");

CREATE INDEX "TSTopicQuestionRun_title_created_idx" ON "TopicSelectionFormTopicQuestionRun"("titleCardId", "createdAt" DESC);
CREATE INDEX "TSTopicQuestionRun_slice_idx" ON "TopicSelectionFormTopicQuestionRun"("researchSliceId");
CREATE INDEX "TSTopicQuestionRun_status_idx" ON "TopicSelectionFormTopicQuestionRun"("status");
CREATE INDEX "TSTopicQuestionRun_workflow_idx" ON "TopicSelectionFormTopicQuestionRun"("workflowRunId");
CREATE INDEX "TSTopicQuestionRun_candidate_set_idx" ON "TopicSelectionFormTopicQuestionRun"("candidateSetId");

CREATE INDEX "TSTopicQuestionFrame_title_created_idx" ON "TopicSelectionQuestionFrame"("titleCardId", "createdAt" DESC);
CREATE INDEX "TSTopicQuestionFrame_run_idx" ON "TopicSelectionQuestionFrame"("formTopicQuestionRunId");
CREATE INDEX "TSTopicQuestionFrame_slice_idx" ON "TopicSelectionQuestionFrame"("researchSliceId");
CREATE INDEX "TSTopicQuestionFrame_checksum_idx" ON "TopicSelectionQuestionFrame"("checksum");

CREATE INDEX "TSTopicQuestionCandidateSet_title_created_idx" ON "TopicSelectionTopicQuestionCandidateSet"("titleCardId", "createdAt" DESC);
CREATE INDEX "TSTopicQuestionCandidateSet_run_idx" ON "TopicSelectionTopicQuestionCandidateSet"("formTopicQuestionRunId");
CREATE INDEX "TSTopicQuestionCandidateSet_frame_idx" ON "TopicSelectionTopicQuestionCandidateSet"("questionFrameId");
CREATE INDEX "TSTopicQuestionCandidateSet_slice_idx" ON "TopicSelectionTopicQuestionCandidateSet"("researchSliceId");
CREATE INDEX "TSTopicQuestionCandidateSet_status_idx" ON "TopicSelectionTopicQuestionCandidateSet"("status");
CREATE INDEX "TSTopicQuestionCandidateSet_workflow_idx" ON "TopicSelectionTopicQuestionCandidateSet"("workflowRunId");

CREATE UNIQUE INDEX "TSTopicQuestionCandidate_set_key_unique" ON "TopicSelectionTopicQuestionCandidate"("candidateSetId", "candidateKey");
CREATE INDEX "TSTopicQuestionCandidate_title_created_idx" ON "TopicSelectionTopicQuestionCandidate"("titleCardId", "createdAt" DESC);
CREATE INDEX "TSTopicQuestionCandidate_set_idx" ON "TopicSelectionTopicQuestionCandidate"("candidateSetId");
CREATE INDEX "TSTopicQuestionCandidate_frame_idx" ON "TopicSelectionTopicQuestionCandidate"("questionFrameId");
CREATE INDEX "TSTopicQuestionCandidate_slice_idx" ON "TopicSelectionTopicQuestionCandidate"("researchSliceId");
CREATE INDEX "TSTopicQuestionCandidate_status_idx" ON "TopicSelectionTopicQuestionCandidate"("status");
CREATE INDEX "TSTopicQuestionCandidate_answerability_idx" ON "TopicSelectionTopicQuestionCandidate"("answerabilityVerdict");

CREATE INDEX "TSTopicQuestionSelection_title_created_idx" ON "TopicSelectionTopicQuestionSelectionDecision"("titleCardId", "createdAt" DESC);
CREATE INDEX "TSTopicQuestionSelection_candidate_set_idx" ON "TopicSelectionTopicQuestionSelectionDecision"("candidateSetId");
CREATE INDEX "TSTopicQuestionSelection_run_idx" ON "TopicSelectionTopicQuestionSelectionDecision"("formTopicQuestionRunId");
CREATE INDEX "TSTopicQuestionSelection_slice_idx" ON "TopicSelectionTopicQuestionSelectionDecision"("researchSliceId");
CREATE INDEX "TSTopicQuestionSelection_decision_idx" ON "TopicSelectionTopicQuestionSelectionDecision"("decision");
CREATE INDEX "TSTopicQuestionSelection_gate_idx" ON "TopicSelectionTopicQuestionSelectionDecision"("gateResultId");
CREATE INDEX "TSTopicQuestionSelection_workflow_idx" ON "TopicSelectionTopicQuestionSelectionDecision"("workflowRunId");

CREATE UNIQUE INDEX "TSTopicQuestionContract_question_version_unique" ON "TopicSelectionTopicQuestionContract"("topicQuestionId", "version");
CREATE INDEX "TSTopicQuestionContract_title_created_idx" ON "TopicSelectionTopicQuestionContract"("titleCardId", "createdAt" DESC);
CREATE INDEX "TSTopicQuestionContract_question_idx" ON "TopicSelectionTopicQuestionContract"("topicQuestionId");
CREATE INDEX "TSTopicQuestionContract_answerability_idx" ON "TopicSelectionTopicQuestionContract"("answerabilityPlanId");
CREATE INDEX "TSTopicQuestionContract_slice_idx" ON "TopicSelectionTopicQuestionContract"("sourceResearchSliceId");
CREATE INDEX "TSTopicQuestionContract_candidate_idx" ON "TopicSelectionTopicQuestionContract"("sourceCandidateId");
CREATE INDEX "TSTopicQuestionContract_selection_idx" ON "TopicSelectionTopicQuestionContract"("selectionDecisionId");
CREATE INDEX "TSTopicQuestionContract_status_idx" ON "TopicSelectionTopicQuestionContract"("status");
CREATE INDEX "TSTopicQuestionContract_hash_idx" ON "TopicSelectionTopicQuestionContract"("contractHash");

CREATE INDEX "TSTopicQuestionAnswerability_title_idx" ON "TopicSelectionTopicQuestionAnswerabilityPlan"("titleCardId");
CREATE INDEX "TSTopicQuestionAnswerability_question_idx" ON "TopicSelectionTopicQuestionAnswerabilityPlan"("topicQuestionId");
CREATE INDEX "TSTopicQuestionAnswerability_contract_idx" ON "TopicSelectionTopicQuestionAnswerabilityPlan"("topicQuestionContractId");
CREATE INDEX "TSTopicQuestionAnswerability_verdict_idx" ON "TopicSelectionTopicQuestionAnswerabilityPlan"("answerabilityVerdict");

CREATE INDEX "TSTopicQuestionNeed_title_idx" ON "TopicSelectionTopicQuestionNeedRef"("titleCardId");
CREATE INDEX "TSTopicQuestionNeed_question_idx" ON "TopicSelectionTopicQuestionNeedRef"("topicQuestionId");
CREATE INDEX "TSTopicQuestionNeed_contract_idx" ON "TopicSelectionTopicQuestionNeedRef"("topicQuestionContractId");
CREATE INDEX "TSTopicQuestionNeed_ref_idx" ON "TopicSelectionTopicQuestionNeedRef"("validatedNeedRefType", "validatedNeedRefId");
CREATE INDEX "TSTopicQuestionNeed_role_idx" ON "TopicSelectionTopicQuestionNeedRef"("role");

CREATE INDEX "TSTopicQuestionEvidence_title_idx" ON "TopicSelectionTopicQuestionEvidenceRef"("titleCardId");
CREATE INDEX "TSTopicQuestionEvidence_question_idx" ON "TopicSelectionTopicQuestionEvidenceRef"("topicQuestionId");
CREATE INDEX "TSTopicQuestionEvidence_contract_idx" ON "TopicSelectionTopicQuestionEvidenceRef"("topicQuestionContractId");
CREATE INDEX "TSTopicQuestionEvidence_ref_idx" ON "TopicSelectionTopicQuestionEvidenceRef"("evidenceRefType", "evidenceRefId");
CREATE INDEX "TSTopicQuestionEvidence_role_idx" ON "TopicSelectionTopicQuestionEvidenceRef"("evidenceRole");

CREATE INDEX "TSTopicQuestionBoundary_title_idx" ON "TopicSelectionTopicQuestionBoundaryRef"("titleCardId");
CREATE INDEX "TSTopicQuestionBoundary_question_idx" ON "TopicSelectionTopicQuestionBoundaryRef"("topicQuestionId");
CREATE INDEX "TSTopicQuestionBoundary_contract_idx" ON "TopicSelectionTopicQuestionBoundaryRef"("topicQuestionContractId");
CREATE INDEX "TSTopicQuestionBoundary_slice_boundary_idx" ON "TopicSelectionTopicQuestionBoundaryRef"("researchSliceBoundaryId");
CREATE INDEX "TSTopicQuestionBoundary_kind_idx" ON "TopicSelectionTopicQuestionBoundaryRef"("boundaryKind");

CREATE INDEX "TSTopicQuestionAssumption_title_idx" ON "TopicSelectionTopicQuestionAssumptionRef"("titleCardId");
CREATE INDEX "TSTopicQuestionAssumption_question_idx" ON "TopicSelectionTopicQuestionAssumptionRef"("topicQuestionId");
CREATE INDEX "TSTopicQuestionAssumption_contract_idx" ON "TopicSelectionTopicQuestionAssumptionRef"("topicQuestionContractId");
CREATE INDEX "TSTopicQuestionAssumption_type_idx" ON "TopicSelectionTopicQuestionAssumptionRef"("assumptionType");
CREATE INDEX "TSTopicQuestionAssumption_risk_idx" ON "TopicSelectionTopicQuestionAssumptionRef"("riskLevel");
CREATE INDEX "TSTopicQuestionAssumption_status_idx" ON "TopicSelectionTopicQuestionAssumptionRef"("status");

CREATE INDEX "TSTopicQuestionFalsification_title_idx" ON "TopicSelectionTopicQuestionFalsificationCondition"("titleCardId");
CREATE INDEX "TSTopicQuestionFalsification_contract_idx" ON "TopicSelectionTopicQuestionFalsificationCondition"("topicQuestionContractId");
CREATE INDEX "TSTopicQuestionFalsification_type_idx" ON "TopicSelectionTopicQuestionFalsificationCondition"("conditionType");
CREATE INDEX "TSTopicQuestionFalsification_severity_idx" ON "TopicSelectionTopicQuestionFalsificationCondition"("severity");
CREATE INDEX "TSTopicQuestionFalsification_status_idx" ON "TopicSelectionTopicQuestionFalsificationCondition"("status");
