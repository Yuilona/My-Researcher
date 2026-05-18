CREATE TABLE "ExperimentFoundationRecord" (
    "id" TEXT NOT NULL,
    "recordKind" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "recordHash" TEXT,
    "status" TEXT,
    "family" TEXT,
    "parentRecordKind" TEXT,
    "parentRecordId" TEXT,
    "ownerRefType" TEXT,
    "ownerRefId" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "sourceRefs" JSONB NOT NULL DEFAULT '[]',
    "traceabilityRefs" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ExperimentFoundationRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExperimentFoundationReadinessReport" (
    "id" TEXT NOT NULL,
    "targetKind" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "readinessStatus" TEXT NOT NULL,
    "readinessHash" TEXT NOT NULL,
    "blockers" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "requiredActions" JSONB NOT NULL DEFAULT '[]',
    "sourceRefs" JSONB NOT NULL DEFAULT '[]',
    "checkedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ExperimentFoundationReadinessReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExperimentFoundationRecord_recordKind_recordId_key" ON "ExperimentFoundationRecord"("recordKind", "recordId");
CREATE INDEX "ExperimentFoundationRecord_recordKind_status_idx" ON "ExperimentFoundationRecord"("recordKind", "status");
CREATE INDEX "ExperimentFoundationRecord_recordKind_recordHash_idx" ON "ExperimentFoundationRecord"("recordKind", "recordHash");
CREATE INDEX "ExperimentFoundationRecord_parentRecordKind_parentRecordId_idx" ON "ExperimentFoundationRecord"("parentRecordKind", "parentRecordId");
CREATE INDEX "ExperimentFoundationRecord_ownerRefType_ownerRefId_idx" ON "ExperimentFoundationRecord"("ownerRefType", "ownerRefId");
CREATE INDEX "ExperimentFoundationRecord_updatedAt_idx" ON "ExperimentFoundationRecord"("updatedAt" DESC);
CREATE INDEX "ExperimentFoundationReadinessReport_targetKind_targetId_createdAt_idx" ON "ExperimentFoundationReadinessReport"("targetKind", "targetId", "createdAt" DESC);
CREATE INDEX "ExperimentFoundationReadinessReport_readinessStatus_idx" ON "ExperimentFoundationReadinessReport"("readinessStatus");
CREATE INDEX "ExperimentFoundationReadinessReport_readinessHash_idx" ON "ExperimentFoundationReadinessReport"("readinessHash");
