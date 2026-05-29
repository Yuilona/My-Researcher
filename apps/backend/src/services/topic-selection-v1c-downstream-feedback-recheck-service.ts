import crypto from 'node:crypto';

import {
  TOPIC_SELECTION_ACTOR_TYPES,
  type TopicSelectionActorType,
  type TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionDecisionWorkQueueItemRecord,
  TopicSelectionImpactLevel,
  TopicSelectionRecheckEventRecord,
  TopicSelectionRecheckImpactRecord,
  TopicSelectionSeverity,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-recheck-risk-memory-contracts';
import type {
  TopicSelectionPaperProjectBridgeHandoff,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-paper-project-bridge-contracts';
import type {
  TopicSelectionDownstreamFeedbackImpactSummary,
  TopicSelectionDownstreamLoopbackCause,
  TopicSelectionDownstreamLoopbackTarget,
  TopicSelectionDownstreamRecheckRequest,
  TopicSelectionDownstreamTopicFeedbackCreateInput,
  TopicSelectionDownstreamTopicFeedbackRecord,
  TopicSelectionLoopbackClassification,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-downstream-feedback-recheck-contracts';
import {
  TOPIC_SELECTION_DOWNSTREAM_FEEDBACK_SOURCE_KINDS,
  TOPIC_SELECTION_DOWNSTREAM_LOOPBACK_CAUSES,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-downstream-feedback-recheck-contracts';

import { AppError } from '../errors/app-error.js';
import type {
  TopicSelectionV1cDownstreamFeedbackRecheckRepository,
} from '../repositories/topic-selection-v1c-downstream-feedback-recheck.repository.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';

type IdFactory = (prefix: string) => string;

export type TopicSelectionPaperProjectBridgeHandoffProvider = {
  getPaperProjectBridgeHandoff(
    paperProjectBridgeId: string,
  ): Promise<TopicSelectionPaperProjectBridgeHandoff>;
};

export type TopicSelectionDownstreamRecheckSink = {
  recordDownstreamFeedback(input: {
    workspace_id?: string | null;
    title_card_id?: string | null;
    source_ref: TopicSelectionFunctionalRef;
    affected_ref: TopicSelectionFunctionalRef;
    feedback_type: string;
    reason_codes: string[];
    summary: string;
    impact_level?: TopicSelectionImpactLevel;
    severity?: TopicSelectionSeverity;
    required_actions?: string[];
    artifact_refs?: TopicSelectionFunctionalRef[];
    policy_version_id?: string | null;
    payload?: Record<string, unknown>;
  }): Promise<{
    event: TopicSelectionRecheckEventRecord | null;
    impact: TopicSelectionRecheckImpactRecord | null;
    queue_item: TopicSelectionDecisionWorkQueueItemRecord | null;
  }>;
};

export type TopicSelectionV1cDownstreamFeedbackRecheckResult = {
  downstream_topic_feedback: TopicSelectionDownstreamTopicFeedbackRecord;
  classification: TopicSelectionLoopbackClassification;
  recheck_request: TopicSelectionDownstreamRecheckRequest | null;
  impact_summary: TopicSelectionDownstreamFeedbackImpactSummary;
};

export type TopicSelectionV1cDownstreamRecheckProjection = {
  downstream_topic_feedback: TopicSelectionDownstreamTopicFeedbackRecord;
  recheck_request: TopicSelectionDownstreamRecheckRequest;
};

export type TopicSelectionV1cDownstreamFeedbackRecheckServiceOptions = {
  repository: TopicSelectionV1cDownstreamFeedbackRecheckRepository;
  paperProjectBridgeService: TopicSelectionPaperProjectBridgeHandoffProvider;
  recheckRiskMemoryService: TopicSelectionDownstreamRecheckSink;
  idFactory?: IdFactory;
  now?: () => string;
};

const LOOPBACK_TARGET_BY_CAUSE: Record<
  TopicSelectionDownstreamLoopbackCause,
  TopicSelectionDownstreamLoopbackTarget
> = {
  stale_evidence: 'evidence_or_search',
  overclaim: 'value_assessment',
  unanswerable_question: 'topic_question',
  boundary_drift: 'research_slice',
  need_invalidated: 'validated_need',
  package_narrative_gap: 'package',
  promotion_authorization_gap: 'promotion',
  bridge_trace_gap: 'paper_project_bridge',
  commitment_gap: 'paper_project_bridge',
  merge_candidate_conflict: 'merge_candidate',
  paper_project_constraint_conflict: 'paper_project_intake',
  downstream_mutation_attempt: 'paper_project_bridge',
  no_recheck_needed: 'paper_project_bridge',
};
const TOPIC_SELECTION_SEVERITIES: readonly TopicSelectionSeverity[] = [
  'info',
  'warning',
  'blocking',
  'critical',
];
const TOPIC_SELECTION_ACTOR_TYPE_SET: readonly TopicSelectionActorType[] = [
  ...TOPIC_SELECTION_ACTOR_TYPES,
];

export class TopicSelectionV1cDownstreamFeedbackRecheckService {
  private readonly repository: TopicSelectionV1cDownstreamFeedbackRecheckRepository;
  private readonly paperProjectBridgeService: TopicSelectionPaperProjectBridgeHandoffProvider;
  private readonly recheckRiskMemoryService: TopicSelectionDownstreamRecheckSink;
  private readonly idFactory: IdFactory;
  private readonly now: () => string;

  constructor(options: TopicSelectionV1cDownstreamFeedbackRecheckServiceOptions) {
    this.repository = options.repository;
    this.paperProjectBridgeService = options.paperProjectBridgeService;
    this.recheckRiskMemoryService = options.recheckRiskMemoryService;
    this.idFactory = options.idFactory ?? ((prefix) => `${prefix}_${crypto.randomUUID()}`);
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async recordDownstreamTopicFeedback(
    input: TopicSelectionDownstreamTopicFeedbackCreateInput,
  ): Promise<TopicSelectionV1cDownstreamFeedbackRecheckResult> {
    this.assertValidCreateInput(input);
    const bridgeHandoff = await this.paperProjectBridgeService.getPaperProjectBridgeHandoff(
      input.paper_project_bridge_id,
    );
    this.assertActiveBridgeHandoff(bridgeHandoff);
    this.assertWorkspace(input.workspace_id ?? null, bridgeHandoff);

    const now = this.now();
    const createdBy = input.created_by ?? 'system';
    const feedbackId = this.idFactory('downstream_topic_feedback');
    const feedbackRef = this.ref(
      'downstream_topic_feedback',
      feedbackId,
      bridgeHandoff.bridge.title_card_id,
      bridgeHandoff.bridge_payload_hash,
    );
    const bridgeRef = bridgeHandoff.paper_project_bridge_ref;
    const loopbackTarget = LOOPBACK_TARGET_BY_CAUSE[input.feedback_signal];
    if (!loopbackTarget) {
      throw new AppError(
        400,
        'INVALID_PAYLOAD',
        `Unsupported downstream feedback signal: ${input.feedback_signal}.`,
      );
    }
    const requiresRecheck = input.feedback_signal !== 'no_recheck_needed';
    const affectedRef = this.resolveAffectedRef(loopbackTarget, bridgeHandoff);
    const requiredActions = this.resolveRequiredActions(input, requiresRecheck);
    const fingerprint = sha256Text(stableStringify({
      paper_project_bridge_id: bridgeHandoff.paper_project_bridge_id,
      downstream_source_kind: input.downstream_source_kind,
      downstream_source_ref: input.downstream_source_ref,
      feedback_signal: input.feedback_signal,
      affected_ref: affectedRef,
      summary: input.summary.trim(),
      required_actions: requiredActions,
    }));
    const existing = await this.repository.findFeedbackByFingerprint(fingerprint);
    if (existing) {
      return {
        downstream_topic_feedback: existing,
        classification: existing.classification,
        recheck_request: existing.recheck_request ?? null,
        impact_summary: existing.impact_summary,
      };
    }
    const sourceRefs = this.uniqueRefs([
      bridgeRef,
      input.downstream_source_ref,
      ...(input.source_feedback_refs ?? []),
      bridgeHandoff.source_promotion_decision_ref,
      bridgeHandoff.promotion_commitment_profile_ref,
      bridgeHandoff.promotion_input_snapshot_ref,
      ...bridgeHandoff.source_refs,
    ]);
    const classification: TopicSelectionLoopbackClassification = {
      loopback_target: loopbackTarget,
      loopback_cause: input.feedback_signal,
      severity: input.severity,
      requires_recheck: requiresRecheck,
      affected_ref: affectedRef,
      affected_stage: this.stageForLoopbackTarget(loopbackTarget),
      source_refs: sourceRefs,
      rationale: this.classificationRationale(input.feedback_signal, loopbackTarget),
      required_actions: requiredActions,
    };
    const impactLevel = this.impactLevelFor(input.severity, requiresRecheck);
    let recheckRequest: TopicSelectionDownstreamRecheckRequest | null = null;
    let recheckEventRef: TopicSelectionFunctionalRef | null = null;
    let recheckImpactRef: TopicSelectionFunctionalRef | null = null;
    let queueItemRef: TopicSelectionFunctionalRef | null = null;

    if (requiresRecheck) {
      recheckRequest = {
        downstream_recheck_request_id: this.idFactory('downstream_recheck_request'),
        feedback_ref: feedbackRef,
        loopback_target: loopbackTarget,
        loopback_cause: input.feedback_signal,
        affected_ref: affectedRef,
        required_actions: requiredActions,
        reason_codes: [input.feedback_signal],
        source_refs: sourceRefs,
        created_at: now,
      };
      const recheck = await this.recheckRiskMemoryService.recordDownstreamFeedback({
        workspace_id: bridgeHandoff.bridge.workspace_id ?? null,
        title_card_id: bridgeHandoff.bridge.title_card_id,
        source_ref: feedbackRef,
        affected_ref: affectedRef,
        feedback_type: `${input.downstream_source_kind}:${input.feedback_signal}`,
        reason_codes: [input.feedback_signal],
        summary: input.summary.trim(),
        impact_level: impactLevel,
        severity: input.severity,
        required_actions: requiredActions,
        artifact_refs: input.artifact_refs ?? [],
        policy_version_id: input.policy_version_id ?? null,
        payload: {
          downstream_source_kind: input.downstream_source_kind,
          downstream_source_ref: input.downstream_source_ref,
          paper_project_bridge_ref: bridgeRef,
          classification,
          feedback_payload: input.feedback_payload ?? {},
        },
      });
      recheckEventRef = recheck.event
        ? this.ref('recheck_event', recheck.event.recheck_event_id, recheck.event.title_card_id ?? null)
        : null;
      recheckImpactRef = recheck.impact
        ? this.ref('recheck_impact', recheck.impact.recheck_impact_id, recheck.impact.title_card_id ?? null)
        : null;
      queueItemRef = recheck.queue_item
        ? this.ref(
          'decision_work_queue_item',
          recheck.queue_item.decision_work_queue_item_id,
          recheck.queue_item.title_card_id ?? null,
        )
        : null;
    }

    const impactSummary: TopicSelectionDownstreamFeedbackImpactSummary = {
      impact_level: impactLevel,
      severity: input.severity,
      loopback_target: loopbackTarget,
      loopback_cause: input.feedback_signal,
      requires_recheck: requiresRecheck,
      affected_ref: affectedRef,
      recheck_event_ref: recheckEventRef,
      recheck_impact_ref: recheckImpactRef,
      decision_work_queue_item_ref: queueItemRef,
      summary: requiresRecheck
        ? `Downstream feedback requires ${loopbackTarget} recheck.`
        : 'Downstream feedback recorded with no upstream recheck required.',
    };
    const record: TopicSelectionDownstreamTopicFeedbackRecord = {
      downstream_topic_feedback_id: feedbackId,
      feedback_fingerprint: fingerprint,
      workspace_id: bridgeHandoff.bridge.workspace_id ?? null,
      title_card_id: bridgeHandoff.bridge.title_card_id,
      paper_project_bridge_id: bridgeHandoff.paper_project_bridge_id,
      paper_project_bridge_ref: bridgeRef,
      source_promotion_decision_ref: bridgeHandoff.source_promotion_decision_ref,
      promotion_commitment_profile_ref: bridgeHandoff.promotion_commitment_profile_ref,
      promotion_input_snapshot_id: bridgeHandoff.promotion_input_snapshot_id,
      promotion_input_snapshot_ref: bridgeHandoff.promotion_input_snapshot_ref,
      promotion_input_snapshot_hash: bridgeHandoff.promotion_input_snapshot_hash,
      topic_package_id: bridgeHandoff.topic_package_id,
      package_version: bridgeHandoff.package_version,
      downstream_source_kind: input.downstream_source_kind,
      downstream_source_ref: input.downstream_source_ref,
      source_feedback_refs: input.source_feedback_refs ?? [],
      observed_blocker_refs: input.observed_blocker_refs ?? [],
      feedback_signal: input.feedback_signal,
      severity: input.severity,
      summary: input.summary.trim(),
      required_action: input.required_action?.trim() || null,
      classification,
      recheck_request: recheckRequest,
      impact_summary: impactSummary,
      recheck_event_ref: recheckEventRef,
      recheck_impact_ref: recheckImpactRef,
      decision_work_queue_item_ref: queueItemRef,
      artifact_refs: input.artifact_refs ?? [],
      payload: {
        feedback_payload: input.feedback_payload ?? {},
        bridge_payload_hash: bridgeHandoff.bridge_payload_hash,
        working_copy_payload_hash: bridgeHandoff.working_copy_payload_hash,
      },
      policy_version_id: input.policy_version_id ?? null,
      created_by: createdBy,
      created_at: now,
    };
    const created = await this.repository.createFeedback(record);
    return {
      downstream_topic_feedback: created,
      classification,
      recheck_request: recheckRequest,
      impact_summary: impactSummary,
    };
  }

  async getDownstreamTopicFeedback(
    downstreamTopicFeedbackId: string,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord> {
    const record = await this.repository.findFeedbackById(downstreamTopicFeedbackId);
    if (!record) {
      throw new AppError(
        404,
        'NOT_FOUND',
        `DownstreamTopicFeedback ${downstreamTopicFeedbackId} not found.`,
      );
    }
    return record;
  }

  async listDownstreamTopicFeedbackByBridge(
    paperProjectBridgeId: string,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord[]> {
    return this.repository.listFeedbackByBridgeId(paperProjectBridgeId);
  }

  async getDownstreamRecheckRequestByFeedback(
    downstreamTopicFeedbackId: string,
  ): Promise<TopicSelectionV1cDownstreamRecheckProjection> {
    const record = await this.getDownstreamTopicFeedback(downstreamTopicFeedbackId);
    if (!record.recheck_request) {
      throw new AppError(
        404,
        'NOT_FOUND',
        `DownstreamTopicFeedback ${downstreamTopicFeedbackId} has no downstream recheck request.`,
      );
    }
    return {
      downstream_topic_feedback: record,
      recheck_request: record.recheck_request,
    };
  }

  async getDownstreamRecheckRequest(
    downstreamRecheckRequestId: string,
  ): Promise<TopicSelectionV1cDownstreamRecheckProjection> {
    const record = await this.repository.findFeedbackByRecheckRequestId(downstreamRecheckRequestId);
    if (!record?.recheck_request) {
      throw new AppError(
        404,
        'NOT_FOUND',
        `DownstreamRecheckRequest ${downstreamRecheckRequestId} not found.`,
      );
    }
    return {
      downstream_topic_feedback: record,
      recheck_request: record.recheck_request,
    };
  }

  private assertValidCreateInput(
    input: TopicSelectionDownstreamTopicFeedbackCreateInput,
  ): void {
    if (!this.hasText(input.paper_project_bridge_id)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Downstream feedback requires paper_project_bridge_id.');
    }
    if (input.workspace_id !== undefined && input.workspace_id !== null && !this.hasText(input.workspace_id)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'workspace_id must be non-empty when provided.');
    }
    if (!TOPIC_SELECTION_DOWNSTREAM_FEEDBACK_SOURCE_KINDS.includes(input.downstream_source_kind)) {
      throw new AppError(400, 'INVALID_PAYLOAD', `Unsupported downstream source kind: ${input.downstream_source_kind}.`);
    }
    if (!TOPIC_SELECTION_DOWNSTREAM_LOOPBACK_CAUSES.includes(input.feedback_signal)) {
      throw new AppError(400, 'INVALID_PAYLOAD', `Unsupported downstream feedback signal: ${input.feedback_signal}.`);
    }
    if (!TOPIC_SELECTION_SEVERITIES.includes(input.severity)) {
      throw new AppError(400, 'INVALID_PAYLOAD', `Unsupported downstream feedback severity: ${input.severity}.`);
    }
    if (input.created_by !== undefined && !TOPIC_SELECTION_ACTOR_TYPE_SET.includes(input.created_by)) {
      throw new AppError(400, 'INVALID_PAYLOAD', `Unsupported downstream feedback actor: ${input.created_by}.`);
    }
    if (!this.hasText(input.summary)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Downstream feedback requires a summary.');
    }
    this.assertRef(input.downstream_source_ref, 'downstream_source_ref');
    for (const sourceRef of input.source_feedback_refs ?? []) {
      this.assertRef(sourceRef, 'source_feedback_refs');
    }
    for (const blockerRef of input.observed_blocker_refs ?? []) {
      this.assertRef(blockerRef, 'observed_blocker_refs');
    }
    for (const artifactRef of input.artifact_refs ?? []) {
      this.assertRef(artifactRef, 'artifact_refs');
    }
  }

  private assertActiveBridgeHandoff(
    bridgeHandoff: TopicSelectionPaperProjectBridgeHandoff,
  ): void {
    if (
      bridgeHandoff.bridge_status !== 'active'
      || bridgeHandoff.bridge.bridge_status !== 'active'
      || bridgeHandoff.paper_project_bridge_id !== bridgeHandoff.bridge.paper_project_bridge_id
    ) {
      throw new AppError(
        409,
        'GATE_CONSTRAINT_FAILED',
        `PaperProjectBridge ${bridgeHandoff.paper_project_bridge_id} is not an active downstream feedback source.`,
      );
    }
  }

  private assertWorkspace(
    requestedWorkspaceId: string | null,
    bridgeHandoff: TopicSelectionPaperProjectBridgeHandoff,
  ): void {
    const bridgeWorkspaceId = bridgeHandoff.bridge.workspace_id ?? null;
    if (requestedWorkspaceId && requestedWorkspaceId !== bridgeWorkspaceId) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        `PaperProjectBridge workspace mismatch: requested ${requestedWorkspaceId}, bridge ${bridgeWorkspaceId}.`,
      );
    }
    if (requestedWorkspaceId && !bridgeWorkspaceId) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        `PaperProjectBridge workspace mismatch: requested ${requestedWorkspaceId}, bridge has no workspace_id.`,
      );
    }
  }

  private resolveRequiredActions(
    input: TopicSelectionDownstreamTopicFeedbackCreateInput,
    requiresRecheck: boolean,
  ): string[] {
    const requiredAction = input.required_action?.trim() ?? '';
    if (requiresRecheck && !requiredAction) {
      throw new AppError(
        400,
        'INVALID_PAYLOAD',
        `Downstream feedback ${input.feedback_signal} requires a non-empty required_action.`,
      );
    }
    return requiredAction ? [requiredAction] : [];
  }

  private resolveAffectedRef(
    loopbackTarget: TopicSelectionDownstreamLoopbackTarget,
    bridgeHandoff: TopicSelectionPaperProjectBridgeHandoff,
  ): TopicSelectionFunctionalRef {
    switch (loopbackTarget) {
      case 'package':
        return this.findSourceRef(bridgeHandoff, ['topic_package'])
          ?? this.ref('topic_package', bridgeHandoff.topic_package_id, bridgeHandoff.bridge.title_card_id, bridgeHandoff.package_version);
      case 'value_assessment':
        return this.requireSourceRef(
          bridgeHandoff,
          ['topic_value_assessment', 'value_assessment'],
          loopbackTarget,
        );
      case 'topic_question':
        return this.requireSourceRef(bridgeHandoff, ['topic_question'], loopbackTarget);
      case 'research_slice':
        return this.requireSourceRef(bridgeHandoff, ['research_slice'], loopbackTarget);
      case 'validated_need':
        return this.requireSourceRef(bridgeHandoff, ['validated_need'], loopbackTarget);
      case 'evidence_or_search':
        return this.requireEvidenceOrSearchRef(bridgeHandoff);
      case 'promotion':
        return bridgeHandoff.source_promotion_decision_ref;
      case 'paper_project_bridge':
        return bridgeHandoff.paper_project_bridge_ref;
      case 'merge_candidate':
        return this.findSourceRef(bridgeHandoff, ['merge_candidate'])
          ?? this.ref(
            'merge_candidate',
            `merge_candidate_${bridgeHandoff.topic_package_id}`,
            bridgeHandoff.bridge.title_card_id,
            bridgeHandoff.package_version,
          );
      case 'paper_project_intake':
        return bridgeHandoff.paper_project_intake_ref
          ?? this.ref(
            'paper_project_intake',
            `paper_project_intake_${bridgeHandoff.paper_project_bridge_id}`,
            bridgeHandoff.bridge.title_card_id,
            bridgeHandoff.bridge_payload_hash,
          );
    }
  }

  private findSourceRef(
    bridgeHandoff: TopicSelectionPaperProjectBridgeHandoff,
    refTypes: string[],
  ): TopicSelectionFunctionalRef | null {
    return bridgeHandoff.source_refs.find((sourceRef) => refTypes.includes(sourceRef.ref_type)) ?? null;
  }

  private requireSourceRef(
    bridgeHandoff: TopicSelectionPaperProjectBridgeHandoff,
    refTypes: string[],
    loopbackTarget: TopicSelectionDownstreamLoopbackTarget,
  ): TopicSelectionFunctionalRef {
    const sourceRef = this.findSourceRef(bridgeHandoff, refTypes);
    if (!sourceRef) {
      throw new AppError(
        409,
        'GATE_CONSTRAINT_FAILED',
        `PaperProjectBridge ${bridgeHandoff.paper_project_bridge_id} is missing source refs for ${loopbackTarget}.`,
      );
    }
    return sourceRef;
  }

  private findEvidenceOrSearchRef(
    bridgeHandoff: TopicSelectionPaperProjectBridgeHandoff,
  ): TopicSelectionFunctionalRef | null {
    return bridgeHandoff.source_refs.find((sourceRef) =>
      sourceRef.ref_type.includes('evidence') || this.isSearchRefType(sourceRef.ref_type)) ?? null;
  }

  private requireEvidenceOrSearchRef(
    bridgeHandoff: TopicSelectionPaperProjectBridgeHandoff,
  ): TopicSelectionFunctionalRef {
    const sourceRef = this.findEvidenceOrSearchRef(bridgeHandoff);
    if (!sourceRef) {
      throw new AppError(
        409,
        'GATE_CONSTRAINT_FAILED',
        `PaperProjectBridge ${bridgeHandoff.paper_project_bridge_id} is missing evidence/search source refs.`,
      );
    }
    return sourceRef;
  }

  private classificationRationale(
    cause: TopicSelectionDownstreamLoopbackCause,
    target: TopicSelectionDownstreamLoopbackTarget,
  ): string {
    return cause === 'no_recheck_needed'
      ? 'Feedback is recorded for replay and lineage without opening an upstream recheck.'
      : `Feedback signal ${cause} deterministically routes to ${target}.`;
  }

  private impactLevelFor(
    severity: TopicSelectionSeverity,
    requiresRecheck: boolean,
  ): TopicSelectionImpactLevel {
    if (!requiresRecheck) {
      return 'no_impact';
    }
    if (severity === 'critical') {
      return 'invalidated';
    }
    if (severity === 'warning') {
      return 'stale';
    }
    return 'recheck_required';
  }

  private stageForLoopbackTarget(target: TopicSelectionDownstreamLoopbackTarget): string {
    switch (target) {
      case 'package':
        return 'topic_package';
      case 'value_assessment':
        return 'value_assessment';
      case 'topic_question':
        return 'topic_question';
      case 'research_slice':
        return 'research_slice';
      case 'validated_need':
        return 'validated_need';
      case 'evidence_or_search':
        return 'evidence_or_search';
      case 'promotion':
        return 'promotion';
      case 'paper_project_bridge':
        return 'paper_project_bridge';
      case 'merge_candidate':
        return 'merge_candidate';
      case 'paper_project_intake':
        return 'paper_project_intake';
    }
  }

  private isSearchRefType(refType: string): boolean {
    return refType === 'search'
      || refType.startsWith('search_')
      || refType.endsWith('_search')
      || refType.includes('_search_');
  }

  private assertRef(ref: TopicSelectionFunctionalRef | undefined, label: string): void {
    if (!ref || !this.hasText(ref.ref_type) || !this.hasText(ref.ref_id)) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${label} must be a valid functional ref.`);
    }
  }

  private uniqueRefs(refs: TopicSelectionFunctionalRef[]): TopicSelectionFunctionalRef[] {
    const seen = new Set<string>();
    const result: TopicSelectionFunctionalRef[] = [];
    for (const ref of refs) {
      if (!ref || !this.hasText(ref.ref_type) || !this.hasText(ref.ref_id)) {
        continue;
      }
      const key = `${ref.ref_type}:${ref.ref_id}:${ref.version_id ?? ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(ref);
      }
    }
    return result;
  }

  private ref(
    refType: string,
    refId: string,
    titleCardId?: string | null,
    versionId?: string | null,
  ): TopicSelectionFunctionalRef {
    return {
      ref_type: refType,
      ref_id: refId,
      title_card_id: titleCardId ?? null,
      version_id: versionId ?? null,
    };
  }

  private hasText(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
