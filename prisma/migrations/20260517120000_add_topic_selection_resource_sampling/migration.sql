CREATE TABLE "TopicSelectionResourceSampleSet" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "topicId" TEXT NOT NULL,
  "sampleSize" INTEGER NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "roleTargets" JSONB NOT NULL DEFAULT '{}',
  "roleCounts" JSONB NOT NULL DEFAULT '{}',
  "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sampleHash" TEXT NOT NULL,
  "model" JSONB NOT NULL DEFAULT '{}',
  "inputSnapshotId" TEXT,
  "workflowRunId" TEXT,
  "gateResultId" TEXT,
  "auditRef" JSONB,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionResourceSampleSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionResourceSampleItem" (
  "id" TEXT NOT NULL,
  "sampleSetId" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "topicId" TEXT NOT NULL,
  "literatureId" TEXT NOT NULL,
  "literatureRef" JSONB NOT NULL DEFAULT '{}',
  "selectedRole" TEXT NOT NULL,
  "selected" BOOLEAN NOT NULL DEFAULT false,
  "rank" INTEGER NOT NULL,
  "topicRelevance" DOUBLE PRECISION NOT NULL,
  "evidencePolarity" TEXT NOT NULL,
  "roleScores" JSONB NOT NULL DEFAULT '{}',
  "confidence" DOUBLE PRECISION NOT NULL,
  "classificationRationale" TEXT NOT NULL,
  "exclusionReason" TEXT,
  "reviewReason" TEXT,
  "guardrailCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "methodFamilies" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionResourceSampleItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionResourceSamplingAudit" (
  "id" TEXT NOT NULL,
  "sampleSetId" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "topicId" TEXT NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "promptTemplateId" TEXT,
  "promptTemplateVersion" TEXT,
  "model" JSONB NOT NULL DEFAULT '{}',
  "candidateCount" INTEGER NOT NULL,
  "eligibleCount" INTEGER NOT NULL,
  "selectedCount" INTEGER NOT NULL,
  "excludedCount" INTEGER NOT NULL,
  "warningCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "guardrailSummary" JSONB NOT NULL DEFAULT '{}',
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "llmStructuredOutput" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionResourceSamplingAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tsrss_topic_created_idx"
  ON "TopicSelectionResourceSampleSet"("topicId", "createdAt" DESC);

CREATE INDEX "tsrss_title_created_idx"
  ON "TopicSelectionResourceSampleSet"("titleCardId", "createdAt" DESC);

CREATE INDEX "tsrss_status_idx"
  ON "TopicSelectionResourceSampleSet"("status");

CREATE INDEX "tsrss_sample_hash_idx"
  ON "TopicSelectionResourceSampleSet"("sampleHash");

CREATE INDEX "tsrsi_sample_selected_rank_idx"
  ON "TopicSelectionResourceSampleItem"("sampleSetId", "selected", "rank");

CREATE INDEX "tsrsi_topic_role_idx"
  ON "TopicSelectionResourceSampleItem"("topicId", "selectedRole");

CREATE INDEX "tsrsi_literature_idx"
  ON "TopicSelectionResourceSampleItem"("literatureId");

CREATE INDEX "tsrsa_sample_set_idx"
  ON "TopicSelectionResourceSamplingAudit"("sampleSetId");

CREATE INDEX "tsrsa_topic_created_idx"
  ON "TopicSelectionResourceSamplingAudit"("topicId", "createdAt" DESC);

ALTER TABLE "TopicSelectionResourceSampleItem"
  ADD CONSTRAINT "TopicSelectionResourceSampleItem_sampleSetId_fkey"
  FOREIGN KEY ("sampleSetId") REFERENCES "TopicSelectionResourceSampleSet"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TopicSelectionResourceSamplingAudit"
  ADD CONSTRAINT "TopicSelectionResourceSamplingAudit_sampleSetId_fkey"
  FOREIGN KEY ("sampleSetId") REFERENCES "TopicSelectionResourceSampleSet"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
