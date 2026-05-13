import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import type { TopicSelectionFunctionalRef } from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import { AppError } from '../errors/app-error.js';
import { InMemoryTopicSelectionControlPlaneRepository } from '../repositories/in-memory-topic-selection-control-plane-repository.js';
import { InMemoryTopicSelectionNeedValidationRepository } from '../repositories/in-memory-topic-selection-need-validation-repository.js';
import { InMemoryTopicSelectionRecheckRiskMemoryRepository } from '../repositories/in-memory-topic-selection-recheck-risk-memory-repository.js';
import { InMemoryTopicSelectionSearchResourceRepository } from '../repositories/in-memory-topic-selection-search-resource-repository.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import { TopicSelectionRecheckRiskMemoryService } from './topic-selection-recheck-risk-memory-service.js';

function ref(refType: string, refId: string, titleCardId = 'title_card_t051'): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: titleCardId,
  };
}

function makeContext() {
  let sequence = 0;
  const now = () => '2026-05-13T00:00:00.000Z';
  const idFactory = (prefix: string) => `${prefix}_${++sequence}`;
  const controlPlaneRepository = new InMemoryTopicSelectionControlPlaneRepository();
  const controlPlane = new TopicSelectionControlPlaneService(controlPlaneRepository, { idFactory, now });
  const recheckRepository = new InMemoryTopicSelectionRecheckRiskMemoryRepository();
  const searchRepository = new InMemoryTopicSelectionSearchResourceRepository();
  const needValidationRepository = new InMemoryTopicSelectionNeedValidationRepository();
  const service = new TopicSelectionRecheckRiskMemoryService(
    recheckRepository,
    controlPlane,
    searchRepository,
    needValidationRepository,
    { idFactory, now },
  );
  return {
    controlPlane,
    needValidationRepository,
    recheckRepository,
    searchRepository,
    service,
  };
}

test('raw QualitySignal is ignored until policy interpretation creates recheck impact and queue item', async () => {
  const ctx = makeContext();
  const targetRef = ref('need_candidate', 'need_001');
  const signal = await ctx.controlPlane.emitQualitySignal({
    workspace_id: 'workspace_t051',
    title_card_id: 'title_card_t051',
    target_ref: targetRef,
    stage: 'v1a',
    check_type: 'trace_integrity',
    verdict: 'fail',
    issue_codes: ['TRACE_INCOMPLETE'],
    recommended_action: 'inspect_trace',
    blocking_transition_keys: ['need-candidate-ready-for-validation'],
    refs: [ref('evidence_map', 'evidence_map_001')],
  });

  assert.deepEqual(await ctx.service.listOpenQueueItems(), []);

  const interpreted = await ctx.service.interpretQualitySignal({
    quality_signal_id: signal.quality_signal_id,
  });
  const queueItems = await ctx.service.listOpenQueueItems();

  assert.equal(interpreted.event?.event_type, 'quality_signal');
  assert.equal(interpreted.event?.workspace_id, 'workspace_t051');
  assert.equal(interpreted.impact?.workspace_id, 'workspace_t051');
  assert.equal(interpreted.impact?.impact_level, 'recheck_required');
  assert.equal(interpreted.queue_item?.queue_item_type, 'recheck');
  assert.equal(interpreted.queue_item?.workspace_id, 'workspace_t051');
  assert.equal(queueItems.length, 1);
  assert.equal(queueItems[0]?.target_ref.ref_id, targetRef.ref_id);
});

test('duplicate signal interpretation merges event and deduplicates impact and queue item during cooldown', async () => {
  const ctx = makeContext();
  const signal = await ctx.controlPlane.emitQualitySignal({
    title_card_id: 'title_card_t051',
    target_ref: ref('need_candidate', 'need_002'),
    stage: 'v1a',
    check_type: 'pseudo_gap_risk',
    verdict: 'fail',
    issue_codes: ['PSEUDO_GAP_RISK'],
  });

  const first = await ctx.service.interpretQualitySignal({ quality_signal_id: signal.quality_signal_id });
  const second = await ctx.service.interpretQualitySignal({ quality_signal_id: signal.quality_signal_id });
  const queueItems = await ctx.service.listOpenQueueItems();

  assert.equal(first.event?.recheck_event_id, second.event?.recheck_event_id);
  assert.equal(second.event?.observation_count, 2);
  assert.equal(first.impact?.recheck_impact_id, second.impact?.recheck_impact_id);
  assert.equal(first.queue_item?.decision_work_queue_item_id, second.queue_item?.decision_work_queue_item_id);
  assert.equal(queueItems.length, 1);
  assert.equal(queueItems[0]?.retry_budget, 3);
  assert.equal(queueItems[0]?.cooldown_until, '2026-05-13T00:30:00.000Z');
});

test('blocked gate result becomes a blocker queue item through policy interpretation', async () => {
  const ctx = makeContext();
  const targetRef = ref('need_candidate', 'need_003');
  const gate = await ctx.controlPlane.runDeterministicGate({
    title_card_id: 'title_card_t051',
    gate_key: 'topic-selection.need-candidate-ready-for-validation',
    target_ref: targetRef,
    blockers: [
      {
        code: 'OPEN_HIGH_PRIORITY_RECHECK',
        message: 'Recheck must be resolved.',
        severity: 'blocking',
      },
    ],
    required_actions: ['resolve_recheck'],
  });

  const interpreted = await ctx.service.interpretGateResult({
    readiness_gate_result_id: gate.readiness_gate_result_id,
  });

  assert.equal(interpreted.event?.event_type, 'gate_result');
  assert.equal(interpreted.impact?.impact_level, 'recheck_required');
  assert.equal(interpreted.queue_item?.queue_item_type, 'blocker');
  assert.equal(interpreted.queue_item?.reason_codes[0], 'OPEN_HIGH_PRIORITY_RECHECK');
});

test('pass-with-risk gate result routes to accepted-risk handling instead of blocker resolution', async () => {
  const ctx = makeContext();
  const targetRef = ref('need_candidate', 'need_003_risk');
  const gate = await ctx.controlPlane.runDeterministicGate({
    title_card_id: 'title_card_t051',
    gate_key: 'topic-selection.need-candidate-ready-with-risk',
    target_ref: targetRef,
    verdict: 'pass_with_risk',
    warnings: [
      {
        code: 'RESIDUAL_COVERAGE_RISK',
        message: 'Residual coverage risk requires explicit acceptance.',
        severity: 'warning',
      },
    ],
  });

  const interpreted = await ctx.service.interpretGateResult({
    readiness_gate_result_id: gate.readiness_gate_result_id,
  });

  assert.equal(interpreted.event?.event_type, 'gate_result');
  assert.equal(interpreted.queue_item?.queue_item_type, 'human_review');
  assert.equal(interpreted.queue_item?.handler_key, 'accept_risk');
  assert.deepEqual(interpreted.queue_item?.required_actions, ['accept_risk']);
});

test('workflow failure interpretation creates a focused workflow-failure queue item', async () => {
  const ctx = makeContext();
  const targetRef = ref('evidence_map', 'evidence_map_001');
  const workflow = await ctx.controlPlane.recordWorkflowRun({
    title_card_id: 'title_card_t051',
    workflow_key: 'topic-selection.evidence-map-refresh',
    workflow_profile_key: 'fixture',
    status: 'failed',
    error_code: 'MODEL_TIMEOUT',
    error_message: 'Fixture timeout',
  });

  const interpreted = await ctx.service.interpretWorkflowFailure({
    workflow_run_id: workflow.workflow_run.workflow_run_id,
    target_ref: targetRef,
  });

  assert.equal(interpreted.event?.event_type, 'workflow_failure');
  assert.equal(interpreted.queue_item?.queue_item_type, 'workflow_failure');
  assert.equal(interpreted.queue_item?.handler_key, 'rerun_workflow');
});

test('SearchPlanRecheckRequest is queued without mutating the request or SearchPlan authority', async () => {
  const ctx = makeContext();
  const request = await ctx.searchRepository.createSearchPlanRecheckRequest({
    search_plan_recheck_request_id: 'search_recheck_001',
    workspace_id: null,
    title_card_id: 'title_card_t051',
    source_ref: ref('need_candidate', 'need_004'),
    target_search_plan_ref: ref('search_plan', 'search_plan_001'),
    target_literature_snapshot_ref: ref('literature_resource_pool_snapshot', 'snapshot_001'),
    reason: 'Coverage gap blocks need validation.',
    gap_codes: ['COVERAGE_GAP'],
    requested_by: 'human',
    status: 'open',
    decision_summary: null,
    policy_version_id: 'policy_v1',
    accepted_risk_refs: [],
    resulting_search_plan_ref: null,
    resulting_search_run_ref: null,
    created_at: '2026-05-13T00:00:00.000Z',
    resolved_at: null,
  });

  const interpreted = await ctx.service.queueSearchPlanRecheckRequest({
    search_plan_recheck_request_id: request.search_plan_recheck_request_id,
  });

  assert.equal(interpreted.event?.event_type, 'searchplan_recheck_request');
  assert.equal(interpreted.queue_item?.queue_item_type, 'searchplan_recheck');
  assert.equal(interpreted.queue_item?.handler_key, 'revise_search_plan');
  assert.equal((await ctx.searchRepository.findSearchPlanRecheckRequestById(request.search_plan_recheck_request_id))?.status, 'open');
});

test('AcceptedRisk requires scope and expiry or recheck condition, and expiry reopens review', async () => {
  const ctx = makeContext();

  await assert.rejects(
    () => ctx.service.acceptRisk({
      title_card_id: 'title_card_t051',
      risk_type: 'coverage_gap',
      target_ref: ref('need_candidate', 'need_005'),
      scope_refs: [],
      rationale: 'Missing scope must fail.',
      accepted_by: { actor_type: 'human', actor_id: 'reviewer_1' },
      recheck_condition: 'new evidence arrives',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  await assert.rejects(
    () => ctx.service.acceptRisk({
      title_card_id: 'title_card_t051',
      risk_type: 'coverage_gap',
      target_ref: ref('need_candidate', 'need_005'),
      scope_refs: [ref('search_plan', 'search_plan_005')],
      rationale: 'Missing expiry and recheck condition must fail.',
      accepted_by: { actor_type: 'human', actor_id: 'reviewer_1' },
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  const risk = await ctx.service.acceptRisk({
    title_card_id: 'title_card_t051',
    risk_type: 'coverage_gap',
    target_ref: ref('need_candidate', 'need_005'),
    scope_refs: [ref('search_plan', 'search_plan_005')],
    affected_object_refs: [ref('need_candidate', 'need_005')],
    rationale: 'Proceed while accepting a bounded coverage gap.',
    accepted_by: { actor_type: 'human', actor_id: 'reviewer_1' },
    expires_at: '2026-05-12T00:00:00.000Z',
  });
  const interpreted = await ctx.service.interpretAcceptedRiskExpiry({
    accepted_risk_id: risk.accepted_risk_id,
  });

  assert.equal(risk.status, 'active');
  assert.equal((await ctx.recheckRepository.findAcceptedRiskById(risk.accepted_risk_id))?.status, 'expired');
  assert.equal(interpreted.event?.event_type, 'accepted_risk_expiry');
  assert.equal(interpreted.queue_item?.queue_item_type, 'accepted_risk_expiry');
});

test('HumanOverride requires a human actor and an accepted risk ref or creation payload', async () => {
  const ctx = makeContext();
  const targetRef = ref('need_candidate', 'need_006');

  await assert.rejects(
    () => ctx.service.recordHumanOverride({
      target_ref: targetRef,
      blocker_type: 'coverage_gap',
      actor: { actor_type: 'system' },
      rationale: 'System cannot override.',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  await assert.rejects(
    () => ctx.service.recordHumanOverride({
      target_ref: targetRef,
      blocker_type: 'coverage_gap',
      actor: { actor_type: 'human', actor_id: 'reviewer_1' },
      rationale: 'Risk is missing.',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  const override = await ctx.service.recordHumanOverride({
    target_ref: targetRef,
    blocker_type: 'coverage_gap',
    actor: { actor_type: 'human', actor_id: 'reviewer_1' },
    rationale: 'Accept scoped residual risk for this validation pass.',
    accepted_risk: {
      title_card_id: 'title_card_t051',
      risk_type: 'coverage_gap',
      target_ref: targetRef,
      scope_refs: [ref('validation_decision_support_packet', 'packet_006')],
      rationale: 'Human accepted a bounded coverage gap.',
      accepted_by: { actor_type: 'human', actor_id: 'reviewer_1' },
      recheck_condition: 'new challenge evidence appears',
    },
  });

  assert.equal(override.status, 'active');
  assert.equal(override.accepted_risk_ref.ref_type, 'accepted_risk');
});

test('HumanOverride rejects expired or out-of-scope accepted risk refs', async () => {
  const ctx = makeContext();
  const targetRef = ref('need_candidate', 'need_006_scope');
  const expiredRisk = await ctx.service.acceptRisk({
    title_card_id: 'title_card_t051',
    risk_type: 'coverage_gap',
    target_ref: targetRef,
    scope_refs: [ref('validation_decision_support_packet', 'packet_006_scope')],
    rationale: 'Expired risk cannot authorize an override.',
    accepted_by: { actor_type: 'human', actor_id: 'reviewer_1' },
    expires_at: '2026-05-12T00:00:00.000Z',
  });
  const otherTargetRisk = await ctx.service.acceptRisk({
    title_card_id: 'title_card_t051',
    risk_type: 'coverage_gap',
    target_ref: ref('need_candidate', 'need_006_other'),
    scope_refs: [ref('validation_decision_support_packet', 'packet_006_other')],
    rationale: 'Wrong target risk cannot authorize this override.',
    accepted_by: { actor_type: 'human', actor_id: 'reviewer_1' },
    recheck_condition: 'new challenge evidence appears',
  });

  await assert.rejects(
    () => ctx.service.recordHumanOverride({
      target_ref: targetRef,
      blocker_type: 'coverage_gap',
      actor: { actor_type: 'human', actor_id: 'reviewer_1' },
      rationale: 'Expired risk should be rejected.',
      accepted_risk_id: expiredRisk.accepted_risk_id,
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
  await assert.rejects(
    () => ctx.service.recordHumanOverride({
      target_ref: targetRef,
      blocker_type: 'coverage_gap',
      actor: { actor_type: 'human', actor_id: 'reviewer_1' },
      rationale: 'Out-of-scope risk should be rejected.',
      accepted_risk_id: otherTargetRisk.accepted_risk_id,
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'VERSION_CONFLICT',
  );
});

test('non-overridable blocker policy prevents human override even with accepted risk input', async () => {
  const ctx = makeContext();
  const targetRef = ref('need_candidate', 'need_006_policy');
  await ctx.recheckRepository.createBlockerPolicy({
    blocker_policy_id: 'blocker_policy_001',
    blocker_code: 'TRACE_INCOMPLETE',
    category: 'non_overridable',
    default_action: 'inspect_trace',
    allowed_handler_keys: ['inspect_trace'],
    policy_version_id: 'policy_v1',
    status: 'active',
    created_at: '2026-05-13T00:00:00.000Z',
    retired_at: null,
  });

  await assert.rejects(
    () => ctx.service.recordHumanOverride({
      target_ref: targetRef,
      blocker_type: 'TRACE_INCOMPLETE',
      actor: { actor_type: 'human', actor_id: 'reviewer_1' },
      rationale: 'Attempt to override a hard blocker.',
      policy_version_id: 'policy_v1',
      accepted_risk: {
        title_card_id: 'title_card_t051',
        risk_type: 'trace_integrity',
        target_ref: targetRef,
        scope_refs: [targetRef],
        rationale: 'This should not be accepted for a non-overridable blocker.',
        accepted_by: { actor_type: 'human', actor_id: 'reviewer_1' },
        recheck_condition: 'trace is repaired',
      },
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
});

test('candidate memory suggestions materialize durable non-evidence memory once', async () => {
  const ctx = makeContext();
  await ctx.needValidationRepository.createCandidateDecisionMemorySuggestion({
    memory_suggestion_id: 'memory_suggestion_001',
    workspace_id: null,
    title_card_id: 'title_card_t051',
    source_need_candidate_id: 'need_007',
    adjudication_result_id: 'adjudication_007',
    suggestion_type: 'rejection_reason',
    status: 'suggested',
    target_ref: ref('need_candidate', 'need_007'),
    suggestion_payload: {
      reason_codes: ['PSEUDO_GAP'],
      effect_policy: 'block_until_rechecked',
      memory_type: 'already_solved',
      confidence: 0.9,
    },
    rationale: 'This pseudo gap should block repetition until rechecked.',
    policy_version_id: 'policy_v1',
    created_by: 'human',
    created_at: '2026-05-13T00:00:00.000Z',
  });

  const first = await ctx.service.materializeCandidateMemorySuggestion({
    memory_suggestion_id: 'memory_suggestion_001',
  });
  const second = await ctx.service.materializeCandidateMemorySuggestion({
    memory_suggestion_id: 'memory_suggestion_001',
  });

  assert.equal(first.memory_entry.memory_type, 'already_solved');
  assert.equal(first.memory_entry.effect_policy, 'block_until_rechecked');
  assert.equal(first.memory_entry.evidence_policy, 'not_evidence');
  assert.equal(first.candidate_memory.evidence_policy, 'not_evidence');
  assert.equal(first.candidate_memory.candidate_decision_memory_id, second.candidate_memory.candidate_decision_memory_id);
});

test('downstream feedback creates derived queue state through policy interpretation', async () => {
  const ctx = makeContext();

  const interpreted = await ctx.service.recordDownstreamFeedback({
    source_ref: ref('promotion_bridge_feedback', 'feedback_001'),
    affected_ref: ref('validated_need', 'validated_need_001'),
    feedback_type: 'promotion_readiness_regression',
    reason_codes: ['DOWNSTREAM_COUNTER_EVIDENCE'],
    summary: 'Promotion bridge found counter-evidence that invalidates v1a readiness.',
    impact_level: 'invalidated',
  });

  assert.equal(interpreted.event?.event_type, 'downstream_feedback');
  assert.equal(interpreted.impact?.impact_level, 'invalidated');
  assert.equal(interpreted.queue_item?.queue_item_type, 'downstream_feedback');
  assert.equal(interpreted.queue_item?.handler_key, 'human_review');
});

test('accepted-risk impact resolution requires and records the accepted risk ref', async () => {
  const ctx = makeContext();
  const signal = await ctx.controlPlane.emitQualitySignal({
    title_card_id: 'title_card_t051',
    target_ref: ref('need_candidate', 'need_008'),
    stage: 'v1a',
    check_type: 'counter_evidence_recall',
    verdict: 'fail',
    issue_codes: ['COUNTER_EVIDENCE_RECALL_LOW'],
  });
  const interpreted = await ctx.service.interpretQualitySignal({
    quality_signal_id: signal.quality_signal_id,
  });

  await assert.rejects(
    () => ctx.service.resolveRecheckImpact({
      recheck_impact_id: interpreted.impact!.recheck_impact_id,
      resolution_type: 'accepted_risk',
      resolved_by: { actor_type: 'human', actor_id: 'reviewer_1' },
      rationale: 'Accepted risk ref is required.',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
  await assert.rejects(
    () => ctx.service.resolveRecheckImpact({
      recheck_impact_id: interpreted.impact!.recheck_impact_id,
      resolution_type: 'accepted_risk',
      resolved_by: { actor_type: 'human', actor_id: 'reviewer_1' },
      rationale: 'Missing accepted risk record should fail.',
      accepted_risk_ref: ref('accepted_risk', 'missing_risk'),
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'NOT_FOUND',
  );

  const risk = await ctx.service.acceptRisk({
    title_card_id: 'title_card_t051',
    risk_type: 'counter_evidence_recall',
    target_ref: ref('need_candidate', 'need_008'),
    scope_refs: [ref('evidence_map', 'evidence_map_008')],
    rationale: 'Human accepts a bounded recall risk for this pass.',
    accepted_by: { actor_type: 'human', actor_id: 'reviewer_1' },
    recheck_condition: 'new challenge evidence appears',
  });
  const riskRef = ref('accepted_risk', risk.accepted_risk_id);
  const resolution = await ctx.service.resolveRecheckImpact({
    recheck_impact_id: interpreted.impact!.recheck_impact_id,
    resolution_type: 'accepted_risk',
    resolved_by: { actor_type: 'human', actor_id: 'reviewer_1' },
    rationale: 'Bounded recall risk accepted with a recheck condition.',
    accepted_risk_ref: riskRef,
  });

  const impact = await ctx.recheckRepository.findRecheckImpactById(interpreted.impact!.recheck_impact_id);
  assert.equal(resolution.accepted_risk_ref?.ref_id, risk.accepted_risk_id);
  assert.equal(impact?.status, 'resolved');
  assert.equal(impact?.accepted_risk_refs[0]?.ref_id, risk.accepted_risk_id);
});

test('Prisma migration uses active partial dedup indexes instead of historical status uniqueness', async () => {
  const schema = await readFile(new URL('../../../../prisma/schema.prisma', import.meta.url), 'utf8');
  const migration = await readFile(
    new URL(
      '../../../../prisma/migrations/20260513223000_add_topic_selection_recheck_risk_memory/migration.sql',
      import.meta.url,
    ),
    'utf8',
  );

  assert.doesNotMatch(schema, /@@unique\(\[eventFingerprint, status\]\)/);
  assert.doesNotMatch(schema, /@@unique\(\[impactDedupKey, status\]\)/);
  assert.doesNotMatch(schema, /@@unique\(\[queueDedupKey, status\]\)/);
  assert.match(migration, /WHERE "status" = 'open'/);
  assert.match(migration, /WHERE "status" IN \('open', 'queued', 'in_progress'\)/);
  assert.match(migration, /WHERE "status" IN \('open', 'in_progress'\)/);
});
