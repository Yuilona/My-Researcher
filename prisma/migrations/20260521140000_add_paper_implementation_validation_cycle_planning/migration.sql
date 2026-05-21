-- CreateTable
CREATE TABLE "PaperImplementationValidationCycleInputSnapshot" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "contextPolicyVersionId" TEXT,
    "includedRefs" JSONB NOT NULL DEFAULT '{}',
    "excludedContextNotes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "inputSnapshotHash" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PaperImplementationValidationCycleInputSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationValidationCycle" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "inputSnapshotId" TEXT NOT NULL,
    "targetRefType" TEXT NOT NULL,
    "targetRefId" TEXT NOT NULL,
    "targetVersionId" TEXT,
    "target" JSONB NOT NULL DEFAULT '{}',
    "triggerType" TEXT NOT NULL,
    "trigger" JSONB NOT NULL DEFAULT '{}',
    "cycleType" TEXT NOT NULL,
    "validationQuestion" TEXT NOT NULL,
    "validationFrame" JSONB NOT NULL DEFAULT '{}',
    "context" JSONB NOT NULL DEFAULT '{}',
    "criteria" JSONB NOT NULL DEFAULT '{}',
    "budgetId" TEXT NOT NULL,
    "budget" JSONB NOT NULL DEFAULT '{}',
    "expectedInformationGain" TEXT NOT NULL,
    "cycleStatus" TEXT NOT NULL,
    "executionStatus" TEXT NOT NULL,
    "outputs" JSONB NOT NULL DEFAULT '{}',
    "cycleAssessment" JSONB,
    "decisionExit" TEXT,
    "gateResultId" TEXT,
    "traceManifestId" TEXT,
    "traceManifestRef" JSONB,
    "confirmationLevel" TEXT NOT NULL,
    "confirmedBy" TEXT,
    "policyVersionId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "admittedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    CONSTRAINT "PaperImplementationValidationCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationTechnicalRouteCandidate" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "validationCycleId" TEXT,
    "motiveId" TEXT,
    "coreMotiveVersionId" TEXT NOT NULL,
    "routeSummary" TEXT NOT NULL,
    "routeStatus" TEXT NOT NULL,
    "expectedInformationGain" TEXT NOT NULL,
    "baselineGapStatus" TEXT NOT NULL,
    "scopeBoundaryRef" JSONB,
    "scopeBoundaryRefType" TEXT,
    "scopeBoundaryRefId" TEXT,
    "scopeBoundaryVersionId" TEXT,
    "primaryMetricRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "primaryMetricRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "secondaryMetricRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "secondaryMetricRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "datasetVersionRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "datasetVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "baselineVersionRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "baselineVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "codeVersionRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "codeVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "configRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "configRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "confirmatoryMarker" BOOLEAN NOT NULL,
    "traceManifestId" TEXT NOT NULL,
    "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PaperImplementationTechnicalRouteCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationFeasibilityProbe" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "validationCycleId" TEXT,
    "probeKind" TEXT NOT NULL,
    "probeQuestion" TEXT NOT NULL,
    "probeStatus" TEXT NOT NULL,
    "expectedInformationGain" TEXT NOT NULL,
    "baselineGapStatus" TEXT NOT NULL,
    "scopeBoundaryRef" JSONB,
    "scopeBoundaryRefType" TEXT,
    "scopeBoundaryRefId" TEXT,
    "scopeBoundaryVersionId" TEXT,
    "primaryMetricRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "primaryMetricRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "secondaryMetricRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "secondaryMetricRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "datasetVersionRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "datasetVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "baselineVersionRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "baselineVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "codeVersionRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "codeVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "configRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "configRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "confirmatoryMarker" BOOLEAN NOT NULL,
    "traceManifestId" TEXT NOT NULL,
    "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PaperImplementationFeasibilityProbe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationExperimentPlanLight" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "validationCycleId" TEXT,
    "routeCandidateId" TEXT,
    "runMode" TEXT NOT NULL,
    "planSummary" TEXT NOT NULL,
    "estimatedCostClass" TEXT NOT NULL,
    "baselineGapStatus" TEXT NOT NULL,
    "scopeBoundaryRef" JSONB,
    "scopeBoundaryRefType" TEXT,
    "scopeBoundaryRefId" TEXT,
    "scopeBoundaryVersionId" TEXT,
    "primaryMetricRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "primaryMetricRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "secondaryMetricRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "secondaryMetricRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "datasetVersionRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "datasetVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "baselineVersionRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "baselineVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "codeVersionRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "codeVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "configRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "configRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "confirmatoryMarker" BOOLEAN NOT NULL,
    "budgetId" TEXT NOT NULL,
    "stopConditionRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "stopConditionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "traceManifestId" TEXT NOT NULL,
    "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PaperImplementationExperimentPlanLight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationValidationPlanningReviewItem" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "validationCycleId" TEXT,
    "itemKind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "blockerCode" TEXT,
    "summary" TEXT NOT NULL,
    "sourceRefs" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "resolvedAt" TIMESTAMPTZ(6),
    CONSTRAINT "PaperImplementationValidationPlanningReviewItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationValidationUpstreamFeedbackCandidate" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "validationCycleId" TEXT,
    "sourceObjectRefs" JSONB NOT NULL DEFAULT '[]',
    "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
    "feedbackType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendedUpstreamAction" TEXT NOT NULL,
    "candidateStatus" TEXT NOT NULL,
    "feedbackEventRef" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "dispatchedAt" TIMESTAMPTZ(6),
    CONSTRAINT "PaperImplementationValidationUpstreamFeedbackCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pivcis_project_created_idx" ON "PaperImplementationValidationCycleInputSnapshot"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pivcis_policy_idx" ON "PaperImplementationValidationCycleInputSnapshot"("contextPolicyVersionId");
CREATE INDEX "pivcis_hash_idx" ON "PaperImplementationValidationCycleInputSnapshot"("inputSnapshotHash");

-- CreateIndex
CREATE INDEX "pivc_project_created_idx" ON "PaperImplementationValidationCycle"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pivc_input_snapshot_idx" ON "PaperImplementationValidationCycle"("inputSnapshotId");
CREATE INDEX "pivc_target_idx" ON "PaperImplementationValidationCycle"("targetRefType", "targetRefId", "targetVersionId");
CREATE INDEX "pivc_question_idx" ON "PaperImplementationValidationCycle"("validationQuestion");
CREATE INDEX "pivc_budget_idx" ON "PaperImplementationValidationCycle"("budgetId");
CREATE INDEX "pivc_info_gain_idx" ON "PaperImplementationValidationCycle"("expectedInformationGain");
CREATE INDEX "pivc_status_idx" ON "PaperImplementationValidationCycle"("cycleStatus");
CREATE INDEX "pivc_execution_idx" ON "PaperImplementationValidationCycle"("executionStatus");
CREATE INDEX "pivc_decision_exit_idx" ON "PaperImplementationValidationCycle"("decisionExit");
CREATE INDEX "pivc_gate_result_idx" ON "PaperImplementationValidationCycle"("gateResultId");
CREATE INDEX "pivc_trace_manifest_idx" ON "PaperImplementationValidationCycle"("traceManifestId");
CREATE INDEX "pivc_policy_idx" ON "PaperImplementationValidationCycle"("policyVersionId");

-- CreateIndex
CREATE INDEX "pitrc_project_created_idx" ON "PaperImplementationTechnicalRouteCandidate"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pitrc_cycle_idx" ON "PaperImplementationTechnicalRouteCandidate"("validationCycleId");
CREATE INDEX "pitrc_motive_version_idx" ON "PaperImplementationTechnicalRouteCandidate"("coreMotiveVersionId");
CREATE INDEX "pitrc_status_idx" ON "PaperImplementationTechnicalRouteCandidate"("routeStatus");
CREATE INDEX "pitrc_info_gain_idx" ON "PaperImplementationTechnicalRouteCandidate"("expectedInformationGain");
CREATE INDEX "pitrc_baseline_gap_idx" ON "PaperImplementationTechnicalRouteCandidate"("baselineGapStatus");
CREATE INDEX "pitrc_scope_boundary_idx" ON "PaperImplementationTechnicalRouteCandidate"("scopeBoundaryRefType", "scopeBoundaryRefId", "scopeBoundaryVersionId");
CREATE INDEX "pitrc_confirmatory_idx" ON "PaperImplementationTechnicalRouteCandidate"("confirmatoryMarker");
CREATE INDEX "pitrc_trace_manifest_idx" ON "PaperImplementationTechnicalRouteCandidate"("traceManifestId");

-- CreateIndex
CREATE INDEX "pifp_project_created_idx" ON "PaperImplementationFeasibilityProbe"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pifp_cycle_idx" ON "PaperImplementationFeasibilityProbe"("validationCycleId");
CREATE INDEX "pifp_kind_idx" ON "PaperImplementationFeasibilityProbe"("probeKind");
CREATE INDEX "pifp_status_idx" ON "PaperImplementationFeasibilityProbe"("probeStatus");
CREATE INDEX "pifp_info_gain_idx" ON "PaperImplementationFeasibilityProbe"("expectedInformationGain");
CREATE INDEX "pifp_baseline_gap_idx" ON "PaperImplementationFeasibilityProbe"("baselineGapStatus");
CREATE INDEX "pifp_scope_boundary_idx" ON "PaperImplementationFeasibilityProbe"("scopeBoundaryRefType", "scopeBoundaryRefId", "scopeBoundaryVersionId");
CREATE INDEX "pifp_confirmatory_idx" ON "PaperImplementationFeasibilityProbe"("confirmatoryMarker");
CREATE INDEX "pifp_trace_manifest_idx" ON "PaperImplementationFeasibilityProbe"("traceManifestId");

-- CreateIndex
CREATE INDEX "piepl_project_created_idx" ON "PaperImplementationExperimentPlanLight"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "piepl_cycle_idx" ON "PaperImplementationExperimentPlanLight"("validationCycleId");
CREATE INDEX "piepl_route_candidate_idx" ON "PaperImplementationExperimentPlanLight"("routeCandidateId");
CREATE INDEX "piepl_run_mode_idx" ON "PaperImplementationExperimentPlanLight"("runMode");
CREATE INDEX "piepl_cost_class_idx" ON "PaperImplementationExperimentPlanLight"("estimatedCostClass");
CREATE INDEX "piepl_baseline_gap_idx" ON "PaperImplementationExperimentPlanLight"("baselineGapStatus");
CREATE INDEX "piepl_scope_boundary_idx" ON "PaperImplementationExperimentPlanLight"("scopeBoundaryRefType", "scopeBoundaryRefId", "scopeBoundaryVersionId");
CREATE INDEX "piepl_confirmatory_idx" ON "PaperImplementationExperimentPlanLight"("confirmatoryMarker");
CREATE INDEX "piepl_budget_idx" ON "PaperImplementationExperimentPlanLight"("budgetId");
CREATE INDEX "piepl_trace_manifest_idx" ON "PaperImplementationExperimentPlanLight"("traceManifestId");

-- CreateIndex
CREATE INDEX "pivpri_project_status_idx" ON "PaperImplementationValidationPlanningReviewItem"("implementationProjectId", "status", "createdAt" DESC);
CREATE INDEX "pivpri_cycle_idx" ON "PaperImplementationValidationPlanningReviewItem"("validationCycleId");
CREATE INDEX "pivpri_kind_idx" ON "PaperImplementationValidationPlanningReviewItem"("itemKind");
CREATE INDEX "pivpri_severity_idx" ON "PaperImplementationValidationPlanningReviewItem"("severity");
CREATE INDEX "pivpri_blocker_idx" ON "PaperImplementationValidationPlanningReviewItem"("blockerCode");

-- CreateIndex
CREATE INDEX "pivufc_project_created_idx" ON "PaperImplementationValidationUpstreamFeedbackCandidate"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pivufc_cycle_idx" ON "PaperImplementationValidationUpstreamFeedbackCandidate"("validationCycleId");
CREATE INDEX "pivufc_feedback_type_idx" ON "PaperImplementationValidationUpstreamFeedbackCandidate"("feedbackType");
CREATE INDEX "pivufc_severity_idx" ON "PaperImplementationValidationUpstreamFeedbackCandidate"("severity");
CREATE INDEX "pivufc_upstream_action_idx" ON "PaperImplementationValidationUpstreamFeedbackCandidate"("recommendedUpstreamAction");
CREATE INDEX "pivufc_status_idx" ON "PaperImplementationValidationUpstreamFeedbackCandidate"("candidateStatus");
