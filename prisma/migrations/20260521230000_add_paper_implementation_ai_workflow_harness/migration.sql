CREATE TABLE "PaperImplementationHarness" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "harnessStatus" TEXT NOT NULL,
  "contextPolicyVersionId" TEXT NOT NULL,
  "tracePolicyVersionId" TEXT NOT NULL,
  "evidencePolicyVersionId" TEXT NOT NULL,
  "experimentPolicyVersionId" TEXT NOT NULL,
  "retentionPolicyVersionId" TEXT NOT NULL,
  "evaluationPolicyVersionId" TEXT NOT NULL,
  "policyPack" JSONB NOT NULL DEFAULT '{}',
  "controlPlaneId" TEXT NOT NULL,
  "artifactStoreRef" JSONB NOT NULL DEFAULT '{}',
  "evidenceLedgerRef" JSONB NOT NULL DEFAULT '{}',
  "workOrderBrokerRef" JSONB NOT NULL DEFAULT '{}',
  "runMonitorRef" JSONB NOT NULL DEFAULT '{}',
  "runtimeBindings" JSONB NOT NULL DEFAULT '{}',
  "invariants" JSONB NOT NULL DEFAULT '{}',
  "auditRefs" JSONB NOT NULL DEFAULT '{}',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "PaperImplementationHarness_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationInputSnapshot" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "targetRef" JSONB NOT NULL DEFAULT '{}',
  "workflowType" TEXT NOT NULL,
  "contextPolicyVersionId" TEXT NOT NULL,
  "includedContext" JSONB NOT NULL DEFAULT '{}',
  "excludedContext" JSONB NOT NULL DEFAULT '{}',
  "freshnessStatus" TEXT NOT NULL,
  "excludeStaleEvidence" BOOLEAN NOT NULL,
  "excludeInvalidatedRefs" BOOLEAN NOT NULL,
  "memoAsEvidenceForbidden" BOOLEAN NOT NULL,
  "citationRequiresLocator" BOOLEAN NOT NULL,
  "sourceHashes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "snapshotHash" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "PaperImplementationInputSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationAgentWorkflowHarnessRun" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "harnessId" TEXT NOT NULL,
  "inputSnapshotId" TEXT NOT NULL,
  "workflowType" TEXT NOT NULL,
  "workflowVersion" TEXT NOT NULL,
  "runMode" TEXT NOT NULL,
  "executionMode" TEXT NOT NULL,
  "modelProfileId" TEXT NOT NULL,
  "promptTemplateVersionId" TEXT NOT NULL,
  "outputSchemaVersionId" TEXT NOT NULL,
  "rawOutputArtifactRef" JSONB NOT NULL DEFAULT '{}',
  "parsedOutputArtifactRef" JSONB,
  "specPayload" JSONB NOT NULL DEFAULT '{}',
  "schemaValidationStatus" TEXT NOT NULL,
  "referenceValidationStatus" TEXT NOT NULL,
  "traceValidationStatus" TEXT NOT NULL,
  "nlFieldRoleValidationStatus" TEXT NOT NULL,
  "memoAsEvidenceDetected" BOOLEAN NOT NULL,
  "directStateMutationDetected" BOOLEAN NOT NULL,
  "blockedReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "runStatus" TEXT NOT NULL,
  "proposalArtifactIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "qualitySignalIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "gateResultId" TEXT,
  "transitionAttemptId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "PaperImplementationAgentWorkflowHarnessRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationProposalArtifact" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "harnessRunId" TEXT NOT NULL,
  "artifactKind" TEXT NOT NULL,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "targetRef" JSONB NOT NULL DEFAULT '{}',
  "artifactRef" JSONB,
  "sourceRefPayloads" JSONB NOT NULL DEFAULT '[]',
  "traceManifestRefPayloads" JSONB NOT NULL DEFAULT '[]',
  "proposalStatus" TEXT NOT NULL,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "PaperImplementationProposalArtifact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationQualitySignal" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "harnessRunId" TEXT,
  "signalType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "targetRef" JSONB NOT NULL DEFAULT '{}',
  "summary" TEXT NOT NULL,
  "sourceRefPayloads" JSONB NOT NULL DEFAULT '[]',
  "payload" JSONB NOT NULL DEFAULT '{}',
  "policyVersionId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "PaperImplementationQualitySignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationGateResult" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "gateType" TEXT NOT NULL,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "targetRef" JSONB NOT NULL DEFAULT '{}',
  "result" TEXT NOT NULL,
  "checks" JSONB NOT NULL DEFAULT '[]',
  "blockers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "warnings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "acceptedRiskRefPayloads" JSONB NOT NULL DEFAULT '[]',
  "requiredActions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "policyVersionId" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "PaperImplementationGateResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationTransitionAttempt" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "transitionKey" TEXT NOT NULL,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "targetRef" JSONB NOT NULL DEFAULT '{}',
  "inputRefPayloads" JSONB NOT NULL DEFAULT '[]',
  "outputRefPayloads" JSONB NOT NULL DEFAULT '[]',
  "actorType" TEXT NOT NULL,
  "actorId" TEXT,
  "transitionPolicyVersionId" TEXT NOT NULL,
  "contextPolicyVersionId" TEXT,
  "tracePolicyVersionId" TEXT NOT NULL,
  "gateResultRefPayloads" JSONB NOT NULL DEFAULT '[]',
  "outcome" TEXT NOT NULL,
  "blockers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "acceptedRiskRefPayloads" JSONB NOT NULL DEFAULT '[]',
  "harnessRunRefPayloads" JSONB NOT NULL DEFAULT '[]',
  "traceManifestRefPayloads" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "PaperImplementationTransitionAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationDecisionWorkQueueItem" (
  "id" TEXT NOT NULL,
  "implementationProjectId" TEXT NOT NULL,
  "queueType" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "targetRefType" TEXT NOT NULL,
  "targetRefId" TEXT NOT NULL,
  "targetVersionId" TEXT,
  "targetRef" JSONB NOT NULL DEFAULT '{}',
  "priority" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "blockingTransitionKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "dedupKey" TEXT NOT NULL,
  "allowedHandlers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "recommendedActions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdFromRefPayloads" JSONB NOT NULL DEFAULT '[]',
  "policyVersionId" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "retryBudget" INTEGER NOT NULL DEFAULT 0,
  "cooldownUntil" TIMESTAMPTZ(6),
  "resolutionNote" TEXT,
  "resolvedBy" TEXT,
  "resolvedAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "PaperImplementationDecisionWorkQueueItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pi_harness_project_created_idx" ON "PaperImplementationHarness"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pi_harness_project_status_idx" ON "PaperImplementationHarness"("implementationProjectId", "harnessStatus");
CREATE INDEX "pi_harness_context_policy_idx" ON "PaperImplementationHarness"("contextPolicyVersionId");
CREATE INDEX "pi_harness_trace_policy_idx" ON "PaperImplementationHarness"("tracePolicyVersionId");
CREATE INDEX "pi_harness_control_plane_idx" ON "PaperImplementationHarness"("controlPlaneId");
CREATE INDEX "pi_input_project_created_idx" ON "PaperImplementationInputSnapshot"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pi_input_project_workflow_idx" ON "PaperImplementationInputSnapshot"("implementationProjectId", "workflowType");
CREATE INDEX "pi_input_target_idx" ON "PaperImplementationInputSnapshot"("targetRefType", "targetRefId", "targetVersionId");
CREATE INDEX "pi_input_context_policy_idx" ON "PaperImplementationInputSnapshot"("contextPolicyVersionId");
CREATE INDEX "pi_input_freshness_idx" ON "PaperImplementationInputSnapshot"("freshnessStatus");
CREATE INDEX "pi_input_hash_idx" ON "PaperImplementationInputSnapshot"("snapshotHash");
CREATE INDEX "pi_awhr_project_created_idx" ON "PaperImplementationAgentWorkflowHarnessRun"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pi_awhr_harness_idx" ON "PaperImplementationAgentWorkflowHarnessRun"("harnessId");
CREATE INDEX "pi_awhr_input_idx" ON "PaperImplementationAgentWorkflowHarnessRun"("inputSnapshotId");
CREATE INDEX "pi_awhr_workflow_status_idx" ON "PaperImplementationAgentWorkflowHarnessRun"("workflowType", "runStatus");
CREATE INDEX "pi_awhr_model_profile_idx" ON "PaperImplementationAgentWorkflowHarnessRun"("modelProfileId");
CREATE INDEX "pi_awhr_run_execution_mode_idx" ON "PaperImplementationAgentWorkflowHarnessRun"("runMode", "executionMode");
CREATE INDEX "pi_awhr_schema_status_idx" ON "PaperImplementationAgentWorkflowHarnessRun"("schemaValidationStatus");
CREATE INDEX "pi_awhr_ref_status_idx" ON "PaperImplementationAgentWorkflowHarnessRun"("referenceValidationStatus");
CREATE INDEX "pi_awhr_trace_status_idx" ON "PaperImplementationAgentWorkflowHarnessRun"("traceValidationStatus");
CREATE INDEX "pi_awhr_gate_idx" ON "PaperImplementationAgentWorkflowHarnessRun"("gateResultId");
CREATE INDEX "pi_proposal_project_created_idx" ON "PaperImplementationProposalArtifact"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pi_proposal_run_idx" ON "PaperImplementationProposalArtifact"("harnessRunId");
CREATE INDEX "pi_proposal_kind_status_idx" ON "PaperImplementationProposalArtifact"("artifactKind", "proposalStatus");
CREATE INDEX "pi_proposal_target_idx" ON "PaperImplementationProposalArtifact"("targetRefType", "targetRefId", "targetVersionId");
CREATE INDEX "pi_proposal_status_idx" ON "PaperImplementationProposalArtifact"("proposalStatus");
CREATE INDEX "pi_quality_project_created_idx" ON "PaperImplementationQualitySignal"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pi_quality_run_idx" ON "PaperImplementationQualitySignal"("harnessRunId");
CREATE INDEX "pi_quality_type_severity_idx" ON "PaperImplementationQualitySignal"("signalType", "severity");
CREATE INDEX "pi_quality_target_idx" ON "PaperImplementationQualitySignal"("targetRefType", "targetRefId", "targetVersionId");
CREATE INDEX "pi_quality_policy_idx" ON "PaperImplementationQualitySignal"("policyVersionId");
CREATE INDEX "pi_gate_project_created_idx" ON "PaperImplementationGateResult"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pi_gate_type_result_idx" ON "PaperImplementationGateResult"("gateType", "result");
CREATE INDEX "pi_gate_target_idx" ON "PaperImplementationGateResult"("targetRefType", "targetRefId", "targetVersionId");
CREATE INDEX "pi_gate_policy_idx" ON "PaperImplementationGateResult"("policyVersionId");
CREATE INDEX "pi_transition_project_created_idx" ON "PaperImplementationTransitionAttempt"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pi_transition_key_outcome_idx" ON "PaperImplementationTransitionAttempt"("transitionKey", "outcome");
CREATE INDEX "pi_transition_target_idx" ON "PaperImplementationTransitionAttempt"("targetRefType", "targetRefId", "targetVersionId");
CREATE INDEX "pi_transition_policy_idx" ON "PaperImplementationTransitionAttempt"("transitionPolicyVersionId");
CREATE UNIQUE INDEX "pi_queue_project_dedup_key" ON "PaperImplementationDecisionWorkQueueItem"("implementationProjectId", "dedupKey");
CREATE INDEX "pi_queue_project_created_idx" ON "PaperImplementationDecisionWorkQueueItem"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pi_queue_type_status_idx" ON "PaperImplementationDecisionWorkQueueItem"("queueType", "status");
CREATE INDEX "pi_queue_target_idx" ON "PaperImplementationDecisionWorkQueueItem"("targetRefType", "targetRefId", "targetVersionId");
CREATE INDEX "pi_queue_priority_status_idx" ON "PaperImplementationDecisionWorkQueueItem"("priority", "status");
CREATE INDEX "pi_queue_policy_idx" ON "PaperImplementationDecisionWorkQueueItem"("policyVersionId");
CREATE INDEX "pi_queue_cooldown_idx" ON "PaperImplementationDecisionWorkQueueItem"("cooldownUntil");
