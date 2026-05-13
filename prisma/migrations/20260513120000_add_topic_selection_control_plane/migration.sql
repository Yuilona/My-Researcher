-- Add dedicated topic-selection v1a control-plane authority records.
-- These tables intentionally keep title-card references as queryable text refs,
-- not foreign keys, so the control plane cannot mutate legacy title-card state.

CREATE TABLE "TopicSelectionContextPolicyVersion" (
  "id" TEXT NOT NULL,
  "policyKey" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "retiredAt" TIMESTAMPTZ(6),

  CONSTRAINT "TopicSelectionContextPolicyVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionWorkflowProfilePolicy" (
  "id" TEXT NOT NULL,
  "profileKey" TEXT NOT NULL,
  "workflowKey" TEXT NOT NULL,
  "policyVersionId" TEXT,
  "status" TEXT NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "retiredAt" TIMESTAMPTZ(6),

  CONSTRAINT "TopicSelectionWorkflowProfilePolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTransitionPolicyVersion" (
  "id" TEXT NOT NULL,
  "transitionKey" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "retiredAt" TIMESTAMPTZ(6),

  CONSTRAINT "TopicSelectionTransitionPolicyVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionInputSnapshot" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "contextPolicyVersionId" TEXT,
  "policyVersion" TEXT,
  "snapshotHash" TEXT NOT NULL,
  "sourceRefs" JSONB NOT NULL DEFAULT '[]',
  "permissionRefs" JSONB NOT NULL DEFAULT '[]',
  "payload" JSONB NOT NULL DEFAULT '{}',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionInputSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionArtifactRef" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "artifactKind" TEXT NOT NULL,
  "storageKind" TEXT NOT NULL,
  "uri" TEXT,
  "payload" JSONB,
  "checksum" TEXT,
  "byteSize" INTEGER,
  "mimeType" TEXT,
  "workflowRunId" TEXT,
  "inputSnapshotId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionArtifactRef_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionLlmWorkflowRun" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "workflowKey" TEXT NOT NULL,
  "workflowProfileKey" TEXT NOT NULL,
  "workflowProfileVersion" TEXT,
  "inputSnapshotId" TEXT,
  "status" TEXT NOT NULL,
  "providerId" TEXT,
  "modelId" TEXT,
  "promptTemplateId" TEXT,
  "promptTemplateVersion" TEXT,
  "startedAt" TIMESTAMPTZ(6) NOT NULL,
  "finishedAt" TIMESTAMPTZ(6),
  "telemetry" JSONB NOT NULL DEFAULT '{}',
  "outputSummary" JSONB NOT NULL DEFAULT '{}',
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "createdBy" TEXT NOT NULL,

  CONSTRAINT "TopicSelectionLlmWorkflowRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionQualitySignal" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "stage" TEXT NOT NULL,
  "checkType" TEXT NOT NULL,
  "verdict" TEXT NOT NULL,
  "issueCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "recommendedAction" TEXT,
  "blockingTransitionKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "refs" JSONB NOT NULL DEFAULT '[]',
  "confidence" DOUBLE PRECISION,
  "workflowRunId" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "emittedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionQualitySignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionReadinessGateResult" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "gateKey" TEXT NOT NULL,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "policyVersionId" TEXT,
  "verdict" TEXT NOT NULL,
  "blockers" JSONB NOT NULL DEFAULT '[]',
  "warnings" JSONB NOT NULL DEFAULT '[]',
  "requiredActions" JSONB NOT NULL DEFAULT '[]',
  "loopbackTarget" JSONB,
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "qualitySignalRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionReadinessGateResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionChainTransitionAttempt" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "transitionKey" TEXT NOT NULL,
  "sourceRefType" TEXT NOT NULL,
  "sourceRefId" TEXT NOT NULL,
  "sourceVersionId" TEXT,
  "targetRefType" TEXT,
  "targetRefId" TEXT,
  "targetVersionId" TEXT,
  "gateResultId" TEXT,
  "workflowRunId" TEXT,
  "inputSnapshotId" TEXT,
  "policyVersionId" TEXT,
  "actorType" TEXT NOT NULL,
  "actorId" TEXT,
  "result" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "requiredActions" JSONB NOT NULL DEFAULT '[]',
  "blockers" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "stateWriteIntents" JSONB NOT NULL DEFAULT '[]',
  "createdAuthorityRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionChainTransitionAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionFunctionalLineageLink" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "sourceRefType" TEXT NOT NULL,
  "sourceRefId" TEXT NOT NULL,
  "sourceVersionId" TEXT,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "relationType" TEXT NOT NULL,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionFunctionalLineageLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionTraceSnapshot" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "snapshotHash" TEXT NOT NULL,
  "objectRefs" JSONB NOT NULL DEFAULT '[]',
  "lineageLinkRefs" JSONB NOT NULL DEFAULT '[]',
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "qualitySignalRefs" JSONB NOT NULL DEFAULT '[]',
  "transitionAttemptRefs" JSONB NOT NULL DEFAULT '[]',
  "payload" JSONB NOT NULL DEFAULT '{}',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionTraceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionHumanConfirmedDecision" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "decisionType" TEXT NOT NULL,
  "actorType" TEXT NOT NULL,
  "actorId" TEXT,
  "rationale" TEXT,
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "policyVersionId" TEXT,
  "resultingAuthorityRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionHumanConfirmedDecision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TopicSelectionContextPolicyVersion_policyKey_version_key"
  ON "TopicSelectionContextPolicyVersion"("policyKey", "version");
CREATE INDEX "TopicSelectionContextPolicyVersion_policyKey_status_idx"
  ON "TopicSelectionContextPolicyVersion"("policyKey", "status");

CREATE UNIQUE INDEX "TopicSelectionWorkflowProfilePolicy_profileKey_workflowKey_policyVersionId_key"
  ON "TopicSelectionWorkflowProfilePolicy"("profileKey", "workflowKey", "policyVersionId");
CREATE INDEX "TopicSelectionWorkflowProfilePolicy_workflowKey_status_idx"
  ON "TopicSelectionWorkflowProfilePolicy"("workflowKey", "status");
CREATE INDEX "TopicSelectionWorkflowProfilePolicy_policyVersionId_idx"
  ON "TopicSelectionWorkflowProfilePolicy"("policyVersionId");

CREATE UNIQUE INDEX "TopicSelectionTransitionPolicyVersion_transitionKey_version_key"
  ON "TopicSelectionTransitionPolicyVersion"("transitionKey", "version");
CREATE INDEX "TopicSelectionTransitionPolicyVersion_transitionKey_status_idx"
  ON "TopicSelectionTransitionPolicyVersion"("transitionKey", "status");

CREATE INDEX "TopicSelectionInputSnapshot_titleCardId_createdAt_idx"
  ON "TopicSelectionInputSnapshot"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionInputSnapshot_targetRefType_targetRefId_idx"
  ON "TopicSelectionInputSnapshot"("targetRefType", "targetRefId");
CREATE INDEX "TopicSelectionInputSnapshot_contextPolicyVersionId_idx"
  ON "TopicSelectionInputSnapshot"("contextPolicyVersionId");
CREATE INDEX "TopicSelectionInputSnapshot_snapshotHash_idx"
  ON "TopicSelectionInputSnapshot"("snapshotHash");

CREATE INDEX "TopicSelectionArtifactRef_titleCardId_createdAt_idx"
  ON "TopicSelectionArtifactRef"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionArtifactRef_artifactKind_idx"
  ON "TopicSelectionArtifactRef"("artifactKind");
CREATE INDEX "TopicSelectionArtifactRef_workflowRunId_idx"
  ON "TopicSelectionArtifactRef"("workflowRunId");
CREATE INDEX "TopicSelectionArtifactRef_inputSnapshotId_idx"
  ON "TopicSelectionArtifactRef"("inputSnapshotId");
CREATE INDEX "TopicSelectionArtifactRef_checksum_idx"
  ON "TopicSelectionArtifactRef"("checksum");

CREATE INDEX "TopicSelectionLlmWorkflowRun_titleCardId_startedAt_idx"
  ON "TopicSelectionLlmWorkflowRun"("titleCardId", "startedAt" DESC);
CREATE INDEX "TopicSelectionLlmWorkflowRun_workflowKey_status_idx"
  ON "TopicSelectionLlmWorkflowRun"("workflowKey", "status");
CREATE INDEX "TopicSelectionLlmWorkflowRun_inputSnapshotId_idx"
  ON "TopicSelectionLlmWorkflowRun"("inputSnapshotId");
CREATE INDEX "TopicSelectionLlmWorkflowRun_status_idx"
  ON "TopicSelectionLlmWorkflowRun"("status");

CREATE INDEX "TopicSelectionQualitySignal_titleCardId_createdAt_idx"
  ON "TopicSelectionQualitySignal"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionQualitySignal_targetRefType_targetRefId_idx"
  ON "TopicSelectionQualitySignal"("targetRefType", "targetRefId");
CREATE INDEX "TopicSelectionQualitySignal_stage_verdict_idx"
  ON "TopicSelectionQualitySignal"("stage", "verdict");
CREATE INDEX "TopicSelectionQualitySignal_workflowRunId_idx"
  ON "TopicSelectionQualitySignal"("workflowRunId");

CREATE INDEX "TopicSelectionReadinessGateResult_titleCardId_createdAt_idx"
  ON "TopicSelectionReadinessGateResult"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionReadinessGateResult_gateKey_verdict_idx"
  ON "TopicSelectionReadinessGateResult"("gateKey", "verdict");
CREATE INDEX "TopicSelectionReadinessGateResult_targetRefType_targetRefId_idx"
  ON "TopicSelectionReadinessGateResult"("targetRefType", "targetRefId");
CREATE INDEX "TopicSelectionReadinessGateResult_workflowRunId_idx"
  ON "TopicSelectionReadinessGateResult"("workflowRunId");

CREATE INDEX "TopicSelectionChainTransitionAttempt_titleCardId_createdAt_idx"
  ON "TopicSelectionChainTransitionAttempt"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionChainTransitionAttempt_transitionKey_result_idx"
  ON "TopicSelectionChainTransitionAttempt"("transitionKey", "result");
CREATE INDEX "TopicSelectionChainTransitionAttempt_sourceRefType_sourceRefId_idx"
  ON "TopicSelectionChainTransitionAttempt"("sourceRefType", "sourceRefId");
CREATE INDEX "TopicSelectionChainTransitionAttempt_targetRefType_targetRefId_idx"
  ON "TopicSelectionChainTransitionAttempt"("targetRefType", "targetRefId");
CREATE INDEX "TopicSelectionChainTransitionAttempt_gateResultId_idx"
  ON "TopicSelectionChainTransitionAttempt"("gateResultId");

CREATE INDEX "TopicSelectionFunctionalLineageLink_titleCardId_createdAt_idx"
  ON "TopicSelectionFunctionalLineageLink"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionFunctionalLineageLink_sourceRefType_sourceRefId_idx"
  ON "TopicSelectionFunctionalLineageLink"("sourceRefType", "sourceRefId");
CREATE INDEX "TopicSelectionFunctionalLineageLink_targetRefType_targetRefId_idx"
  ON "TopicSelectionFunctionalLineageLink"("targetRefType", "targetRefId");
CREATE INDEX "TopicSelectionFunctionalLineageLink_relationType_idx"
  ON "TopicSelectionFunctionalLineageLink"("relationType");

CREATE INDEX "TopicSelectionTraceSnapshot_titleCardId_createdAt_idx"
  ON "TopicSelectionTraceSnapshot"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionTraceSnapshot_targetRefType_targetRefId_idx"
  ON "TopicSelectionTraceSnapshot"("targetRefType", "targetRefId");
CREATE INDEX "TopicSelectionTraceSnapshot_snapshotHash_idx"
  ON "TopicSelectionTraceSnapshot"("snapshotHash");

CREATE INDEX "TopicSelectionHumanConfirmedDecision_titleCardId_createdAt_idx"
  ON "TopicSelectionHumanConfirmedDecision"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionHumanConfirmedDecision_targetRefType_targetRefId_idx"
  ON "TopicSelectionHumanConfirmedDecision"("targetRefType", "targetRefId");
CREATE INDEX "TopicSelectionHumanConfirmedDecision_decisionType_idx"
  ON "TopicSelectionHumanConfirmedDecision"("decisionType");
CREATE INDEX "TopicSelectionHumanConfirmedDecision_policyVersionId_idx"
  ON "TopicSelectionHumanConfirmedDecision"("policyVersionId");
