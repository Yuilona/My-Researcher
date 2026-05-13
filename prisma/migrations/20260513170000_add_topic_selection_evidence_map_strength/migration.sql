-- Add topic-selection v1a evidence-map/strength authority records.
-- These records intentionally keep functional refs as JSON payloads beside
-- queryable refs and avoid foreign-key coupling to title-card, literature, or
-- control-plane tables.

CREATE TABLE "TopicSelectionEvidenceMap" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "evidenceMapVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reviewStatus" TEXT NOT NULL,
  "freshnessStatus" TEXT NOT NULL,
  "searchRunId" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "literatureSnapshotId" TEXT NOT NULL,
  "searchRunRef" JSONB NOT NULL DEFAULT '{}',
  "searchPlanRef" JSONB NOT NULL DEFAULT '{}',
  "literatureSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "unitCount" INTEGER NOT NULL DEFAULT 0,
  "supportUnitCount" INTEGER NOT NULL DEFAULT 0,
  "challengeUnitCount" INTEGER NOT NULL DEFAULT 0,
  "baselineUnitCount" INTEGER NOT NULL DEFAULT 0,
  "contextUnitCount" INTEGER NOT NULL DEFAULT 0,
  "digestPayload" JSONB NOT NULL DEFAULT '{}',
  "staleReasonCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "traceSnapshotId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionEvidenceMap_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionEvidenceUnit" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "evidenceMapId" TEXT NOT NULL,
  "evidenceMapVersion" TEXT NOT NULL,
  "searchRunId" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "literatureSnapshotId" TEXT NOT NULL,
  "coverageRowIntentId" TEXT,
  "literatureId" TEXT NOT NULL,
  "evidenceRole" TEXT NOT NULL,
  "locatorType" TEXT NOT NULL,
  "locatorRefType" TEXT NOT NULL,
  "locatorRefId" TEXT NOT NULL,
  "abstractOnly" BOOLEAN NOT NULL DEFAULT false,
  "reviewStatus" TEXT NOT NULL,
  "freshnessStatus" TEXT NOT NULL,
  "sourceAttributionKind" TEXT NOT NULL,
  "searchRunRef" JSONB NOT NULL DEFAULT '{}',
  "searchPlanRef" JSONB NOT NULL DEFAULT '{}',
  "literatureSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "coverageRowIntentRef" JSONB,
  "literatureRef" JSONB NOT NULL DEFAULT '{}',
  "sourceRefs" JSONB NOT NULL DEFAULT '[]',
  "locator" JSONB NOT NULL DEFAULT '{}',
  "sourceStatement" TEXT NOT NULL,
  "normalizedStatement" TEXT,
  "interpretationPayload" JSONB NOT NULL DEFAULT '{}',
  "extractionConfidence" DOUBLE PRECISION,
  "issueCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionEvidenceUnit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionEvidenceTypedLink" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "evidenceMapId" TEXT NOT NULL,
  "evidenceMapVersion" TEXT NOT NULL,
  "linkType" TEXT NOT NULL,
  "sourceUnitId" TEXT NOT NULL,
  "targetUnitId" TEXT NOT NULL,
  "sourceUnitRef" JSONB NOT NULL DEFAULT '{}',
  "targetUnitRef" JSONB NOT NULL DEFAULT '{}',
  "rationale" TEXT,
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionEvidenceTypedLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionEvidenceCluster" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "evidenceMapId" TEXT NOT NULL,
  "evidenceMapVersion" TEXT NOT NULL,
  "clusterType" TEXT NOT NULL,
  "clusterKey" TEXT NOT NULL,
  "unitIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "unitRefs" JSONB NOT NULL DEFAULT '[]',
  "label" TEXT NOT NULL,
  "rationale" TEXT,
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionEvidenceCluster_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionEvidencePattern" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "evidenceMapId" TEXT NOT NULL,
  "evidenceMapVersion" TEXT NOT NULL,
  "patternType" TEXT NOT NULL,
  "evidenceRole" TEXT NOT NULL,
  "unitIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "unitRefs" JSONB NOT NULL DEFAULT '[]',
  "patternStatement" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionEvidencePattern_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionEvidenceConflictSet" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "evidenceMapId" TEXT NOT NULL,
  "evidenceMapVersion" TEXT NOT NULL,
  "conflictType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "supportUnitIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "challengeUnitIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "baselineUnitIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "contextUnitIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "supportUnitRefs" JSONB NOT NULL DEFAULT '[]',
  "challengeUnitRefs" JSONB NOT NULL DEFAULT '[]',
  "baselineUnitRefs" JSONB NOT NULL DEFAULT '[]',
  "contextUnitRefs" JSONB NOT NULL DEFAULT '[]',
  "issueCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionEvidenceConflictSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionEvidenceStrengthAssessment" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "evidenceMapId" TEXT NOT NULL,
  "evidenceMapVersion" TEXT NOT NULL,
  "searchRunId" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "literatureSnapshotId" TEXT NOT NULL,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetRef" JSONB NOT NULL DEFAULT '{}',
  "searchRunRef" JSONB NOT NULL DEFAULT '{}',
  "searchPlanRef" JSONB NOT NULL DEFAULT '{}',
  "literatureSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "purpose" TEXT NOT NULL,
  "granularity" TEXT NOT NULL,
  "roleBundle" JSONB NOT NULL DEFAULT '{}',
  "unitIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "unitRefs" JSONB NOT NULL DEFAULT '[]',
  "conflictRefs" JSONB NOT NULL DEFAULT '[]',
  "cacheKey" TEXT NOT NULL,
  "strengthVerdict" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION,
  "gapCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "qualitySignalRefs" JSONB NOT NULL DEFAULT '[]',
  "staleReasonCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "freshnessStatus" TEXT NOT NULL,
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "policyVersionId" TEXT,
  "assessmentWorkflowVersion" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionEvidenceStrengthAssessment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TopicSelectionEvidenceMap_searchRunId_evidenceMapVersion_key"
  ON "TopicSelectionEvidenceMap"("searchRunId", "evidenceMapVersion");
CREATE INDEX "TopicSelectionEvidenceMap_titleCardId_createdAt_idx"
  ON "TopicSelectionEvidenceMap"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionEvidenceMap_searchRunId_idx"
  ON "TopicSelectionEvidenceMap"("searchRunId");
CREATE INDEX "TopicSelectionEvidenceMap_searchPlanId_idx"
  ON "TopicSelectionEvidenceMap"("searchPlanId");
CREATE INDEX "TopicSelectionEvidenceMap_literatureSnapshotId_idx"
  ON "TopicSelectionEvidenceMap"("literatureSnapshotId");
CREATE INDEX "TopicSelectionEvidenceMap_reviewStatus_idx"
  ON "TopicSelectionEvidenceMap"("reviewStatus");
CREATE INDEX "TopicSelectionEvidenceMap_freshnessStatus_idx"
  ON "TopicSelectionEvidenceMap"("freshnessStatus");
CREATE INDEX "TopicSelectionEvidenceMap_inputSnapshotId_idx"
  ON "TopicSelectionEvidenceMap"("inputSnapshotId");
CREATE INDEX "TopicSelectionEvidenceMap_workflowRunId_idx"
  ON "TopicSelectionEvidenceMap"("workflowRunId");

CREATE INDEX "TopicSelectionEvidenceUnit_titleCardId_createdAt_idx"
  ON "TopicSelectionEvidenceUnit"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionEvidenceUnit_evidenceMapId_idx"
  ON "TopicSelectionEvidenceUnit"("evidenceMapId");
CREATE INDEX "TopicSelectionEvidenceUnit_searchRunId_idx"
  ON "TopicSelectionEvidenceUnit"("searchRunId");
CREATE INDEX "TopicSelectionEvidenceUnit_searchPlanId_idx"
  ON "TopicSelectionEvidenceUnit"("searchPlanId");
CREATE INDEX "TopicSelectionEvidenceUnit_literatureSnapshotId_idx"
  ON "TopicSelectionEvidenceUnit"("literatureSnapshotId");
CREATE INDEX "TopicSelectionEvidenceUnit_literatureId_idx"
  ON "TopicSelectionEvidenceUnit"("literatureId");
CREATE INDEX "TopicSelectionEvidenceUnit_coverageRowIntentId_idx"
  ON "TopicSelectionEvidenceUnit"("coverageRowIntentId");
CREATE INDEX "TopicSelectionEvidenceUnit_evidenceRole_idx"
  ON "TopicSelectionEvidenceUnit"("evidenceRole");
CREATE INDEX "TopicSelectionEvidenceUnit_locatorRefType_locatorRefId_idx"
  ON "TopicSelectionEvidenceUnit"("locatorRefType", "locatorRefId");
CREATE INDEX "TopicSelectionEvidenceUnit_abstractOnly_idx"
  ON "TopicSelectionEvidenceUnit"("abstractOnly");
CREATE INDEX "TopicSelectionEvidenceUnit_reviewStatus_idx"
  ON "TopicSelectionEvidenceUnit"("reviewStatus");
CREATE INDEX "TopicSelectionEvidenceUnit_freshnessStatus_idx"
  ON "TopicSelectionEvidenceUnit"("freshnessStatus");

CREATE INDEX "TopicSelectionEvidenceTypedLink_evidenceMapId_idx"
  ON "TopicSelectionEvidenceTypedLink"("evidenceMapId");
CREATE INDEX "TopicSelectionEvidenceTypedLink_titleCardId_idx"
  ON "TopicSelectionEvidenceTypedLink"("titleCardId");
CREATE INDEX "TopicSelectionEvidenceTypedLink_linkType_idx"
  ON "TopicSelectionEvidenceTypedLink"("linkType");
CREATE INDEX "TopicSelectionEvidenceTypedLink_sourceUnitId_idx"
  ON "TopicSelectionEvidenceTypedLink"("sourceUnitId");
CREATE INDEX "TopicSelectionEvidenceTypedLink_targetUnitId_idx"
  ON "TopicSelectionEvidenceTypedLink"("targetUnitId");

CREATE UNIQUE INDEX "TopicSelectionEvidenceCluster_evidenceMapId_clusterKey_key"
  ON "TopicSelectionEvidenceCluster"("evidenceMapId", "clusterKey");
CREATE INDEX "TopicSelectionEvidenceCluster_evidenceMapId_idx"
  ON "TopicSelectionEvidenceCluster"("evidenceMapId");
CREATE INDEX "TopicSelectionEvidenceCluster_titleCardId_idx"
  ON "TopicSelectionEvidenceCluster"("titleCardId");
CREATE INDEX "TopicSelectionEvidenceCluster_clusterType_idx"
  ON "TopicSelectionEvidenceCluster"("clusterType");

CREATE INDEX "TopicSelectionEvidencePattern_evidenceMapId_idx"
  ON "TopicSelectionEvidencePattern"("evidenceMapId");
CREATE INDEX "TopicSelectionEvidencePattern_titleCardId_idx"
  ON "TopicSelectionEvidencePattern"("titleCardId");
CREATE INDEX "TopicSelectionEvidencePattern_patternType_idx"
  ON "TopicSelectionEvidencePattern"("patternType");
CREATE INDEX "TopicSelectionEvidencePattern_evidenceRole_idx"
  ON "TopicSelectionEvidencePattern"("evidenceRole");

CREATE INDEX "TopicSelectionEvidenceConflictSet_evidenceMapId_idx"
  ON "TopicSelectionEvidenceConflictSet"("evidenceMapId");
CREATE INDEX "TopicSelectionEvidenceConflictSet_titleCardId_idx"
  ON "TopicSelectionEvidenceConflictSet"("titleCardId");
CREATE INDEX "TopicSelectionEvidenceConflictSet_conflictType_idx"
  ON "TopicSelectionEvidenceConflictSet"("conflictType");
CREATE INDEX "TopicSelectionEvidenceConflictSet_severity_idx"
  ON "TopicSelectionEvidenceConflictSet"("severity");

CREATE UNIQUE INDEX "TopicSelectionEvidenceStrengthAssessment_cacheKey_key"
  ON "TopicSelectionEvidenceStrengthAssessment"("cacheKey");
CREATE INDEX "TopicSelectionEvidenceStrengthAssessment_titleCardId_createdAt_idx"
  ON "TopicSelectionEvidenceStrengthAssessment"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionEvidenceStrengthAssessment_evidenceMapId_idx"
  ON "TopicSelectionEvidenceStrengthAssessment"("evidenceMapId");
CREATE INDEX "TopicSelectionEvidenceStrengthAssessment_evidenceMapVersion_idx"
  ON "TopicSelectionEvidenceStrengthAssessment"("evidenceMapVersion");
CREATE INDEX "TopicSelectionEvidenceStrengthAssessment_searchRunId_idx"
  ON "TopicSelectionEvidenceStrengthAssessment"("searchRunId");
CREATE INDEX "TopicSelectionEvidenceStrengthAssessment_searchPlanId_idx"
  ON "TopicSelectionEvidenceStrengthAssessment"("searchPlanId");
CREATE INDEX "TopicSelectionEvidenceStrengthAssessment_literatureSnapshotId_idx"
  ON "TopicSelectionEvidenceStrengthAssessment"("literatureSnapshotId");
CREATE INDEX "TopicSelectionEvidenceStrengthAssessment_targetRefType_targetRefId_idx"
  ON "TopicSelectionEvidenceStrengthAssessment"("targetRefType", "targetRefId");
CREATE INDEX "TopicSelectionEvidenceStrengthAssessment_purpose_idx"
  ON "TopicSelectionEvidenceStrengthAssessment"("purpose");
CREATE INDEX "TopicSelectionEvidenceStrengthAssessment_granularity_idx"
  ON "TopicSelectionEvidenceStrengthAssessment"("granularity");
CREATE INDEX "TopicSelectionEvidenceStrengthAssessment_strengthVerdict_idx"
  ON "TopicSelectionEvidenceStrengthAssessment"("strengthVerdict");
CREATE INDEX "TopicSelectionEvidenceStrengthAssessment_freshnessStatus_idx"
  ON "TopicSelectionEvidenceStrengthAssessment"("freshnessStatus");
CREATE INDEX "TopicSelectionEvidenceStrengthAssessment_workflowRunId_idx"
  ON "TopicSelectionEvidenceStrengthAssessment"("workflowRunId");
