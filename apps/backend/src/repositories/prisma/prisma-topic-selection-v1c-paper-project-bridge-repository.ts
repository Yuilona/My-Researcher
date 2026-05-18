import type {
  PrismaClient,
  TopicSelectionPaperProjectBridge as PaperProjectBridgeRow,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionPaperProjectBridgeRecord,
  TopicSelectionPaperProjectBridgeWorkingCopyPayload,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-paper-project-bridge-contracts';
import type {
  TopicSelectionAllowedPromotionRefinement,
  TopicSelectionPromotionBridgeHandoff,
  TopicSelectionPromotionCondition,
  TopicSelectionPromotionStopOrReopenCondition,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-human-promotion-decision-contracts';
import {
  TopicSelectionV1cPaperProjectBridgeAttachmentConflictError,
  TopicSelectionV1cPaperProjectBridgeHashConflictError,
  type TopicSelectionV1cPaperProjectBridgeControlPlanePersistence,
  type TopicSelectionV1cPaperProjectBridgePersistence,
  type TopicSelectionV1cPaperProjectBridgeRepository,
} from '../topic-selection-v1c-paper-project-bridge.repository.js';

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asFunctionalRef(value: unknown): TopicSelectionFunctionalRef {
  return asRecord(value) as unknown as TopicSelectionFunctionalRef;
}

function asNullableFunctionalRef(value: unknown): TopicSelectionFunctionalRef | null {
  return value === null || value === undefined
    ? null
    : asFunctionalRef(value);
}

function toBridgeRecord(row: PaperProjectBridgeRow): TopicSelectionPaperProjectBridgeRecord {
  return {
    paper_project_bridge_id: row.id,
    bridge_status: row.bridgeStatus as TopicSelectionPaperProjectBridgeRecord['bridge_status'],
    workspace_id: row.workspaceId,
    title_card_id: row.titleCardId,
    source_promotion_decision_id: row.sourcePromotionDecisionId,
    source_promotion_decision_ref: asFunctionalRef(row.sourcePromotionDecisionRef),
    human_promotion_decision_ref: asFunctionalRef(row.humanPromotionDecisionRef),
    human_confirmed_decision_ref: asFunctionalRef(row.humanConfirmedDecisionRef),
    promotion_commitment_profile_id: row.promotionCommitmentProfileId,
    promotion_commitment_profile_ref: asFunctionalRef(row.promotionCommitmentProfileRef),
    promotion_gate_check_ref: asFunctionalRef(row.promotionGateCheckRef),
    promotion_input_snapshot_id: row.promotionInputSnapshotId,
    promotion_input_snapshot_ref: asFunctionalRef(row.promotionInputSnapshotRef),
    promotion_input_snapshot_hash: row.promotionInputSnapshotHash,
    topic_package_id: row.topicPackageId,
    package_version: row.packageVersion,
    decision: row.decision as TopicSelectionPaperProjectBridgeRecord['decision'],
    conditions: asArray<TopicSelectionPromotionCondition>(row.conditions),
    accepted_risk_refs: asArray<TopicSelectionFunctionalRef>(row.acceptedRiskRefs),
    allowed_refinements: asArray<TopicSelectionAllowedPromotionRefinement>(row.allowedRefinements),
    early_check_obligations: row.earlyCheckObligations,
    stop_conditions: asArray<TopicSelectionPromotionStopOrReopenCondition>(row.stopConditions),
    reopen_conditions: asArray<TopicSelectionPromotionStopOrReopenCondition>(row.reopenConditions),
    source_refs: asArray<TopicSelectionFunctionalRef>(row.sourceRefs),
    snapshot_hashes: asRecord(row.snapshotHashes) as TopicSelectionPromotionBridgeHandoff['snapshot_hashes'],
    working_copy_payload: asRecord(row.workingCopyPayload) as unknown as TopicSelectionPaperProjectBridgeWorkingCopyPayload,
    working_copy_payload_hash: row.workingCopyPayloadHash,
    bridge_payload_hash: row.bridgePayloadHash,
    paper_project_intake_ref: asNullableFunctionalRef(row.paperProjectIntakeRef),
    target_paper_project_ref: asNullableFunctionalRef(row.targetPaperProjectRef),
    source_promotion_handoff: asRecord(row.sourcePromotionHandoff) as unknown as TopicSelectionPromotionBridgeHandoff,
    input_snapshot_id: row.inputSnapshotId,
    workflow_run_id: row.workflowRunId,
    gate_result_id: row.gateResultId,
    transition_attempt_id: row.transitionAttemptId,
    trace_snapshot_id: row.traceSnapshotId,
    artifact_refs: asArray<TopicSelectionFunctionalRef>(row.artifactRefs),
    policy_version_id: row.policyVersionId,
    created_by: row.createdBy as TopicSelectionPaperProjectBridgeRecord['created_by'],
    created_at: row.createdAt.toISOString(),
  };
}

export class PrismaTopicSelectionV1cPaperProjectBridgeRepository
implements TopicSelectionV1cPaperProjectBridgeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createBridge(
    persistence: TopicSelectionV1cPaperProjectBridgePersistence,
  ): Promise<TopicSelectionPaperProjectBridgeRecord> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.createControlPlaneRecords(tx, persistence.control_plane);
        await tx.topicSelectionPaperProjectBridge.create({
          data: this.toBridgeCreateInput(persistence.paper_project_bridge),
        });
      });
    } catch (error) {
      if (this.isSourcePromotionDecisionUniqueConflict(error)) {
        const existing = await this.findBridgeBySourcePromotionDecisionId(
          persistence.paper_project_bridge.source_promotion_decision_id,
        );
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
    return persistence.paper_project_bridge;
  }

  async findBridgeById(
    paperProjectBridgeId: string,
  ): Promise<TopicSelectionPaperProjectBridgeRecord | null> {
    const row = await this.prisma.topicSelectionPaperProjectBridge.findUnique({
      where: { id: paperProjectBridgeId },
    });
    return row ? toBridgeRecord(row) : null;
  }

  async findBridgeBySourcePromotionDecisionId(
    sourcePromotionDecisionId: string,
  ): Promise<TopicSelectionPaperProjectBridgeRecord | null> {
    const row = await this.prisma.topicSelectionPaperProjectBridge.findUnique({
      where: { sourcePromotionDecisionId },
    });
    return row ? toBridgeRecord(row) : null;
  }

  async attachPaperProjectRefs(
    paperProjectBridgeId: string,
    input: {
      expected_bridge_payload_hash: string;
      paper_project_intake_ref: TopicSelectionFunctionalRef;
      target_paper_project_ref: TopicSelectionFunctionalRef;
    },
  ): Promise<TopicSelectionPaperProjectBridgeRecord> {
    const existing = await this.prisma.topicSelectionPaperProjectBridge.findUnique({
      where: { id: paperProjectBridgeId },
    });
    if (!existing) {
      throw new Error(`PaperProjectBridge ${paperProjectBridgeId} not found.`);
    }
    if (existing.bridgePayloadHash !== input.expected_bridge_payload_hash) {
      throw new TopicSelectionV1cPaperProjectBridgeHashConflictError(paperProjectBridgeId);
    }
    if (existing.paperProjectIntakeRef || existing.targetPaperProjectRef) {
      throw new TopicSelectionV1cPaperProjectBridgeAttachmentConflictError(paperProjectBridgeId);
    }

    const updated = await this.prisma.topicSelectionPaperProjectBridge.update({
      where: { id: paperProjectBridgeId },
      data: {
        paperProjectIntakeRef: toJsonValue(input.paper_project_intake_ref),
        targetPaperProjectRef: toJsonValue(input.target_paper_project_ref),
      },
    });
    return toBridgeRecord(updated);
  }

  private async createControlPlaneRecords(
    tx: Prisma.TransactionClient,
    controlPlane: TopicSelectionV1cPaperProjectBridgeControlPlanePersistence,
  ): Promise<void> {
    await tx.topicSelectionInputSnapshot.create({
      data: {
        id: controlPlane.input_snapshot.input_snapshot_id,
        workspaceId: controlPlane.input_snapshot.workspace_id ?? null,
        titleCardId: controlPlane.input_snapshot.title_card_id ?? null,
        targetRefType: controlPlane.input_snapshot.target_ref.ref_type,
        targetRefId: controlPlane.input_snapshot.target_ref.ref_id,
        targetVersionId: controlPlane.input_snapshot.target_ref.version_id ?? null,
        contextPolicyVersionId: controlPlane.input_snapshot.context_policy_version_id ?? null,
        policyVersion: controlPlane.input_snapshot.policy_version ?? null,
        snapshotHash: controlPlane.input_snapshot.snapshot_hash,
        sourceRefs: toJsonValue(controlPlane.input_snapshot.source_refs),
        permissionRefs: toJsonValue(controlPlane.input_snapshot.permission_refs),
        payload: toJsonValue(controlPlane.input_snapshot.payload),
        createdBy: controlPlane.input_snapshot.created_by,
        createdAt: new Date(controlPlane.input_snapshot.created_at),
      },
    });
    await tx.topicSelectionLlmWorkflowRun.create({
      data: {
        id: controlPlane.workflow_run.workflow_run_id,
        workspaceId: controlPlane.workflow_run.workspace_id ?? null,
        titleCardId: controlPlane.workflow_run.title_card_id ?? null,
        workflowKey: controlPlane.workflow_run.workflow_key,
        workflowProfileKey: controlPlane.workflow_run.workflow_profile_key,
        workflowProfileVersion: controlPlane.workflow_run.workflow_profile_version ?? null,
        inputSnapshotId: controlPlane.workflow_run.input_snapshot_id ?? null,
        status: controlPlane.workflow_run.status,
        providerId: controlPlane.workflow_run.provider_id ?? null,
        modelId: controlPlane.workflow_run.model_id ?? null,
        promptTemplateId: controlPlane.workflow_run.prompt_template_id ?? null,
        promptTemplateVersion: controlPlane.workflow_run.prompt_template_version ?? null,
        startedAt: new Date(controlPlane.workflow_run.started_at),
        finishedAt: controlPlane.workflow_run.finished_at
          ? new Date(controlPlane.workflow_run.finished_at)
          : null,
        telemetry: toJsonValue(controlPlane.workflow_run.telemetry),
        outputSummary: toJsonValue(controlPlane.workflow_run.output_summary),
        errorCode: controlPlane.workflow_run.error_code ?? null,
        errorMessage: controlPlane.workflow_run.error_message ?? null,
        createdBy: controlPlane.workflow_run.created_by,
      },
    });
    for (const artifactRef of controlPlane.artifact_refs) {
      await tx.topicSelectionArtifactRef.create({
        data: {
          id: artifactRef.artifact_ref_id,
          workspaceId: artifactRef.workspace_id ?? null,
          titleCardId: artifactRef.title_card_id ?? null,
          artifactKind: artifactRef.artifact_kind,
          storageKind: artifactRef.storage_kind,
          uri: artifactRef.uri ?? null,
          payload: artifactRef.payload === null || artifactRef.payload === undefined
            ? undefined
            : toJsonValue(artifactRef.payload),
          checksum: artifactRef.checksum ?? null,
          byteSize: artifactRef.byte_size ?? null,
          mimeType: artifactRef.mime_type ?? null,
          workflowRunId: artifactRef.workflow_run_id ?? null,
          inputSnapshotId: artifactRef.input_snapshot_id ?? null,
          createdBy: artifactRef.created_by,
          createdAt: new Date(artifactRef.created_at),
        },
      });
    }
    await tx.topicSelectionReadinessGateResult.create({
      data: {
        id: controlPlane.readiness_gate_result.readiness_gate_result_id,
        workspaceId: controlPlane.readiness_gate_result.workspace_id ?? null,
        titleCardId: controlPlane.readiness_gate_result.title_card_id ?? null,
        gateKey: controlPlane.readiness_gate_result.gate_key,
        targetRefType: controlPlane.readiness_gate_result.target_ref.ref_type,
        targetRefId: controlPlane.readiness_gate_result.target_ref.ref_id,
        targetVersionId: controlPlane.readiness_gate_result.target_ref.version_id ?? null,
        inputSnapshotId: controlPlane.readiness_gate_result.input_snapshot_id ?? null,
        workflowRunId: controlPlane.readiness_gate_result.workflow_run_id ?? null,
        policyVersionId: controlPlane.readiness_gate_result.policy_version_id ?? null,
        verdict: controlPlane.readiness_gate_result.verdict,
        blockers: toJsonValue(controlPlane.readiness_gate_result.blockers),
        warnings: toJsonValue(controlPlane.readiness_gate_result.warnings),
        requiredActions: toJsonValue(controlPlane.readiness_gate_result.required_actions),
        loopbackTarget: controlPlane.readiness_gate_result.loopback_target
          ? toJsonValue(controlPlane.readiness_gate_result.loopback_target)
          : undefined,
        acceptedRiskRefs: toJsonValue(controlPlane.readiness_gate_result.accepted_risk_refs),
        qualitySignalRefs: toJsonValue(controlPlane.readiness_gate_result.quality_signal_refs),
        createdBy: controlPlane.readiness_gate_result.created_by,
        createdAt: new Date(controlPlane.readiness_gate_result.created_at),
      },
    });
    await tx.topicSelectionChainTransitionAttempt.create({
      data: {
        id: controlPlane.transition_attempt.chain_transition_attempt_id,
        workspaceId: controlPlane.transition_attempt.workspace_id ?? null,
        titleCardId: controlPlane.transition_attempt.title_card_id ?? null,
        transitionKey: controlPlane.transition_attempt.transition_key,
        sourceRefType: controlPlane.transition_attempt.source_ref.ref_type,
        sourceRefId: controlPlane.transition_attempt.source_ref.ref_id,
        sourceVersionId: controlPlane.transition_attempt.source_ref.version_id ?? null,
        targetRefType: controlPlane.transition_attempt.target_ref?.ref_type ?? null,
        targetRefId: controlPlane.transition_attempt.target_ref?.ref_id ?? null,
        targetVersionId: controlPlane.transition_attempt.target_ref?.version_id ?? null,
        gateResultId: controlPlane.transition_attempt.gate_result_id ?? null,
        workflowRunId: controlPlane.transition_attempt.workflow_run_id ?? null,
        inputSnapshotId: controlPlane.transition_attempt.input_snapshot_id ?? null,
        policyVersionId: controlPlane.transition_attempt.policy_version_id ?? null,
        actorType: controlPlane.transition_attempt.actor.actor_type,
        actorId: controlPlane.transition_attempt.actor.actor_id ?? null,
        result: controlPlane.transition_attempt.result,
        reason: controlPlane.transition_attempt.reason,
        requiredActions: toJsonValue(controlPlane.transition_attempt.required_actions),
        blockers: toJsonValue(controlPlane.transition_attempt.blockers),
        acceptedRiskRefs: toJsonValue(controlPlane.transition_attempt.accepted_risk_refs),
        stateWriteIntents: toJsonValue(controlPlane.transition_attempt.state_write_intents),
        createdAuthorityRefs: toJsonValue(controlPlane.transition_attempt.created_authority_refs),
        createdAt: new Date(controlPlane.transition_attempt.created_at),
      },
    });
    await tx.topicSelectionTraceSnapshot.create({
      data: {
        id: controlPlane.trace_snapshot.trace_snapshot_id,
        workspaceId: controlPlane.trace_snapshot.workspace_id ?? null,
        titleCardId: controlPlane.trace_snapshot.title_card_id ?? null,
        targetRefType: controlPlane.trace_snapshot.target_ref.ref_type,
        targetRefId: controlPlane.trace_snapshot.target_ref.ref_id,
        targetVersionId: controlPlane.trace_snapshot.target_ref.version_id ?? null,
        snapshotHash: controlPlane.trace_snapshot.snapshot_hash,
        objectRefs: toJsonValue(controlPlane.trace_snapshot.object_refs),
        lineageLinkRefs: toJsonValue(controlPlane.trace_snapshot.lineage_link_refs),
        artifactRefs: toJsonValue(controlPlane.trace_snapshot.artifact_refs),
        qualitySignalRefs: toJsonValue(controlPlane.trace_snapshot.quality_signal_refs),
        transitionAttemptRefs: toJsonValue(controlPlane.trace_snapshot.transition_attempt_refs),
        payload: toJsonValue(controlPlane.trace_snapshot.payload),
        createdBy: controlPlane.trace_snapshot.created_by,
        createdAt: new Date(controlPlane.trace_snapshot.created_at),
      },
    });
  }

  private toBridgeCreateInput(
    record: TopicSelectionPaperProjectBridgeRecord,
  ): Prisma.TopicSelectionPaperProjectBridgeCreateInput {
    return {
      id: record.paper_project_bridge_id,
      bridgeStatus: record.bridge_status,
      workspaceId: record.workspace_id ?? null,
      titleCardId: record.title_card_id,
      sourcePromotionDecisionId: record.source_promotion_decision_id,
      sourcePromotionDecisionRef: toJsonValue(record.source_promotion_decision_ref),
      humanPromotionDecisionRef: toJsonValue(record.human_promotion_decision_ref),
      humanConfirmedDecisionRef: toJsonValue(record.human_confirmed_decision_ref),
      promotionCommitmentProfileId: record.promotion_commitment_profile_id,
      promotionCommitmentProfileRef: toJsonValue(record.promotion_commitment_profile_ref),
      promotionGateCheckRef: toJsonValue(record.promotion_gate_check_ref),
      promotionInputSnapshotId: record.promotion_input_snapshot_id,
      promotionInputSnapshotRef: toJsonValue(record.promotion_input_snapshot_ref),
      promotionInputSnapshotHash: record.promotion_input_snapshot_hash,
      topicPackageId: record.topic_package_id,
      packageVersion: record.package_version,
      decision: record.decision,
      conditions: toJsonValue(record.conditions),
      acceptedRiskRefs: toJsonValue(record.accepted_risk_refs),
      allowedRefinements: toJsonValue(record.allowed_refinements),
      earlyCheckObligations: record.early_check_obligations,
      stopConditions: toJsonValue(record.stop_conditions),
      reopenConditions: toJsonValue(record.reopen_conditions),
      sourceRefs: toJsonValue(record.source_refs),
      snapshotHashes: toJsonValue(record.snapshot_hashes),
      workingCopyPayload: toJsonValue(record.working_copy_payload),
      workingCopyPayloadHash: record.working_copy_payload_hash,
      bridgePayloadHash: record.bridge_payload_hash,
      paperProjectIntakeRef: record.paper_project_intake_ref
        ? toJsonValue(record.paper_project_intake_ref)
        : undefined,
      targetPaperProjectRef: record.target_paper_project_ref
        ? toJsonValue(record.target_paper_project_ref)
        : undefined,
      sourcePromotionHandoff: toJsonValue(record.source_promotion_handoff),
      inputSnapshotId: record.input_snapshot_id ?? null,
      workflowRunId: record.workflow_run_id ?? null,
      gateResultId: record.gate_result_id ?? null,
      transitionAttemptId: record.transition_attempt_id ?? null,
      traceSnapshotId: record.trace_snapshot_id ?? null,
      artifactRefs: toJsonValue(record.artifact_refs),
      policyVersionId: record.policy_version_id ?? null,
      createdBy: record.created_by,
      createdAt: new Date(record.created_at),
    };
  }

  private isSourcePromotionDecisionUniqueConflict(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return false;
    }
    const target = error.meta?.target;
    return Array.isArray(target)
      ? target.includes('sourcePromotionDecisionId')
      : target === 'sourcePromotionDecisionId';
  }
}
