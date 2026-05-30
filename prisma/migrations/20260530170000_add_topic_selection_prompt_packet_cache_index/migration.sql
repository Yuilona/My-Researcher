-- Add a persistent prompt packet cache index for T-112.
-- The index stores exact prompt-packet identity metadata and artifact refs only.
-- It intentionally does not store prompt payload text, provider responses,
-- provider telemetry payloads, or business authority records.

CREATE TABLE "TopicSelectionPromptPacketCacheIndex" (
  "promptPacketHash" TEXT NOT NULL,
  "promptTemplateId" TEXT NOT NULL,
  "promptTemplateVersion" TEXT NOT NULL,
  "promptVariantKey" TEXT NOT NULL,
  "invocationSlotId" TEXT NOT NULL,
  "contextPolicyProfileId" TEXT NOT NULL,
  "contextPolicyProfileVersion" TEXT NOT NULL,
  "contextPolicyProfileHash" TEXT NOT NULL,
  "outputContract" TEXT NOT NULL,
  "redactionPolicy" TEXT NOT NULL,
  "contextPacketHashesHash" TEXT NOT NULL,
  "compressionReportHash" TEXT,
  "compressedContextHash" TEXT,
  "dynamicMaterialRefsHash" TEXT,
  "modelOptionId" TEXT,
  "normalizedParamsHash" TEXT,
  "runtimeModifiersHash" TEXT NOT NULL,
  "redactedPromptArtifactRef" JSONB NOT NULL DEFAULT '{}',
  "redactedPromptArtifactHash" TEXT NOT NULL,
  "promptQualityReportRef" JSONB NOT NULL DEFAULT '{}',
  "promptQualityReportHash" TEXT NOT NULL,
  "qualityDecision" TEXT NOT NULL,
  "freshnessStatus" TEXT NOT NULL,
  "provenanceRef" JSONB NOT NULL DEFAULT '{}',
  "blockerCodes" JSONB NOT NULL DEFAULT '[]',
  "warningCodes" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionPromptPacketCacheIndex_pkey" PRIMARY KEY ("promptPacketHash")
);

CREATE INDEX "TopicSelectionPromptPacketCacheIndex_template_variant_idx"
  ON "TopicSelectionPromptPacketCacheIndex" (
    "promptTemplateId",
    "promptTemplateVersion",
    "promptVariantKey"
  );

CREATE INDEX "TopicSelectionPromptPacketCacheIndex_slot_freshness_idx"
  ON "TopicSelectionPromptPacketCacheIndex" ("invocationSlotId", "freshnessStatus");

CREATE INDEX "TopicSelectionPromptPacketCacheIndex_context_profile_idx"
  ON "TopicSelectionPromptPacketCacheIndex" (
    "contextPolicyProfileId",
    "contextPolicyProfileVersion"
  );

CREATE INDEX "TopicSelectionPromptPacketCacheIndex_model_option_idx"
  ON "TopicSelectionPromptPacketCacheIndex" ("modelOptionId");

CREATE INDEX "TopicSelectionPromptPacketCacheIndex_quality_decision_idx"
  ON "TopicSelectionPromptPacketCacheIndex" ("qualityDecision");

CREATE INDEX "TopicSelectionPromptPacketCacheIndex_updated_at_idx"
  ON "TopicSelectionPromptPacketCacheIndex" ("updatedAt");
