-- T-096 PaperImplementation WorkOrder experiment bridge

CREATE TABLE "PaperImplementationResearchWorkOrder" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "validationCycleId" TEXT NOT NULL,
    "experimentPlanLightId" TEXT,
    "runType" TEXT NOT NULL,
    "workOrderStatus" TEXT NOT NULL,
    "runPolicyId" TEXT NOT NULL,
    "retryBudget" INTEGER NOT NULL,
    "computeLimitRef" JSONB,
    "computeLimitRefType" TEXT,
    "computeLimitRefId" TEXT,
    "computeLimitVersionId" TEXT,
    "stopConditionRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stopConditionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "allowedMutationRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "autotunePolicy" TEXT NOT NULL,
    "experimentBridge" JSONB NOT NULL DEFAULT '{}',
    "runRecipeRef" JSONB NOT NULL DEFAULT '{}',
    "runRecipeRefType" TEXT NOT NULL,
    "runRecipeRefId" TEXT NOT NULL,
    "runRecipeVersionId" TEXT,
    "runRecipeHash" TEXT NOT NULL,
    "versionLockHash" TEXT,
    "configSnapshotHash" TEXT,
    "trainingTaskSpecRef" JSONB,
    "trainingTaskSpecRefType" TEXT,
    "trainingTaskSpecRefId" TEXT,
    "trainingTaskSpecVersionId" TEXT,
    "trainingTaskSpecHash" TEXT,
    "externalJobRef" JSONB,
    "externalJobRefType" TEXT,
    "externalJobRefId" TEXT,
    "externalJobVersionId" TEXT,
    "externalJobHash" TEXT,
    "motiveRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "motiveRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "assertionRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assertionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "datasetVersionRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "datasetVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "baselineVersionRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "baselineVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "codeVersionRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "codeVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "configRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "configRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "traceManifestId" TEXT NOT NULL,
    "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
    "admissionGateResultId" TEXT,
    "policyVersionId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "admittedAt" TIMESTAMPTZ(6),

    CONSTRAINT "PaperImplementationResearchWorkOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationWorkOrderHarnessRun" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "runStatus" TEXT NOT NULL,
    "runAttempt" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "externalJobRef" JSONB NOT NULL DEFAULT '{}',
    "externalJobRefType" TEXT NOT NULL,
    "externalJobRefId" TEXT NOT NULL,
    "externalJobVersionId" TEXT,
    "externalJobHash" TEXT NOT NULL,
    "submittedAt" TIMESTAMPTZ(6) NOT NULL,
    "completedAt" TIMESTAMPTZ(6),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PaperImplementationWorkOrderHarnessRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationRunMonitorIntake" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "externalJobRef" JSONB,
    "externalJobRefType" TEXT,
    "externalJobRefId" TEXT,
    "externalJobVersionId" TEXT,
    "externalJobHash" TEXT,
    "monitorEventKind" TEXT NOT NULL,
    "runStatus" TEXT NOT NULL,
    "trustStatus" TEXT NOT NULL,
    "resultRef" JSONB,
    "resultRefType" TEXT,
    "resultRefId" TEXT,
    "resultVersionId" TEXT,
    "resultHash" TEXT,
    "resultValidationReportRef" JSONB,
    "resultValidationReportRefType" TEXT,
    "resultValidationReportRefId" TEXT,
    "resultValidationReportVersionId" TEXT,
    "resultValidationReportHash" TEXT,
    "evidenceCandidateRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceCandidateRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "evidenceCandidateHashes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failureSummary" TEXT,
    "rawPayload" JSONB NOT NULL DEFAULT '{}',
    "receivedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "PaperImplementationRunMonitorIntake_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperImplementationRunEvidenceUnit" (
    "id" TEXT NOT NULL,
    "implementationProjectId" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "validationCycleId" TEXT NOT NULL,
    "experimentPlanLightId" TEXT,
    "monitorIntakeId" TEXT NOT NULL,
    "externalJobRef" JSONB,
    "externalJobRefType" TEXT,
    "externalJobRefId" TEXT,
    "externalJobVersionId" TEXT,
    "externalJobHash" TEXT,
    "runType" TEXT NOT NULL,
    "runStatus" TEXT NOT NULL,
    "trustedStatus" TEXT NOT NULL,
    "datasetVersionRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "datasetVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "baselineVersionRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "baselineVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "codeVersionRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "codeVersionRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "configRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "configRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "resultRef" JSONB,
    "resultRefType" TEXT,
    "resultRefId" TEXT,
    "resultVersionId" TEXT,
    "resultHash" TEXT,
    "resultValidationReportRef" JSONB,
    "resultValidationReportRefType" TEXT,
    "resultValidationReportRefId" TEXT,
    "resultValidationReportVersionId" TEXT,
    "resultValidationReportHash" TEXT,
    "evidenceCandidateRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceCandidateRefPayloads" JSONB NOT NULL DEFAULT '[]',
    "evidenceCandidateHashes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failureSummaryId" TEXT,
    "failureSummary" TEXT,
    "traceManifestId" TEXT NOT NULL,
    "traceManifestRef" JSONB NOT NULL DEFAULT '{}',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PaperImplementationRunEvidenceUnit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pirwo_project_created_idx" ON "PaperImplementationResearchWorkOrder"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pirwo_cycle_idx" ON "PaperImplementationResearchWorkOrder"("validationCycleId");
CREATE INDEX "pirwo_plan_idx" ON "PaperImplementationResearchWorkOrder"("experimentPlanLightId");
CREATE INDEX "pirwo_run_type_idx" ON "PaperImplementationResearchWorkOrder"("runType");
CREATE INDEX "pirwo_status_idx" ON "PaperImplementationResearchWorkOrder"("workOrderStatus");
CREATE INDEX "pirwo_policy_idx" ON "PaperImplementationResearchWorkOrder"("runPolicyId");
CREATE INDEX "pirwo_retry_budget_idx" ON "PaperImplementationResearchWorkOrder"("retryBudget");
CREATE INDEX "pirwo_compute_limit_idx" ON "PaperImplementationResearchWorkOrder"("computeLimitRefType", "computeLimitRefId", "computeLimitVersionId");
CREATE INDEX "pirwo_recipe_idx" ON "PaperImplementationResearchWorkOrder"("runRecipeRefType", "runRecipeRefId", "runRecipeVersionId");
CREATE INDEX "pirwo_task_spec_idx" ON "PaperImplementationResearchWorkOrder"("trainingTaskSpecRefType", "trainingTaskSpecRefId", "trainingTaskSpecVersionId");
CREATE INDEX "pirwo_external_job_idx" ON "PaperImplementationResearchWorkOrder"("externalJobRefType", "externalJobRefId", "externalJobVersionId");
CREATE INDEX "pirwo_trace_manifest_idx" ON "PaperImplementationResearchWorkOrder"("traceManifestId");
CREATE INDEX "pirwo_gate_idx" ON "PaperImplementationResearchWorkOrder"("admissionGateResultId");

CREATE INDEX "piwohr_project_created_idx" ON "PaperImplementationWorkOrderHarnessRun"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "piwohr_work_order_idx" ON "PaperImplementationWorkOrderHarnessRun"("workOrderId");
CREATE INDEX "piwohr_status_idx" ON "PaperImplementationWorkOrderHarnessRun"("runStatus");
CREATE INDEX "piwohr_idempotency_idx" ON "PaperImplementationWorkOrderHarnessRun"("idempotencyKey");
CREATE INDEX "piwohr_external_job_idx" ON "PaperImplementationWorkOrderHarnessRun"("externalJobRefType", "externalJobRefId", "externalJobVersionId");

CREATE INDEX "pirmi_project_received_idx" ON "PaperImplementationRunMonitorIntake"("implementationProjectId", "receivedAt" DESC);
CREATE INDEX "pirmi_work_order_idx" ON "PaperImplementationRunMonitorIntake"("workOrderId");
CREATE INDEX "pirmi_external_job_idx" ON "PaperImplementationRunMonitorIntake"("externalJobRefType", "externalJobRefId", "externalJobVersionId");
CREATE INDEX "pirmi_event_kind_idx" ON "PaperImplementationRunMonitorIntake"("monitorEventKind");
CREATE INDEX "pirmi_run_status_idx" ON "PaperImplementationRunMonitorIntake"("runStatus");
CREATE INDEX "pirmi_trust_idx" ON "PaperImplementationRunMonitorIntake"("trustStatus");
CREATE INDEX "pirmi_result_idx" ON "PaperImplementationRunMonitorIntake"("resultRefType", "resultRefId", "resultVersionId");
CREATE INDEX "pirmi_validation_report_idx" ON "PaperImplementationRunMonitorIntake"("resultValidationReportRefId");

CREATE INDEX "pireu_project_created_idx" ON "PaperImplementationRunEvidenceUnit"("implementationProjectId", "createdAt" DESC);
CREATE INDEX "pireu_work_order_idx" ON "PaperImplementationRunEvidenceUnit"("workOrderId");
CREATE INDEX "pireu_cycle_idx" ON "PaperImplementationRunEvidenceUnit"("validationCycleId");
CREATE INDEX "pireu_plan_idx" ON "PaperImplementationRunEvidenceUnit"("experimentPlanLightId");
CREATE INDEX "pireu_monitor_idx" ON "PaperImplementationRunEvidenceUnit"("monitorIntakeId");
CREATE INDEX "pireu_external_job_idx" ON "PaperImplementationRunEvidenceUnit"("externalJobRefType", "externalJobRefId", "externalJobVersionId");
CREATE INDEX "pireu_run_type_idx" ON "PaperImplementationRunEvidenceUnit"("runType");
CREATE INDEX "pireu_run_status_idx" ON "PaperImplementationRunEvidenceUnit"("runStatus");
CREATE INDEX "pireu_trusted_idx" ON "PaperImplementationRunEvidenceUnit"("trustedStatus");
CREATE INDEX "pireu_validation_report_idx" ON "PaperImplementationRunEvidenceUnit"("resultValidationReportRefId");
CREATE INDEX "pireu_failure_summary_idx" ON "PaperImplementationRunEvidenceUnit"("failureSummaryId");
CREATE INDEX "pireu_trace_manifest_idx" ON "PaperImplementationRunEvidenceUnit"("traceManifestId");
