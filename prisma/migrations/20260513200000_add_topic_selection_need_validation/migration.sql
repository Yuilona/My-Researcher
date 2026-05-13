-- Add topic-selection v1a need-validation authority records.
-- Records keep query-critical refs in columns and preserve complete functional
-- refs in JSON without foreign-key coupling to title-card business state.

CREATE TABLE "TopicSelectionNeedCandidate" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "evidenceMapId" TEXT NOT NULL,
  "candidateVersion" TEXT NOT NULL,
  "lifecycleStatus" TEXT NOT NULL,
  "decisionStatus" TEXT NOT NULL,
  "reviewStatus" TEXT NOT NULL,
  "freshnessStatus" TEXT NOT NULL,
  "candidateNeed" TEXT NOT NULL,
  "unmetNeedStatement" TEXT NOT NULL,
  "mechanismType" TEXT NOT NULL,
  "mechanismSummary" TEXT,
  "mechanismPayload" JSONB NOT NULL DEFAULT '{}',
  "scopeNotes" TEXT,
  "nonGoalNotes" TEXT,
  "priorArtStatus" TEXT NOT NULL,
  "evidenceMapRef" JSONB NOT NULL DEFAULT '{}',
  "searchRunId" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "literatureSnapshotId" TEXT NOT NULL,
  "searchRunRef" JSONB NOT NULL DEFAULT '{}',
  "searchPlanRef" JSONB NOT NULL DEFAULT '{}',
  "literatureSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "evidenceRoleBundle" JSONB NOT NULL DEFAULT '{}',
  "conflictRefs" JSONB NOT NULL DEFAULT '[]',
  "strengthAssessmentRefs" JSONB NOT NULL DEFAULT '[]',
  "openRecheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "unresolvedChallengeRefs" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "gapCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "speculative" BOOLEAN NOT NULL DEFAULT false,
  "confidence" DOUBLE PRECISION,
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "traceSnapshotId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "resultAdjudicationId" TEXT,
  "resultValidatedNeedId" TEXT,
  "mergedIntoNeedCandidateId" TEXT,
  "mergedIntoNeedCandidateRef" JSONB,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionNeedCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionNeedCandidateReadinessAssessment" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "needCandidateId" TEXT NOT NULL,
  "evidenceMapId" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  "blockers" JSONB NOT NULL DEFAULT '[]',
  "warnings" JSONB NOT NULL DEFAULT '[]',
  "requiredActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "strengthAssessmentId" TEXT,
  "strengthAssessmentRef" JSONB,
  "evidenceMapRef" JSONB NOT NULL DEFAULT '{}',
  "searchRunId" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "literatureSnapshotId" TEXT NOT NULL,
  "searchRunRef" JSONB NOT NULL DEFAULT '{}',
  "searchPlanRef" JSONB NOT NULL DEFAULT '{}',
  "literatureSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "supportUnitRefs" JSONB NOT NULL DEFAULT '[]',
  "challengeUnitRefs" JSONB NOT NULL DEFAULT '[]',
  "baselineUnitRefs" JSONB NOT NULL DEFAULT '[]',
  "contextUnitRefs" JSONB NOT NULL DEFAULT '[]',
  "conflictRefs" JSONB NOT NULL DEFAULT '[]',
  "openRecheckRequestRefs" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "gapCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "supportCount" INTEGER NOT NULL DEFAULT 0,
  "challengeCount" INTEGER NOT NULL DEFAULT 0,
  "abstractOnlySupportCount" INTEGER NOT NULL DEFAULT 0,
  "strongUnresolvedChallengeCount" INTEGER NOT NULL DEFAULT 0,
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "policyVersionId" TEXT,
  "assessedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionNeedCandidateReadinessAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionValidationDecisionSupportPacket" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "needCandidateId" TEXT NOT NULL,
  "evidenceMapId" TEXT NOT NULL,
  "readinessAssessmentId" TEXT,
  "packetStatus" TEXT NOT NULL,
  "evidenceMapRef" JSONB NOT NULL DEFAULT '{}',
  "searchRunId" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "literatureSnapshotId" TEXT NOT NULL,
  "searchRunRef" JSONB NOT NULL DEFAULT '{}',
  "searchPlanRef" JSONB NOT NULL DEFAULT '{}',
  "literatureSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "needCandidateRef" JSONB NOT NULL DEFAULT '{}',
  "readinessAssessmentRef" JSONB,
  "evidenceRoleBundle" JSONB NOT NULL DEFAULT '{}',
  "conflictRefs" JSONB NOT NULL DEFAULT '[]',
  "strengthAssessmentRefs" JSONB NOT NULL DEFAULT '[]',
  "coverageRefs" JSONB NOT NULL DEFAULT '[]',
  "residualRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "openGapCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "requiredHumanChecks" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "priorArtStatus" TEXT NOT NULL,
  "alreadySolvedReview" JSONB NOT NULL DEFAULT '{}',
  "packetPayload" JSONB NOT NULL DEFAULT '{}',
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "traceSnapshotId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionValidationDecisionSupportPacket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionValidateNeedAdjudicationResult" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "needCandidateId" TEXT NOT NULL,
  "supportPacketId" TEXT NOT NULL,
  "finalDecision" TEXT NOT NULL,
  "outputValidatedNeedId" TEXT,
  "humanDecisionId" TEXT,
  "loopbackTarget" TEXT NOT NULL,
  "rejectedReason" TEXT,
  "mergeTargetNeedCandidateId" TEXT,
  "mergeTargetNeedCandidateRef" JSONB,
  "outputSearchplanRecheckRequestId" TEXT,
  "outputSearchplanRecheckRequestRef" JSONB,
  "outputMemorySuggestionId" TEXT,
  "outputMemorySuggestionRef" JSONB,
  "rationale" TEXT NOT NULL,
  "requiredActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "residualRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "gapCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "decisionPayload" JSONB NOT NULL DEFAULT '{}',
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "traceSnapshotId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "adjudicatedBy" JSONB NOT NULL DEFAULT '{}',
  "adjudicatedByType" TEXT NOT NULL,
  "adjudicatedById" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionValidateNeedAdjudicationResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionValidatedNeed" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "sourceNeedCandidateId" TEXT NOT NULL,
  "adjudicationResultId" TEXT NOT NULL,
  "supportPacketId" TEXT NOT NULL,
  "humanDecisionId" TEXT NOT NULL,
  "validatedNeedStatement" TEXT NOT NULL,
  "mechanismType" TEXT NOT NULL,
  "mechanismSummary" TEXT,
  "mechanismPayload" JSONB NOT NULL DEFAULT '{}',
  "scopeNotes" TEXT,
  "nonGoalNotes" TEXT,
  "priorArtStatus" TEXT NOT NULL,
  "evidenceMapId" TEXT NOT NULL,
  "searchRunId" TEXT NOT NULL,
  "searchPlanId" TEXT NOT NULL,
  "literatureSnapshotId" TEXT NOT NULL,
  "evidenceMapRef" JSONB NOT NULL DEFAULT '{}',
  "searchRunRef" JSONB NOT NULL DEFAULT '{}',
  "searchPlanRef" JSONB NOT NULL DEFAULT '{}',
  "literatureSnapshotRef" JSONB NOT NULL DEFAULT '{}',
  "supportPacketRef" JSONB NOT NULL DEFAULT '{}',
  "adjudicationResultRef" JSONB NOT NULL DEFAULT '{}',
  "humanDecisionRef" JSONB NOT NULL DEFAULT '{}',
  "evidenceRoleBundle" JSONB NOT NULL DEFAULT '{}',
  "strengthAssessmentRefs" JSONB NOT NULL DEFAULT '[]',
  "conflictRefs" JSONB NOT NULL DEFAULT '[]',
  "residualRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "traceRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionValidatedNeed_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionCandidateDecisionMemorySuggestion" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "sourceNeedCandidateId" TEXT NOT NULL,
  "adjudicationResultId" TEXT,
  "suggestionType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetRef" JSONB NOT NULL DEFAULT '{}',
  "suggestionPayload" JSONB NOT NULL DEFAULT '{}',
  "rationale" TEXT NOT NULL,
  "policyVersionId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionCandidateDecisionMemorySuggestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionV1aToV1bInputBundle" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "validatedNeedId" TEXT NOT NULL,
  "sourceNeedCandidateId" TEXT NOT NULL,
  "adjudicationResultId" TEXT NOT NULL,
  "supportPacketId" TEXT NOT NULL,
  "bundleVersion" TEXT NOT NULL,
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
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionV1aToV1bInputBundle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TopicSelectionNeedCandidate_evidenceMapId_candidateVersion_key"
  ON "TopicSelectionNeedCandidate"("evidenceMapId", "candidateVersion");
CREATE INDEX "TopicSelectionNeedCandidate_titleCardId_createdAt_idx"
  ON "TopicSelectionNeedCandidate"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionNeedCandidate_evidenceMapId_idx"
  ON "TopicSelectionNeedCandidate"("evidenceMapId");
CREATE INDEX "TopicSelectionNeedCandidate_decisionStatus_idx"
  ON "TopicSelectionNeedCandidate"("decisionStatus");
CREATE INDEX "TopicSelectionNeedCandidate_reviewStatus_idx"
  ON "TopicSelectionNeedCandidate"("reviewStatus");
CREATE INDEX "TopicSelectionNeedCandidate_freshnessStatus_idx"
  ON "TopicSelectionNeedCandidate"("freshnessStatus");
CREATE INDEX "TopicSelectionNeedCandidate_searchRunId_idx"
  ON "TopicSelectionNeedCandidate"("searchRunId");
CREATE INDEX "TopicSelectionNeedCandidate_searchPlanId_idx"
  ON "TopicSelectionNeedCandidate"("searchPlanId");
CREATE INDEX "TopicSelectionNeedCandidate_literatureSnapshotId_idx"
  ON "TopicSelectionNeedCandidate"("literatureSnapshotId");
CREATE INDEX "TopicSelectionNeedCandidate_resultAdjudicationId_idx"
  ON "TopicSelectionNeedCandidate"("resultAdjudicationId");
CREATE INDEX "TopicSelectionNeedCandidate_resultValidatedNeedId_idx"
  ON "TopicSelectionNeedCandidate"("resultValidatedNeedId");
CREATE INDEX "TopicSelectionNeedCandidate_mergedIntoNeedCandidateId_idx"
  ON "TopicSelectionNeedCandidate"("mergedIntoNeedCandidateId");
CREATE INDEX "TopicSelectionNeedCandidate_inputSnapshotId_idx"
  ON "TopicSelectionNeedCandidate"("inputSnapshotId");
CREATE INDEX "TopicSelectionNeedCandidate_workflowRunId_idx"
  ON "TopicSelectionNeedCandidate"("workflowRunId");

CREATE INDEX "TopicSelectionNeedCandidateReadinessAssessment_titleCardId_createdAt_idx"
  ON "TopicSelectionNeedCandidateReadinessAssessment"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionNeedCandidateReadinessAssessment_needCandidateId_createdAt_idx"
  ON "TopicSelectionNeedCandidateReadinessAssessment"("needCandidateId", "createdAt" DESC);
CREATE INDEX "TopicSelectionNeedCandidateReadinessAssessment_evidenceMapId_idx"
  ON "TopicSelectionNeedCandidateReadinessAssessment"("evidenceMapId");
CREATE INDEX "TopicSelectionNeedCandidateReadinessAssessment_recommendation_idx"
  ON "TopicSelectionNeedCandidateReadinessAssessment"("recommendation");
CREATE INDEX "TopicSelectionNeedCandidateReadinessAssessment_strengthAssessmentId_idx"
  ON "TopicSelectionNeedCandidateReadinessAssessment"("strengthAssessmentId");
CREATE INDEX "TopicSelectionNeedCandidateReadinessAssessment_gateResultId_idx"
  ON "TopicSelectionNeedCandidateReadinessAssessment"("gateResultId");
CREATE INDEX "TopicSelectionNeedCandidateReadinessAssessment_workflowRunId_idx"
  ON "TopicSelectionNeedCandidateReadinessAssessment"("workflowRunId");
CREATE INDEX "TopicSelectionNeedCandidateReadinessAssessment_policyVersionId_idx"
  ON "TopicSelectionNeedCandidateReadinessAssessment"("policyVersionId");

CREATE INDEX "TopicSelectionValidationDecisionSupportPacket_titleCardId_createdAt_idx"
  ON "TopicSelectionValidationDecisionSupportPacket"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionValidationDecisionSupportPacket_needCandidateId_idx"
  ON "TopicSelectionValidationDecisionSupportPacket"("needCandidateId");
CREATE INDEX "TopicSelectionValidationDecisionSupportPacket_evidenceMapId_idx"
  ON "TopicSelectionValidationDecisionSupportPacket"("evidenceMapId");
CREATE INDEX "TopicSelectionValidationDecisionSupportPacket_readinessAssessmentId_idx"
  ON "TopicSelectionValidationDecisionSupportPacket"("readinessAssessmentId");
CREATE INDEX "TopicSelectionValidationDecisionSupportPacket_packetStatus_idx"
  ON "TopicSelectionValidationDecisionSupportPacket"("packetStatus");
CREATE INDEX "TopicSelectionValidationDecisionSupportPacket_searchRunId_idx"
  ON "TopicSelectionValidationDecisionSupportPacket"("searchRunId");
CREATE INDEX "TopicSelectionValidationDecisionSupportPacket_searchPlanId_idx"
  ON "TopicSelectionValidationDecisionSupportPacket"("searchPlanId");
CREATE INDEX "TopicSelectionValidationDecisionSupportPacket_literatureSnapshotId_idx"
  ON "TopicSelectionValidationDecisionSupportPacket"("literatureSnapshotId");
CREATE INDEX "TopicSelectionValidationDecisionSupportPacket_workflowRunId_idx"
  ON "TopicSelectionValidationDecisionSupportPacket"("workflowRunId");

CREATE INDEX "TopicSelectionValidateNeedAdjudicationResult_titleCardId_createdAt_idx"
  ON "TopicSelectionValidateNeedAdjudicationResult"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionValidateNeedAdjudicationResult_needCandidateId_idx"
  ON "TopicSelectionValidateNeedAdjudicationResult"("needCandidateId");
CREATE INDEX "TopicSelectionValidateNeedAdjudicationResult_supportPacketId_idx"
  ON "TopicSelectionValidateNeedAdjudicationResult"("supportPacketId");
CREATE INDEX "TopicSelectionValidateNeedAdjudicationResult_finalDecision_idx"
  ON "TopicSelectionValidateNeedAdjudicationResult"("finalDecision");
CREATE INDEX "TopicSelectionValidateNeedAdjudicationResult_outputValidatedNeedId_idx"
  ON "TopicSelectionValidateNeedAdjudicationResult"("outputValidatedNeedId");
CREATE INDEX "TopicSelectionValidateNeedAdjudicationResult_humanDecisionId_idx"
  ON "TopicSelectionValidateNeedAdjudicationResult"("humanDecisionId");
CREATE INDEX "TopicSelectionValidateNeedAdjudicationResult_mergeTargetNeedCandidateId_idx"
  ON "TopicSelectionValidateNeedAdjudicationResult"("mergeTargetNeedCandidateId");
CREATE INDEX "TopicSelectionValidateNeedAdjudicationResult_outputSearchplanRecheckRequestId_idx"
  ON "TopicSelectionValidateNeedAdjudicationResult"("outputSearchplanRecheckRequestId");
CREATE INDEX "TopicSelectionValidateNeedAdjudicationResult_outputMemorySuggestionId_idx"
  ON "TopicSelectionValidateNeedAdjudicationResult"("outputMemorySuggestionId");
CREATE INDEX "TopicSelectionValidateNeedAdjudicationResult_workflowRunId_idx"
  ON "TopicSelectionValidateNeedAdjudicationResult"("workflowRunId");

CREATE INDEX "TopicSelectionValidatedNeed_titleCardId_createdAt_idx"
  ON "TopicSelectionValidatedNeed"("titleCardId", "createdAt" DESC);
CREATE UNIQUE INDEX "TopicSelectionValidatedNeed_sourceNeedCandidateId_key"
  ON "TopicSelectionValidatedNeed"("sourceNeedCandidateId");
CREATE INDEX "TopicSelectionValidatedNeed_adjudicationResultId_idx"
  ON "TopicSelectionValidatedNeed"("adjudicationResultId");
CREATE INDEX "TopicSelectionValidatedNeed_supportPacketId_idx"
  ON "TopicSelectionValidatedNeed"("supportPacketId");
CREATE INDEX "TopicSelectionValidatedNeed_humanDecisionId_idx"
  ON "TopicSelectionValidatedNeed"("humanDecisionId");
CREATE INDEX "TopicSelectionValidatedNeed_evidenceMapId_idx"
  ON "TopicSelectionValidatedNeed"("evidenceMapId");
CREATE INDEX "TopicSelectionValidatedNeed_searchRunId_idx"
  ON "TopicSelectionValidatedNeed"("searchRunId");
CREATE INDEX "TopicSelectionValidatedNeed_searchPlanId_idx"
  ON "TopicSelectionValidatedNeed"("searchPlanId");
CREATE INDEX "TopicSelectionValidatedNeed_literatureSnapshotId_idx"
  ON "TopicSelectionValidatedNeed"("literatureSnapshotId");

CREATE INDEX "TopicSelectionCandidateDecisionMemorySuggestion_titleCardId_createdAt_idx"
  ON "TopicSelectionCandidateDecisionMemorySuggestion"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionCandidateDecisionMemorySuggestion_sourceNeedCandidateId_idx"
  ON "TopicSelectionCandidateDecisionMemorySuggestion"("sourceNeedCandidateId");
CREATE INDEX "TopicSelectionCandidateDecisionMemorySuggestion_adjudicationResultId_idx"
  ON "TopicSelectionCandidateDecisionMemorySuggestion"("adjudicationResultId");
CREATE INDEX "TopicSelectionCandidateDecisionMemorySuggestion_suggestionType_idx"
  ON "TopicSelectionCandidateDecisionMemorySuggestion"("suggestionType");
CREATE INDEX "TopicSelectionCandidateDecisionMemorySuggestion_status_idx"
  ON "TopicSelectionCandidateDecisionMemorySuggestion"("status");
CREATE INDEX "TopicSelectionCandidateDecisionMemorySuggestion_targetRefType_targetRefId_idx"
  ON "TopicSelectionCandidateDecisionMemorySuggestion"("targetRefType", "targetRefId");
CREATE INDEX "TopicSelectionCandidateDecisionMemorySuggestion_policyVersionId_idx"
  ON "TopicSelectionCandidateDecisionMemorySuggestion"("policyVersionId");

CREATE UNIQUE INDEX "TopicSelectionV1aToV1bInputBundle_validatedNeedId_bundleVersion_key"
  ON "TopicSelectionV1aToV1bInputBundle"("validatedNeedId", "bundleVersion");
CREATE INDEX "TopicSelectionV1aToV1bInputBundle_titleCardId_createdAt_idx"
  ON "TopicSelectionV1aToV1bInputBundle"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionV1aToV1bInputBundle_validatedNeedId_idx"
  ON "TopicSelectionV1aToV1bInputBundle"("validatedNeedId");
CREATE INDEX "TopicSelectionV1aToV1bInputBundle_sourceNeedCandidateId_idx"
  ON "TopicSelectionV1aToV1bInputBundle"("sourceNeedCandidateId");
CREATE INDEX "TopicSelectionV1aToV1bInputBundle_adjudicationResultId_idx"
  ON "TopicSelectionV1aToV1bInputBundle"("adjudicationResultId");
CREATE INDEX "TopicSelectionV1aToV1bInputBundle_supportPacketId_idx"
  ON "TopicSelectionV1aToV1bInputBundle"("supportPacketId");
CREATE INDEX "TopicSelectionV1aToV1bInputBundle_evidenceMapId_idx"
  ON "TopicSelectionV1aToV1bInputBundle"("evidenceMapId");
CREATE INDEX "TopicSelectionV1aToV1bInputBundle_searchRunId_idx"
  ON "TopicSelectionV1aToV1bInputBundle"("searchRunId");
CREATE INDEX "TopicSelectionV1aToV1bInputBundle_searchPlanId_idx"
  ON "TopicSelectionV1aToV1bInputBundle"("searchPlanId");
CREATE INDEX "TopicSelectionV1aToV1bInputBundle_literatureSnapshotId_idx"
  ON "TopicSelectionV1aToV1bInputBundle"("literatureSnapshotId");
