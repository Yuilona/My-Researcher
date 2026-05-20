-- PaperImplementation trace kernel tables for T-097.

CREATE TABLE "PaperImplementationTraceManifest" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "targetRef" JSONB NOT NULL DEFAULT '{}',
  "literatureLineage" JSONB NOT NULL DEFAULT '{}',
  "experimentLineage" JSONB NOT NULL DEFAULT '{}',
  "artifactLineage" JSONB NOT NULL DEFAULT '{}',
  "decisionLineage" JSONB NOT NULL DEFAULT '{}',
  "internalInterpretationLineage" JSONB NOT NULL DEFAULT '{}',
  "integrity" JSONB NOT NULL DEFAULT '{}',
  "traceStatus" TEXT NOT NULL,
  "brokenRefCount" INTEGER NOT NULL,
  "staleRefCount" INTEGER NOT NULL,
  "missingRefCount" INTEGER NOT NULL,
  "nonCitableRefCount" INTEGER NOT NULL,
  "tracePolicyVersionId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "PaperImplementationTraceManifest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationCitationCandidate" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "traceManifestId" TEXT NOT NULL,
  "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
  "sourceKind" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "sourceEvidenceUnitRefType" TEXT NOT NULL,
  "sourceEvidenceUnitId" TEXT NOT NULL,
  "sourceEvidenceUnitVersionId" TEXT,
  "sourceEvidenceUnitRef" JSONB NOT NULL DEFAULT '{}',
  "sourceLocatorId" TEXT NOT NULL,
  "locatorQuality" TEXT NOT NULL,
  "locator" JSONB NOT NULL DEFAULT '{}',
  "citedFor" JSONB NOT NULL DEFAULT '[]',
  "linkedTargetRefType" TEXT NOT NULL,
  "linkedTargetRefId" TEXT NOT NULL,
  "linkedTargetVersionId" TEXT,
  "linkedTargetRefs" JSONB NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL,
  "normalizedSourceStatement" TEXT NOT NULL,
  "citationLimitation" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "PaperImplementationCitationCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationClaimTracePacket" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "claimRefType" TEXT NOT NULL,
  "claimRefId" TEXT NOT NULL,
  "claimVersionId" TEXT,
  "claimRef" JSONB NOT NULL DEFAULT '{}',
  "claimStatement" TEXT NOT NULL,
  "traceManifestId" TEXT NOT NULL,
  "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
  "literatureLineage" JSONB NOT NULL DEFAULT '{}',
  "experimentLineage" JSONB NOT NULL DEFAULT '{}',
  "artifactLineage" JSONB NOT NULL DEFAULT '{}',
  "decisionLineage" JSONB NOT NULL DEFAULT '{}',
  "internalInterpretationLineage" JSONB NOT NULL DEFAULT '{}',
  "challenge" JSONB NOT NULL DEFAULT '{}',
  "claimScope" JSONB NOT NULL DEFAULT '{}',
  "boundary" JSONB NOT NULL DEFAULT '{}',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "PaperImplementationClaimTracePacket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationNaturalLanguageFieldRole" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "fieldOwnerRefType" TEXT NOT NULL,
  "fieldOwnerRefId" TEXT NOT NULL,
  "fieldOwnerVersionId" TEXT,
  "fieldOwnerVersionKey" TEXT NOT NULL DEFAULT '',
  "fieldOwnerRef" JSONB NOT NULL DEFAULT '{}',
  "fieldName" TEXT NOT NULL,
  "fieldRole" TEXT NOT NULL,
  "canFeedWorkflow" BOOLEAN NOT NULL,
  "canFeedHardGate" BOOLEAN NOT NULL,
  "canBeCited" BOOLEAN NOT NULL,
  "policyVersionId" TEXT,
  "policyVersionKey" TEXT NOT NULL DEFAULT '',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "PaperImplementationNaturalLanguageFieldRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationTraceRepairQueueItem" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "traceManifestId" TEXT NOT NULL,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "targetRef" JSONB NOT NULL DEFAULT '{}',
  "lineageType" TEXT NOT NULL,
  "blockerCode" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "sourceRef" JSONB,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "resolvedBy" TEXT,
  "resolvedAt" TIMESTAMPTZ(6),
  "resolutionNote" TEXT,
  CONSTRAINT "PaperImplementationTraceRepairQueueItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pitm_project_created_idx" ON "PaperImplementationTraceManifest" ("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pitm_target_idx" ON "PaperImplementationTraceManifest" ("implementationProjectId", "targetRefType", "targetRefId");
CREATE INDEX "pitm_target_version_idx" ON "PaperImplementationTraceManifest" ("targetRefType", "targetRefId", "targetVersionId");
CREATE INDEX "pitm_trace_status_idx" ON "PaperImplementationTraceManifest" ("traceStatus");
CREATE INDEX "pitm_broken_count_idx" ON "PaperImplementationTraceManifest" ("brokenRefCount");
CREATE INDEX "pitm_stale_count_idx" ON "PaperImplementationTraceManifest" ("staleRefCount");
CREATE INDEX "pitm_missing_count_idx" ON "PaperImplementationTraceManifest" ("missingRefCount");
CREATE INDEX "pitm_non_citable_count_idx" ON "PaperImplementationTraceManifest" ("nonCitableRefCount");
CREATE INDEX "pitm_policy_version_idx" ON "PaperImplementationTraceManifest" ("tracePolicyVersionId");

CREATE INDEX "picc_project_created_idx" ON "PaperImplementationCitationCandidate" ("implementationProjectId", "createdAt" DESC);
CREATE INDEX "picc_trace_manifest_idx" ON "PaperImplementationCitationCandidate" ("traceManifestId");
CREATE INDEX "picc_source_locator_idx" ON "PaperImplementationCitationCandidate" ("sourceLocatorId");
CREATE INDEX "picc_source_kind_idx" ON "PaperImplementationCitationCandidate" ("sourceKind");
CREATE INDEX "picc_source_type_idx" ON "PaperImplementationCitationCandidate" ("sourceType");
CREATE INDEX "picc_source_id_idx" ON "PaperImplementationCitationCandidate" ("sourceId");
CREATE INDEX "picc_source_evidence_ref_idx" ON "PaperImplementationCitationCandidate" ("sourceEvidenceUnitRefType", "sourceEvidenceUnitId", "sourceEvidenceUnitVersionId");
CREATE INDEX "picc_linked_target_idx" ON "PaperImplementationCitationCandidate" ("linkedTargetRefType", "linkedTargetRefId", "linkedTargetVersionId");
CREATE INDEX "picc_status_idx" ON "PaperImplementationCitationCandidate" ("status");

CREATE INDEX "picp_project_created_idx" ON "PaperImplementationClaimTracePacket" ("implementationProjectId", "createdAt" DESC);
CREATE INDEX "picp_trace_manifest_idx" ON "PaperImplementationClaimTracePacket" ("traceManifestId");
CREATE INDEX "picp_claim_ref_idx" ON "PaperImplementationClaimTracePacket" ("claimRefType", "claimRefId", "claimVersionId");

CREATE INDEX "pinl_project_created_idx" ON "PaperImplementationNaturalLanguageFieldRole" ("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pinl_owner_ref_idx" ON "PaperImplementationNaturalLanguageFieldRole" ("fieldOwnerRefType", "fieldOwnerRefId", "fieldOwnerVersionId");
CREATE UNIQUE INDEX "pinl_owner_field_policy_unique" ON "PaperImplementationNaturalLanguageFieldRole" ("implementationProjectId", "fieldOwnerRefType", "fieldOwnerRefId", "fieldOwnerVersionKey", "fieldName", "policyVersionKey");
CREATE INDEX "pinl_field_name_idx" ON "PaperImplementationNaturalLanguageFieldRole" ("fieldName");
CREATE INDEX "pinl_field_role_idx" ON "PaperImplementationNaturalLanguageFieldRole" ("fieldRole");
CREATE INDEX "pinl_can_feed_workflow_idx" ON "PaperImplementationNaturalLanguageFieldRole" ("canFeedWorkflow");
CREATE INDEX "pinl_can_feed_hard_gate_idx" ON "PaperImplementationNaturalLanguageFieldRole" ("canFeedHardGate");
CREATE INDEX "pinl_can_be_cited_idx" ON "PaperImplementationNaturalLanguageFieldRole" ("canBeCited");
CREATE INDEX "pinl_policy_version_idx" ON "PaperImplementationNaturalLanguageFieldRole" ("policyVersionId");

CREATE INDEX "pitrq_project_status_idx" ON "PaperImplementationTraceRepairQueueItem" ("implementationProjectId", "status", "createdAt" DESC);
CREATE INDEX "pitrq_manifest_status_idx" ON "PaperImplementationTraceRepairQueueItem" ("traceManifestId", "status");
CREATE INDEX "pitrq_target_idx" ON "PaperImplementationTraceRepairQueueItem" ("targetRefType", "targetRefId", "targetVersionId");
CREATE INDEX "pitrq_lineage_type_idx" ON "PaperImplementationTraceRepairQueueItem" ("lineageType");
CREATE INDEX "pitrq_blocker_code_idx" ON "PaperImplementationTraceRepairQueueItem" ("blockerCode");
CREATE INDEX "pitrq_severity_idx" ON "PaperImplementationTraceRepairQueueItem" ("severity");
