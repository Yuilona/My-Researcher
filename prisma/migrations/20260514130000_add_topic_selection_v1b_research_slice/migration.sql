CREATE TABLE "TopicSelectionPlanResearchSliceRun" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "v1bIntakeReadinessAssessmentId" TEXT NOT NULL,
  "v1bIntakeSnapshotId" TEXT NOT NULL,
  "researchConstraintProfileId" TEXT NOT NULL,
  "v1bInputBundleId" TEXT NOT NULL,
  "validatedNeedId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "triggeredBy" TEXT NOT NULL,
  "v1bInputBundleRef" JSONB NOT NULL DEFAULT '{}',
  "v1bIntakeSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "researchConstraintProfileRef" JSONB NOT NULL DEFAULT '{}',
  "readinessAssessmentRef" JSONB NOT NULL DEFAULT '{}',
  "validatedNeedRef" JSONB NOT NULL DEFAULT '{}',
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
  "optionSetId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "qualityFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "failureReason" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionPlanResearchSliceRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionResearchSliceOptionSet" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "planResearchSliceRunId" TEXT NOT NULL,
  "v1bIntakeReadinessAssessmentId" TEXT NOT NULL,
  "v1bIntakeSnapshotId" TEXT NOT NULL,
  "researchConstraintProfileId" TEXT NOT NULL,
  "v1bInputBundleId" TEXT NOT NULL,
  "validatedNeedIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL,
  "recommendedOptionId" TEXT,
  "selectedOptionId" TEXT,
  "optionCount" INTEGER NOT NULL,
  "highRiskOptionCount" INTEGER NOT NULL,
  "requiresHumanReview" BOOLEAN NOT NULL,
  "comparisonAxes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "comparisonSummary" TEXT NOT NULL,
  "missingOptionTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "unresolvedDisagreements" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "humanReviewTriggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "optionsPayload" JSONB NOT NULL DEFAULT '{}',
  "comparisonPayload" JSONB NOT NULL DEFAULT '{}',
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionResearchSliceOptionSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionResearchSliceOption" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "researchSliceOptionSetId" TEXT NOT NULL,
  "optionOrdinal" INTEGER NOT NULL,
  "optionKey" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "sourceValidatedNeedRefs" JSONB NOT NULL DEFAULT '[]',
  "sliceStatement" TEXT NOT NULL,
  "problemSpace" TEXT NOT NULL,
  "targetSetting" TEXT NOT NULL,
  "targetCommunity" TEXT NOT NULL,
  "includedBoundaries" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "excludedBoundaries" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "contributionTypeCandidate" TEXT NOT NULL,
  "supportEvidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "challengeEvidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "baselineEvidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "contextEvidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "resourceAssumptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "dataAssumptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "evaluationPath" TEXT NOT NULL,
  "baselineAssumptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "hardBlockers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "dependencyRisks" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sliceBudget" JSONB NOT NULL DEFAULT '{}',
  "expectedClaim" TEXT NOT NULL,
  "fallbackClaim" TEXT NOT NULL,
  "observableSuccessCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "mainRisks" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "baselineRisk" TEXT NOT NULL,
  "executionRisk" TEXT NOT NULL,
  "scopeRisk" TEXT NOT NULL,
  "claimCeilingAlignment" JSONB NOT NULL DEFAULT '{}',
  "confidence" DOUBLE PRECISION,
  "requiresHumanReview" BOOLEAN NOT NULL,
  "humanReviewTriggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "detailsPayload" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionResearchSliceOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionSliceSelectionDecision" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "researchSliceOptionSetId" TEXT NOT NULL,
  "selectedOptionId" TEXT,
  "decision" TEXT NOT NULL,
  "decidedBy" TEXT NOT NULL,
  "selectionPolicyVersion" TEXT NOT NULL,
  "decisionBasis" JSONB NOT NULL DEFAULT '{}',
  "selectionRationale" TEXT NOT NULL,
  "rejectedOptionReasons" JSONB NOT NULL DEFAULT '[]',
  "hardBlockers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "openRisks" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "unresolvedDisagreements" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "loopbackTarget" TEXT,
  "loopbackTargetRef" JSONB,
  "requiredActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "loopbackReasonCode" TEXT,
  "sourceDownstreamObjectRef" JSONB,
  "createsNewRunOrVersion" BOOLEAN NOT NULL,
  "confidence" DOUBLE PRECISION,
  "requiresHumanReview" BOOLEAN NOT NULL,
  "humanReviewReason" TEXT,
  "outputResearchSliceId" TEXT,
  "outputResearchSliceRef" JSONB,
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionSliceSelectionDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionResearchSlice" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "v1bIntakeSnapshotId" TEXT NOT NULL,
  "researchConstraintProfileId" TEXT NOT NULL,
  "v1bInputBundleId" TEXT NOT NULL,
  "validatedNeedId" TEXT NOT NULL,
  "sourceOptionSetId" TEXT NOT NULL,
  "sourceOptionId" TEXT NOT NULL,
  "sliceSelectionDecisionId" TEXT NOT NULL,
  "sliceVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "v1bIntakeSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "researchConstraintProfileRef" JSONB NOT NULL DEFAULT '{}',
  "readinessAssessmentRef" JSONB NOT NULL DEFAULT '{}',
  "v1bInputBundleRef" JSONB NOT NULL DEFAULT '{}',
  "validatedNeedRef" JSONB NOT NULL DEFAULT '{}',
  "evidenceMapRef" JSONB NOT NULL DEFAULT '{}',
  "searchRunRef" JSONB NOT NULL DEFAULT '{}',
  "searchPlanRef" JSONB NOT NULL DEFAULT '{}',
  "literatureSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "sourceOptionSetRef" JSONB NOT NULL DEFAULT '{}',
  "sourceOptionRef" JSONB NOT NULL DEFAULT '{}',
  "sliceSelectionDecisionRef" JSONB NOT NULL DEFAULT '{}',
  "problemSpace" TEXT NOT NULL,
  "sliceStatement" TEXT NOT NULL,
  "targetSetting" TEXT NOT NULL,
  "targetCommunity" TEXT NOT NULL,
  "includedBoundaries" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "excludedBoundaries" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "candidateContributionTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "preferredContributionType" TEXT,
  "contributionRationale" TEXT NOT NULL,
  "expectedClaim" TEXT NOT NULL,
  "fallbackClaim" TEXT NOT NULL,
  "observableSuccessCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "resourceAssumptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "dataAssumptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "evaluationPath" TEXT NOT NULL,
  "baselineAssumptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "dependencyRisks" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sliceBudget" JSONB NOT NULL DEFAULT '{}',
  "topicQuestionGuardrails" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "valueAssessmentInputs" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "mustPreserveBoundaries" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "memorySuggestionRefs" JSONB NOT NULL DEFAULT '[]',
  "recheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "gapCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "nonGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "claimCeiling" TEXT NOT NULL,
  "decisionReason" TEXT,
  "supersedesResearchSliceId" TEXT,
  "supersedesResearchSliceRef" JSONB,
  "supersededByResearchSliceId" TEXT,
  "supersededByResearchSliceRef" JSONB,
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "traceSnapshotId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionResearchSlice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionResearchSliceEvidenceRef" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "researchSliceId" TEXT NOT NULL,
  "evidenceRef" JSONB NOT NULL DEFAULT '{}',
  "evidenceRefType" TEXT NOT NULL,
  "evidenceRefId" TEXT NOT NULL,
  "evidenceRole" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "evidenceStrengthSnapshot" JSONB NOT NULL DEFAULT '{}',
  "sourceLocatorSnapshot" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionResearchSliceEvidenceRef_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionResearchSliceBoundary" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "researchSliceId" TEXT NOT NULL,
  "boundaryKind" TEXT NOT NULL,
  "boundaryType" TEXT NOT NULL,
  "statement" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionResearchSliceBoundary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionResearchSliceAssumption" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "researchSliceId" TEXT NOT NULL,
  "assumptionType" TEXT NOT NULL,
  "statement" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "riskLevel" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionResearchSliceAssumption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TSPlanSliceRun_title_created_idx"
  ON "TopicSelectionPlanResearchSliceRun"("titleCardId", "createdAt" DESC);
CREATE INDEX "TSPlanSliceRun_readiness_idx"
  ON "TopicSelectionPlanResearchSliceRun"("v1bIntakeReadinessAssessmentId");
CREATE INDEX "TSPlanSliceRun_snapshot_idx"
  ON "TopicSelectionPlanResearchSliceRun"("v1bIntakeSnapshotId");
CREATE INDEX "TSPlanSliceRun_profile_idx"
  ON "TopicSelectionPlanResearchSliceRun"("researchConstraintProfileId");
CREATE INDEX "TSPlanSliceRun_bundle_idx"
  ON "TopicSelectionPlanResearchSliceRun"("v1bInputBundleId");
CREATE INDEX "TSPlanSliceRun_need_idx"
  ON "TopicSelectionPlanResearchSliceRun"("validatedNeedId");
CREATE INDEX "TSPlanSliceRun_status_idx"
  ON "TopicSelectionPlanResearchSliceRun"("status");
CREATE INDEX "TSPlanSliceRun_workflow_idx"
  ON "TopicSelectionPlanResearchSliceRun"("workflowRunId");
CREATE INDEX "TSPlanSliceRun_option_set_idx"
  ON "TopicSelectionPlanResearchSliceRun"("optionSetId");

CREATE INDEX "TSOptionSet_title_created_idx"
  ON "TopicSelectionResearchSliceOptionSet"("titleCardId", "createdAt" DESC);
CREATE INDEX "TSOptionSet_plan_run_idx"
  ON "TopicSelectionResearchSliceOptionSet"("planResearchSliceRunId");
CREATE INDEX "TSOptionSet_readiness_idx"
  ON "TopicSelectionResearchSliceOptionSet"("v1bIntakeReadinessAssessmentId");
CREATE INDEX "TSOptionSet_snapshot_idx"
  ON "TopicSelectionResearchSliceOptionSet"("v1bIntakeSnapshotId");
CREATE INDEX "TSOptionSet_profile_idx"
  ON "TopicSelectionResearchSliceOptionSet"("researchConstraintProfileId");
CREATE INDEX "TSOptionSet_bundle_idx"
  ON "TopicSelectionResearchSliceOptionSet"("v1bInputBundleId");
CREATE INDEX "TSOptionSet_status_idx"
  ON "TopicSelectionResearchSliceOptionSet"("status");
CREATE INDEX "TSOptionSet_recommended_idx"
  ON "TopicSelectionResearchSliceOptionSet"("recommendedOptionId");
CREATE INDEX "TSOptionSet_selected_idx"
  ON "TopicSelectionResearchSliceOptionSet"("selectedOptionId");
CREATE INDEX "TSOptionSet_workflow_idx"
  ON "TopicSelectionResearchSliceOptionSet"("workflowRunId");

CREATE UNIQUE INDEX "TSOption_set_key_unique"
  ON "TopicSelectionResearchSliceOption"("researchSliceOptionSetId", "optionKey");
CREATE INDEX "TSOption_title_created_idx"
  ON "TopicSelectionResearchSliceOption"("titleCardId", "createdAt" DESC);
CREATE INDEX "TSOption_option_set_idx"
  ON "TopicSelectionResearchSliceOption"("researchSliceOptionSetId");
CREATE INDEX "TSOption_status_idx"
  ON "TopicSelectionResearchSliceOption"("status");
CREATE INDEX "TSOption_baseline_risk_idx"
  ON "TopicSelectionResearchSliceOption"("baselineRisk");
CREATE INDEX "TSOption_execution_risk_idx"
  ON "TopicSelectionResearchSliceOption"("executionRisk");
CREATE INDEX "TSOption_scope_risk_idx"
  ON "TopicSelectionResearchSliceOption"("scopeRisk");
CREATE INDEX "TSOption_human_review_idx"
  ON "TopicSelectionResearchSliceOption"("requiresHumanReview");

CREATE INDEX "TSSliceDecision_title_created_idx"
  ON "TopicSelectionSliceSelectionDecision"("titleCardId", "createdAt" DESC);
CREATE INDEX "TSSliceDecision_option_set_idx"
  ON "TopicSelectionSliceSelectionDecision"("researchSliceOptionSetId");
CREATE INDEX "TSSliceDecision_option_idx"
  ON "TopicSelectionSliceSelectionDecision"("selectedOptionId");
CREATE INDEX "TSSliceDecision_decision_idx"
  ON "TopicSelectionSliceSelectionDecision"("decision");
CREATE INDEX "TSSliceDecision_output_slice_idx"
  ON "TopicSelectionSliceSelectionDecision"("outputResearchSliceId");
CREATE INDEX "TSSliceDecision_gate_idx"
  ON "TopicSelectionSliceSelectionDecision"("gateResultId");
CREATE INDEX "TSSliceDecision_workflow_idx"
  ON "TopicSelectionSliceSelectionDecision"("workflowRunId");

CREATE UNIQUE INDEX "TSResearchSlice_option_version_unique"
  ON "TopicSelectionResearchSlice"("sourceOptionSetId", "sourceOptionId", "sliceVersion");
CREATE INDEX "TSResearchSlice_title_created_idx"
  ON "TopicSelectionResearchSlice"("titleCardId", "createdAt" DESC);
CREATE INDEX "TSResearchSlice_snapshot_idx"
  ON "TopicSelectionResearchSlice"("v1bIntakeSnapshotId");
CREATE INDEX "TSResearchSlice_profile_idx"
  ON "TopicSelectionResearchSlice"("researchConstraintProfileId");
CREATE INDEX "TSResearchSlice_bundle_idx"
  ON "TopicSelectionResearchSlice"("v1bInputBundleId");
CREATE INDEX "TSResearchSlice_need_idx"
  ON "TopicSelectionResearchSlice"("validatedNeedId");
CREATE INDEX "TSResearchSlice_status_idx"
  ON "TopicSelectionResearchSlice"("status");
CREATE INDEX "TSResearchSlice_option_idx"
  ON "TopicSelectionResearchSlice"("sourceOptionId");
CREATE INDEX "TSResearchSlice_option_set_idx"
  ON "TopicSelectionResearchSlice"("sourceOptionSetId");
CREATE INDEX "TSResearchSlice_gate_idx"
  ON "TopicSelectionResearchSlice"("gateResultId");
CREATE INDEX "TSResearchSlice_workflow_idx"
  ON "TopicSelectionResearchSlice"("workflowRunId");

CREATE INDEX "TSResearchSliceEvidence_title_idx"
  ON "TopicSelectionResearchSliceEvidenceRef"("titleCardId");
CREATE INDEX "TSResearchSliceEvidence_slice_idx"
  ON "TopicSelectionResearchSliceEvidenceRef"("researchSliceId");
CREATE INDEX "TSResearchSliceEvidence_ref_idx"
  ON "TopicSelectionResearchSliceEvidenceRef"("evidenceRefType", "evidenceRefId");
CREATE INDEX "TSResearchSliceEvidence_role_idx"
  ON "TopicSelectionResearchSliceEvidenceRef"("evidenceRole");

CREATE INDEX "TSResearchSliceBoundary_title_idx"
  ON "TopicSelectionResearchSliceBoundary"("titleCardId");
CREATE INDEX "TSResearchSliceBoundary_slice_idx"
  ON "TopicSelectionResearchSliceBoundary"("researchSliceId");
CREATE INDEX "TSResearchSliceBoundary_kind_idx"
  ON "TopicSelectionResearchSliceBoundary"("boundaryKind");
CREATE INDEX "TSResearchSliceBoundary_type_idx"
  ON "TopicSelectionResearchSliceBoundary"("boundaryType");

CREATE INDEX "TSResearchSliceAssumption_title_idx"
  ON "TopicSelectionResearchSliceAssumption"("titleCardId");
CREATE INDEX "TSResearchSliceAssumption_slice_idx"
  ON "TopicSelectionResearchSliceAssumption"("researchSliceId");
CREATE INDEX "TSResearchSliceAssumption_type_idx"
  ON "TopicSelectionResearchSliceAssumption"("assumptionType");
CREATE INDEX "TSResearchSliceAssumption_status_idx"
  ON "TopicSelectionResearchSliceAssumption"("status");
CREATE INDEX "TSResearchSliceAssumption_risk_idx"
  ON "TopicSelectionResearchSliceAssumption"("riskLevel");

ALTER TABLE "TopicSelectionResearchSliceEvidenceRef"
  ADD CONSTRAINT "TopicSelectionResearchSliceEvidenceRef_researchSliceId_fkey"
  FOREIGN KEY ("researchSliceId") REFERENCES "TopicSelectionResearchSlice"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TopicSelectionResearchSliceBoundary"
  ADD CONSTRAINT "TopicSelectionResearchSliceBoundary_researchSliceId_fkey"
  FOREIGN KEY ("researchSliceId") REFERENCES "TopicSelectionResearchSlice"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TopicSelectionResearchSliceAssumption"
  ADD CONSTRAINT "TopicSelectionResearchSliceAssumption_researchSliceId_fkey"
  FOREIGN KEY ("researchSliceId") REFERENCES "TopicSelectionResearchSlice"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
