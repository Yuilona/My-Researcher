CREATE TABLE "TopicSelectionV1bIntakeSnapshot" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "v1bInputBundleId" TEXT NOT NULL,
  "validatedNeedId" TEXT NOT NULL,
  "snapshotVersion" TEXT NOT NULL,
  "v1bInputBundleRef" JSONB NOT NULL DEFAULT '{}',
  "validatedNeedRef" JSONB NOT NULL DEFAULT '{}',
  "sourceNeedCandidateRef" JSONB NOT NULL DEFAULT '{}',
  "adjudicationResultRef" JSONB NOT NULL DEFAULT '{}',
  "supportPacketRef" JSONB NOT NULL DEFAULT '{}',
  "humanDecisionRef" JSONB NOT NULL DEFAULT '{}',
  "evidenceMapId" TEXT NOT NULL,
  "searchRunId" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "literatureSnapshotId" TEXT NOT NULL,
  "evidenceMapRef" JSONB NOT NULL DEFAULT '{}',
  "searchRunRef" JSONB NOT NULL DEFAULT '{}',
  "searchPlanRef" JSONB NOT NULL DEFAULT '{}',
  "literatureSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "evidenceRoleBundle" JSONB NOT NULL DEFAULT '{}',
  "traceRefs" JSONB NOT NULL DEFAULT '[]',
  "riskRefs" JSONB NOT NULL DEFAULT '[]',
  "gapCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "memorySuggestionRefs" JSONB NOT NULL DEFAULT '[]',
  "recheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "handoffPayload" JSONB NOT NULL DEFAULT '{}',
  "traceStatus" TEXT NOT NULL,
  "traceIssues" JSONB NOT NULL DEFAULT '[]',
  "evidenceMapFreshnessStatus" TEXT,
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "traceSnapshotId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionV1bIntakeSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionResearchConstraintProfile" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "v1bIntakeSnapshotId" TEXT NOT NULL,
  "v1bInputBundleId" TEXT NOT NULL,
  "validatedNeedId" TEXT NOT NULL,
  "profileVersion" TEXT NOT NULL,
  "v1bIntakeSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "v1bInputBundleRef" JSONB NOT NULL DEFAULT '{}',
  "validatedNeedRef" JSONB NOT NULL DEFAULT '{}',
  "supersedesProfileId" TEXT,
  "supersedesProfileRef" JSONB,
  "targetCommunity" TEXT NOT NULL,
  "targetVenueClass" TEXT,
  "intendedContributionStyle" TEXT,
  "methodConstraints" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "resourceConstraints" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "availableAssets" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "feasibilityBudget" JSONB NOT NULL DEFAULT '{}',
  "nonGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "claimCeiling" TEXT NOT NULL,
  "humanConstraintNotes" TEXT,
  "constraintPayload" JSONB NOT NULL DEFAULT '{}',
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "traceSnapshotId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionResearchConstraintProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionV1bIntakeReadinessAssessment" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "v1bIntakeSnapshotId" TEXT NOT NULL,
  "researchConstraintProfileId" TEXT NOT NULL,
  "v1bInputBundleId" TEXT NOT NULL,
  "validatedNeedId" TEXT NOT NULL,
  "profileVersion" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  "blockers" JSONB NOT NULL DEFAULT '[]',
  "warnings" JSONB NOT NULL DEFAULT '[]',
  "requiredActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "v1bIntakeSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "researchConstraintProfileRef" JSONB NOT NULL DEFAULT '{}',
  "v1bInputBundleRef" JSONB NOT NULL DEFAULT '{}',
  "validatedNeedRef" JSONB NOT NULL DEFAULT '{}',
  "evidenceMapRef" JSONB NOT NULL DEFAULT '{}',
  "searchRunRef" JSONB NOT NULL DEFAULT '{}',
  "searchPlanRef" JSONB NOT NULL DEFAULT '{}',
  "literatureSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "openRecheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "uncoveredRecheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "staleRefCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "missingConstraintCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "policyVersionId" TEXT,
  "assessedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionV1bIntakeReadinessAssessment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TopicSelectionV1bIntakeSnapshot_v1bInputBundleId_snapshotVersion_key"
  ON "TopicSelectionV1bIntakeSnapshot"("v1bInputBundleId", "snapshotVersion");
CREATE INDEX "TopicSelectionV1bIntakeSnapshot_titleCardId_createdAt_idx"
  ON "TopicSelectionV1bIntakeSnapshot"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionV1bIntakeSnapshot_v1bInputBundleId_idx"
  ON "TopicSelectionV1bIntakeSnapshot"("v1bInputBundleId");
CREATE INDEX "TopicSelectionV1bIntakeSnapshot_validatedNeedId_idx"
  ON "TopicSelectionV1bIntakeSnapshot"("validatedNeedId");
CREATE INDEX "TopicSelectionV1bIntakeSnapshot_traceStatus_idx"
  ON "TopicSelectionV1bIntakeSnapshot"("traceStatus");
CREATE INDEX "TopicSelectionV1bIntakeSnapshot_evidenceMapId_idx"
  ON "TopicSelectionV1bIntakeSnapshot"("evidenceMapId");
CREATE INDEX "TopicSelectionV1bIntakeSnapshot_searchRunId_idx"
  ON "TopicSelectionV1bIntakeSnapshot"("searchRunId");
CREATE INDEX "TopicSelectionV1bIntakeSnapshot_searchPlanId_idx"
  ON "TopicSelectionV1bIntakeSnapshot"("searchPlanId");
CREATE INDEX "TopicSelectionV1bIntakeSnapshot_literatureSnapshotId_idx"
  ON "TopicSelectionV1bIntakeSnapshot"("literatureSnapshotId");
CREATE INDEX "TopicSelectionV1bIntakeSnapshot_gateResultId_idx"
  ON "TopicSelectionV1bIntakeSnapshot"("gateResultId");
CREATE INDEX "TopicSelectionV1bIntakeSnapshot_workflowRunId_idx"
  ON "TopicSelectionV1bIntakeSnapshot"("workflowRunId");

CREATE UNIQUE INDEX "TopicSelectionResearchConstraintProfile_v1bInputBundleId_profileVersion_key"
  ON "TopicSelectionResearchConstraintProfile"("v1bInputBundleId", "profileVersion");
CREATE INDEX "TopicSelectionResearchConstraintProfile_titleCardId_createdAt_idx"
  ON "TopicSelectionResearchConstraintProfile"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionResearchConstraintProfile_v1bIntakeSnapshotId_idx"
  ON "TopicSelectionResearchConstraintProfile"("v1bIntakeSnapshotId");
CREATE INDEX "TopicSelectionResearchConstraintProfile_v1bInputBundleId_idx"
  ON "TopicSelectionResearchConstraintProfile"("v1bInputBundleId");
CREATE INDEX "TopicSelectionResearchConstraintProfile_validatedNeedId_idx"
  ON "TopicSelectionResearchConstraintProfile"("validatedNeedId");
CREATE INDEX "TopicSelectionResearchConstraintProfile_supersedesProfileId_idx"
  ON "TopicSelectionResearchConstraintProfile"("supersedesProfileId");
CREATE INDEX "TopicSelectionResearchConstraintProfile_targetCommunity_idx"
  ON "TopicSelectionResearchConstraintProfile"("targetCommunity");
CREATE INDEX "TopicSelectionResearchConstraintProfile_gateResultId_idx"
  ON "TopicSelectionResearchConstraintProfile"("gateResultId");
CREATE INDEX "TopicSelectionResearchConstraintProfile_workflowRunId_idx"
  ON "TopicSelectionResearchConstraintProfile"("workflowRunId");

CREATE UNIQUE INDEX "TopicSelectionV1bIntakeReadinessAssessment_snapshot_profile_version_key"
  ON "TopicSelectionV1bIntakeReadinessAssessment"("v1bIntakeSnapshotId", "researchConstraintProfileId", "profileVersion");
CREATE INDEX "TopicSelectionV1bIntakeReadinessAssessment_titleCardId_createdAt_idx"
  ON "TopicSelectionV1bIntakeReadinessAssessment"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionV1bIntakeReadinessAssessment_v1bIntakeSnapshotId_idx"
  ON "TopicSelectionV1bIntakeReadinessAssessment"("v1bIntakeSnapshotId");
CREATE INDEX "TopicSelectionV1bIntakeReadinessAssessment_researchConstraintProfileId_idx"
  ON "TopicSelectionV1bIntakeReadinessAssessment"("researchConstraintProfileId");
CREATE INDEX "TopicSelectionV1bIntakeReadinessAssessment_v1bInputBundleId_idx"
  ON "TopicSelectionV1bIntakeReadinessAssessment"("v1bInputBundleId");
CREATE INDEX "TopicSelectionV1bIntakeReadinessAssessment_validatedNeedId_idx"
  ON "TopicSelectionV1bIntakeReadinessAssessment"("validatedNeedId");
CREATE INDEX "TopicSelectionV1bIntakeReadinessAssessment_recommendation_idx"
  ON "TopicSelectionV1bIntakeReadinessAssessment"("recommendation");
CREATE INDEX "TopicSelectionV1bIntakeReadinessAssessment_gateResultId_idx"
  ON "TopicSelectionV1bIntakeReadinessAssessment"("gateResultId");
CREATE INDEX "TopicSelectionV1bIntakeReadinessAssessment_workflowRunId_idx"
  ON "TopicSelectionV1bIntakeReadinessAssessment"("workflowRunId");
CREATE INDEX "TopicSelectionV1bIntakeReadinessAssessment_policyVersionId_idx"
  ON "TopicSelectionV1bIntakeReadinessAssessment"("policyVersionId");
