-- CreateTable
CREATE TABLE "PaperImplementationCoreMotiveIdentity" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "origin" JSONB NOT NULL DEFAULT '{}',
    "portfolioRole" TEXT NOT NULL,
    "roleSince" TIMESTAMPTZ(6) NOT NULL,
    "roleDecisionId" TEXT,
    "roleDecisionRef" JSONB,
    "lifecycleStatus" TEXT NOT NULL,
    "lineage" JSONB NOT NULL DEFAULT '{}',
    "mergedIntoMotiveId" TEXT,
    "supersededByMotiveId" TEXT,
    "control" JSONB NOT NULL DEFAULT '{}',
    "policyVersionId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PaperImplementationCoreMotiveIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationCoreMotiveSet" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "activeMotiveIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "primaryMotiveIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "secondaryMotiveIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "fallbackMotiveIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "supportingMotiveIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "parkedMotiveIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "abandonedMotiveIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "activeMotiveCount" INTEGER NOT NULL,
    "maxActiveMotives" INTEGER NOT NULL,
    "maxPrimaryMotives" INTEGER NOT NULL,
    "maxParallelRoutes" INTEGER NOT NULL,
    "latestPortfolioDecisionId" TEXT,
    "policyVersionId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PaperImplementationCoreMotiveSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationCoreMotiveVersion" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "motiveId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "versionStatus" TEXT NOT NULL,
    "versionOrigin" JSONB NOT NULL DEFAULT '{}',
    "motiveContract" JSONB NOT NULL DEFAULT '{}',
    "scopeContract" JSONB NOT NULL DEFAULT '{}',
    "boundaryToUpstream" JSONB NOT NULL DEFAULT '{}',
    "falsificationContract" JSONB NOT NULL DEFAULT '{}',
    "claimBoundary" JSONB NOT NULL DEFAULT '{}',
    "routeInterface" JSONB NOT NULL DEFAULT '{}',
    "sourceRefs" JSONB NOT NULL DEFAULT '[]',
    "sourceResultPacketRefs" JSONB NOT NULL DEFAULT '[]',
    "sourceHumanJudgmentRefs" JSONB NOT NULL DEFAULT '[]',
    "traceManifestId" TEXT,
    "traceManifestRef" JSONB,
    "admissionGateResultId" TEXT,
    "evolutionDecisionId" TEXT,
    "hypothesisOnly" BOOLEAN NOT NULL,
    "policyVersionId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "admittedAt" TIMESTAMPTZ(6),
    CONSTRAINT "PaperImplementationCoreMotiveVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationCoreMotiveVersionState" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "motiveId" TEXT NOT NULL,
    "coreMotiveVersionId" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL,
    "freshnessStatus" TEXT NOT NULL,
    "maturityLevel" TEXT NOT NULL,
    "boardReadinessStatus" TEXT NOT NULL,
    "evidenceStatus" TEXT NOT NULL,
    "feasibilityStatus" TEXT NOT NULL,
    "resultStatus" TEXT NOT NULL,
    "currentBoardVersionId" TEXT,
    "latestValidationCycleId" TEXT,
    "latestEvolutionDecisionId" TEXT,
    "blockerRefs" JSONB NOT NULL DEFAULT '[]',
    "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PaperImplementationCoreMotiveVersionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationMotiveAssertion" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "motiveId" TEXT NOT NULL,
    "coreMotiveVersionId" TEXT NOT NULL,
    "assertionType" TEXT NOT NULL,
    "assertionText" TEXT NOT NULL,
    "importance" JSONB NOT NULL DEFAULT '{}',
    "importanceRole" TEXT NOT NULL,
    "mustHoldForMotiveToContinue" BOOLEAN NOT NULL,
    "validationRequirements" JSONB NOT NULL DEFAULT '{}',
    "minimumSupportLevel" TEXT NOT NULL,
    "falsification" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PaperImplementationMotiveAssertion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationMotiveEvidenceBoardVersion" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "motiveId" TEXT NOT NULL,
    "coreMotiveVersionId" TEXT NOT NULL,
    "assertionRefs" JSONB NOT NULL DEFAULT '[]',
    "evidenceBindingRefs" JSONB NOT NULL DEFAULT '[]',
    "boardSummary" JSONB NOT NULL DEFAULT '{}',
    "readinessStatus" TEXT NOT NULL,
    "blockerStatus" TEXT NOT NULL,
    "freshnessStatus" TEXT NOT NULL,
    "supportState" TEXT NOT NULL,
    "challengeStatus" TEXT NOT NULL,
    "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
    "traceManifestId" TEXT NOT NULL,
    "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PaperImplementationMotiveEvidenceBoardVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationEvidenceBinding" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "motiveId" TEXT NOT NULL,
    "coreMotiveVersionId" TEXT NOT NULL,
    "boardVersionId" TEXT NOT NULL,
    "assertionId" TEXT NOT NULL,
    "evidenceRef" JSONB NOT NULL DEFAULT '{}',
    "sourceRefType" TEXT NOT NULL,
    "sourceRefId" TEXT NOT NULL,
    "sourceVersionId" TEXT,
    "bindingRole" TEXT NOT NULL,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "strength" JSONB NOT NULL DEFAULT '{}',
    "supportState" TEXT NOT NULL,
    "challengeStatus" TEXT NOT NULL,
    "freshnessStatus" TEXT NOT NULL,
    "interpretation" JSONB NOT NULL DEFAULT '{}',
    "traceManifestId" TEXT NOT NULL,
    "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PaperImplementationEvidenceBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationEvidenceTransferBinding" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "source" JSONB NOT NULL DEFAULT '{}',
    "sourceBoardVersionId" TEXT NOT NULL,
    "sourceAssertionId" TEXT NOT NULL,
    "sourceEvidenceBindingId" TEXT NOT NULL,
    "target" JSONB NOT NULL DEFAULT '{}',
    "targetBoardVersionId" TEXT NOT NULL,
    "targetAssertionId" TEXT NOT NULL,
    "transferRole" TEXT NOT NULL,
    "transferValidity" TEXT NOT NULL,
    "scopeMatch" JSONB NOT NULL DEFAULT '{}',
    "rationale" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "traceManifestId" TEXT NOT NULL,
    "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PaperImplementationEvidenceTransferBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationCrossBoardReview" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "motiveRefs" JSONB NOT NULL DEFAULT '[]',
    "sharedEvidenceSuggestions" JSONB NOT NULL DEFAULT '[]',
    "conflictWarnings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "mergeSuggestions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "splitSuggestions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "routeReuseSuggestions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "experimentReuseSuggestions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "portfolioUpdateRecommendations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "recommendationPayload" JSONB NOT NULL DEFAULT '{}',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PaperImplementationCrossBoardReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationMotivePortfolioDecision" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "motiveRolesAfterDecision" JSONB NOT NULL DEFAULT '{}',
    "primaryMotiveIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "activeMotiveCount" INTEGER NOT NULL,
    "changes" JSONB NOT NULL DEFAULT '{}',
    "rationale" JSONB NOT NULL DEFAULT '{}',
    "maxActiveMotives" INTEGER NOT NULL,
    "maxPrimaryMotives" INTEGER NOT NULL,
    "maxParallelRoutes" INTEGER NOT NULL,
    "proposedBy" TEXT NOT NULL,
    "confirmedBy" TEXT,
    "confirmationLevel" TEXT NOT NULL,
    "policyVersionId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "appliedAt" TIMESTAMPTZ(6),
    CONSTRAINT "PaperImplementationMotivePortfolioDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationMotiveEvolutionDecision" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "sourceMotiveRefs" JSONB NOT NULL DEFAULT '[]',
    "triggeringValidationCycleRefs" JSONB NOT NULL DEFAULT '[]',
    "triggeringResultPacketRefs" JSONB NOT NULL DEFAULT '[]',
    "triggeringCrossBoardReviewRefs" JSONB NOT NULL DEFAULT '[]',
    "triggeringHumanRequestRefs" JSONB NOT NULL DEFAULT '[]',
    "evolutionType" TEXT NOT NULL,
    "effectClass" TEXT NOT NULL,
    "decisionSummary" TEXT NOT NULL,
    "decisionRationale" TEXT NOT NULL,
    "changeSet" JSONB NOT NULL DEFAULT '{}',
    "proposedOutputs" JSONB NOT NULL DEFAULT '{}',
    "evidenceBasis" JSONB NOT NULL DEFAULT '{}',
    "impactAnalysis" JSONB NOT NULL DEFAULT '{}',
    "gate" JSONB NOT NULL DEFAULT '{}',
    "proposedBy" TEXT NOT NULL,
    "confirmedBy" TEXT,
    "humanConfirmationRequired" BOOLEAN NOT NULL,
    "confirmationRef" JSONB,
    "applicationStatus" TEXT NOT NULL,
    "traceManifestId" TEXT,
    "traceManifestRef" JSONB,
    "policyVersionId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PaperImplementationMotiveEvolutionDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "picmi_project_created_idx" ON "PaperImplementationCoreMotiveIdentity"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "picmi_current_version_idx" ON "PaperImplementationCoreMotiveIdentity"("currentVersionId");
CREATE INDEX "picmi_portfolio_role_idx" ON "PaperImplementationCoreMotiveIdentity"("portfolioRole");
CREATE INDEX "picmi_role_decision_idx" ON "PaperImplementationCoreMotiveIdentity"("roleDecisionId");
CREATE INDEX "picmi_lifecycle_idx" ON "PaperImplementationCoreMotiveIdentity"("lifecycleStatus");
CREATE INDEX "picmi_merged_into_idx" ON "PaperImplementationCoreMotiveIdentity"("mergedIntoMotiveId");
CREATE INDEX "picmi_superseded_by_idx" ON "PaperImplementationCoreMotiveIdentity"("supersededByMotiveId");
CREATE INDEX "picmi_policy_version_idx" ON "PaperImplementationCoreMotiveIdentity"("policyVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "picms_project_unique" ON "PaperImplementationCoreMotiveSet"("implementationProjectId");
CREATE INDEX "picms_active_count_idx" ON "PaperImplementationCoreMotiveSet"("activeMotiveCount");
CREATE INDEX "picms_latest_decision_idx" ON "PaperImplementationCoreMotiveSet"("latestPortfolioDecisionId");
CREATE INDEX "picms_policy_version_idx" ON "PaperImplementationCoreMotiveSet"("policyVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "picmv_motive_version_unique" ON "PaperImplementationCoreMotiveVersion"("motiveId", "versionNumber");
CREATE INDEX "picmv_project_created_idx" ON "PaperImplementationCoreMotiveVersion"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "picmv_motive_version_idx" ON "PaperImplementationCoreMotiveVersion"("motiveId", "versionNumber");
CREATE INDEX "picmv_status_idx" ON "PaperImplementationCoreMotiveVersion"("versionStatus");
CREATE INDEX "picmv_trace_manifest_idx" ON "PaperImplementationCoreMotiveVersion"("traceManifestId");
CREATE INDEX "picmv_admission_gate_idx" ON "PaperImplementationCoreMotiveVersion"("admissionGateResultId");
CREATE INDEX "picmv_evolution_decision_idx" ON "PaperImplementationCoreMotiveVersion"("evolutionDecisionId");
CREATE INDEX "picmv_policy_version_idx" ON "PaperImplementationCoreMotiveVersion"("policyVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "picmvs_version_unique" ON "PaperImplementationCoreMotiveVersionState"("coreMotiveVersionId");
CREATE INDEX "picmvs_project_maturity_idx" ON "PaperImplementationCoreMotiveVersionState"("implementationProjectId", "maturityLevel");
CREATE INDEX "picmvs_motive_idx" ON "PaperImplementationCoreMotiveVersionState"("motiveId");
CREATE INDEX "picmvs_freshness_idx" ON "PaperImplementationCoreMotiveVersionState"("freshnessStatus");
CREATE INDEX "picmvs_board_readiness_idx" ON "PaperImplementationCoreMotiveVersionState"("boardReadinessStatus");
CREATE INDEX "picmvs_evidence_status_idx" ON "PaperImplementationCoreMotiveVersionState"("evidenceStatus");
CREATE INDEX "picmvs_current_board_idx" ON "PaperImplementationCoreMotiveVersionState"("currentBoardVersionId");
CREATE INDEX "picmvs_latest_evolution_idx" ON "PaperImplementationCoreMotiveVersionState"("latestEvolutionDecisionId");

-- CreateIndex
CREATE INDEX "pima_project_created_idx" ON "PaperImplementationMotiveAssertion"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pima_version_idx" ON "PaperImplementationMotiveAssertion"("coreMotiveVersionId");
CREATE INDEX "pima_motive_idx" ON "PaperImplementationMotiveAssertion"("motiveId");
CREATE INDEX "pima_assertion_type_idx" ON "PaperImplementationMotiveAssertion"("assertionType");
CREATE INDEX "pima_importance_role_idx" ON "PaperImplementationMotiveAssertion"("importanceRole");
CREATE INDEX "pima_min_support_idx" ON "PaperImplementationMotiveAssertion"("minimumSupportLevel");
CREATE INDEX "pima_status_idx" ON "PaperImplementationMotiveAssertion"("status");

-- CreateIndex
CREATE INDEX "pimebv_project_created_idx" ON "PaperImplementationMotiveEvidenceBoardVersion"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pimebv_motive_idx" ON "PaperImplementationMotiveEvidenceBoardVersion"("motiveId");
CREATE INDEX "pimebv_version_idx" ON "PaperImplementationMotiveEvidenceBoardVersion"("coreMotiveVersionId");
CREATE INDEX "pimebv_readiness_idx" ON "PaperImplementationMotiveEvidenceBoardVersion"("readinessStatus");
CREATE INDEX "pimebv_freshness_idx" ON "PaperImplementationMotiveEvidenceBoardVersion"("freshnessStatus");
CREATE INDEX "pimebv_support_state_idx" ON "PaperImplementationMotiveEvidenceBoardVersion"("supportState");
CREATE INDEX "pimebv_challenge_status_idx" ON "PaperImplementationMotiveEvidenceBoardVersion"("challengeStatus");
CREATE INDEX "pimebv_trace_manifest_idx" ON "PaperImplementationMotiveEvidenceBoardVersion"("traceManifestId");

-- CreateIndex
CREATE INDEX "pieb_project_created_idx" ON "PaperImplementationEvidenceBinding"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pieb_version_idx" ON "PaperImplementationEvidenceBinding"("coreMotiveVersionId");
CREATE INDEX "pieb_board_idx" ON "PaperImplementationEvidenceBinding"("boardVersionId");
CREATE INDEX "pieb_assertion_idx" ON "PaperImplementationEvidenceBinding"("assertionId");
CREATE INDEX "pieb_binding_role_idx" ON "PaperImplementationEvidenceBinding"("bindingRole");
CREATE INDEX "pieb_support_state_idx" ON "PaperImplementationEvidenceBinding"("supportState");
CREATE INDEX "pieb_challenge_status_idx" ON "PaperImplementationEvidenceBinding"("challengeStatus");
CREATE INDEX "pieb_source_ref_idx" ON "PaperImplementationEvidenceBinding"("sourceRefType", "sourceRefId", "sourceVersionId");
CREATE INDEX "pieb_freshness_idx" ON "PaperImplementationEvidenceBinding"("freshnessStatus");
CREATE INDEX "pieb_trace_manifest_idx" ON "PaperImplementationEvidenceBinding"("traceManifestId");

-- CreateIndex
CREATE INDEX "pietb_project_created_idx" ON "PaperImplementationEvidenceTransferBinding"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pietb_source_board_idx" ON "PaperImplementationEvidenceTransferBinding"("sourceBoardVersionId");
CREATE INDEX "pietb_source_binding_idx" ON "PaperImplementationEvidenceTransferBinding"("sourceEvidenceBindingId");
CREATE INDEX "pietb_target_board_idx" ON "PaperImplementationEvidenceTransferBinding"("targetBoardVersionId");
CREATE INDEX "pietb_role_idx" ON "PaperImplementationEvidenceTransferBinding"("transferRole");
CREATE INDEX "pietb_validity_idx" ON "PaperImplementationEvidenceTransferBinding"("transferValidity");
CREATE INDEX "pietb_trace_manifest_idx" ON "PaperImplementationEvidenceTransferBinding"("traceManifestId");

-- CreateIndex
CREATE INDEX "picbr_project_created_idx" ON "PaperImplementationCrossBoardReview"("implementationProjectId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "pimpd_project_created_idx" ON "PaperImplementationMotivePortfolioDecision"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pimpd_active_count_idx" ON "PaperImplementationMotivePortfolioDecision"("activeMotiveCount");
CREATE INDEX "pimpd_max_active_idx" ON "PaperImplementationMotivePortfolioDecision"("maxActiveMotives");
CREATE INDEX "pimpd_max_primary_idx" ON "PaperImplementationMotivePortfolioDecision"("maxPrimaryMotives");
CREATE INDEX "pimpd_max_parallel_idx" ON "PaperImplementationMotivePortfolioDecision"("maxParallelRoutes");
CREATE INDEX "pimpd_confirmed_by_idx" ON "PaperImplementationMotivePortfolioDecision"("confirmedBy");
CREATE INDEX "pimpd_confirmation_idx" ON "PaperImplementationMotivePortfolioDecision"("confirmationLevel");
CREATE INDEX "pimpd_policy_version_idx" ON "PaperImplementationMotivePortfolioDecision"("policyVersionId");

-- CreateIndex
CREATE INDEX "pimed_project_created_idx" ON "PaperImplementationMotiveEvolutionDecision"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pimed_evolution_type_idx" ON "PaperImplementationMotiveEvolutionDecision"("evolutionType");
CREATE INDEX "pimed_effect_class_idx" ON "PaperImplementationMotiveEvolutionDecision"("effectClass");
CREATE INDEX "pimed_application_status_idx" ON "PaperImplementationMotiveEvolutionDecision"("applicationStatus");
CREATE INDEX "pimed_trace_manifest_idx" ON "PaperImplementationMotiveEvolutionDecision"("traceManifestId");
CREATE INDEX "pimed_policy_version_idx" ON "PaperImplementationMotiveEvolutionDecision"("policyVersionId");
