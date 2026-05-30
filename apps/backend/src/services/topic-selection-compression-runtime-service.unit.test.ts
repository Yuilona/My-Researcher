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
