import test from 'node:test';
import assert from 'node:assert/strict';

import type {
  TopicSelectionPromotionDecisionSupportRecord,
  TopicSelectionPromotionDossierRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-promotion-gate-contracts';
import type {
  TopicSelectionDownstreamTopicFeedbackRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-downstream-feedback-recheck-contracts';
import type {
  TopicSelectionHumanPromotionDecisionRecord,
  TopicSelectionPromotionDecisionRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-human-promotion-decision-contracts';

import {
  invalidFeedbackNodeResult,
  normalizeN2PromotionSupport,
  normalizeN4HumanPromotionDecision,
  normalizeN6DownstreamFeedback,
  routingOutcomeForGateDisposition,
} from './topic-selection-v1c-harness-adapter.js';
import {
  TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  topicSelectionV1cAcceptanceRef,
} from './topic-selection-v1c-acceptance-scenario-fixtures.js';

test('T-108 harness adapter normalizes N3 rich dispositions to three routing outcomes', () => {
  assert.equal(routingOutcomeForGateDisposition('ready_for_human_decision'), 'ready_for_human_decision');
  assert.equal(routingOutcomeForGateDisposition('blocked'), 'action_required');
  assert.equal(routingOutcomeForGateDisposition('needs_revision'), 'action_required');
  assert.equal(routingOutcomeForGateDisposition('recheck_required'), 'action_required');
  assert.equal(routingOutcomeForGateDisposition('park'), 'parked');
});

test('T-108 harness adapter normalizes N2 from split support bundle without N3 handoff', () => {
  const result = normalizeN2PromotionSupport({
    promotion_decision_support: {
      promotion_decision_support_id: 'promotion_decision_support_001',
      title_card_id: 'title_card_001',
      promotion_input_snapshot_ref: topicSelectionV1cAcceptanceRef('promotion_input_snapshot', 'promotion_input_snapshot_001'),
      promotion_input_snapshot_hash: 'promotion_input_snapshot_hash_001',
      source_refs: [topicSelectionV1cAcceptanceRef('topic_package', 'topic_package_001')],
      support_generation_mode: 'llm_draft',
    } as TopicSelectionPromotionDecisionSupportRecord,
	    promotion_dossier: {
	      promotion_dossier_id: 'promotion_dossier_001',
	      title_card_id: 'title_card_001',
	    } as TopicSelectionPromotionDossierRecord,
	    provider_involved: false,
	  });

  assert.equal(result.node_id, 'N2');
  assert.equal(result.routing_outcome, 'support_ready');
  assert.equal(result.automation, 'advance');
  assert.equal(result.provider_involved, false);
  assert.deepEqual(result.authority_refs.map((ref) => ref.ref_type), [
    'promotion_decision_support',
    'promotion_dossier',
  ]);
  assert.equal(result.snapshot_hashes.promotion_input_snapshot_hash, 'promotion_input_snapshot_hash_001');
});

test('T-108 harness adapter normalizes N4 bridge and non-progress decisions', () => {
  const bridgeAuthorized = normalizeN4HumanPromotionDecision({
    human_promotion_decision: makeHumanDecision('promote_with_conditions'),
    promotion_decision: makePromotionDecision({
      decision: 'promote_with_conditions',
      bridge_eligible: true,
      decision_class: 'promote',
    }),
    promotion_commitment_profile: null,
  });
  const actionRequired = normalizeN4HumanPromotionDecision({
    human_promotion_decision: makeHumanDecision('refine_package'),
    promotion_decision: makePromotionDecision({
      decision: 'refine_package',
      bridge_eligible: false,
      decision_class: 'non_promote',
    }),
    promotion_commitment_profile: null,
  });
  const closed = normalizeN4HumanPromotionDecision({
    human_promotion_decision: makeHumanDecision('park'),
    promotion_decision: makePromotionDecision({
      decision: 'park',
      bridge_eligible: false,
      decision_class: 'non_promote',
    }),
    promotion_commitment_profile: null,
  });

  assert.equal(bridgeAuthorized.routing_outcome, 'bridge_authorized');
  assert.equal(bridgeAuthorized.automation, 'advance');
  assert.equal(actionRequired.routing_outcome, 'action_required');
  assert.equal(actionRequired.automation, 'stop');
  assert.equal(closed.routing_outcome, 'closed_no_auto_progress');
  assert.equal(closed.automation, 'stop');
});

test('T-108 harness adapter normalizes N6 direct feedback results', () => {
  const recheck = normalizeN6DownstreamFeedback(makeFeedback(true));
  const recorded = normalizeN6DownstreamFeedback(makeFeedback(false));
  const invalid = invalidFeedbackNodeResult({ message: 'Unsupported downstream feedback signal.' });

  assert.equal(recheck.routing_outcome, 'recheck_opened');
  assert.equal(recheck.automation, 'record_only');
  assert.equal(recheck.authority_refs.some((ref) => ref.ref_type === 'downstream_recheck_request'), true);
  assert.equal(recorded.routing_outcome, 'feedback_recorded');
  assert.equal(recorded.authority_refs.some((ref) => ref.ref_type === 'downstream_recheck_request'), false);
  assert.equal(invalid.routing_outcome, 'invalid_feedback');
  assert.equal(invalid.authority_refs.length, 0);
});

function makeHumanDecision(
  decision: TopicSelectionPromotionDecisionRecord['decision'],
): TopicSelectionHumanPromotionDecisionRecord {
  const decisionClass: TopicSelectionHumanPromotionDecisionRecord['decision_class'] =
    decision === 'promote_with_conditions' || decision === 'promote_to_paper_project'
      ? 'promote'
      : 'non_promote';
  return {
    human_promotion_decision_id: 'human_promotion_decision_001',
    human_confirmed_decision_id: 'human_confirmed_decision_001',
    human_promotion_decision_key: 'human_promotion_decision_key_001',
    workspace_id: 'workspace_001',
    title_card_id: 'title_card_001',
    promotion_gate_check_id: 'promotion_gate_check_001',
    promotion_gate_check_ref: topicSelectionV1cAcceptanceRef('promotion_gate_check', 'promotion_gate_check_001'),
    promotion_input_snapshot_id: 'promotion_input_snapshot_001',
    promotion_input_snapshot_hash: 'promotion_input_snapshot_hash_001',
    decision,
    decision_class: decisionClass,
    actor: {
      actor_type: 'human',
      actor_id: 'reviewer_001',
    },
    decision_timestamp: TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
    confirmed_snapshot_hash: 'promotion_input_snapshot_hash_001',
    rationale: 'Harness adapter fixture.',
    conditions: [],
    required_actions: [],
    loopback_target: decision === 'refine_package' ? 'package' : null,
    loopback_refs: [],
    accepted_risk_refs: [],
    allowed_refinements: [],
    stop_conditions: [],
    reopen_conditions: [],
    source_refs: [],
    artifact_refs: [],
    policy_version_id: null,
    created_at: TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  };
}

function makePromotionDecision(overrides: Partial<TopicSelectionPromotionDecisionRecord>): TopicSelectionPromotionDecisionRecord {
  return {
    promotion_decision_id: 'promotion_decision_001',
    promotion_decision_status: 'current',
    current_promotion_input_snapshot_key: 'promotion_input_snapshot_001',
    human_promotion_decision_id: 'human_promotion_decision_001',
    human_confirmed_decision_id: 'human_confirmed_decision_001',
    workspace_id: 'workspace_001',
    title_card_id: 'title_card_001',
    promotion_gate_check_id: 'promotion_gate_check_001',
    promotion_input_snapshot_id: 'promotion_input_snapshot_001',
    promotion_input_snapshot_hash: 'promotion_input_snapshot_hash_001',
    gate_disposition: 'ready_for_human_decision',
    decision: 'promote_with_conditions',
    decision_class: 'promote',
    bridge_eligible: true,
    promotion_commitment_profile_id: null,
    loopback_target: null,
    required_actions: [],
    accepted_risk_refs: [],
    conditions: [],
    source_refs: [],
    snapshot_hashes: {
      bundle_hash: 'bundle_hash_001',
      package_snapshot_hash: 'package_snapshot_hash_001',
      package_draft_input_snapshot_hash: 'package_draft_input_snapshot_hash_001',
      promotion_input_snapshot_hash: 'promotion_input_snapshot_hash_001',
    },
    artifact_refs: [],
    created_at: TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
    ...overrides,
  };
}

function makeFeedback(withRecheck: boolean): TopicSelectionDownstreamTopicFeedbackRecord {
  const affectedRef = topicSelectionV1cAcceptanceRef('evidence_unit', 'evidence_unit_001');
  const feedbackRef = topicSelectionV1cAcceptanceRef(
    'downstream_topic_feedback',
    'downstream_topic_feedback_001',
  );
  return {
    downstream_topic_feedback_id: 'downstream_topic_feedback_001',
    feedback_fingerprint: 'feedback_fingerprint_001',
    workspace_id: 'workspace_001',
    title_card_id: 'title_card_001',
    paper_project_bridge_id: 'paper_project_bridge_001',
    paper_project_bridge_ref: topicSelectionV1cAcceptanceRef('paper_project_bridge', 'paper_project_bridge_001'),
    source_promotion_decision_ref: topicSelectionV1cAcceptanceRef('promotion_decision', 'promotion_decision_001'),
    promotion_commitment_profile_ref: topicSelectionV1cAcceptanceRef(
      'promotion_commitment_profile',
      'promotion_commitment_profile_001',
    ),
    promotion_input_snapshot_id: 'promotion_input_snapshot_001',
    promotion_input_snapshot_ref: topicSelectionV1cAcceptanceRef('promotion_input_snapshot', 'promotion_input_snapshot_001'),
    promotion_input_snapshot_hash: 'promotion_input_snapshot_hash_001',
    topic_package_id: 'topic_package_001',
    package_version: 'v1',
    downstream_source_kind: 'reviewer_check',
    downstream_source_ref: topicSelectionV1cAcceptanceRef('reviewer_check', 'reviewer_check_001'),
    source_feedback_refs: [],
    observed_blocker_refs: [],
    feedback_signal: withRecheck ? 'stale_evidence' : 'no_recheck_needed',
    severity: withRecheck ? 'blocking' : 'info',
    summary: 'Harness adapter fixture.',
    required_action: withRecheck ? 'Refresh selected evidence.' : null,
    classification: {
      loopback_target: withRecheck ? 'evidence_or_search' : 'paper_project_bridge',
      loopback_cause: withRecheck ? 'stale_evidence' : 'no_recheck_needed',
      severity: withRecheck ? 'blocking' : 'info',
      requires_recheck: withRecheck,
      affected_ref: affectedRef,
      affected_stage: withRecheck ? 'evidence_or_search' : 'paper_project_bridge',
      source_refs: [feedbackRef],
      rationale: 'Harness adapter fixture.',
      required_actions: withRecheck ? ['Refresh selected evidence.'] : [],
    },
    recheck_request: withRecheck
      ? {
          downstream_recheck_request_id: 'downstream_recheck_request_001',
          feedback_ref: feedbackRef,
          loopback_target: 'evidence_or_search',
          loopback_cause: 'stale_evidence',
          affected_ref: affectedRef,
          required_actions: ['Refresh selected evidence.'],
          reason_codes: ['stale_evidence'],
          source_refs: [feedbackRef],
          created_at: TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
        }
      : null,
    impact_summary: {
      impact_level: withRecheck ? 'recheck_required' : 'no_impact',
      severity: withRecheck ? 'blocking' : 'info',
      loopback_target: withRecheck ? 'evidence_or_search' : 'paper_project_bridge',
      loopback_cause: withRecheck ? 'stale_evidence' : 'no_recheck_needed',
      requires_recheck: withRecheck,
      affected_ref: affectedRef,
      summary: 'Harness adapter fixture.',
    },
    recheck_event_ref: null,
    recheck_impact_ref: null,
    decision_work_queue_item_ref: null,
    artifact_refs: [],
    payload: {},
    policy_version_id: null,
    created_by: 'system',
    created_at: TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  };
}
