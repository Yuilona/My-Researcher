import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionPaperProjectBridgeHandoff,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-paper-project-bridge-contracts';
import type {
  TopicSelectionDownstreamLoopbackCause,
  TopicSelectionDownstreamLoopbackTarget,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-downstream-feedback-recheck-contracts';

import { AppError } from '../errors/app-error.js';

export type TopicSelectionV1cDownstreamFeedbackPolicy = {
  loopback_target: TopicSelectionDownstreamLoopbackTarget;
  affected_ref: TopicSelectionFunctionalRef;
  affected_stage: string;
  requires_recheck: boolean;
};

const TOPIC_SELECTION_V1C_DOWNSTREAM_LOOPBACK_TARGET_BY_CAUSE: Record<
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

const AFFECTED_STAGE_BY_LOOPBACK_TARGET: Record<TopicSelectionDownstreamLoopbackTarget, string> = {
  package: 'topic_package',
  value_assessment: 'value_assessment',
  topic_question: 'topic_question',
  research_slice: 'research_slice',
  validated_need: 'validated_need',
  evidence_or_search: 'evidence_or_search',
  promotion: 'promotion',
  paper_project_bridge: 'paper_project_bridge',
  merge_candidate: 'merge_candidate',
  paper_project_intake: 'paper_project_intake',
};

export function resolveTopicSelectionV1cDownstreamFeedbackPolicy(input: {
  feedback_signal: TopicSelectionDownstreamLoopbackCause;
  bridge_handoff: TopicSelectionPaperProjectBridgeHandoff;
}): TopicSelectionV1cDownstreamFeedbackPolicy {
  const loopbackTarget = resolveTopicSelectionV1cDownstreamLoopbackTarget(input.feedback_signal);
  return {
    loopback_target: loopbackTarget,
    affected_ref: resolveTopicSelectionV1cDownstreamAffectedRef({
      loopback_target: loopbackTarget,
      bridge_handoff: input.bridge_handoff,
    }),
    affected_stage: resolveTopicSelectionV1cDownstreamAffectedStage(loopbackTarget),
    requires_recheck: input.feedback_signal !== 'no_recheck_needed',
  };
}

function resolveTopicSelectionV1cDownstreamLoopbackTarget(
  feedbackSignal: TopicSelectionDownstreamLoopbackCause,
): TopicSelectionDownstreamLoopbackTarget {
  const loopbackTarget = TOPIC_SELECTION_V1C_DOWNSTREAM_LOOPBACK_TARGET_BY_CAUSE[feedbackSignal];
  if (!loopbackTarget) {
    throw new AppError(
      400,
      'INVALID_PAYLOAD',
      `Unsupported downstream feedback signal: ${feedbackSignal}.`,
    );
  }
  return loopbackTarget;
}

function resolveTopicSelectionV1cDownstreamAffectedStage(
  loopbackTarget: TopicSelectionDownstreamLoopbackTarget,
): string {
  return AFFECTED_STAGE_BY_LOOPBACK_TARGET[loopbackTarget];
}

function resolveTopicSelectionV1cDownstreamAffectedRef(input: {
  loopback_target: TopicSelectionDownstreamLoopbackTarget;
  bridge_handoff: TopicSelectionPaperProjectBridgeHandoff;
}): TopicSelectionFunctionalRef {
  const { loopback_target: loopbackTarget, bridge_handoff: bridgeHandoff } = input;
  switch (loopbackTarget) {
    case 'package':
      return findSourceRef(bridgeHandoff, ['topic_package'])
        ?? ref('topic_package', bridgeHandoff.topic_package_id, bridgeHandoff.bridge.title_card_id, bridgeHandoff.package_version);
    case 'value_assessment':
      return requireSourceRef(
        bridgeHandoff,
        ['topic_value_assessment', 'value_assessment'],
        loopbackTarget,
      );
    case 'topic_question':
      return requireSourceRef(bridgeHandoff, ['topic_question'], loopbackTarget);
    case 'research_slice':
      return requireSourceRef(bridgeHandoff, ['research_slice'], loopbackTarget);
    case 'validated_need':
      return requireSourceRef(bridgeHandoff, ['validated_need'], loopbackTarget);
    case 'evidence_or_search':
      return requireEvidenceOrSearchRef(bridgeHandoff);
    case 'promotion':
      return bridgeHandoff.source_promotion_decision_ref;
    case 'paper_project_bridge':
      return bridgeHandoff.paper_project_bridge_ref;
    case 'merge_candidate':
      return findSourceRef(bridgeHandoff, ['merge_candidate'])
        ?? ref(
          'merge_candidate',
          `merge_candidate_${bridgeHandoff.topic_package_id}`,
          bridgeHandoff.bridge.title_card_id,
          bridgeHandoff.package_version,
        );
    case 'paper_project_intake':
      return bridgeHandoff.paper_project_intake_ref
        ?? ref(
          'paper_project_intake',
          `paper_project_intake_${bridgeHandoff.paper_project_bridge_id}`,
          bridgeHandoff.bridge.title_card_id,
          bridgeHandoff.bridge_payload_hash,
        );
  }
}

function findSourceRef(
  bridgeHandoff: TopicSelectionPaperProjectBridgeHandoff,
  refTypes: string[],
): TopicSelectionFunctionalRef | null {
  return bridgeHandoff.source_refs.find((sourceRef) => refTypes.includes(sourceRef.ref_type)) ?? null;
}

function requireSourceRef(
  bridgeHandoff: TopicSelectionPaperProjectBridgeHandoff,
  refTypes: string[],
  loopbackTarget: TopicSelectionDownstreamLoopbackTarget,
): TopicSelectionFunctionalRef {
  const sourceRef = findSourceRef(bridgeHandoff, refTypes);
  if (!sourceRef) {
    throw new AppError(
      409,
      'GATE_CONSTRAINT_FAILED',
      `PaperProjectBridge ${bridgeHandoff.paper_project_bridge_id} is missing source refs for ${loopbackTarget}.`,
    );
  }
  return sourceRef;
}

function findEvidenceOrSearchRef(
  bridgeHandoff: TopicSelectionPaperProjectBridgeHandoff,
): TopicSelectionFunctionalRef | null {
  return bridgeHandoff.source_refs.find((sourceRef) =>
    sourceRef.ref_type.includes('evidence') || isSearchRefType(sourceRef.ref_type)) ?? null;
}

function requireEvidenceOrSearchRef(
  bridgeHandoff: TopicSelectionPaperProjectBridgeHandoff,
): TopicSelectionFunctionalRef {
  const sourceRef = findEvidenceOrSearchRef(bridgeHandoff);
  if (!sourceRef) {
    throw new AppError(
      409,
      'GATE_CONSTRAINT_FAILED',
      `PaperProjectBridge ${bridgeHandoff.paper_project_bridge_id} is missing evidence/search source refs.`,
    );
  }
  return sourceRef;
}

function isSearchRefType(refType: string): boolean {
  return refType === 'search'
    || refType.startsWith('search_')
    || refType.endsWith('_search')
    || refType.includes('_search_');
}

function ref(
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
