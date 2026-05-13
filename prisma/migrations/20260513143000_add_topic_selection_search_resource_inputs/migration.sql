-- Add topic-selection v1a search/resource/evidence-input authority records.
-- These records use queryable title-card refs and functional refs instead of
-- foreign-key coupling to title-card, literature, or control-plane tables.

CREATE TABLE "TopicSelectionTopicSeed" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "seedVersion" TEXT NOT NULL,
  "seedKind" TEXT NOT NULL,
  "workingTitle" TEXT NOT NULL,
  "intentSummary" TEXT NOT NULL,
  "scopeNotes" TEXT,
  "sourceTitleCardRef" JSONB NOT NULL DEFAULT '{}',
  "sourceRefs" JSONB NOT NULL DEFAULT '[]',
  "inputSnapshotId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "traceSnapshotId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionTopicSeed_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionLiteratureResourcePoolSnapshot" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "snapshotVersion" TEXT NOT NULL,
  "sourceScope" TEXT NOT NULL,
  "topicSeedId" TEXT NOT NULL,
  "topicSeedRef" JSONB NOT NULL DEFAULT '{}',
  "literatureRefs" JSONB NOT NULL DEFAULT '[]',
  "contentSourceRefs" JSONB NOT NULL DEFAULT '[]',
  "sourceHealthSummary" JSONB NOT NULL DEFAULT '{}',
  "totalLiteratureCount" INTEGER NOT NULL DEFAULT 0,
  "missingLiteratureCount" INTEGER NOT NULL DEFAULT 0,
  "sourceCount" INTEGER NOT NULL DEFAULT 0,
  "fulltextReadyCount" INTEGER NOT NULL DEFAULT 0,
  "fulltextMissingCount" INTEGER NOT NULL DEFAULT 0,
  "blockedCount" INTEGER NOT NULL DEFAULT 0,
  "warningCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "snapshotHash" TEXT NOT NULL,
  "inputSnapshotId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionLiteratureResourcePoolSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionSearchPlan" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "planVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "topicSeedId" TEXT NOT NULL,
  "literatureSnapshotId" TEXT NOT NULL,
  "parentSearchPlanId" TEXT,
  "recheckRequestId" TEXT,
  "topicSeedRef" JSONB NOT NULL DEFAULT '{}',
  "literatureSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "parentSearchPlanRef" JSONB,
  "recheckRequestRef" JSONB,
  "queryIntents" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "mustCheckConstraints" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "exclusionRules" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "coverageStrategy" JSONB NOT NULL DEFAULT '{}',
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionSearchPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionCoverageRowIntent" (
  "id" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "coverageKey" TEXT NOT NULL,
  "intentType" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "targetSourceTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "expectedEvidenceRole" TEXT NOT NULL,
  "refs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionCoverageRowIntent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionCoverageExecutionObservation" (
  "id" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "coverageRowIntentId" TEXT NOT NULL,
  "searchRunId" TEXT,
  "status" TEXT NOT NULL,
  "resultCount" INTEGER NOT NULL DEFAULT 0,
  "sourceCount" INTEGER NOT NULL DEFAULT 0,
  "missingReasonCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionCoverageExecutionObservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionCoverageEvidenceBinding" (
  "id" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "coverageRowIntentId" TEXT NOT NULL,
  "searchRunId" TEXT NOT NULL,
  "literatureRef" JSONB NOT NULL DEFAULT '{}',
  "sourceRefs" JSONB NOT NULL DEFAULT '[]',
  "bindingKind" TEXT NOT NULL,
  "resultRank" INTEGER,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionCoverageEvidenceBinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionCoverageAssessment" (
  "id" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "coverageRowIntentId" TEXT NOT NULL,
  "verdict" TEXT NOT NULL,
  "issueCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "confidence" DOUBLE PRECISION,
  "assessedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionCoverageAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionCoverageRiskAcceptance" (
  "id" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "coverageRowIntentId" TEXT NOT NULL,
  "acceptedRiskRef" JSONB NOT NULL DEFAULT '{}',
  "acceptedBy" JSONB NOT NULL DEFAULT '{}',
  "rationale" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionCoverageRiskAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionSearchRun" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "literatureSnapshotId" TEXT NOT NULL,
  "searchPlanRef" JSONB NOT NULL DEFAULT '{}',
  "literatureSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "runKind" TEXT NOT NULL,
  "runStatus" TEXT NOT NULL,
  "queryProvenance" JSONB NOT NULL DEFAULT '[]',
  "resultAccounting" JSONB NOT NULL DEFAULT '{}',
  "totalResultCount" INTEGER NOT NULL DEFAULT 0,
  "uniqueLiteratureCount" INTEGER NOT NULL DEFAULT 0,
  "duplicateResultCount" INTEGER NOT NULL DEFAULT 0,
  "failedSourceCount" INTEGER NOT NULL DEFAULT 0,
  "skippedSourceCount" INTEGER NOT NULL DEFAULT 0,
  "sourceHealthSummary" JSONB NOT NULL DEFAULT '{}',
  "sourceHealthSourceCount" INTEGER NOT NULL DEFAULT 0,
  "sourceHealthBlockedCount" INTEGER NOT NULL DEFAULT 0,
  "sourceHealthFulltextReadyCount" INTEGER NOT NULL DEFAULT 0,
  "sourceHealthFulltextMissingCount" INTEGER NOT NULL DEFAULT 0,
  "sourceHealthWarningCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "dedupSummary" JSONB NOT NULL DEFAULT '{}',
  "evidenceMapInputRefs" JSONB NOT NULL DEFAULT '[]',
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "startedAt" TIMESTAMPTZ(6) NOT NULL,
  "finishedAt" TIMESTAMPTZ(6),
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionSearchRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionSearchPlanRecheckRequest" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "sourceRefType" TEXT NOT NULL,
  "sourceRefId" TEXT NOT NULL,
  "targetSearchPlanId" TEXT NOT NULL,
  "targetLiteratureSnapshotId" TEXT,
  "resultingSearchPlanId" TEXT,
  "resultingSearchRunId" TEXT,
  "sourceRef" JSONB NOT NULL DEFAULT '{}',
  "targetSearchPlanRef" JSONB NOT NULL DEFAULT '{}',
  "targetLiteratureSnapshotRef" JSONB,
  "reason" TEXT NOT NULL,
  "gapCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "requestedBy" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "decisionSummary" TEXT,
  "policyVersionId" TEXT,
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "resultingSearchPlanRef" JSONB,
  "resultingSearchRunRef" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "resolvedAt" TIMESTAMPTZ(6),

  CONSTRAINT "TopicSelectionSearchPlanRecheckRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TopicSelectionTopicSeed_titleCardId_seedVersion_key"
  ON "TopicSelectionTopicSeed"("titleCardId", "seedVersion");
CREATE INDEX "TopicSelectionTopicSeed_titleCardId_createdAt_idx"
  ON "TopicSelectionTopicSeed"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionTopicSeed_seedKind_idx"
  ON "TopicSelectionTopicSeed"("seedKind");
CREATE INDEX "TopicSelectionTopicSeed_inputSnapshotId_idx"
  ON "TopicSelectionTopicSeed"("inputSnapshotId");

CREATE UNIQUE INDEX "TopicSelectionLiteratureResourcePoolSnapshot_titleCardId_snapshotVersion_key"
  ON "TopicSelectionLiteratureResourcePoolSnapshot"("titleCardId", "snapshotVersion");
CREATE INDEX "TopicSelectionLiteratureResourcePoolSnapshot_titleCardId_createdAt_idx"
  ON "TopicSelectionLiteratureResourcePoolSnapshot"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionLiteratureResourcePoolSnapshot_topicSeedId_idx"
  ON "TopicSelectionLiteratureResourcePoolSnapshot"("topicSeedId");
CREATE INDEX "TopicSelectionLiteratureResourcePoolSnapshot_sourceScope_idx"
  ON "TopicSelectionLiteratureResourcePoolSnapshot"("sourceScope");
CREATE INDEX "TopicSelectionLiteratureResourcePoolSnapshot_snapshotHash_idx"
  ON "TopicSelectionLiteratureResourcePoolSnapshot"("snapshotHash");
CREATE INDEX "TopicSelectionLiteratureResourcePoolSnapshot_blockedCount_idx"
  ON "TopicSelectionLiteratureResourcePoolSnapshot"("blockedCount");

CREATE UNIQUE INDEX "TopicSelectionSearchPlan_titleCardId_planVersion_key"
  ON "TopicSelectionSearchPlan"("titleCardId", "planVersion");
CREATE INDEX "TopicSelectionSearchPlan_titleCardId_createdAt_idx"
  ON "TopicSelectionSearchPlan"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionSearchPlan_status_idx"
  ON "TopicSelectionSearchPlan"("status");
CREATE INDEX "TopicSelectionSearchPlan_topicSeedId_idx"
  ON "TopicSelectionSearchPlan"("topicSeedId");
CREATE INDEX "TopicSelectionSearchPlan_literatureSnapshotId_idx"
  ON "TopicSelectionSearchPlan"("literatureSnapshotId");
CREATE INDEX "TopicSelectionSearchPlan_parentSearchPlanId_idx"
  ON "TopicSelectionSearchPlan"("parentSearchPlanId");
CREATE INDEX "TopicSelectionSearchPlan_recheckRequestId_idx"
  ON "TopicSelectionSearchPlan"("recheckRequestId");
CREATE INDEX "TopicSelectionSearchPlan_inputSnapshotId_idx"
  ON "TopicSelectionSearchPlan"("inputSnapshotId");
CREATE INDEX "TopicSelectionSearchPlan_workflowRunId_idx"
  ON "TopicSelectionSearchPlan"("workflowRunId");

CREATE UNIQUE INDEX "TopicSelectionCoverageRowIntent_searchPlanId_coverageKey_key"
  ON "TopicSelectionCoverageRowIntent"("searchPlanId", "coverageKey");
CREATE INDEX "TopicSelectionCoverageRowIntent_searchPlanId_idx"
  ON "TopicSelectionCoverageRowIntent"("searchPlanId");
CREATE INDEX "TopicSelectionCoverageRowIntent_titleCardId_idx"
  ON "TopicSelectionCoverageRowIntent"("titleCardId");
CREATE INDEX "TopicSelectionCoverageRowIntent_intentType_idx"
  ON "TopicSelectionCoverageRowIntent"("intentType");

CREATE INDEX "TopicSelectionCoverageExecutionObservation_searchPlanId_createdAt_idx"
  ON "TopicSelectionCoverageExecutionObservation"("searchPlanId", "createdAt" DESC);
CREATE INDEX "TopicSelectionCoverageExecutionObservation_coverageRowIntentId_createdAt_idx"
  ON "TopicSelectionCoverageExecutionObservation"("coverageRowIntentId", "createdAt" DESC);
CREATE INDEX "TopicSelectionCoverageExecutionObservation_searchRunId_idx"
  ON "TopicSelectionCoverageExecutionObservation"("searchRunId");
CREATE INDEX "TopicSelectionCoverageExecutionObservation_status_idx"
  ON "TopicSelectionCoverageExecutionObservation"("status");

CREATE INDEX "TopicSelectionCoverageEvidenceBinding_searchPlanId_idx"
  ON "TopicSelectionCoverageEvidenceBinding"("searchPlanId");
CREATE INDEX "TopicSelectionCoverageEvidenceBinding_coverageRowIntentId_idx"
  ON "TopicSelectionCoverageEvidenceBinding"("coverageRowIntentId");
CREATE INDEX "TopicSelectionCoverageEvidenceBinding_searchRunId_idx"
  ON "TopicSelectionCoverageEvidenceBinding"("searchRunId");
CREATE INDEX "TopicSelectionCoverageEvidenceBinding_bindingKind_idx"
  ON "TopicSelectionCoverageEvidenceBinding"("bindingKind");

CREATE INDEX "TopicSelectionCoverageAssessment_searchPlanId_createdAt_idx"
  ON "TopicSelectionCoverageAssessment"("searchPlanId", "createdAt" DESC);
CREATE INDEX "TopicSelectionCoverageAssessment_coverageRowIntentId_createdAt_idx"
  ON "TopicSelectionCoverageAssessment"("coverageRowIntentId", "createdAt" DESC);
CREATE INDEX "TopicSelectionCoverageAssessment_verdict_idx"
  ON "TopicSelectionCoverageAssessment"("verdict");

CREATE INDEX "TopicSelectionCoverageRiskAcceptance_searchPlanId_createdAt_idx"
  ON "TopicSelectionCoverageRiskAcceptance"("searchPlanId", "createdAt" DESC);
CREATE INDEX "TopicSelectionCoverageRiskAcceptance_coverageRowIntentId_idx"
  ON "TopicSelectionCoverageRiskAcceptance"("coverageRowIntentId");

CREATE INDEX "TopicSelectionSearchRun_titleCardId_createdAt_idx"
  ON "TopicSelectionSearchRun"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionSearchRun_searchPlanId_createdAt_idx"
  ON "TopicSelectionSearchRun"("searchPlanId", "createdAt" DESC);
CREATE INDEX "TopicSelectionSearchRun_literatureSnapshotId_idx"
  ON "TopicSelectionSearchRun"("literatureSnapshotId");
CREATE INDEX "TopicSelectionSearchRun_runKind_runStatus_idx"
  ON "TopicSelectionSearchRun"("runKind", "runStatus");
CREATE INDEX "TopicSelectionSearchRun_failedSourceCount_idx"
  ON "TopicSelectionSearchRun"("failedSourceCount");
CREATE INDEX "TopicSelectionSearchRun_sourceHealthBlockedCount_idx"
  ON "TopicSelectionSearchRun"("sourceHealthBlockedCount");
CREATE INDEX "TopicSelectionSearchRun_inputSnapshotId_idx"
  ON "TopicSelectionSearchRun"("inputSnapshotId");
CREATE INDEX "TopicSelectionSearchRun_workflowRunId_idx"
  ON "TopicSelectionSearchRun"("workflowRunId");

CREATE INDEX "TopicSelectionSearchPlanRecheckRequest_titleCardId_createdAt_idx"
  ON "TopicSelectionSearchPlanRecheckRequest"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionSearchPlanRecheckRequest_sourceRefType_sourceRefId_idx"
  ON "TopicSelectionSearchPlanRecheckRequest"("sourceRefType", "sourceRefId");
CREATE INDEX "TopicSelectionSearchPlanRecheckRequest_targetSearchPlanId_idx"
  ON "TopicSelectionSearchPlanRecheckRequest"("targetSearchPlanId");
CREATE INDEX "TopicSelectionSearchPlanRecheckRequest_targetLiteratureSnapshotId_idx"
  ON "TopicSelectionSearchPlanRecheckRequest"("targetLiteratureSnapshotId");
CREATE INDEX "TopicSelectionSearchPlanRecheckRequest_resultingSearchPlanId_idx"
  ON "TopicSelectionSearchPlanRecheckRequest"("resultingSearchPlanId");
CREATE INDEX "TopicSelectionSearchPlanRecheckRequest_resultingSearchRunId_idx"
  ON "TopicSelectionSearchPlanRecheckRequest"("resultingSearchRunId");
CREATE INDEX "TopicSelectionSearchPlanRecheckRequest_status_idx"
  ON "TopicSelectionSearchPlanRecheckRequest"("status");
CREATE INDEX "TopicSelectionSearchPlanRecheckRequest_policyVersionId_idx"
  ON "TopicSelectionSearchPlanRecheckRequest"("policyVersionId");
