-- CreateTable
CREATE TABLE "PaperImplementationResultInterpretationPacket" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "validationCycleId" TEXT NOT NULL,
    "experimentPlanLightId" TEXT,
    "sourceRunEvidenceRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceRunEvidenceRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "validationReportRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validationReportRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "metricRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metricRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "failedRunRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failedRunRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "inconclusiveRunRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inconclusiveRunRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "staleOrInvalidatedEvidenceRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "staleOrInvalidatedEvidenceRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "sourcePayload" JSONB NOT NULL DEFAULT '{}',
    "resultSummary" JSONB NOT NULL DEFAULT '{}',
    "reliability" JSONB NOT NULL DEFAULT '{}',
    "claimImplications" JSONB NOT NULL DEFAULT '{}',
    "interpretationGateStatus" TEXT NOT NULL,
    "failedRunsAccountedFor" BOOLEAN NOT NULL,
    "inconclusiveRunsAccountedFor" BOOLEAN NOT NULL,
    "exploratoryConfirmatorySeparated" BOOLEAN NOT NULL,
    "allowedClaimCeiling" TEXT NOT NULL,
    "forbiddenOverclaimCount" INTEGER NOT NULL,
    "traceManifestId" TEXT NOT NULL,
    "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
    "policyVersionId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PaperImplementationResultInterpretationPacket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationClaimCandidate" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "claimType" TEXT NOT NULL,
    "claimStatement" TEXT NOT NULL,
    "claimStrength" TEXT NOT NULL,
    "claimStatus" TEXT NOT NULL,
    "boundaryGateStatus" TEXT NOT NULL,
    "resultInterpretationPacketRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resultInterpretationPacketRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "supportRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supportRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "challengeRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "challengeRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "scope" JSONB NOT NULL DEFAULT '{}',
    "boundary" JSONB NOT NULL DEFAULT '{}',
    "traceManifestId" TEXT NOT NULL,
    "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
    "claimTracePacketId" TEXT,
    "claimTracePacketRef" JSONB,
    "humanConfirmationRequired" BOOLEAN NOT NULL,
    "humanConfirmationRef" JSONB,
    "humanConfirmationRefType" TEXT,
    "humanConfirmationRefId" TEXT,
    "humanConfirmationVersionId" TEXT,
    "forbiddenOverclaimCount" INTEGER NOT NULL,
    "policyVersionId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PaperImplementationClaimCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationDossier" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "dossierVersion" INTEGER NOT NULL,
    "dossierStatus" TEXT NOT NULL,
    "dossierTraceStatus" TEXT NOT NULL,
    "resultInterpretationPacketRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resultInterpretationPacketPayloads" JSONB NOT NULL DEFAULT '[]',
    "claimCandidateRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "claimCandidateRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "claimTracePacketRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "claimTracePacketRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "runEvidenceRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "runEvidenceRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "validationCycleRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validationCycleRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "traceManifestRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "traceManifestRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "sourcePayload" JSONB NOT NULL DEFAULT '{}',
    "experimentSection" JSONB NOT NULL DEFAULT '{}',
    "claimSection" JSONB NOT NULL DEFAULT '{}',
    "readiness" JSONB NOT NULL DEFAULT '{}',
    "traceManifestId" TEXT NOT NULL,
    "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
    "failedRunCount" INTEGER NOT NULL,
    "inconclusiveRunCount" INTEGER NOT NULL,
    "forbiddenOverclaimCount" INTEGER NOT NULL,
    "readinessGateResultId" TEXT,
    "projectionPolicyVersionId" TEXT,
    "dossierHash" TEXT NOT NULL,
    "reopenCondition" TEXT,
    "abandonReason" TEXT,
    "policyVersionId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PaperImplementationDossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperImplementationWritingEntryPacket" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "dossierVersion" INTEGER NOT NULL,
    "dossierHash" TEXT NOT NULL,
    "dossierStatus" TEXT NOT NULL,
    "readinessGateResultId" TEXT NOT NULL,
    "traceManifestId" TEXT NOT NULL,
    "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
    "projectionPolicyVersionId" TEXT NOT NULL,
    "packetStatus" TEXT NOT NULL,
    "writingTargetRef" JSONB,
    "writingTargetRefType" TEXT,
    "writingTargetRefId" TEXT,
    "writingTargetVersionId" TEXT,
    "packetPayload" JSONB NOT NULL DEFAULT '{}',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PaperImplementationWritingEntryPacket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pirip_project_created_idx" ON "PaperImplementationResultInterpretationPacket"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pirip_cycle_idx" ON "PaperImplementationResultInterpretationPacket"("validationCycleId");
CREATE INDEX "pirip_plan_idx" ON "PaperImplementationResultInterpretationPacket"("experimentPlanLightId");
CREATE INDEX "pirip_gate_status_idx" ON "PaperImplementationResultInterpretationPacket"("interpretationGateStatus");
CREATE INDEX "pirip_failed_accounted_idx" ON "PaperImplementationResultInterpretationPacket"("failedRunsAccountedFor");
CREATE INDEX "pirip_inconclusive_accounted_idx" ON "PaperImplementationResultInterpretationPacket"("inconclusiveRunsAccountedFor");
CREATE INDEX "pirip_claim_ceiling_idx" ON "PaperImplementationResultInterpretationPacket"("allowedClaimCeiling");
CREATE INDEX "pirip_forbidden_count_idx" ON "PaperImplementationResultInterpretationPacket"("forbiddenOverclaimCount");
CREATE INDEX "pirip_trace_manifest_idx" ON "PaperImplementationResultInterpretationPacket"("traceManifestId");
CREATE INDEX "pirip_policy_idx" ON "PaperImplementationResultInterpretationPacket"("policyVersionId");

CREATE INDEX "piccl_project_created_idx" ON "PaperImplementationClaimCandidate"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "piccl_type_idx" ON "PaperImplementationClaimCandidate"("claimType");
CREATE INDEX "piccl_strength_idx" ON "PaperImplementationClaimCandidate"("claimStrength");
CREATE INDEX "piccl_status_idx" ON "PaperImplementationClaimCandidate"("claimStatus");
CREATE INDEX "piccl_boundary_status_idx" ON "PaperImplementationClaimCandidate"("boundaryGateStatus");
CREATE INDEX "piccl_trace_manifest_idx" ON "PaperImplementationClaimCandidate"("traceManifestId");
CREATE INDEX "piccl_claim_trace_idx" ON "PaperImplementationClaimCandidate"("claimTracePacketId");
CREATE INDEX "piccl_confirm_required_idx" ON "PaperImplementationClaimCandidate"("humanConfirmationRequired");
CREATE INDEX "piccl_confirmation_ref_idx" ON "PaperImplementationClaimCandidate"("humanConfirmationRefType", "humanConfirmationRefId", "humanConfirmationVersionId");
CREATE INDEX "piccl_forbidden_count_idx" ON "PaperImplementationClaimCandidate"("forbiddenOverclaimCount");
CREATE INDEX "piccl_policy_idx" ON "PaperImplementationClaimCandidate"("policyVersionId");

CREATE INDEX "pid_project_created_idx" ON "PaperImplementationDossier"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pid_project_version_idx" ON "PaperImplementationDossier"("implementationProjectId", "dossierVersion");
CREATE INDEX "pid_status_idx" ON "PaperImplementationDossier"("dossierStatus");
CREATE INDEX "pid_trace_status_idx" ON "PaperImplementationDossier"("dossierTraceStatus");
CREATE INDEX "pid_readiness_gate_idx" ON "PaperImplementationDossier"("readinessGateResultId");
CREATE INDEX "pid_trace_manifest_idx" ON "PaperImplementationDossier"("traceManifestId");
CREATE INDEX "pid_failed_run_count_idx" ON "PaperImplementationDossier"("failedRunCount");
CREATE INDEX "pid_forbidden_count_idx" ON "PaperImplementationDossier"("forbiddenOverclaimCount");
CREATE INDEX "pid_projection_policy_idx" ON "PaperImplementationDossier"("projectionPolicyVersionId");
CREATE INDEX "pid_hash_idx" ON "PaperImplementationDossier"("dossierHash");
CREATE INDEX "pid_policy_idx" ON "PaperImplementationDossier"("policyVersionId");

CREATE INDEX "piwep_project_created_idx" ON "PaperImplementationWritingEntryPacket"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "piwep_dossier_version_idx" ON "PaperImplementationWritingEntryPacket"("dossierId", "dossierVersion");
CREATE INDEX "piwep_dossier_status_idx" ON "PaperImplementationWritingEntryPacket"("dossierStatus");
CREATE INDEX "piwep_readiness_gate_idx" ON "PaperImplementationWritingEntryPacket"("readinessGateResultId");
CREATE INDEX "piwep_trace_manifest_idx" ON "PaperImplementationWritingEntryPacket"("traceManifestId");
CREATE INDEX "piwep_projection_policy_idx" ON "PaperImplementationWritingEntryPacket"("projectionPolicyVersionId");
CREATE INDEX "piwep_status_idx" ON "PaperImplementationWritingEntryPacket"("packetStatus");
CREATE INDEX "piwep_writing_target_idx" ON "PaperImplementationWritingEntryPacket"("writingTargetRefType", "writingTargetRefId", "writingTargetVersionId");
