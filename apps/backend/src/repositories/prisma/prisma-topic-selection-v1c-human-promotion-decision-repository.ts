import type {
  PrismaClient,
  TopicSelectionHumanPromotionDecision as HumanPromotionDecisionRow,
  TopicSelectionPromotionCommitmentProfile as PromotionCommitmentProfileRow,
  TopicSelectionPromotionDecision as PromotionDecisionRow,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
  TopicSelectionActorRef,
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionAllowedPromotionRefinement,
  TopicSelectionHumanPromotionDecisionRecord,
  TopicSelectionPromotionCommitmentProfileRecord,
  TopicSelectionPromotionCondition,
  TopicSelectionPromotionDecisionRecord,
  TopicSelectionPromotionStopOrReopenCondition,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-human-promotion-decision-contracts';
import type {
  TopicSelectionPromotionGateRequiredAction,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-promotion-gate-contracts';
import {
  TopicSelectionV1cHumanPromotionDecisionCurrentConflictError,
  type TopicSelectionV1cHumanPromotionDecisionControlPlanePersistence,
  type TopicSelectionV1cHumanPromotionDecisionPersistenceBundle,
  type TopicSelectionV1cHumanPromotionDecisionRecordBundle,
  type TopicSelectionV1cHumanPromotionDecisionRepository,
} from '../topic-selection-v1c-human-promotion-decision.repository.js';

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

function toHumanPromotionDecisionRecord(
  row: HumanPromotionDecisionRow,
): TopicSelectionHumanPromotionDecisionRecord {
  return {
    human_promotion_decision_id: row.id,
    human_confirmed_decision_id: row.humanConfirmedDecisionId,
    human_promotion_decision_key: row.humanPromotionDecisionKey,
    workspace_id: row.workspaceId,
    title_card_id: row.titleCardId,
    promotion_gate_check_id: row.promotionGateCheckId,
    promotion_gate_check_ref: asFunctionalRef(row.promotionGateCheckRef),
    promotion_input_snapshot_id: row.promotionInputSnapshotId,
    promotion_input_snapshot_hash: row.promotionInputSnapshotHash,
    decision: row.decision as TopicSelectionHumanPromotionDecisionRecord['decision'],
    decision_class: row.decisionClass as TopicSelectionHumanPromotionDecisionRecord['decision_class'],
    actor: asRecord(row.actor) as unknown as TopicSelectionActorRef,
    decision_timestamp: row.decisionTimestamp.toISOString(),
    confirmed_snapshot_hash: row.confirmedSnapshotHash,
    rationale: row.rationale,
    conditions: asArray<TopicSelectionPromotionCondition>(row.conditions),
    required_actions: asArray<TopicSelectionPromotionGateRequiredAction>(row.requiredActions),
    loopback_target: row.loopbackTarget as TopicSelectionHumanPromotionDecisionRecord['loopback_target'],
    loopback_refs: asArray<TopicSelectionFunctionalRef>(row.loopbackRefs),
    accepted_risk_refs: asArray<TopicSelectionFunctionalRef>(row.acceptedRiskRefs),
    allowed_refinements: asArray<TopicSelectionAllowedPromotionRefinement>(row.allowedRefinements),
    stop_conditions: asArray<TopicSelectionPromotionStopOrReopenCondition>(row.stopConditions),
    reopen_conditions: asArray<TopicSelectionPromotionStopOrReopenCondition>(row.reopenConditions),
    source_refs: asArray<TopicSelectionFunctionalRef>(row.sourceRefs),
    input_snapshot_id: row.inputSnapshotId,
    workflow_run_id: row.workflowRunId,
    gate_result_id: row.gateResultId,
    transition_attempt_id: row.transitionAttemptId,
    trace_snapshot_id: row.traceSnapshotId,
    artifact_refs: asArray<TopicSelectionFunctionalRef>(row.artifactRefs),
    policy_version_id: row.policyVersionId,
    created_at: row.createdAt.toISOString(),
  };
}

function toPromotionDecisionRecord(
  row: PromotionDecisionRow,
): TopicSelectionPromotionDecisionRecord {
  return {
    promotion_decision_id: row.id,
    promotion_decision_status: row.promotionDecisionStatus as TopicSelectionPromotionDecisionRecord['promotion_decision_status'],
    current_promotion_input_snapshot_key: row.currentPromotionInputSnapshotKey,
    human_promotion_decision_id: row.humanPromotionDecisionId,
    human_confirmed_decision_id: row.humanConfirmedDecisionId,
    workspace_id: row.workspaceId,
    title_card_id: row.titleCardId,
    promotion_gate_check_id: row.promotionGateCheckId,
    promotion_input_snapshot_id: row.promotionInputSnapshotId,
    promotion_input_snapshot_hash: row.promotionInputSnapshotHash,
    gate_disposition: row.gateDisposition as TopicSelectionPromotionDecisionRecord['gate_disposition'],
    decision: row.decision as TopicSelectionPromotionDecisionRecord['decision'],
    decision_class: row.decisionClass as TopicSelectionPromotionDecisionRecord['decision_class'],
    bridge_eligible: row.bridgeEligible,
    promotion_commitment_profile_id: row.promotionCommitmentProfileId,
    loopback_target: row.loopbackTarget as TopicSelectionPromotionDecisionRecord['loopback_target'],
    required_actions: asArray<TopicSelectionPromotionGateRequiredAction>(row.requiredActions),
    accepted_risk_refs: asArray<TopicSelectionFunctionalRef>(row.acceptedRiskRefs),
    conditions: asArray<TopicSelectionPromotionCondition>(row.conditions),
    source_refs: asArray<TopicSelectionFunctionalRef>(row.sourceRefs),
    snapshot_hashes: asRecord(row.snapshotHashes) as TopicSelectionPromotionDecisionRecord['snapshot_hashes'],
    artifact_refs: asArray<TopicSelectionFunctionalRef>(row.artifactRefs),
    created_at: row.createdAt.toISOString(),
  };
}

function toCommitmentProfileRecord(
  row: PromotionCommitmentProfileRow,
): TopicSelectionPromotionCommitmentProfileRecord {
  return {
    promotion_commitment_profile_id: row.id,
    promotion_decision_id: row.promotionDecisionId,
    human_promotion_decision_id: row.humanPromotionDecisionId,
    human_confirmed_decision_id: row.humanConfirmedDecisionId,
    workspace_id: row.workspaceId,
    title_card_id: row.titleCardId,
    promotion_gate_check_id: row.promotionGateCheckId,
    promotion_input_snapshot_id: row.promotionInputSnapshotId,
    promotion_input_snapshot_hash: row.promotionInputSnapshotHash,
    topic_package_id: row.topicPackageId,
    package_version: row.packageVersion,
    scope: asRecord(row.scope),
    claim_ceiling: row.claimCeiling,
    prohibited_claims: row.prohibitedClaims,
    accepted_risk_refs: asArray<TopicSelectionFunctionalRef>(row.acceptedRiskRefs),
    conditions: asArray<TopicSelectionPromotionCondition>(row.conditions),
    allowed_refinements: asArray<TopicSelectionAllowedPromotionRefinement>(row.allowedRefinements),
    early_check_obligations: row.earlyCheckObligations,
    stop_conditions: asArray<TopicSelectionPromotionStopOrReopenCondition>(row.stopConditions),
    reopen_conditions: asArray<TopicSelectionPromotionStopOrReopenCondition>(row.reopenConditions),
    source_refs: asArray<TopicSelectionFunctionalRef>(row.sourceRefs),
    snapshot_hashes: asRecord(row.snapshotHashes) as TopicSelectionPromotionCommitmentProfileRecord['snapshot_hashes'],
    artifact_refs: asArray<TopicSelectionFunctionalRef>(row.artifactRefs),
    created_at: row.createdAt.toISOString(),
  };
}

export class PrismaTopicSelectionV1cHumanPromotionDecisionRepository
implements TopicSelectionV1cHumanPromotionDecisionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createBundle(
    persistence: TopicSelectionV1cHumanPromotionDecisionPersistenceBundle,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.createControlPlaneRecords(tx, persistence.control_plane);
        await tx.topicSelectionHumanPromotionDecision.create({
          data: this.toHumanPromotionDecisionCreateInput(
            persistence.human_promotion_decision,
          ),
        });
        await tx.topicSelectionPromotionDecision.create({
          data: this.toPromotionDecisionCreateInput(persistence.promotion_decision),
        });
        if (persistence.promotion_commitment_profile) {
          await tx.topicSelectionPromotionCommitmentProfile.create({
            data: this.toCommitmentProfileCreateInput(
              persistence.promotion_commitment_profile,
            ),
          });
        }
      });
    } catch (error) {
      if (this.isDecisionKeyUniqueConflict(error)) {
        const existing = await this.findBundleByHumanPromotionDecisionKey(
          persistence.human_promotion_decision.human_promotion_decision_key,
        );
        if (existing) {
          return existing;
        }
      }
      if (this.isCurrentSnapshotUniqueConflict(error)) {
        throw new TopicSelectionV1cHumanPromotionDecisionCurrentConflictError(
          persistence.promotion_decision.promotion_input_snapshot_id,
        );
      }
      throw error;
    }
    return {
      human_promotion_decision: persistence.human_promotion_decision,
      promotion_decision: persistence.promotion_decision,
      promotion_commitment_profile: persistence.promotion_commitment_profile ?? null,
    };
  }

  async findBundleByHumanPromotionDecisionKey(
    humanPromotionDecisionKey: string,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle | null> {
    const humanDecision = await this.prisma.topicSelectionHumanPromotionDecision.findUnique({
      where: { humanPromotionDecisionKey },
    });
    if (!humanDecision) {
      return null;
    }
    const promotionDecision = await this.prisma.topicSelectionPromotionDecision.findFirst({
      where: { humanPromotionDecisionId: humanDecision.id },
      orderBy: { createdAt: 'desc' },
    });
    return promotionDecision ? this.toRecordBundle(promotionDecision) : null;
  }

  async findCurrentBundleByPromotionInputSnapshotId(
    promotionInputSnapshotId: string,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle | null> {
    const promotionDecision = await this.prisma.topicSelectionPromotionDecision.findUnique({
      where: { currentPromotionInputSnapshotKey: promotionInputSnapshotId },
    });
    return promotionDecision ? this.toRecordBundle(promotionDecision) : null;
  }

  async findHumanPromotionDecisionById(
    humanPromotionDecisionId: string,
  ): Promise<TopicSelectionHumanPromotionDecisionRecord | null> {
    const row = await this.prisma.topicSelectionHumanPromotionDecision.findUnique({
      where: { id: humanPromotionDecisionId },
    });
    return row ? toHumanPromotionDecisionRecord(row) : null;
  }

  async findPromotionDecisionById(
    promotionDecisionId: string,
  ): Promise<TopicSelectionPromotionDecisionRecord | null> {
    const row = await this.prisma.topicSelectionPromotionDecision.findUnique({
      where: { id: promotionDecisionId },
    });
    return row ? toPromotionDecisionRecord(row) : null;
  }

  async findCommitmentProfileById(
    promotionCommitmentProfileId: string,
  ): Promise<TopicSelectionPromotionCommitmentProfileRecord | null> {
    const row = await this.prisma.topicSelectionPromotionCommitmentProfile.findUnique({
      where: { id: promotionCommitmentProfileId },
    });
    return row ? toCommitmentProfileRecord(row) : null;
  }

  async findBundleByPromotionDecisionId(
    promotionDecisionId: string,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle | null> {
    const promotionDecision = await this.prisma.topicSelectionPromotionDecision.findUnique({
      where: { id: promotionDecisionId },
    });
    return promotionDecision ? this.toRecordBundle(promotionDecision) : null;
  }

  async findBundleByGateCheckId(
    promotionGateCheckId: string,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle | null> {
    const promotionDecision = await this.prisma.topicSelectionPromotionDecision.findFirst({
      where: {
        promotionGateCheckId,
        promotionDecisionStatus: 'current',
      },
      orderBy: { createdAt: 'desc' },
    });
    return promotionDecision ? this.toRecordBundle(promotionDecision) : null;
  }

  private async toRecordBundle(
    promotionDecisionRow: PromotionDecisionRow,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle | null> {
    const [humanPromotionDecision, commitmentProfile] = await Promise.all([
      this.prisma.topicSelectionHumanPromotionDecision.findUnique({
        where: { id: promotionDecisionRow.humanPromotionDecisionId },
      }),
      promotionDecisionRow.promotionCommitmentProfileId
        ? this.prisma.topicSelectionPromotionCommitmentProfile.findUnique({
            where: { id: promotionDecisionRow.promotionCommitmentProfileId },
          })
        : Promise.resolve(null),
    ]);
    if (!humanPromotionDecision) {
      return null;
    }
    return {
      human_promotion_decision: toHumanPromotionDecisionRecord(humanPromotionDecision),
      promotion_decision: toPromotionDecisionRecord(promotionDecisionRow),
      promotion_commitment_profile: commitmentProfile
        ? toCommitmentProfileRecord(commitmentProfile)
        : null,
    };
  }

  private async createControlPlaneRecords(
    tx: Prisma.TransactionClient,
    controlPlane: TopicSelectionV1cHumanPromotionDecisionControlPlanePersistence,
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
    await tx.topicSelectionHumanConfirmedDecision.create({
      data: {
        id: controlPlane.human_confirmed_decision.human_confirmed_decision_id,
        workspaceId: controlPlane.human_confirmed_decision.workspace_id ?? null,
        titleCardId: controlPlane.human_confirmed_decision.title_card_id ?? null,
        targetRefType: controlPlane.human_confirmed_decision.target_ref.ref_type,
        targetRefId: controlPlane.human_confirmed_decision.target_ref.ref_id,
        targetVersionId: controlPlane.human_confirmed_decision.target_ref.version_id ?? null,
        decisionType: controlPlane.human_confirmed_decision.decision_type,
        actorType: controlPlane.human_confirmed_decision.actor.actor_type,
        actorId: controlPlane.human_confirmed_decision.actor.actor_id ?? null,
        rationale: controlPlane.human_confirmed_decision.rationale ?? null,
        artifactRefs: toJsonValue(controlPlane.human_confirmed_decision.artifact_refs),
        policyVersionId: controlPlane.human_confirmed_decision.policy_version_id ?? null,
        resultingAuthorityRefs: toJsonValue(
          controlPlane.human_confirmed_decision.resulting_authority_refs,
        ),
        createdAt: new Date(controlPlane.human_confirmed_decision.created_at),
      },
    });
  }

  private toHumanPromotionDecisionCreateInput(
    record: TopicSelectionHumanPromotionDecisionRecord,
  ): Prisma.TopicSelectionHumanPromotionDecisionCreateInput {
    return {
      id: record.human_promotion_decision_id,
      humanConfirmedDecisionId: record.human_confirmed_decision_id,
      humanPromotionDecisionKey: record.human_promotion_decision_key,
      workspaceId: record.workspace_id ?? null,
      titleCardId: record.title_card_id,
      promotionGateCheckId: record.promotion_gate_check_id,
      promotionGateCheckRef: toJsonValue(record.promotion_gate_check_ref),
      promotionInputSnapshotId: record.promotion_input_snapshot_id,
      promotionInputSnapshotHash: record.promotion_input_snapshot_hash,
      decision: record.decision,
      decisionClass: record.decision_class,
      actor: toJsonValue(record.actor),
      decisionTimestamp: new Date(record.decision_timestamp),
      confirmedSnapshotHash: record.confirmed_snapshot_hash,
      rationale: record.rationale,
      conditions: toJsonValue(record.conditions),
      requiredActions: toJsonValue(record.required_actions),
      loopbackTarget: record.loopback_target ?? null,
      loopbackRefs: toJsonValue(record.loopback_refs),
      acceptedRiskRefs: toJsonValue(record.accepted_risk_refs),
      allowedRefinements: toJsonValue(record.allowed_refinements),
      stopConditions: toJsonValue(record.stop_conditions),
      reopenConditions: toJsonValue(record.reopen_conditions),
      sourceRefs: toJsonValue(record.source_refs),
      inputSnapshotId: record.input_snapshot_id ?? null,
      workflowRunId: record.workflow_run_id ?? null,
      gateResultId: record.gate_result_id ?? null,
      transitionAttemptId: record.transition_attempt_id ?? null,
      traceSnapshotId: record.trace_snapshot_id ?? null,
      artifactRefs: toJsonValue(record.artifact_refs),
      policyVersionId: record.policy_version_id ?? null,
      createdAt: new Date(record.created_at),
    };
  }

  private toPromotionDecisionCreateInput(
    record: TopicSelectionPromotionDecisionRecord,
  ): Prisma.TopicSelectionPromotionDecisionCreateInput {
    return {
      id: record.promotion_decision_id,
      promotionDecisionStatus: record.promotion_decision_status,
      currentPromotionInputSnapshotKey: record.current_promotion_input_snapshot_key ?? null,
      humanPromotionDecisionId: record.human_promotion_decision_id,
      humanConfirmedDecisionId: record.human_confirmed_decision_id,
      workspaceId: record.workspace_id ?? null,
      titleCardId: record.title_card_id,
      promotionGateCheckId: record.promotion_gate_check_id,
      promotionInputSnapshotId: record.promotion_input_snapshot_id,
      promotionInputSnapshotHash: record.promotion_input_snapshot_hash,
      gateDisposition: record.gate_disposition,
      decision: record.decision,
      decisionClass: record.decision_class,
      bridgeEligible: record.bridge_eligible,
      promotionCommitmentProfileId: record.promotion_commitment_profile_id ?? null,
      loopbackTarget: record.loopback_target ?? null,
      requiredActions: toJsonValue(record.required_actions),
      acceptedRiskRefs: toJsonValue(record.accepted_risk_refs),
      conditions: toJsonValue(record.conditions),
      sourceRefs: toJsonValue(record.source_refs),
      snapshotHashes: toJsonValue(record.snapshot_hashes),
      artifactRefs: toJsonValue(record.artifact_refs),
      createdAt: new Date(record.created_at),
    };
  }

  private toCommitmentProfileCreateInput(
    record: TopicSelectionPromotionCommitmentProfileRecord,
  ): Prisma.TopicSelectionPromotionCommitmentProfileCreateInput {
    return {
      id: record.promotion_commitment_profile_id,
      promotionDecisionId: record.promotion_decision_id,
      humanPromotionDecisionId: record.human_promotion_decision_id,
      humanConfirmedDecisionId: record.human_confirmed_decision_id,
      workspaceId: record.workspace_id ?? null,
      titleCardId: record.title_card_id,
      promotionGateCheckId: record.promotion_gate_check_id,
      promotionInputSnapshotId: record.promotion_input_snapshot_id,
      promotionInputSnapshotHash: record.promotion_input_snapshot_hash,
      topicPackageId: record.topic_package_id,
      packageVersion: record.package_version,
      scope: toJsonValue(record.scope),
      claimCeiling: record.claim_ceiling,
      prohibitedClaims: record.prohibited_claims,
      acceptedRiskRefs: toJsonValue(record.accepted_risk_refs),
      conditions: toJsonValue(record.conditions),
      allowedRefinements: toJsonValue(record.allowed_refinements),
      earlyCheckObligations: record.early_check_obligations,
      stopConditions: toJsonValue(record.stop_conditions),
      reopenConditions: toJsonValue(record.reopen_conditions),
      sourceRefs: toJsonValue(record.source_refs),
      snapshotHashes: toJsonValue(record.snapshot_hashes),
      artifactRefs: toJsonValue(record.artifact_refs),
      createdAt: new Date(record.created_at),
    };
  }

  private isDecisionKeyUniqueConflict(error: unknown): boolean {
    return this.isUniqueConflictOnField(error, 'humanPromotionDecisionKey');
  }

  private isCurrentSnapshotUniqueConflict(error: unknown): boolean {
    return this.isUniqueConflictOnField(error, 'currentPromotionInputSnapshotKey');
  }

  private isUniqueConflictOnField(error: unknown, field: string): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return false;
    }
    const target = error.meta?.target;
    return Array.isArray(target)
      ? target.includes(field)
      : target === field;
  }
}
