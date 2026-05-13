-- Add topic-selection v1a recheck/risk/memory/queue records.
-- These records are control-plane authority records. They keep query-critical
-- ids/statuses in columns and preserve full functional refs as JSON payloads.

CREATE TABLE "TopicSelectionRecheckEvent" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "originStage" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "sourceRefType" TEXT NOT NULL,
  "sourceRefId" TEXT NOT NULL,
  "sourceVersionId" TEXT,
  "sourceRef" JSONB NOT NULL DEFAULT '{}',
  "affectedScopeType" TEXT,
  "affectedScopeId" TEXT,
  "affectedScopeRef" JSONB,
  "eventFingerprint" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "reasonCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "summary" TEXT NOT NULL,
  "stateSignalRefs" JSONB NOT NULL DEFAULT '[]',
  "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "artifactRefs" JSONB NOT NULL DEFAULT '[]',
  "policyVersionId" TEXT,
  "status" TEXT NOT NULL,
  "observationCount" INTEGER NOT NULL DEFAULT 1,
  "firstSeenAt" TIMESTAMPTZ(6) NOT NULL,
  "lastSeenAt" TIMESTAMPTZ(6) NOT NULL,
  "cooldownUntil" TIMESTAMPTZ(6),
  "payload" JSONB NOT NULL DEFAULT '{}',

  CONSTRAINT "TopicSelectionRecheckEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionRecheckImpact" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "recheckEventId" TEXT NOT NULL,
  "recheckEventRef" JSONB NOT NULL DEFAULT '{}',
  "affectedRefType" TEXT NOT NULL,
  "affectedRefId" TEXT NOT NULL,
  "affectedVersionId" TEXT,
  "affectedRef" JSONB NOT NULL DEFAULT '{}',
  "affectedStage" TEXT NOT NULL,
  "impactLevel" TEXT NOT NULL,
  "impactDedupKey" TEXT NOT NULL,
  "requiredActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "retryBudget" INTEGER NOT NULL DEFAULT 3,
  "cooldownUntil" TIMESTAMPTZ(6),
  "acceptedRiskRefs" JSONB NOT NULL DEFAULT '[]',
  "queueItemRefs" JSONB NOT NULL DEFAULT '[]',
  "assessmentPayload" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionRecheckImpact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionRecheckResolution" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "recheckImpactId" TEXT NOT NULL,
  "recheckImpactRef" JSONB NOT NULL DEFAULT '{}',
  "resolutionType" TEXT NOT NULL,
  "resolvedBy" JSONB NOT NULL DEFAULT '{}',
  "rationale" TEXT NOT NULL,
  "outputRefs" JSONB NOT NULL DEFAULT '[]',
  "acceptedRiskId" TEXT,
  "acceptedRiskRef" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionRecheckResolution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionAcceptedRisk" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "riskType" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceRefType" TEXT,
  "sourceRefId" TEXT,
  "sourceRef" JSONB,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "targetRef" JSONB NOT NULL DEFAULT '{}',
  "scopeRefs" JSONB NOT NULL DEFAULT '[]',
  "affectedObjectRefs" JSONB NOT NULL DEFAULT '[]',
  "severity" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "acceptedBy" JSONB NOT NULL DEFAULT '{}',
  "policyVersionId" TEXT,
  "expiryCondition" TEXT,
  "recheckCondition" TEXT,
  "expiresAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  "resolvedAt" TIMESTAMPTZ(6),

  CONSTRAINT "TopicSelectionAcceptedRisk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionHumanOverride" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "targetRef" JSONB NOT NULL DEFAULT '{}',
  "overriddenRef" JSONB,
  "blockerType" TEXT NOT NULL,
  "acceptedRiskId" TEXT NOT NULL,
  "acceptedRiskRef" JSONB NOT NULL DEFAULT '{}',
  "actor" JSONB NOT NULL DEFAULT '{}',
  "rationale" TEXT NOT NULL,
  "policyVersionId" TEXT,
  "scope" JSONB NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionHumanOverride_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionBlockerPolicy" (
  "id" TEXT NOT NULL,
  "blockerCode" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "defaultAction" TEXT NOT NULL,
  "allowedHandlerKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "policyVersionId" TEXT,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "retiredAt" TIMESTAMPTZ(6),

  CONSTRAINT "TopicSelectionBlockerPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionDecisionMemoryEntry" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "sourceStage" TEXT NOT NULL,
  "sourceRefType" TEXT NOT NULL,
  "sourceRefId" TEXT NOT NULL,
  "sourceRef" JSONB NOT NULL DEFAULT '{}',
  "targetScopeRefType" TEXT,
  "targetScopeRefId" TEXT,
  "targetScopeRef" JSONB,
  "memoryType" TEXT NOT NULL,
  "effectPolicy" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION,
  "status" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "applicabilityScope" JSONB NOT NULL DEFAULT '{}',
  "payload" JSONB NOT NULL DEFAULT '{}',
  "evidencePolicy" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "expiresAt" TIMESTAMPTZ(6),
  "recheckCondition" TEXT,

  CONSTRAINT "TopicSelectionDecisionMemoryEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionCandidateDecisionMemory" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT NOT NULL,
  "decisionMemoryEntryId" TEXT NOT NULL,
  "decisionMemoryEntryRef" JSONB NOT NULL DEFAULT '{}',
  "sourceSuggestionId" TEXT,
  "sourceSuggestionRef" JSONB,
  "needCandidateId" TEXT NOT NULL,
  "needCandidateRef" JSONB NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL,
  "reasonCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "evidencePolicy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "TopicSelectionCandidateDecisionMemory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicSelectionDecisionWorkQueueItem" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "titleCardId" TEXT,
  "queueItemType" TEXT NOT NULL,
  "handlerKey" TEXT NOT NULL,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "targetRef" JSONB NOT NULL DEFAULT '{}',
  "sourceRefType" TEXT NOT NULL,
  "sourceRefId" TEXT NOT NULL,
  "sourceRef" JSONB NOT NULL DEFAULT '{}',
  "queueDedupKey" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "requiredActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "reasonCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "blockedTransitionKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "retryBudget" INTEGER NOT NULL DEFAULT 3,
  "cooldownUntil" TIMESTAMPTZ(6),
  "policyVersionId" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  "resolvedAt" TIMESTAMPTZ(6),

  CONSTRAINT "TopicSelectionDecisionWorkQueueItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TopicSelectionRecheckEvent_open_fingerprint_key"
  ON "TopicSelectionRecheckEvent"("eventFingerprint")
  WHERE "status" = 'open';
CREATE INDEX "TopicSelectionRecheckEvent_eventFingerprint_status_idx"
  ON "TopicSelectionRecheckEvent"("eventFingerprint", "status");
CREATE INDEX "TopicSelectionRecheckEvent_titleCardId_lastSeenAt_idx"
  ON "TopicSelectionRecheckEvent"("titleCardId", "lastSeenAt" DESC);
CREATE INDEX "TopicSelectionRecheckEvent_eventType_status_idx"
  ON "TopicSelectionRecheckEvent"("eventType", "status");
CREATE INDEX "TopicSelectionRecheckEvent_sourceRefType_sourceRefId_idx"
  ON "TopicSelectionRecheckEvent"("sourceRefType", "sourceRefId");
CREATE INDEX "TopicSelectionRecheckEvent_affectedScopeType_affectedScopeId_idx"
  ON "TopicSelectionRecheckEvent"("affectedScopeType", "affectedScopeId");
CREATE INDEX "TopicSelectionRecheckEvent_severity_status_idx"
  ON "TopicSelectionRecheckEvent"("severity", "status");
CREATE INDEX "TopicSelectionRecheckEvent_cooldownUntil_idx"
  ON "TopicSelectionRecheckEvent"("cooldownUntil");

CREATE UNIQUE INDEX "TopicSelectionRecheckImpact_active_dedup_key"
  ON "TopicSelectionRecheckImpact"("impactDedupKey")
  WHERE "status" IN ('open', 'queued', 'in_progress');
CREATE INDEX "TopicSelectionRecheckImpact_impactDedupKey_status_idx"
  ON "TopicSelectionRecheckImpact"("impactDedupKey", "status");
CREATE INDEX "TopicSelectionRecheckImpact_titleCardId_createdAt_idx"
  ON "TopicSelectionRecheckImpact"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionRecheckImpact_recheckEventId_idx"
  ON "TopicSelectionRecheckImpact"("recheckEventId");
CREATE INDEX "TopicSelectionRecheckImpact_affectedRefType_affectedRefId_idx"
  ON "TopicSelectionRecheckImpact"("affectedRefType", "affectedRefId");
CREATE INDEX "TopicSelectionRecheckImpact_impactLevel_status_idx"
  ON "TopicSelectionRecheckImpact"("impactLevel", "status");
CREATE INDEX "TopicSelectionRecheckImpact_cooldownUntil_idx"
  ON "TopicSelectionRecheckImpact"("cooldownUntil");

CREATE INDEX "TopicSelectionRecheckResolution_titleCardId_createdAt_idx"
  ON "TopicSelectionRecheckResolution"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionRecheckResolution_recheckImpactId_idx"
  ON "TopicSelectionRecheckResolution"("recheckImpactId");
CREATE INDEX "TopicSelectionRecheckResolution_resolutionType_idx"
  ON "TopicSelectionRecheckResolution"("resolutionType");
CREATE INDEX "TopicSelectionRecheckResolution_acceptedRiskId_idx"
  ON "TopicSelectionRecheckResolution"("acceptedRiskId");

CREATE INDEX "TopicSelectionAcceptedRisk_titleCardId_createdAt_idx"
  ON "TopicSelectionAcceptedRisk"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionAcceptedRisk_targetRefType_targetRefId_idx"
  ON "TopicSelectionAcceptedRisk"("targetRefType", "targetRefId");
CREATE INDEX "TopicSelectionAcceptedRisk_sourceRefType_sourceRefId_idx"
  ON "TopicSelectionAcceptedRisk"("sourceRefType", "sourceRefId");
CREATE INDEX "TopicSelectionAcceptedRisk_riskType_status_idx"
  ON "TopicSelectionAcceptedRisk"("riskType", "status");
CREATE INDEX "TopicSelectionAcceptedRisk_expiresAt_status_idx"
  ON "TopicSelectionAcceptedRisk"("expiresAt", "status");

CREATE INDEX "TopicSelectionHumanOverride_titleCardId_createdAt_idx"
  ON "TopicSelectionHumanOverride"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionHumanOverride_targetRefType_targetRefId_idx"
  ON "TopicSelectionHumanOverride"("targetRefType", "targetRefId");
CREATE INDEX "TopicSelectionHumanOverride_acceptedRiskId_idx"
  ON "TopicSelectionHumanOverride"("acceptedRiskId");
CREATE INDEX "TopicSelectionHumanOverride_blockerType_status_idx"
  ON "TopicSelectionHumanOverride"("blockerType", "status");

CREATE UNIQUE INDEX "TopicSelectionBlockerPolicy_blockerCode_policyVersionId_key"
  ON "TopicSelectionBlockerPolicy"("blockerCode", "policyVersionId");
CREATE INDEX "TopicSelectionBlockerPolicy_category_status_idx"
  ON "TopicSelectionBlockerPolicy"("category", "status");

CREATE INDEX "TopicSelectionDecisionMemoryEntry_titleCardId_createdAt_idx"
  ON "TopicSelectionDecisionMemoryEntry"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionDecisionMemoryEntry_sourceRefType_sourceRefId_idx"
  ON "TopicSelectionDecisionMemoryEntry"("sourceRefType", "sourceRefId");
CREATE INDEX "TopicSelectionDecisionMemoryEntry_targetScopeRefType_targetScopeRefId_idx"
  ON "TopicSelectionDecisionMemoryEntry"("targetScopeRefType", "targetScopeRefId");
CREATE INDEX "TopicSelectionDecisionMemoryEntry_memoryType_status_idx"
  ON "TopicSelectionDecisionMemoryEntry"("memoryType", "status");
CREATE INDEX "TopicSelectionDecisionMemoryEntry_effectPolicy_status_idx"
  ON "TopicSelectionDecisionMemoryEntry"("effectPolicy", "status");
CREATE INDEX "TopicSelectionDecisionMemoryEntry_expiresAt_idx"
  ON "TopicSelectionDecisionMemoryEntry"("expiresAt");

CREATE UNIQUE INDEX "TopicSelectionCandidateDecisionMemory_sourceSuggestionId_key"
  ON "TopicSelectionCandidateDecisionMemory"("sourceSuggestionId");
CREATE INDEX "TopicSelectionCandidateDecisionMemory_titleCardId_createdAt_idx"
  ON "TopicSelectionCandidateDecisionMemory"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionCandidateDecisionMemory_decisionMemoryEntryId_idx"
  ON "TopicSelectionCandidateDecisionMemory"("decisionMemoryEntryId");
CREATE INDEX "TopicSelectionCandidateDecisionMemory_needCandidateId_idx"
  ON "TopicSelectionCandidateDecisionMemory"("needCandidateId");
CREATE INDEX "TopicSelectionCandidateDecisionMemory_status_idx"
  ON "TopicSelectionCandidateDecisionMemory"("status");

CREATE UNIQUE INDEX "TopicSelectionDecisionWorkQueueItem_active_dedup_key"
  ON "TopicSelectionDecisionWorkQueueItem"("queueDedupKey")
  WHERE "status" IN ('open', 'in_progress');
CREATE INDEX "TopicSelectionDecisionWorkQueueItem_queueDedupKey_status_idx"
  ON "TopicSelectionDecisionWorkQueueItem"("queueDedupKey", "status");
CREATE INDEX "TopicSelectionDecisionWorkQueueItem_titleCardId_createdAt_idx"
  ON "TopicSelectionDecisionWorkQueueItem"("titleCardId", "createdAt" DESC);
CREATE INDEX "TopicSelectionDecisionWorkQueueItem_queueItemType_status_idx"
  ON "TopicSelectionDecisionWorkQueueItem"("queueItemType", "status");
CREATE INDEX "TopicSelectionDecisionWorkQueueItem_handlerKey_status_idx"
  ON "TopicSelectionDecisionWorkQueueItem"("handlerKey", "status");
CREATE INDEX "TopicSelectionDecisionWorkQueueItem_targetRefType_targetRefId_idx"
  ON "TopicSelectionDecisionWorkQueueItem"("targetRefType", "targetRefId");
CREATE INDEX "TopicSelectionDecisionWorkQueueItem_sourceRefType_sourceRefId_idx"
  ON "TopicSelectionDecisionWorkQueueItem"("sourceRefType", "sourceRefId");
CREATE INDEX "TopicSelectionDecisionWorkQueueItem_priority_status_idx"
  ON "TopicSelectionDecisionWorkQueueItem"("priority", "status");
CREATE INDEX "TopicSelectionDecisionWorkQueueItem_cooldownUntil_idx"
  ON "TopicSelectionDecisionWorkQueueItem"("cooldownUntil");
