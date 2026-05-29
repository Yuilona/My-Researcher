import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionDownstreamTopicFeedbackRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-downstream-feedback-recheck-contracts';
import type {
  TopicSelectionHumanPromotionDecisionRecord,
  TopicSelectionPromotionCommitmentProfileRecord,
  TopicSelectionPromotionDecisionRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-human-promotion-decision-contracts';
import type {
  TopicSelectionPaperProjectBridgeHandoff,
  TopicSelectionPaperProjectBridgeRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-paper-project-bridge-contracts';
import type {
  TopicSelectionPromotionGateDisposition,
  TopicSelectionPromotionGateHandoff,
  TopicSelectionPromotionGateLoopbackHint,
  TopicSelectionPromotionGateRequiredAction,
  TopicSelectionPromotionDecisionSupportRecord,
  TopicSelectionPromotionDossierRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-promotion-gate-contracts';
import type {
  TopicSelectionPromotionInputSnapshotRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-promotion-input-contracts';

export const TOPIC_SELECTION_V1C_HARNESS_ADAPTER_VERSION =
  'topic-selection-v1c-harness-adapter-v0';

export type TopicSelectionV1cHarnessNodeId =
  | 'N1'
  | 'N2'
  | 'N3'
  | 'N4'
  | 'N5'
  | 'N6';

export type TopicSelectionV1cHarnessRoutingOutcome =
  | 'ready_for_gate'
  | 'support_ready'
  | 'ready_for_human_decision'
  | 'action_required'
  | 'parked'
  | 'bridge_authorized'
  | 'closed_no_auto_progress'
  | 'bridge_ready'
  | 'recheck_opened'
  | 'feedback_recorded'
  | 'invalid_feedback';

export type TopicSelectionV1cHarnessAutomation =
  | 'advance'
  | 'stop'
  | 'record_only';

export type TopicSelectionV1cHarnessNodeResult = {
  node_id: TopicSelectionV1cHarnessNodeId;
  node_name: string;
  routing_outcome: TopicSelectionV1cHarnessRoutingOutcome;
  automation: TopicSelectionV1cHarnessAutomation;
  authority_refs: TopicSelectionFunctionalRef[];
  diagnostic_refs: TopicSelectionFunctionalRef[];
  required_actions: Array<TopicSelectionPromotionGateRequiredAction | string>;
  loopback_hints: TopicSelectionPromotionGateLoopbackHint[];
  source_refs: TopicSelectionFunctionalRef[];
  snapshot_hashes: Record<string, string>;
  provider_involved: boolean;
  notes: string[];
};

export type TopicSelectionV1cAcceptanceManifest = {
  schema_version: 'topic-selection-v1c-acceptance-manifest-v0';
  run_id: string;
  adapter_version: typeof TOPIC_SELECTION_V1C_HARNESS_ADAPTER_VERSION;
  created_at: string;
  started_at: string;
  completed_at: string;
  command: string;
  git_sha: string | null;
  selected_gate: string;
  environment_status: Record<string, unknown>;
  profile_versions: Record<string, string | null>;
  status: 'pass' | 'fail';
  row_results: TopicSelectionV1cAcceptanceRowResult[];
  node_trace: TopicSelectionV1cHarnessNodeResult[];
  persistence_summary: Record<string, number>;
  evidence_files: string[];
  pending_gaps: string[];
};

export type TopicSelectionV1cAcceptanceRowResult = {
  row_id: string;
  status: 'pass' | 'fail';
  scenario: string;
  node_ids: TopicSelectionV1cHarnessNodeId[];
  routing_outcomes: TopicSelectionV1cHarnessRoutingOutcome[];
  evidence: Record<string, unknown>;
  notes: string[];
};

type TopicSelectionV1cPromotionSupportAdapterInput =
  | TopicSelectionPromotionGateHandoff
  | {
      promotion_decision_support: TopicSelectionPromotionDecisionSupportRecord;
      promotion_dossier: TopicSelectionPromotionDossierRecord;
    };

export function normalizeN1PromotionInputSnapshot(
  snapshot: TopicSelectionPromotionInputSnapshotRecord,
): TopicSelectionV1cHarnessNodeResult {
  const ready = snapshot.closure_status === 'ready_for_gate';
  return {
    node_id: 'N1',
    node_name: 'create-promotion-input-snapshot',
    routing_outcome: ready ? 'ready_for_gate' : 'action_required',
    automation: ready ? 'advance' : 'stop',
    authority_refs: ready ? [snapshot.promotion_input_snapshot_ref] : [],
    diagnostic_refs: ready ? [] : [snapshot.promotion_input_snapshot_ref],
    required_actions: [...snapshot.required_actions],
    loopback_hints: [],
    source_refs: [
      snapshot.source_bundle_ref,
      snapshot.topic_package_ref,
      snapshot.package_trace_boundary_check_ref,
      snapshot.package_readiness_assessment_ref,
    ],
    snapshot_hashes: {
      bundle_hash: snapshot.bundle_hash,
      package_snapshot_hash: snapshot.package_snapshot_hash,
      package_draft_input_snapshot_hash: snapshot.package_draft_input_snapshot_hash,
      promotion_input_snapshot_hash: snapshot.promotion_input_snapshot_hash,
    },
    provider_involved: false,
    notes: ready
      ? ['Ready promotion input snapshot can advance to N2.']
      : [`Promotion input stopped with closure_status=${snapshot.closure_status}.`],
  };
}

export function normalizeN2PromotionSupport(
  input: TopicSelectionV1cPromotionSupportAdapterInput,
): TopicSelectionV1cHarnessNodeResult {
  const support = 'support' in input ? input.support : input.promotion_decision_support;
  const dossier = 'dossier' in input ? input.dossier : input.promotion_dossier;
  const promotionInputSnapshotRef = 'promotion_input_snapshot_ref' in input
    ? input.promotion_input_snapshot_ref
    : support.promotion_input_snapshot_ref;
  const snapshotHashes = 'snapshot_hashes' in input
    ? {
        ...input.snapshot_hashes,
        promotion_input_snapshot_hash: input.promotion_input_snapshot_hash,
      }
    : {
        promotion_input_snapshot_hash: support.promotion_input_snapshot_hash,
      };
  return {
    node_id: 'N2',
    node_name: 'generate-promotion-support',
    routing_outcome: 'support_ready',
    automation: 'advance',
    authority_refs: [
      ref('promotion_decision_support', support.promotion_decision_support_id, support.title_card_id),
      ref('promotion_dossier', dossier.promotion_dossier_id, dossier.title_card_id),
    ],
    diagnostic_refs: [],
    required_actions: [],
    loopback_hints: [],
    source_refs: [
      promotionInputSnapshotRef,
      ...support.source_refs,
    ],
    snapshot_hashes: snapshotHashes,
    provider_involved: support.support_generation_mode !== 'deterministic',
    notes: ['N2 advisory support is ready; N3 owns deterministic gate routing.'],
  };
}

export function normalizeN3PromotionGate(
  handoff: TopicSelectionPromotionGateHandoff,
): TopicSelectionV1cHarnessNodeResult {
  const routingOutcome = routingOutcomeForGateDisposition(handoff.disposition);
  return {
    node_id: 'N3',
    node_name: 'run-promotion-gate',
    routing_outcome: routingOutcome,
    automation: routingOutcome === 'ready_for_human_decision' ? 'advance' : 'stop',
    authority_refs: [
      handoff.argument_readiness_mini_check_ref,
      handoff.promotion_gate_check_ref,
    ],
    diagnostic_refs: routingOutcome === 'ready_for_human_decision'
      ? []
      : [handoff.promotion_gate_check_ref],
    required_actions: [...handoff.required_actions],
    loopback_hints: [...handoff.loopback_hints],
    source_refs: [
      handoff.promotion_input_snapshot_ref,
      handoff.promotion_decision_support_ref,
      handoff.promotion_dossier_ref,
    ],
    snapshot_hashes: {
      ...handoff.snapshot_hashes,
      promotion_input_snapshot_hash: handoff.promotion_input_snapshot_hash,
    },
    provider_involved: false,
    notes: [`Service disposition ${handoff.disposition} normalized for harness routing.`],
  };
}

export function normalizeN4HumanPromotionDecision(input: {
  human_promotion_decision: TopicSelectionHumanPromotionDecisionRecord;
  promotion_decision: TopicSelectionPromotionDecisionRecord;
  promotion_commitment_profile?: TopicSelectionPromotionCommitmentProfileRecord | null;
}): TopicSelectionV1cHarnessNodeResult {
  const routingOutcome = routingOutcomeForPromotionDecision(input.promotion_decision);
  const authorityRefs = [
    ref('human_promotion_decision', input.human_promotion_decision.human_promotion_decision_id, input.human_promotion_decision.title_card_id),
    ref('human_confirmed_decision', input.human_promotion_decision.human_confirmed_decision_id, input.human_promotion_decision.title_card_id),
    ref('promotion_decision', input.promotion_decision.promotion_decision_id, input.promotion_decision.title_card_id),
  ];
  if (input.promotion_commitment_profile) {
    authorityRefs.push(ref(
      'promotion_commitment_profile',
      input.promotion_commitment_profile.promotion_commitment_profile_id,
      input.promotion_commitment_profile.title_card_id,
    ));
  }
  return {
    node_id: 'N4',
    node_name: 'record-human-promotion-decision',
    routing_outcome: routingOutcome,
    automation: routingOutcome === 'bridge_authorized' ? 'advance' : 'stop',
    authority_refs: authorityRefs,
    diagnostic_refs: routingOutcome === 'bridge_authorized'
      ? []
      : [authorityRefs[2]],
    required_actions: [...input.promotion_decision.required_actions],
    loopback_hints: [],
    source_refs: [...input.promotion_decision.source_refs],
    snapshot_hashes: {
      ...input.promotion_decision.snapshot_hashes,
      promotion_input_snapshot_hash: input.promotion_decision.promotion_input_snapshot_hash,
    },
    provider_involved: false,
    notes: [`Decision ${input.promotion_decision.decision} normalized to ${routingOutcome}.`],
  };
}

export function normalizeN5PaperProjectBridge(input: {
  bridge: TopicSelectionPaperProjectBridgeRecord;
  handoff: TopicSelectionPaperProjectBridgeHandoff;
}): TopicSelectionV1cHarnessNodeResult {
  return {
    node_id: 'N5',
    node_name: 'create-paper-project-bridge',
    routing_outcome: 'bridge_ready',
    automation: 'stop',
    authority_refs: [input.handoff.paper_project_bridge_ref],
    diagnostic_refs: [],
    required_actions: [],
    loopback_hints: [],
    source_refs: [
      input.bridge.source_promotion_decision_ref,
      input.bridge.promotion_commitment_profile_ref,
      input.bridge.promotion_input_snapshot_ref,
      ...input.bridge.source_refs,
    ],
    snapshot_hashes: {
      ...input.bridge.snapshot_hashes,
      promotion_input_snapshot_hash: input.bridge.promotion_input_snapshot_hash,
      working_copy_payload_hash: input.bridge.working_copy_payload_hash,
      bridge_payload_hash: input.bridge.bridge_payload_hash,
    },
    provider_involved: false,
    notes: ['N5 materialized bridge and stops before downstream intake.'],
  };
}

export function normalizeN6DownstreamFeedback(
  feedback: TopicSelectionDownstreamTopicFeedbackRecord,
): TopicSelectionV1cHarnessNodeResult {
  const hasRecheck = Boolean(feedback.recheck_request);
  return {
    node_id: 'N6',
    node_name: 'record-downstream-feedback-recheck',
    routing_outcome: hasRecheck ? 'recheck_opened' : 'feedback_recorded',
    automation: 'record_only',
    authority_refs: [
      ref('downstream_topic_feedback', feedback.downstream_topic_feedback_id, feedback.title_card_id ?? null),
      ...(feedback.recheck_request
        ? [ref('downstream_recheck_request', feedback.recheck_request.downstream_recheck_request_id, feedback.title_card_id ?? null)]
        : []),
    ],
    diagnostic_refs: [],
    required_actions: [...feedback.classification.required_actions],
    loopback_hints: [],
    source_refs: [
      feedback.paper_project_bridge_ref,
      feedback.downstream_source_ref,
      ...feedback.source_feedback_refs,
      ...feedback.classification.source_refs,
    ],
    snapshot_hashes: {
      promotion_input_snapshot_hash: feedback.promotion_input_snapshot_hash,
      feedback_fingerprint: feedback.feedback_fingerprint,
    },
    provider_involved: false,
    notes: [hasRecheck
      ? 'N6 opened a recheck projection without auto-invoking N1-N5.'
      : 'N6 recorded feedback without opening a recheck projection.'],
  };
}

export function invalidFeedbackNodeResult(input: {
  message: string;
  source_ref?: TopicSelectionFunctionalRef | null;
}): TopicSelectionV1cHarnessNodeResult {
  return {
    node_id: 'N6',
    node_name: 'record-downstream-feedback-recheck',
    routing_outcome: 'invalid_feedback',
    automation: 'stop',
    authority_refs: [],
    diagnostic_refs: [],
    required_actions: [],
    loopback_hints: [],
    source_refs: input.source_ref ? [input.source_ref] : [],
    snapshot_hashes: {},
    provider_involved: false,
    notes: [input.message],
  };
}

export function routingOutcomeForGateDisposition(
  disposition: TopicSelectionPromotionGateDisposition,
): TopicSelectionV1cHarnessRoutingOutcome {
  switch (disposition) {
    case 'ready_for_human_decision':
      return 'ready_for_human_decision';
    case 'park':
      return 'parked';
    case 'blocked':
    case 'needs_revision':
    case 'recheck_required':
      return 'action_required';
  }
}

function routingOutcomeForPromotionDecision(
  decision: TopicSelectionPromotionDecisionRecord,
): TopicSelectionV1cHarnessRoutingOutcome {
  if (decision.bridge_eligible) {
    return 'bridge_authorized';
  }
  if (decision.decision === 'park' || decision.decision === 'drop') {
    return 'closed_no_auto_progress';
  }
  return 'action_required';
}

function ref(
  refType: string,
  refId: string,
  titleCardId?: string | null,
  versionId: string | null = null,
): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: titleCardId ?? null,
    version_id: versionId,
  };
}
