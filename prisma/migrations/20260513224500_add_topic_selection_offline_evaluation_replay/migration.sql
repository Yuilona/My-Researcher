-- Add topic-selection v1a offline evaluation/replay records.
-- These records store frozen replay inputs, observed outputs, metrics, and
-- diffs without mutating production topic-selection authority objects.

CREATE TABLE "TopicSelectionOfflineEvaluationDataset" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "datasetKey" TEXT NOT NULL,
  "datasetVersion" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "description" TEXT,
  "caseCount" INTEGER NOT NULL DEFAULT 0,
  "caseTypeCoverage" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "payload" JSONB NOT NULL DEFAULT '{}',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionOfflineEvaluationDataset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionOfflineEvaluationCase" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "datasetId" TEXT NOT NULL,
  "titleCardId" TEXT,
  "caseKey" TEXT NOT NULL,
  "caseType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "frozenInputBundle" JSONB NOT NULL DEFAULT '{}',
  "goldExpectation" JSONB NOT NULL DEFAULT '{}',
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionOfflineEvaluationCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionOfflineEvaluationRun" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "datasetId" TEXT NOT NULL,
  "runKey" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "workflowProfileKey" TEXT NOT NULL,
  "workflowProfileVersion" TEXT,
  "modelProfileKey" TEXT,
  "searchProfileKey" TEXT,
  "policyVersionId" TEXT,
  "metricKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "caseCount" INTEGER NOT NULL DEFAULT 0,
  "runPayload" JSONB NOT NULL DEFAULT '{}',
  "createdBy" TEXT NOT NULL,
  "startedAt" TIMESTAMPTZ(6) NOT NULL,
  "finishedAt" TIMESTAMPTZ(6),

  CONSTRAINT "TopicSelectionOfflineEvaluationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionOfflineEvaluationCaseResult" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "runId" TEXT NOT NULL,
  "datasetId" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "caseType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "observedOutput" JSONB NOT NULL DEFAULT '{}',
  "replayDiffRef" JSONB,
  "metricContributionPayload" JSONB NOT NULL DEFAULT '{}',
  "failureExamples" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionOfflineEvaluationCaseResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionOfflineEvaluationMetricResult" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "runId" TEXT NOT NULL,
  "datasetId" TEXT NOT NULL,
  "metricKey" TEXT NOT NULL,
  "numerator" DOUBLE PRECISION NOT NULL,
  "denominator" DOUBLE PRECISION NOT NULL,
  "value" DOUBLE PRECISION,
  "contributingCaseRefs" JSONB NOT NULL DEFAULT '[]',
  "failureCaseRefs" JSONB NOT NULL DEFAULT '[]',
  "notes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "metricPayload" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionOfflineEvaluationMetricResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionReplayDiff" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "runId" TEXT NOT NULL,
  "datasetId" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "changedDimensions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "finalDecisionChanged" BOOLEAN NOT NULL DEFAULT false,
  "keyEvidenceSetChanged" BOOLEAN NOT NULL DEFAULT false,
  "blockerSetChanged" BOOLEAN NOT NULL DEFAULT false,
  "traceVerdictChanged" BOOLEAN NOT NULL DEFAULT false,
  "expectedSnapshot" JSONB NOT NULL DEFAULT '{}',
  "observedSnapshot" JSONB NOT NULL DEFAULT '{}',
  "baselineSnapshot" JSONB,
  "diffPayload" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionReplayDiff_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TopicSelectionOfflineEvaluationDataset_datasetKey_datasetVersion_idx"
  ON "TopicSelectionOfflineEvaluationDataset"("datasetKey", "datasetVersion");
CREATE INDEX "TopicSelectionOfflineEvaluationDataset_stage_status_idx"
  ON "TopicSelectionOfflineEvaluationDataset"("stage", "status");
CREATE INDEX "TopicSelectionOfflineEvaluationDataset_source_status_idx"
  ON "TopicSelectionOfflineEvaluationDataset"("source", "status");
CREATE INDEX "TopicSelectionOfflineEvaluationDataset_createdAt_idx"
  ON "TopicSelectionOfflineEvaluationDataset"("createdAt" DESC);

CREATE UNIQUE INDEX "TopicSelectionOfflineEvaluationCase_datasetId_caseKey_key"
  ON "TopicSelectionOfflineEvaluationCase"("datasetId", "caseKey");
CREATE INDEX "TopicSelectionOfflineEvaluationCase_datasetId_caseType_idx"
  ON "TopicSelectionOfflineEvaluationCase"("datasetId", "caseType");
CREATE INDEX "TopicSelectionOfflineEvaluationCase_titleCardId_idx"
  ON "TopicSelectionOfflineEvaluationCase"("titleCardId");
CREATE INDEX "TopicSelectionOfflineEvaluationCase_caseType_status_idx"
  ON "TopicSelectionOfflineEvaluationCase"("caseType", "status");
CREATE INDEX "TopicSelectionOfflineEvaluationCase_createdAt_idx"
  ON "TopicSelectionOfflineEvaluationCase"("createdAt" DESC);

CREATE INDEX "TopicSelectionOfflineEvaluationRun_datasetId_startedAt_idx"
  ON "TopicSelectionOfflineEvaluationRun"("datasetId", "startedAt" DESC);
CREATE INDEX "TopicSelectionOfflineEvaluationRun_runKey_idx"
  ON "TopicSelectionOfflineEvaluationRun"("runKey");
CREATE INDEX "TopicSelectionOfflineEvaluationRun_status_startedAt_idx"
  ON "TopicSelectionOfflineEvaluationRun"("status", "startedAt" DESC);
CREATE INDEX "TopicSelectionOfflineEvaluationRun_workflowProfileKey_idx"
  ON "TopicSelectionOfflineEvaluationRun"("workflowProfileKey");
CREATE INDEX "TopicSelectionOfflineEvaluationRun_policyVersionId_idx"
  ON "TopicSelectionOfflineEvaluationRun"("policyVersionId");

CREATE INDEX "TopicSelectionOfflineEvaluationCaseResult_runId_createdAt_idx"
  ON "TopicSelectionOfflineEvaluationCaseResult"("runId", "createdAt");
CREATE UNIQUE INDEX "TopicSelectionOfflineEvaluationCaseResult_runId_caseId_key"
  ON "TopicSelectionOfflineEvaluationCaseResult"("runId", "caseId");
CREATE INDEX "TopicSelectionOfflineEvaluationCaseResult_datasetId_caseType_idx"
  ON "TopicSelectionOfflineEvaluationCaseResult"("datasetId", "caseType");
CREATE INDEX "TopicSelectionOfflineEvaluationCaseResult_caseId_idx"
  ON "TopicSelectionOfflineEvaluationCaseResult"("caseId");
CREATE INDEX "TopicSelectionOfflineEvaluationCaseResult_status_idx"
  ON "TopicSelectionOfflineEvaluationCaseResult"("status");

CREATE UNIQUE INDEX "TopicSelectionOfflineEvaluationMetricResult_runId_metricKey_key"
  ON "TopicSelectionOfflineEvaluationMetricResult"("runId", "metricKey");
CREATE INDEX "TopicSelectionOfflineEvaluationMetricResult_datasetId_metricKey_idx"
  ON "TopicSelectionOfflineEvaluationMetricResult"("datasetId", "metricKey");
CREATE INDEX "TopicSelectionOfflineEvaluationMetricResult_createdAt_idx"
  ON "TopicSelectionOfflineEvaluationMetricResult"("createdAt" DESC);

CREATE INDEX "TopicSelectionReplayDiff_runId_createdAt_idx"
  ON "TopicSelectionReplayDiff"("runId", "createdAt");
CREATE INDEX "TopicSelectionReplayDiff_datasetId_status_idx"
  ON "TopicSelectionReplayDiff"("datasetId", "status");
CREATE INDEX "TopicSelectionReplayDiff_caseId_idx"
  ON "TopicSelectionReplayDiff"("caseId");
CREATE INDEX "TopicSelectionReplayDiff_status_idx"
  ON "TopicSelectionReplayDiff"("status");
