import type {
  PaperImplementationFeedbackEvent as FeedbackEventRow,
  PaperImplementationIntakeSnapshot as IntakeSnapshotRow,
  PaperImplementationProject as ProjectRow,
  PrismaClient,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
  ImplementationFeedbackEvent,
  ImplementationIntakeSnapshot,
  ImplementationProject,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-contracts';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionPaperProjectBridgeHandoff,
  TopicSelectionPaperProjectBridgeWorkingCopyPayload,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-paper-project-bridge-contracts';
import type {
  TopicSelectionDownstreamFeedbackImpactSummary,
  TopicSelectionDownstreamRecheckRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-downstream-feedback-recheck-contracts';
import type {
  TopicSelectionPromotionBridgeHandoff,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-human-promotion-decision-contracts';
import type {
  PaperImplementationBootstrapPersistence,
  PaperImplementationBootstrapResult,
  PaperImplementationRepository,
} from '../paper-implementation.repository.js';
import { AppError } from '../../errors/app-error.js';

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
  return value === null || value === undefined ? null : asFunctionalRef(value);
}

function asNullableRecord<T>(value: unknown): T | null {
  return value === null || value === undefined ? null : asRecord(value) as unknown as T;
}

function toProject(row: ProjectRow): ImplementationProject {
  return {
    implementation_project_id: row.id,
    intake_snapshot_id: row.intakeSnapshotId,
    workspace_id: row.workspaceId,
    title_card_id: row.titleCardId,
    paper_project_bridge_id: row.paperProjectBridgeId,
    bridge_payload_hash: row.bridgePayloadHash,
    target_paper_project_ref: asNullableFunctionalRef(row.targetPaperProjectRef),
    lifecycle_status: row.lifecycleStatus as ImplementationProject['lifecycle_status'],
    freshness_status: row.freshnessStatus as ImplementationProject['freshness_status'],
    source_status: row.sourceStatus as ImplementationProject['source_status'],
    version_number: row.versionNumber,
    policy_version_id: row.policyVersionId,
    created_by: row.createdBy as ImplementationProject['created_by'],
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function toIntakeSnapshot(row: IntakeSnapshotRow): ImplementationIntakeSnapshot {
  return {
    intake_snapshot_id: row.id,
    implementation_project_id: row.implementationProjectId,
    workspace_id: row.workspaceId,
    title_card_id: row.titleCardId,
    paper_project_bridge_id: row.paperProjectBridgeId,
    paper_project_bridge_ref: asFunctionalRef(row.paperProjectBridgeRef),
    bridge_payload_hash: row.bridgePayloadHash,
    promotion_decision_id: row.promotionDecisionId,
    promotion_decision_ref: asFunctionalRef(row.promotionDecisionRef),
    promotion_commitment_profile_id: row.promotionCommitmentProfileId,
    promotion_commitment_profile_ref: asFunctionalRef(row.promotionCommitmentProfileRef),
    promotion_input_snapshot_id: row.promotionInputSnapshotId,
    promotion_input_snapshot_ref: asFunctionalRef(row.promotionInputSnapshotRef),
    promotion_input_snapshot_hash: row.promotionInputSnapshotHash,
    topic_package_id: row.topicPackageId,
    package_version: row.packageVersion,
    source_status: row.sourceStatus as ImplementationIntakeSnapshot['source_status'],
    snapshot_hashes: asRecord(row.snapshotHashes) as TopicSelectionPromotionBridgeHandoff['snapshot_hashes'],
    source_refs: asArray<TopicSelectionFunctionalRef>(row.sourceRefs),
    accepted_risk_refs: asArray<TopicSelectionFunctionalRef>(row.acceptedRiskRefs),
    condition_refs: asArray<TopicSelectionFunctionalRef>(row.conditionRefs),
    early_check_obligations: row.earlyCheckObligations,
    working_copy_payload: asRecord(row.workingCopyPayload) as unknown as TopicSelectionPaperProjectBridgeWorkingCopyPayload,
    working_copy_payload_hash: row.workingCopyPayloadHash,
    source_handoff: asRecord(row.sourceHandoff) as unknown as TopicSelectionPaperProjectBridgeHandoff,
    target_paper_project_ref: asNullableFunctionalRef(row.targetPaperProjectRef),
    intake_snapshot_hash: row.intakeSnapshotHash,
    policy_version_id: row.policyVersionId,
    created_by: row.createdBy as ImplementationIntakeSnapshot['created_by'],
    created_at: row.createdAt.toISOString(),
  };
}

function toFeedbackEvent(row: FeedbackEventRow): ImplementationFeedbackEvent {
  return {
    feedback_event_id: row.id,
    implementation_project_id: row.implementationProjectId,
    intake_snapshot_id: row.intakeSnapshotId,
    paper_project_bridge_id: row.paperProjectBridgeId,
    feedback_type: row.feedbackType as ImplementationFeedbackEvent['feedback_type'],
    severity: row.severity as ImplementationFeedbackEvent['severity'],
    summary: row.summary,
    source_object_refs: asArray<TopicSelectionFunctionalRef>(row.sourceObjectRefs),
    evidence_refs: asArray<TopicSelectionFunctionalRef>(row.evidenceRefs),
    run_refs: asArray<TopicSelectionFunctionalRef>(row.runRefs),
    recommended_upstream_action: row.recommendedUpstreamAction as ImplementationFeedbackEvent['recommended_upstream_action'],
    feedback_status: row.feedbackStatus as ImplementationFeedbackEvent['feedback_status'],
    downstream_topic_feedback_ref: asNullableFunctionalRef(row.downstreamTopicFeedbackRef),
    downstream_recheck_request: asNullableRecord<TopicSelectionDownstreamRecheckRequest>(row.downstreamRecheckRequest),
    downstream_impact_summary: asNullableRecord<TopicSelectionDownstreamFeedbackImpactSummary>(row.downstreamImpactSummary),
    artifact_refs: asArray<TopicSelectionFunctionalRef>(row.artifactRefs),
    payload: asRecord(row.payload),
    policy_version_id: row.policyVersionId,
    created_by: row.createdBy as ImplementationFeedbackEvent['created_by'],
    created_at: row.createdAt.toISOString(),
  };
}

export class PrismaPaperImplementationRepository
implements PaperImplementationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createBootstrap(
    persistence: PaperImplementationBootstrapPersistence,
  ): Promise<PaperImplementationBootstrapResult> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.paperImplementationIntakeSnapshot.create({
          data: this.toIntakeSnapshotCreateInput(persistence.intake_snapshot),
        });
        await tx.paperImplementationProject.create({
          data: this.toProjectCreateInput(persistence.implementation_project),
        });
      });
      return {
        ...persistence,
        created: true,
      };
    } catch (error) {
      if (!this.isBootstrapUniqueConflict(error)) {
        throw error;
      }
      const existingProject = await this.findProjectByBridgeId(
        persistence.implementation_project.paper_project_bridge_id,
      );
      if (!existingProject) {
        throw error;
      }
      if (existingProject.bridge_payload_hash !== persistence.implementation_project.bridge_payload_hash) {
        throw new AppError(
          409,
          'VERSION_CONFLICT',
          `ImplementationProject ${existingProject.implementation_project_id} already admits PaperProjectBridge ${existingProject.paper_project_bridge_id} at a different bridge_payload_hash.`,
          {
            implementation_project_id: existingProject.implementation_project_id,
            admitted_bridge_payload_hash: existingProject.bridge_payload_hash,
            requested_bridge_payload_hash: persistence.implementation_project.bridge_payload_hash,
          },
        );
      }
      const existingSnapshot = await this.findIntakeSnapshotByProjectId(
        existingProject.implementation_project_id,
      );
      if (!existingSnapshot) {
        throw new AppError(
          409,
          'GATE_CONSTRAINT_FAILED',
          `ImplementationProject ${existingProject.implementation_project_id} is missing its intake snapshot.`,
        );
      }
      return {
        implementation_project: existingProject,
        intake_snapshot: existingSnapshot,
        created: false,
      };
    }
  }

  async findProjectById(
    implementationProjectId: string,
  ): Promise<ImplementationProject | null> {
    const row = await this.prisma.paperImplementationProject.findUnique({
      where: { id: implementationProjectId },
    });
    return row ? toProject(row) : null;
  }

  async findProjectByBridgeId(
    paperProjectBridgeId: string,
  ): Promise<ImplementationProject | null> {
    const row = await this.prisma.paperImplementationProject.findUnique({
      where: { paperProjectBridgeId },
    });
    return row ? toProject(row) : null;
  }

  async findIntakeSnapshotById(
    intakeSnapshotId: string,
  ): Promise<ImplementationIntakeSnapshot | null> {
    const row = await this.prisma.paperImplementationIntakeSnapshot.findUnique({
      where: { id: intakeSnapshotId },
    });
    return row ? toIntakeSnapshot(row) : null;
  }

  async findIntakeSnapshotByProjectId(
    implementationProjectId: string,
  ): Promise<ImplementationIntakeSnapshot | null> {
    const row = await this.prisma.paperImplementationIntakeSnapshot.findUnique({
      where: { implementationProjectId },
    });
    return row ? toIntakeSnapshot(row) : null;
  }

  async createFeedbackEvent(
    event: ImplementationFeedbackEvent,
  ): Promise<ImplementationFeedbackEvent> {
    const row = await this.prisma.paperImplementationFeedbackEvent.create({
      data: this.toFeedbackEventCreateInput(event),
    });
    return toFeedbackEvent(row);
  }

  private isBootstrapUniqueConflict(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return false;
    }
    const target = error.meta?.target;
    const targetValues = Array.isArray(target)
      ? target.map((value) => String(value))
      : target
        ? [String(target)]
        : [];
    return targetValues.some((value) => [
      'id',
      'implementationProjectId',
      'intakeSnapshotId',
      'paperProjectBridgeId',
      'implementation_project_id',
      'intake_snapshot_id',
      'paper_project_bridge_id',
      'PaperImplementationProject_paperProjectBridgeId_key',
      'PaperImplementationProject_intakeSnapshotId_key',
      'PaperImplementationIntakeSnapshot_implementationProjectId_key',
      'pip_bridge_unique',
      'pip_intake_snapshot_unique',
      'piis_project_unique',
    ].includes(value));
  }

  private toProjectCreateInput(
    project: ImplementationProject,
  ): Prisma.PaperImplementationProjectCreateInput {
    return {
      id: project.implementation_project_id,
      intakeSnapshotId: project.intake_snapshot_id,
      workspaceId: project.workspace_id ?? null,
      titleCardId: project.title_card_id,
      paperProjectBridgeId: project.paper_project_bridge_id,
      bridgePayloadHash: project.bridge_payload_hash,
      targetPaperProjectRef: project.target_paper_project_ref
        ? toJsonValue(project.target_paper_project_ref)
        : undefined,
      lifecycleStatus: project.lifecycle_status,
      freshnessStatus: project.freshness_status,
      sourceStatus: project.source_status,
      versionNumber: project.version_number,
      policyVersionId: project.policy_version_id ?? null,
      createdBy: project.created_by,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    };
  }

  private toIntakeSnapshotCreateInput(
    snapshot: ImplementationIntakeSnapshot,
  ): Prisma.PaperImplementationIntakeSnapshotCreateInput {
    return {
      id: snapshot.intake_snapshot_id,
      implementationProjectId: snapshot.implementation_project_id,
      workspaceId: snapshot.workspace_id ?? null,
      titleCardId: snapshot.title_card_id,
      paperProjectBridgeId: snapshot.paper_project_bridge_id,
      paperProjectBridgeRef: toJsonValue(snapshot.paper_project_bridge_ref),
      bridgePayloadHash: snapshot.bridge_payload_hash,
      promotionDecisionId: snapshot.promotion_decision_id,
      promotionDecisionRef: toJsonValue(snapshot.promotion_decision_ref),
      promotionCommitmentProfileId: snapshot.promotion_commitment_profile_id,
      promotionCommitmentProfileRef: toJsonValue(snapshot.promotion_commitment_profile_ref),
      promotionInputSnapshotId: snapshot.promotion_input_snapshot_id,
      promotionInputSnapshotRef: toJsonValue(snapshot.promotion_input_snapshot_ref),
      promotionInputSnapshotHash: snapshot.promotion_input_snapshot_hash,
      topicPackageId: snapshot.topic_package_id,
      packageVersion: snapshot.package_version,
      sourceStatus: snapshot.source_status,
      snapshotHashes: toJsonValue(snapshot.snapshot_hashes),
      sourceRefs: toJsonValue(snapshot.source_refs),
      acceptedRiskRefs: toJsonValue(snapshot.accepted_risk_refs),
      conditionRefs: toJsonValue(snapshot.condition_refs),
      earlyCheckObligations: snapshot.early_check_obligations,
      workingCopyPayload: toJsonValue(snapshot.working_copy_payload),
      workingCopyPayloadHash: snapshot.working_copy_payload_hash,
      sourceHandoff: toJsonValue(snapshot.source_handoff),
      targetPaperProjectRef: snapshot.target_paper_project_ref
        ? toJsonValue(snapshot.target_paper_project_ref)
        : undefined,
      intakeSnapshotHash: snapshot.intake_snapshot_hash,
      policyVersionId: snapshot.policy_version_id ?? null,
      createdBy: snapshot.created_by,
      createdAt: new Date(snapshot.created_at),
    };
  }

  private toFeedbackEventCreateInput(
    event: ImplementationFeedbackEvent,
  ): Prisma.PaperImplementationFeedbackEventCreateInput {
    return {
      id: event.feedback_event_id,
      implementationProjectId: event.implementation_project_id,
      intakeSnapshotId: event.intake_snapshot_id,
      paperProjectBridgeId: event.paper_project_bridge_id,
      feedbackType: event.feedback_type,
      severity: event.severity,
      summary: event.summary,
      sourceObjectRefs: toJsonValue(event.source_object_refs),
      evidenceRefs: toJsonValue(event.evidence_refs),
      runRefs: toJsonValue(event.run_refs),
      recommendedUpstreamAction: event.recommended_upstream_action,
      feedbackStatus: event.feedback_status,
      downstreamTopicFeedbackRef: event.downstream_topic_feedback_ref
        ? toJsonValue(event.downstream_topic_feedback_ref)
        : undefined,
      downstreamRecheckRequest: event.downstream_recheck_request
        ? toJsonValue(event.downstream_recheck_request)
        : undefined,
      downstreamImpactSummary: event.downstream_impact_summary
        ? toJsonValue(event.downstream_impact_summary)
        : undefined,
      artifactRefs: toJsonValue(event.artifact_refs),
      payload: toJsonValue(event.payload),
      policyVersionId: event.policy_version_id ?? null,
      createdBy: event.created_by,
      createdAt: new Date(event.created_at),
    };
  }
}
