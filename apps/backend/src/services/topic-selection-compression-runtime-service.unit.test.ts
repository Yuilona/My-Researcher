import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionContextPolicyProfile,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';
import { AppError } from '../errors/app-error.js';
import {
  TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS,
  TOPIC_SELECTION_V1B_N7_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1B_N7_INVOCATION_SLOT_IDS,
  TopicSelectionContextPolicyProfileRegistryService,
} from './topic-selection-context-policy-profile-registry-service.js';
import { TopicSelectionCompressionRuntimeService } from './topic-selection-compression-runtime-service.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';

function ref(refType: string, refId: string): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: 'title_card_001',
  };
}

function resolvedProfile() {
  const registry = new TopicSelectionContextPolicyProfileRegistryService();
  return registry.resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.need_candidate_generation,
    invocation_slot_id:
      TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
  });
}

function resolvedV1bN7Profile(input: {
  context_policy_profile_id: string;
  invocation_slot_id: string;
}) {
  const registry = new TopicSelectionContextPolicyProfileRegistryService();
  return registry.resolveProfile(input);
}

function inputContext() {
  return {
    source_refs: [ref('evidence_unit', 'support_001')],
    blockers: ['NO_SOURCE_HEALTH_GAP'],
    residual_risks: ['risk_prior_art_overlap'],
    accepted_risks: ['risk_scope_narrow'],
    source_health_warnings: ['source_health_partial_coverage'],
    method_family_gaps: ['gap_hybrid_adaptation'],
    unresolved_challenges: ['challenge_prior_art_boundary'],
    recheck_hints: ['recheck_after_supplemental_round'],
    verbose_notes: 'Long exploratory context that can be summarized after refs and risks are preserved.',
  };
}

function compressedContext() {
  return {
    source_refs: [ref('evidence_unit', 'support_001')],
    preserved: {
      blockers: ['NO_SOURCE_HEALTH_GAP'],
      residual_risks: ['risk_prior_art_overlap'],
      accepted_risks: ['risk_scope_narrow'],
      source_health_warnings: ['source_health_partial_coverage'],
      method_family_gaps: ['gap_hybrid_adaptation'],
      unresolved_challenges: ['challenge_prior_art_boundary'],
      recheck_hints: ['recheck_after_supplemental_round'],
    },
    summary: 'Compressed ref-backed context preserving blockers, risks, gaps, challenges, and recheck hints.',
  };
}

function requiredFacts() {
  return {
    blocker: ['NO_SOURCE_HEALTH_GAP'],
    residual_risk: ['risk_prior_art_overlap'],
    accepted_risk: ['risk_scope_narrow'],
    source_health_warning: ['source_health_partial_coverage'],
    method_family_gap: ['gap_hybrid_adaptation'],
    unresolved_challenge: ['challenge_prior_art_boundary'],
    recheck_hint: ['recheck_after_supplemental_round'],
  };
}

function v1bN7RequiredFacts() {
  return {
    blocker: ['N7_SUPPORT_GATE_REQUIRED'],
    residual_risk: ['risk_value_evidence_thin'],
    n8_feedback: ['feedback_ref_001'],
    loopback_target: ['topic-selection.v1b.N6'],
    regeneration_hint: ['hint_needs_clearer_research_axis'],
    candidate_identity: ['candidate_ref_001'],
    failed_candidate_identity: ['candidate_ref_002'],
    n8_gate_rejection_reason: ['novelty_gate_failed'],
    debate_admission_need: ['need_additional_value_risk_review'],
    value_risk_fact: ['risk_value_evidence_thin'],
  };
}

function profileHash(profile: TopicSelectionContextPolicyProfile): string {
  return sha256Text(stableStringify(profile));
}

test('compression runtime creates ref-backed hash-checked quality-gated report', () => {
  const { profile, profile_hash } = resolvedProfile();
  const runtime = new TopicSelectionCompressionRuntimeService();
  const result = runtime.createReport({
    context_policy_profile: profile,
    context_policy_profile_hash: profile_hash,
    compression_report_ref: ref('artifact_ref', 'compression_report_001'),
    source_refs: [ref('artifact_ref', 'context_packet_001')],
    input_context: inputContext(),
    compressed_context: compressedContext(),
    summary: 'Short summary preserving all required facts.',
    compression_executor_kind: 'deterministic_structural',
    required_preserved_facts: requiredFacts(),
    compressed_preserved_facts: requiredFacts(),
    estimated_input_tokens_before_override: 1000,
    estimated_input_tokens_after_override: 320,
  });

  assert.equal(result.quality_gate_result, 'passed');
  assert.deepEqual(result.blocker_codes, []);
  assert.deepEqual(result.warning_codes, []);
  assert.equal(result.report.compression_report_ref.ref_id, 'compression_report_001');
  assert.equal(result.report.source_refs.length, 1);
  assert.equal(result.report.redaction_policy, profile.redaction_policy);
  assert.equal(
    result.report.compression_strategy_id,
    profile.compression_policy.compression_strategy_id,
  );
  assert.match(result.report.input_context_hash, /^[a-f0-9]{64}$/);
  assert.match(result.report.compressed_context_hash, /^[a-f0-9]{64}$/);
  assert.match(result.report.summary_hash, /^[a-f0-9]{64}$/);
  assert.equal(result.report.estimated_input_tokens_before, 1000);
  assert.equal(result.report.estimated_input_tokens_after, 320);
  assert.ok(result.report.preserved_fact_kinds.includes('method_family_gap'));
});

test('compression quality gate blocks when required risk gap and recheck facts are dropped', () => {
  const { profile, profile_hash } = resolvedProfile();
  const runtime = new TopicSelectionCompressionRuntimeService();
  const result = runtime.createReport({
    context_policy_profile: profile,
    context_policy_profile_hash: profile_hash,
    compression_report_ref: ref('artifact_ref', 'compression_report_002'),
    source_refs: [ref('artifact_ref', 'context_packet_001')],
    input_context: inputContext(),
    compressed_context: {
      source_refs: [ref('evidence_unit', 'support_001')],
      summary: 'Dropped some quality-gate facts.',
    },
    summary: 'Compressed but incomplete.',
    compression_executor_kind: 'codex_assisted',
    required_preserved_facts: requiredFacts(),
    compressed_preserved_facts: {
      blocker: ['NO_SOURCE_HEALTH_GAP'],
      residual_risk: [],
      accepted_risk: ['risk_scope_narrow'],
      source_health_warning: ['source_health_partial_coverage'],
      method_family_gap: [],
      unresolved_challenge: ['challenge_prior_art_boundary'],
      recheck_hint: [],
    },
    estimated_input_tokens_before_override: 1000,
    estimated_input_tokens_after_override: 300,
  });

  assert.equal(result.quality_gate_result, 'blocked');
  assert.ok(result.blocker_codes.includes('COMPRESSION_REQUIRED_RESIDUAL_RISK_DROPPED'));
  assert.ok(result.blocker_codes.includes('COMPRESSION_REQUIRED_METHOD_FAMILY_GAP_DROPPED'));
  assert.ok(result.blocker_codes.includes('COMPRESSION_REQUIRED_RECHECK_HINT_DROPPED'));
  assert.equal(result.report.quality_gate_result, 'blocked');
});

test('compression quality gate blocks when v1b N7 runtime support facts are dropped', () => {
  const failedTrialProfile = resolvedV1bN7Profile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1B_N7_CONTEXT_RUNTIME_PROFILE_IDS.failed_trial_synthesis,
    invocation_slot_id:
      TOPIC_SELECTION_V1B_N7_INVOCATION_SLOT_IDS.failed_trial_synthesis,
  });
  const debateAdmissionProfile = resolvedV1bN7Profile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1B_N7_CONTEXT_RUNTIME_PROFILE_IDS.n8_debate_admission_review,
    invocation_slot_id:
      TOPIC_SELECTION_V1B_N7_INVOCATION_SLOT_IDS.n8_debate_admission_review,
  });
  const groupingProfile = resolvedV1bN7Profile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1B_N7_CONTEXT_RUNTIME_PROFILE_IDS.candidate_grouping,
    invocation_slot_id:
      TOPIC_SELECTION_V1B_N7_INVOCATION_SLOT_IDS.candidate_grouping,
  });
  const runtime = new TopicSelectionCompressionRuntimeService();

  const failedTrialResult = runtime.createReport({
    context_policy_profile: failedTrialProfile.profile,
    context_policy_profile_hash: failedTrialProfile.profile_hash,
    compression_report_ref: ref('artifact_ref', 'compression_report_v1b_n7_failed_trial'),
    source_refs: [ref('artifact_ref', 'n7_failed_trial_context_packet')],
    input_context: {
      n8_feedback: ['feedback_ref_001'],
      loopback_target: 'topic-selection.v1b.N6',
      regeneration_hint: 'hint_needs_clearer_research_axis',
    },
    compressed_context: {
      summary: 'Dropped failed-trial loopback facts.',
    },
    summary: 'Incomplete failed-trial synthesis compression.',
    compression_executor_kind: 'codex_assisted',
    required_preserved_facts: v1bN7RequiredFacts(),
    compressed_preserved_facts: {
      blocker: ['N7_SUPPORT_GATE_REQUIRED'],
      residual_risk: ['risk_value_evidence_thin'],
      failed_candidate_identity: ['candidate_ref_002'],
    },
    estimated_input_tokens_before_override: 1000,
    estimated_input_tokens_after_override: 420,
  });

  assert.equal(failedTrialResult.quality_gate_result, 'blocked');
  assert.ok(failedTrialResult.blocker_codes.includes('COMPRESSION_REQUIRED_N8_FEEDBACK_DROPPED'));
  assert.ok(failedTrialResult.blocker_codes.includes('COMPRESSION_REQUIRED_LOOPBACK_TARGET_DROPPED'));
  assert.ok(failedTrialResult.blocker_codes.includes('COMPRESSION_REQUIRED_REGENERATION_HINT_DROPPED'));

  const debateAdmissionResult = runtime.createReport({
    context_policy_profile: debateAdmissionProfile.profile,
    context_policy_profile_hash: debateAdmissionProfile.profile_hash,
    compression_report_ref: ref('artifact_ref', 'compression_report_v1b_n7_debate_admission'),
    source_refs: [ref('artifact_ref', 'n7_debate_admission_context_packet')],
    input_context: {
      n8_gate_rejection_reason: 'novelty_gate_failed',
      debate_admission_need: 'need_additional_value_risk_review',
      value_risk_fact: 'risk_value_evidence_thin',
    },
    compressed_context: {
      summary: 'Dropped debate admission value-risk context.',
    },
    summary: 'Incomplete debate admission compression.',
    compression_executor_kind: 'codex_assisted',
    required_preserved_facts: v1bN7RequiredFacts(),
    compressed_preserved_facts: {
      candidate_identity: ['candidate_ref_001'],
      failed_contract_identity: ['contract_ref_001'],
    },
    estimated_input_tokens_before_override: 1000,
    estimated_input_tokens_after_override: 430,
  });

  assert.equal(debateAdmissionResult.quality_gate_result, 'blocked');
  assert.ok(
    debateAdmissionResult.blocker_codes.includes(
      'COMPRESSION_REQUIRED_N8_GATE_REJECTION_REASON_DROPPED',
    ),
  );
  assert.ok(
    debateAdmissionResult.blocker_codes.includes(
      'COMPRESSION_REQUIRED_DEBATE_ADMISSION_NEED_DROPPED',
    ),
  );
  assert.ok(debateAdmissionResult.blocker_codes.includes('COMPRESSION_REQUIRED_VALUE_RISK_FACT_DROPPED'));

  const groupingResult = runtime.createReport({
    context_policy_profile: groupingProfile.profile,
    context_policy_profile_hash: groupingProfile.profile_hash,
    compression_report_ref: ref('artifact_ref', 'compression_report_v1b_n7_grouping'),
    source_refs: [ref('artifact_ref', 'n7_grouping_context_packet')],
    input_context: {
      candidate_identity: ['candidate_ref_001'],
      candidate_order: ['candidate_ref_001', 'candidate_ref_002'],
      grouping_rationale: 'candidate_ref_001 has clearer research axis',
    },
    compressed_context: {
      summary: 'Dropped grouping identity facts.',
    },
    summary: 'Incomplete candidate grouping compression.',
    compression_executor_kind: 'codex_assisted',
    required_preserved_facts: {
      candidate_identity: ['candidate_ref_001'],
      candidate_order: ['candidate_ref_001', 'candidate_ref_002'],
      grouping_rationale: ['grouping_rationale_ref_001'],
    },
    compressed_preserved_facts: {
      priority_signal: ['higher_value'],
    },
    estimated_input_tokens_before_override: 1000,
    estimated_input_tokens_after_override: 390,
  });

  assert.equal(groupingResult.quality_gate_result, 'blocked');
  assert.ok(groupingResult.blocker_codes.includes('COMPRESSION_REQUIRED_CANDIDATE_IDENTITY_DROPPED'));
  assert.ok(groupingResult.blocker_codes.includes('COMPRESSION_REQUIRED_CANDIDATE_ORDER_DROPPED'));
  assert.ok(groupingResult.blocker_codes.includes('COMPRESSION_REQUIRED_GROUPING_RATIONALE_DROPPED'));
});

test('compression quality gate blocks forbidden hidden reasoning raw logs and secrets', () => {
  const { profile, profile_hash } = resolvedProfile();
  const runtime = new TopicSelectionCompressionRuntimeService();
  const result = runtime.createReport({
    context_policy_profile: profile,
    context_policy_profile_hash: profile_hash,
    compression_report_ref: ref('artifact_ref', 'compression_report_003'),
    source_refs: [ref('artifact_ref', 'context_packet_001')],
    input_context: inputContext(),
    compressed_context: {
      hidden_reasoning: 'do not persist this',
      source_refs: [ref('evidence_unit', 'support_001')],
    },
    summary: 'Bearer sk-test-secret',
    compression_executor_kind: 'deterministic_structural',
    required_preserved_facts: requiredFacts(),
    compressed_preserved_facts: requiredFacts(),
    estimated_input_tokens_before_override: 1000,
    estimated_input_tokens_after_override: 200,
  });

  assert.equal(result.quality_gate_result, 'blocked');
  assert.ok(result.blocker_codes.includes('COMPRESSION_FORBIDDEN_PERSISTED_PAYLOAD'));
  assert.match(result.warning_codes.join(' '), /compressed_payload\.hidden_reasoning/);
});

test('compression runtime rejects source profile executor and redaction drift before report creation', () => {
  const { profile, profile_hash } = resolvedProfile();
  const runtime = new TopicSelectionCompressionRuntimeService();

  assert.throws(
    () => runtime.createReport({
      context_policy_profile: profile,
      context_policy_profile_hash: profile_hash,
      compression_report_ref: ref('artifact_ref', 'compression_report_004'),
      source_refs: [],
      input_context: inputContext(),
      compressed_context: compressedContext(),
      summary: 'summary',
      compression_executor_kind: 'deterministic_structural',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  assert.throws(
    () => runtime.createReport({
      context_policy_profile: profile,
      context_policy_profile_hash: 'a'.repeat(64),
      compression_report_ref: ref('artifact_ref', 'compression_report_005'),
      source_refs: [ref('artifact_ref', 'context_packet_001')],
      input_context: inputContext(),
      compressed_context: compressedContext(),
      summary: 'summary',
      compression_executor_kind: 'deterministic_structural',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  const deterministicOnlyProfile: TopicSelectionContextPolicyProfile = {
    ...profile,
    compression_policy: {
      ...profile.compression_policy,
      allowed_executor_kinds: ['deterministic_structural'],
    },
  };
  assert.throws(
    () => runtime.createReport({
      context_policy_profile: deterministicOnlyProfile,
      context_policy_profile_hash: profileHash(deterministicOnlyProfile),
      compression_report_ref: ref('artifact_ref', 'compression_report_006'),
      source_refs: [ref('artifact_ref', 'context_packet_001')],
      input_context: inputContext(),
      compressed_context: compressedContext(),
      summary: 'summary',
      compression_executor_kind: 'codex_assisted',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  assert.throws(
    () => runtime.createReport({
      context_policy_profile: profile,
      context_policy_profile_hash: profile_hash,
      compression_report_ref: ref('artifact_ref', 'compression_report_007'),
      source_refs: [ref('artifact_ref', 'context_packet_001')],
      input_context: inputContext(),
      compressed_context: compressedContext(),
      summary: 'summary',
      compression_executor_kind: 'deterministic_structural',
      redaction_policy: 'unredacted',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
});

test('compression runtime warns when token estimate is not reduced', () => {
  const { profile, profile_hash } = resolvedProfile();
  const runtime = new TopicSelectionCompressionRuntimeService();
  const result = runtime.createReport({
    context_policy_profile: profile,
    context_policy_profile_hash: profile_hash,
    compression_report_ref: ref('artifact_ref', 'compression_report_008'),
    source_refs: [ref('artifact_ref', 'context_packet_001')],
    input_context: inputContext(),
    compressed_context: compressedContext(),
    summary: 'summary',
    compression_executor_kind: 'deterministic_structural',
    required_preserved_facts: requiredFacts(),
    compressed_preserved_facts: requiredFacts(),
    estimated_input_tokens_before_override: 100,
    estimated_input_tokens_after_override: 100,
  });

  assert.equal(result.quality_gate_result, 'warned');
  assert.deepEqual(result.blocker_codes, []);
  assert.deepEqual(result.warning_codes, ['COMPRESSION_DID_NOT_REDUCE_TOKEN_ESTIMATE']);
});
