-- Add global literature quality assessments and topic-level evidence activation.
CREATE TABLE "LiteratureQualityAssessment" (
    "id" TEXT NOT NULL,
    "literatureId" TEXT NOT NULL,
    "qualityStatus" TEXT NOT NULL,
    "qualityScore" DOUBLE PRECISION,
    "qualityComponents" JSONB NOT NULL,
    "blockerCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "source" TEXT NOT NULL,
    "assessedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "LiteratureQualityAssessment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TopicLiteratureScope"
    ADD COLUMN "activationStatus" TEXT NOT NULL DEFAULT 'candidate',
    ADD COLUMN "activationReason" TEXT,
    ADD COLUMN "activationScore" DOUBLE PRECISION,
    ADD COLUMN "activatedAt" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX "LiteratureQualityAssessment_literatureId_key"
    ON "LiteratureQualityAssessment"("literatureId");

CREATE INDEX "LiteratureQualityAssessment_qualityStatus_idx"
    ON "LiteratureQualityAssessment"("qualityStatus");

CREATE INDEX "LiteratureQualityAssessment_assessedAt_idx"
    ON "LiteratureQualityAssessment"("assessedAt");

CREATE INDEX "TopicLiteratureScope_topicId_activationStatus_idx"
    ON "TopicLiteratureScope"("topicId", "activationStatus");

CREATE INDEX "TopicLiteratureScope_literatureId_activationStatus_idx"
    ON "TopicLiteratureScope"("literatureId", "activationStatus");

ALTER TABLE "LiteratureQualityAssessment"
    ADD CONSTRAINT "LiteratureQualityAssessment_literatureId_fkey"
    FOREIGN KEY ("literatureId") REFERENCES "LiteratureRecord"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
