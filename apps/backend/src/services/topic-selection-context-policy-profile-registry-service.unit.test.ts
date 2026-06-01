import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../errors/app-error.js';
import {
  createDefaultTopicSelectionContextPolicyProfileRegistry,
  TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY,
  TOPIC_SELECTION_V1A_N5_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1A_N5_INVOCATION_SLOT_IDS,
  TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS,
  TOPIC_SELECTION_V1A_N7_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1A_N7_INVOCATION_SLOT_IDS,
  TOPIC_SELECTION_V1A_N8_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1A_N8_INVOCATION_SLOT_IDS,
  TOPIC_SELECTION_V1B_N6_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1B_N6_INVOCATION_SLOT_IDS,
  TOPIC_SELECTION_V1B_N7_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1B_N7_INVOCATION_SLOT_IDS,
  TOPIC_SELECTION_V1B_N8_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1B_N8_INVOCATION_SLOT_IDS,
  TopicSelectionContextPolicyProfileRegistryService,
} from './topic-selection-context-policy-profile-registry-service.js';

test('context policy profile registry validates and resolves v1a runtime profiles', () => {
  const service = new TopicSelectionContextPolicyProfileRegistryService();
  const validation = service.validateRegistry();

  assert.equal(validation.valid, true);
  assert.equal(validation.issue_count, 0);

  const needGeneration = service.resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.need_candidate_generation,
    context_policy_profile_version: 'v1',
    invocation_slot_id: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
  });
  assert.equal(needGeneration.profile.context_family, 'v1a_n6_exploration');
  assert.equal(needGeneration.profile.functional_template, 'candidate_for_deterministic_gate');
  assert.equal(needGeneration.profile.token_budget_policy.estimated_input_token_target, 28000);
  assert.equal(needGeneration.profile.token_budget_policy.estimated_output_token_budget, 4096);
  assert.equal(needGeneration.profile.token_budget_policy.token_estimate_safety_margin, 1.25);
  assert.equal(needGeneration.profile.reuse_policy.provider_llm_response_reuse, 'blocked');
  assert.equal(needGeneration.profile.redaction_policy, TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY);
  assert.match(needGeneration.profile_hash, /^[a-f0-9]{64}$/);

  const explorer = service.resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.explorer_round_1_discovery,
    invocation_slot_id: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.explorer_round_1_discovery,
  });
  assert.equal(explorer.profile.context_family, 'v1a_n6_exploration');
  assert.equal(explorer.profile.functional_template, 'support_only_semantic');
  assert.equal(explorer.profile.provenance_policy.human_trust_summary_required, false);

  const arbiterFinal = service.resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.arbiter_final_synthesis,
    invocation_slot_id: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.arbiter_final_synthesis,
  });
  assert.equal(arbiterFinal.profile.context_family, 'v1a_n6_arbiter');
  assert.equal(arbiterFinal.profile.provenance_policy.human_trust_summary_required, true);
  assert.notEqual(explorer.profile_hash, arbiterFinal.profile_hash);

  const evidenceExtraction = service.resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1A_N5_CONTEXT_RUNTIME_PROFILE_IDS.evidence_extraction,
    invocation_slot_id: TOPIC_SELECTION_V1A_N5_INVOCATION_SLOT_IDS.evidence_extraction,
  });
  assert.equal(evidenceExtraction.profile.context_family, 'v1a_n5_evidence_extraction');
  assert.equal(evidenceExtraction.profile.functional_template, 'candidate_for_deterministic_gate');

  const adjudication = service.resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1A_N7_CONTEXT_RUNTIME_PROFILE_IDS.adjudication_recommendation,
    invocation_slot_id: TOPIC_SELECTION_V1A_N7_INVOCATION_SLOT_IDS.adjudication_recommendation,
  });
  assert.equal(adjudication.profile.context_family, 'v1a_n7_need_adjudication_support');
  assert.equal(adjudication.profile.functional_template, 'candidate_for_deterministic_gate');

  const confirmation = service.resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1A_N8_CONTEXT_RUNTIME_PROFILE_IDS.confirmation_semantic_review,
    invocation_slot_id: TOPIC_SELECTION_V1A_N8_INVOCATION_SLOT_IDS.confirmation_semantic_review,
  });
  assert.equal(confirmation.profile.context_family, 'v1a_n8_human_confirmation_semantic_review');
  assert.equal(confirmation.profile.functional_template, 'human_review_advisory');

  const grouping = service.resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1B_N7_CONTEXT_RUNTIME_PROFILE_IDS.candidate_grouping,
    invocation_slot_id: TOPIC_SELECTION_V1B_N7_INVOCATION_SLOT_IDS.candidate_grouping,
  });
  assert.equal(grouping.profile.context_family, 'v1b_n7_topic_question_hardening');
  assert.equal(grouping.profile.functional_template, 'support_only_semantic');

  const n6Draft = service.resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1B_N6_CONTEXT_RUNTIME_PROFILE_IDS.question_candidate_draft,
    invocation_slot_id: TOPIC_SELECTION_V1B_N6_INVOCATION_SLOT_IDS.question_candidate_draft,
  });
  assert.equal(n6Draft.profile.context_family, 'v1b_n6_topic_question_generation');
  assert.equal(n6Draft.profile.functional_template, 'candidate_for_deterministic_gate');
  assert.equal(n6Draft.profile.token_budget_policy.estimated_output_token_budget, 4096);
  assert.equal(n6Draft.profile.cache_policy.post_cache_gates.includes('draft_admission'), true);
  assert.equal(n6Draft.profile.post_reuse_gates.includes('authority_boundary'), true);
  assert.equal(
    n6Draft.profile.compression_policy.preserved_fact_kinds.includes('selected_slice_identity'),
    true,
  );
  assert.equal(
    n6Draft.profile.compression_policy.preserved_fact_kinds.includes('n5_handoff'),
    true,
  );
  assert.equal(
    n6Draft.profile.compression_policy.preserved_fact_kinds.includes('n7_loopback_projection'),
    true,
  );
  assert.equal(
    n6Draft.profile.compression_policy.preserved_fact_kinds.includes('n6_gate_failure_projection'),
    true,
  );
  assert.equal(
    n6Draft.profile.compression_policy.preserved_fact_kinds.includes('failed_draft_identity'),
    true,
  );
  assert.equal(
    n6Draft.profile.compression_policy.preserved_fact_kinds.includes('regeneration_hint'),
    true,
  );
  assert.equal(
    n6Draft.profile.compression_policy.allowed_executor_kinds.includes(
      'provider_llm' as never,
    ),
    false,
  );

  const n6LoopbackTriage = service.resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1B_N6_CONTEXT_RUNTIME_PROFILE_IDS.loopback_triage,
    invocation_slot_id: TOPIC_SELECTION_V1B_N6_INVOCATION_SLOT_IDS.loopback_triage,
  });
  assert.equal(n6LoopbackTriage.profile.context_family, 'v1b_n6_loopback_triage_context');
  assert.equal(n6LoopbackTriage.profile.functional_template, 'support_only_semantic');
  assert.equal(
    n6LoopbackTriage.profile.compression_policy.preserved_fact_kinds.includes('failed_draft_identity'),
    true,
  );
  assert.equal(
    n6LoopbackTriage.profile.cache_policy.post_cache_gates.includes('loopback_boundary'),
    true,
  );

  assert.deepEqual(
    grouping.profile.compression_policy.allowed_executor_kinds,
    ['deterministic_structural', 'codex_assisted'],
  );
  assert.equal(
    grouping.profile.compression_policy.preserved_fact_kinds.includes('candidate_identity'),
    true,
  );
  assert.equal(
    grouping.profile.compression_policy.preserved_fact_kinds.includes('overlap_group'),
    true,
  );
  assert.equal(
    grouping.profile.compression_policy.allowed_executor_kinds.includes(
      'provider_llm' as never,
    ),
    false,
  );

  const failedTrial = service.resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1B_N7_CONTEXT_RUNTIME_PROFILE_IDS.failed_trial_synthesis,
    invocation_slot_id: TOPIC_SELECTION_V1B_N7_INVOCATION_SLOT_IDS.failed_trial_synthesis,
  });
  assert.equal(
    failedTrial.profile.compression_policy.preserved_fact_kinds.includes('n8_feedback'),
    true,
  );
  assert.equal(
    failedTrial.profile.compression_policy.preserved_fact_kinds.includes('loopback_target'),
    true,
  );

  const debateAdmission = service.resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1B_N7_CONTEXT_RUNTIME_PROFILE_IDS.n8_debate_admission_review,
    invocation_slot_id: TOPIC_SELECTION_V1B_N7_INVOCATION_SLOT_IDS.n8_debate_admission_review,
  });
  assert.equal(
    debateAdmission.profile.compression_policy.preserved_fact_kinds.includes('n8_gate_rejection_reason'),
    true,
  );
  assert.equal(
    debateAdmission.profile.cache_policy.post_cache_gates.includes('n8_admission_boundary'),
    true,
  );

  const n8ValueAssessment = service.resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1B_N8_CONTEXT_RUNTIME_PROFILE_IDS.value_assessment_draft,
    invocation_slot_id: TOPIC_SELECTION_V1B_N8_INVOCATION_SLOT_IDS.value_assessment_draft,
  });
  assert.equal(n8ValueAssessment.profile.context_family, 'v1b_n8_topic_value_assessment');
  assert.equal(n8ValueAssessment.profile.functional_template, 'candidate_for_deterministic_gate');
  assert.equal(n8ValueAssessment.profile.token_budget_policy.estimated_output_token_budget, 4096);
  assert.equal(n8ValueAssessment.profile.cache_policy.post_cache_gates.includes('draft_admission'), true);
  assert.equal(
    n8ValueAssessment.profile.cache_policy.post_cache_gates.includes('compression_structure_manifest'),
    true,
  );
  assert.equal(
    n8ValueAssessment.profile.compression_policy.preserved_fact_kinds.includes('n7_to_n8_projection'),
    true,
  );
  assert.equal(
    n8ValueAssessment.profile.compression_policy.preserved_fact_kinds.includes('trial_ledger'),
    true,
  );
  assert.equal(
    n8ValueAssessment.profile.compression_policy.preserved_fact_kinds.includes('feedback_recheck_hint'),
    true,
  );
});

test('context policy profile registry fails closed for unknown profile, version mismatch, slot mismatch, and hash drift', () => {
  const service = new TopicSelectionContextPolicyProfileRegistryService();

  assert.throws(
    () => service.resolveProfile({
      context_policy_profile_id: 'missing-profile',
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.errorCode === 'INVALID_PAYLOAD'
      && error.message === 'context policy profile does not exist.',
  );

  assert.throws(
    () => service.resolveProfile({
      context_policy_profile_id:
        TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.need_candidate_generation,
      context_policy_profile_version: 'v2',
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.errorCode === 'INVALID_PAYLOAD'
      && error.message === 'context policy profile version mismatch.',
  );

  assert.throws(
    () => service.resolveProfile({
      context_policy_profile_id:
        TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.need_candidate_generation,
      invocation_slot_id: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.arbiter_final_synthesis,
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.errorCode === 'INVALID_PAYLOAD'
      && error.message === 'invocation_slot_id does not match context policy profile.',
  );

  assert.throws(
    () => service.resolveProfile({
      context_policy_profile_id:
        TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.need_candidate_generation,
      expected_profile_hash: '0'.repeat(64),
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.errorCode === 'INVALID_PAYLOAD'
      && error.message === 'context policy profile hash drift detected.',
  );
});

test('context policy profile registry catches duplicate ids and policy drift', () => {
  const registry = createDefaultTopicSelectionContextPolicyProfileRegistry();
  registry.profiles.push({ ...registry.profiles[0]! });
  const firstProfile = registry.profiles[0]!;
  firstProfile.reuse_policy.provider_llm_response_reuse = 'treated_as_miss';
  firstProfile.compression_policy.quality_gate_required = false;
  firstProfile.cache_policy.exact_key_fields = firstProfile.cache_policy.exact_key_fields.filter(
    (field) => field !== 'profile_hash',
  );
  firstProfile.cache_policy.post_cache_gates = [];
  firstProfile.compression_policy.forbidden_payload_classes =
    firstProfile.compression_policy.forbidden_payload_classes.filter(
      (payloadClass) => payloadClass !== 'hidden_reasoning',
    );
  firstProfile.compression_policy.preserved_fact_kinds =
    firstProfile.compression_policy.preserved_fact_kinds.filter(
      (factKind) => factKind !== 'residual_risk',
    );

  const service = new TopicSelectionContextPolicyProfileRegistryService({ registry });
  const validation = service.validateRegistry();
  const codes = validation.issues.map((issue) => issue.code);

  assert.equal(validation.valid, false);
  assert.ok(codes.includes('DUPLICATE_PROFILE_ID'));
  assert.ok(codes.includes('DUPLICATE_INVOCATION_SLOT_ID'));
  assert.ok(codes.includes('PROVIDER_REQUIRED_LIVE_POLICY_INVALID'));
  assert.ok(codes.includes('COMPRESSION_QUALITY_GATE_REQUIRED'));
  assert.ok(codes.includes('CACHE_KEY_FIELD_MISSING'));
  assert.ok(codes.includes('CACHE_POST_GATE_MISSING'));
  assert.ok(codes.includes('FORBIDDEN_PAYLOAD_CLASS_MISSING'));
  assert.ok(codes.includes('REQUIRED_PRESERVED_FACT_MISSING'));
});

test('context policy profile registry treats schema-invalid profile rows as invalid registry', () => {
  const registry = createDefaultTopicSelectionContextPolicyProfileRegistry();
  (
    registry.profiles[0]!.memory_policy as unknown as Record<string, unknown>
  ).durable_memory_as_standalone_evidence = true;
  const service = new TopicSelectionContextPolicyProfileRegistryService({ registry });
  const validation = service.validateRegistry();

  assert.equal(validation.valid, false);
  assert.equal(validation.issues[0]?.code, 'SCHEMA_VALIDATION_FAILED');
});
