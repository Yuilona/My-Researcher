-- Add durable fulltext acquisition jobs and per-source runtime state for T-041.

CREATE TABLE "LiteratureFulltextAcquisitionJob" (
  "id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "workset" JSONB NOT NULL DEFAULT '{}',
  "options" JSONB NOT NULL DEFAULT '{}',
  "dryRunEstimate" JSONB NOT NULL DEFAULT '{}',
  "totals" JSONB NOT NULL DEFAULT '{}',
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "startedAt" TIMESTAMPTZ(6),
  "pausedAt" TIMESTAMPTZ(6),
  "canceledAt" TIMESTAMPTZ(6),
  "finishedAt" TIMESTAMPTZ(6),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "LiteratureFulltextAcquisitionJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LiteratureFulltextAcquisitionItem" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "literatureId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "selectedSourceKind" TEXT,
  "sourceUrl" TEXT,
  "finalUrl" TEXT,
  "contentAssetId" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "blockerCode" TEXT,
  "retryable" BOOLEAN NOT NULL DEFAULT true,
  "resolutionCandidates" JSONB NOT NULL DEFAULT '[]',
  "checkpoint" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "startedAt" TIMESTAMPTZ(6),
  "finishedAt" TIMESTAMPTZ(6),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "LiteratureFulltextAcquisitionItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LiteratureSourceRuntimeState" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "cooldownUntil" TIMESTAMPTZ(6),
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  "lastErrorCode" TEXT,
  "lastErrorMessage" TEXT,
  "lastRequestAt" TIMESTAMPTZ(6),
  "lastSuccessAt" TIMESTAMPTZ(6),
  "lastFailureAt" TIMESTAMPTZ(6),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "LiteratureSourceRuntimeState_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LiteratureFulltextAcquisitionJob_status_createdAt_idx"
  ON "LiteratureFulltextAcquisitionJob"("status", "createdAt");
CREATE INDEX "LiteratureFulltextAcquisitionJob_updatedAt_idx"
  ON "LiteratureFulltextAcquisitionJob"("updatedAt");
CREATE INDEX "LiteratureFulltextAcquisitionItem_jobId_status_idx"
  ON "LiteratureFulltextAcquisitionItem"("jobId", "status");
CREATE INDEX "LiteratureFulltextAcquisitionItem_literatureId_status_idx"
  ON "LiteratureFulltextAcquisitionItem"("literatureId", "status");
CREATE INDEX "LiteratureFulltextAcquisitionItem_contentAssetId_idx"
  ON "LiteratureFulltextAcquisitionItem"("contentAssetId");
CREATE INDEX "LiteratureFulltextAcquisitionItem_updatedAt_idx"
  ON "LiteratureFulltextAcquisitionItem"("updatedAt");
CREATE UNIQUE INDEX "LiteratureSourceRuntimeState_source_key"
  ON "LiteratureSourceRuntimeState"("source");
CREATE INDEX "LiteratureSourceRuntimeState_status_cooldownUntil_idx"
  ON "LiteratureSourceRuntimeState"("status", "cooldownUntil");
CREATE INDEX "LiteratureSourceRuntimeState_updatedAt_idx"
  ON "LiteratureSourceRuntimeState"("updatedAt");

ALTER TABLE "LiteratureFulltextAcquisitionItem"
  ADD CONSTRAINT "LiteratureFulltextAcquisitionItem_jobId_fkey"
  FOREIGN KEY ("jobId")
  REFERENCES "LiteratureFulltextAcquisitionJob"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LiteratureFulltextAcquisitionItem"
  ADD CONSTRAINT "LiteratureFulltextAcquisitionItem_literatureId_fkey"
  FOREIGN KEY ("literatureId")
  REFERENCES "LiteratureRecord"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LiteratureFulltextAcquisitionItem"
  ADD CONSTRAINT "LiteratureFulltextAcquisitionItem_contentAssetId_fkey"
  FOREIGN KEY ("contentAssetId")
  REFERENCES "LiteratureContentAsset"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
