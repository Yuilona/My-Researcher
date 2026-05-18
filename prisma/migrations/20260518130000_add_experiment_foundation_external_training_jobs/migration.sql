CREATE TABLE "ExperimentFoundationExternalTrainingJob" (
    "id" TEXT NOT NULL,
    "externalJobId" TEXT NOT NULL,
    "trainingTaskSpecId" TEXT NOT NULL,
    "trainingTaskSpecHash" TEXT NOT NULL,
    "materializationResultId" TEXT NOT NULL,
    "materializationResultHash" TEXT NOT NULL,
    "adapterKind" TEXT NOT NULL,
    "adapterVersion" TEXT NOT NULL,
    "platformKind" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "externalJobRef" JSONB NOT NULL DEFAULT '{}',
    "externalJobHash" TEXT NOT NULL,
    "jobStatus" TEXT NOT NULL,
    "submittedAt" TIMESTAMPTZ(6) NOT NULL,
    "lastSyncedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "stageEventRefs" JSONB NOT NULL DEFAULT '[]',
    "partialResultRefs" JSONB NOT NULL DEFAULT '[]',
    "resultRefs" JSONB NOT NULL DEFAULT '[]',
    "adapterMetadataRefs" JSONB NOT NULL DEFAULT '[]',
    "adapterMetadataHashes" JSONB NOT NULL DEFAULT '[]',
    "traceabilityRefs" JSONB NOT NULL DEFAULT '[]',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ExperimentFoundationExternalTrainingJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExperimentFoundationExternalTrainingJob_externalJobId_key" ON "ExperimentFoundationExternalTrainingJob"("externalJobId");
CREATE UNIQUE INDEX "ExperimentFoundationExternalTrainingJob_idempotencyKey_key" ON "ExperimentFoundationExternalTrainingJob"("idempotencyKey");
CREATE INDEX "ExperimentFoundationExternalTrainingJob_trainingTaskSpecId_idx" ON "ExperimentFoundationExternalTrainingJob"("trainingTaskSpecId");
CREATE INDEX "ExperimentFoundationExternalTrainingJob_materializationResultId_idx" ON "ExperimentFoundationExternalTrainingJob"("materializationResultId");
CREATE INDEX "ExperimentFoundationExternalTrainingJob_adapterKind_jobStatus_idx" ON "ExperimentFoundationExternalTrainingJob"("adapterKind", "jobStatus");
CREATE INDEX "ExperimentFoundationExternalTrainingJob_jobStatus_idx" ON "ExperimentFoundationExternalTrainingJob"("jobStatus");
CREATE INDEX "ExperimentFoundationExternalTrainingJob_updatedAt_idx" ON "ExperimentFoundationExternalTrainingJob"("updatedAt" DESC);
