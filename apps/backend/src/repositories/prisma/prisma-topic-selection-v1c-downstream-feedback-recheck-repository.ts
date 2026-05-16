import type {
  PrismaClient,
  TopicSelectionDownstreamTopicFeedback as DownstreamTopicFeedbackRow,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionDownstreamFeedbackImpactSummary,
  TopicSelectionDownstreamRecheckRequest,
  TopicSelectionDownstreamTopicFeedbackRecord,
  TopicSelectionLoopbackClassification,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-downstream-feedback-recheck-contracts';
import type {
  TopicSelectionV1cDownstreamFeedbackRecheckRepository,
} from '../topic-selection-v1c-downstream-feedback-recheck.repository.js';

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

function asNullableRecheckRequest(value: unknown): TopicSelectionDownstreamRecheckRequest | null {
  return value === null || value === undefined
    ? null
    : asRecord(value) as unknown as TopicSelectionDownstreamRecheckRequest;
}

function toFeedbackRecord(
  row: DownstreamTopicFeedbackRow,
): TopicSelectionDownstreamTopicFeedbackRecord {
  return {
    downstream_topic_feedback_id: row.id,
    feedback_fingerprint: row.feedbackFingerprint,
    workspace_id: row.workspaceId,
    title_card_id: row.titleCardId,
    paper_project_bridge_id: row.paperProjectBridgeId,
    paper_project_bridge_ref: asFunctionalRef(row.paperProjectBridgeRef),
    source_promotion_decision_ref: asFunctionalRef(row.sourcePromotionDecisionRef),
    promotion_commitment_profile_ref: asFunctionalRef(row.promotionCommitmentProfileRef),
    promotion_input_snapshot_id: row.promotionInputSnapshotId,
    promotion_input_snapshot_ref: asFunctionalRef(row.promotionInputSnapshotRef),
    promotion_input_snapshot_hash: row.promotionInputSnapshotHash,
    topic_package_id: row.topicPackageId,
    package_version: row.packageVersion,
    downstream_source_kind: row.downstreamSourceKind as TopicSelectionDownstreamTopicFeedbackRecord['downstream_source_kind'],
    downstream_source_ref: asFunctionalRef(row.downstreamSourceRef),
    source_feedback_refs: asArray<TopicSelectionFunctionalRef>(row.sourceFeedbackRefs),
    observed_blocker_refs: asArray<TopicSelectionFunctionalRef>(row.observedBlockerRefs),
    feedback_signal: row.feedbackSignal as TopicSelectionDownstreamTopicFeedbackRecord['feedback_signal'],
    severity: row.severity as TopicSelectionDownstreamTopicFeedbackRecord['severity'],
    summary: row.summary,
    required_action: row.requiredAction,
    classification: asRecord(row.classification) as unknown as TopicSelectionLoopbackClassification,
    recheck_request: asNullableRecheckRequest(row.recheckRequest),
    impact_summary: asRecord(row.impactSummary) as unknown as TopicSelectionDownstreamFeedbackImpactSummary,
    recheck_event_ref: asNullableFunctionalRef(row.recheckEventRef),
    recheck_impact_ref: asNullableFunctionalRef(row.recheckImpactRef),
    decision_work_queue_item_ref: asNullableFunctionalRef(row.decisionWorkQueueItemRef),
    artifact_refs: asArray<TopicSelectionFunctionalRef>(row.artifactRefs),
    payload: asRecord(row.payload),
    policy_version_id: row.policyVersionId,
    created_by: row.createdBy as TopicSelectionDownstreamTopicFeedbackRecord['created_by'],
    created_at: row.createdAt.toISOString(),
  };
}

export class PrismaTopicSelectionV1cDownstreamFeedbackRecheckRepository
implements TopicSelectionV1cDownstreamFeedbackRecheckRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createFeedback(
    record: TopicSelectionDownstreamTopicFeedbackRecord,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord> {
    await this.prisma.topicSelectionDownstreamTopicFeedback.create({
      data: this.toCreateInput(record),
    });
    return record;
  }

  async findFeedbackById(
    downstreamTopicFeedbackId: string,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord | null> {
    const row = await this.prisma.topicSelectionDownstreamTopicFeedback.findUnique({
      where: { id: downstreamTopicFeedbackId },
    });
    return row ? toFeedbackRecord(row) : null;
  }

  async findFeedbackByRecheckRequestId(
    downstreamRecheckRequestId: string,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord | null> {
    const row = await this.prisma.topicSelectionDownstreamTopicFeedback.findFirst({
      where: {
        recheckRequest: {
          path: ['downstream_recheck_request_id'],
          equals: downstreamRecheckRequestId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return row ? toFeedbackRecord(row) : null;
  }

  async listFeedbackByBridgeId(
    paperProjectBridgeId: string,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord[]> {
    const rows = await this.prisma.topicSelectionDownstreamTopicFeedback.findMany({
      where: { paperProjectBridgeId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toFeedbackRecord);
  }

  private toCreateInput(
    record: TopicSelectionDownstreamTopicFeedbackRecord,
  ): Prisma.TopicSelectionDownstreamTopicFeedbackCreateInput {
    return {
      id: record.downstream_topic_feedback_id,
      feedbackFingerprint: record.feedback_fingerprint,
      workspaceId: record.workspace_id ?? null,
      titleCardId: record.title_card_id ?? null,
      paperProjectBridgeId: record.paper_project_bridge_id,
      paperProjectBridgeRef: toJsonValue(record.paper_project_bridge_ref),
      sourcePromotionDecisionRef: toJsonValue(record.source_promotion_decision_ref),
      promotionCommitmentProfileRef: toJsonValue(record.promotion_commitment_profile_ref),
      promotionInputSnapshotId: record.promotion_input_snapshot_id,
      promotionInputSnapshotRef: toJsonValue(record.promotion_input_snapshot_ref),
      promotionInputSnapshotHash: record.promotion_input_snapshot_hash,
      topicPackageId: record.topic_package_id,
      packageVersion: record.package_version,
      downstreamSourceKind: record.downstream_source_kind,
      downstreamSourceRef: toJsonValue(record.downstream_source_ref),
      sourceFeedbackRefs: toJsonValue(record.source_feedback_refs),
      observedBlockerRefs: toJsonValue(record.observed_blocker_refs),
      feedbackSignal: record.feedback_signal,
      severity: record.severity,
      summary: record.summary,
      requiredAction: record.required_action ?? null,
      classification: toJsonValue(record.classification),
      recheckRequest: record.recheck_request ? toJsonValue(record.recheck_request) : undefined,
      impactSummary: toJsonValue(record.impact_summary),
      recheckEventRef: record.recheck_event_ref ? toJsonValue(record.recheck_event_ref) : undefined,
      recheckImpactRef: record.recheck_impact_ref ? toJsonValue(record.recheck_impact_ref) : undefined,
      decisionWorkQueueItemRef: record.decision_work_queue_item_ref
        ? toJsonValue(record.decision_work_queue_item_ref)
        : undefined,
      artifactRefs: toJsonValue(record.artifact_refs),
      payload: toJsonValue(record.payload),
      policyVersionId: record.policy_version_id ?? null,
      createdBy: record.created_by,
      createdAt: new Date(record.created_at),
    };
  }
}
