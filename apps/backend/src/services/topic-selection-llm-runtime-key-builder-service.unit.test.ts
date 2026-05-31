import assert from 'node:assert/strict';
import test from 'node:test';
import type { TopicSelectionFunctionalRef } from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import { AppError } from '../errors/app-error.js';
import {
  TOPIC_SELECTION_CONTEXT_RUNTIME_POLICY_VERSION,
  TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY,
  TOPIC_SELECTION_CONTEXT_RUNTIME_SCHEMA_VERSION,
  TOPIC_SELECTION_NEED_DISCOVERY_CONTEXT_COMPILER_VERSION,
  TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS,
  TopicSelectionContextPolicyProfileRegistryService,
} from './topic-selection-context-policy-profile-registry-service.js';
import { TopicSelectionLlmRuntimeKeyBuilderService } from './topic-selection-llm-runtime-key-builder-service.js';

const hashA = 'a'.repeat(64);
const hashB = 'b'.repeat(64);
const hashC = 'c'.repeat(64);

function ref(refType: string, refId: string): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    version_id: 'v1',
    title_card_id: 'title_card_001',
  };
}

function resolvedNeedGenerationProfile() {
  return new TopicSelectionContextPolicyProfileRegistryService().resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.need_candidate_generation,
    invocation_slot_id: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
  });
}

function keyBuilderInput() {
  const resolvedProfile = resolvedNeedGenerationProfile();
  return {
    node_id: 'topic-selection.v1a.generate-need-candidate.v1',
    invocation_slot_id: resolvedProfile.profile.invocation_slot_id,
    execution_mode: 'provider_llm' as const,
    executor_kind: 'single_agent' as const,
    context_family: resolvedProfile.profile.context_family,
    runtime_invocation_context_hash: hashA,
    input_refs: [
      ref('topic_scope', 'topic_scope_001'),
      ref('evidence_map', 'evidence_map_001'),
    ],
    context_packet_hashes: [hashA, hashB],
    prompt_packet_hash: hashC,
    policy_version: TOPIC_SELECTION_CONTEXT_RUNTIME_POLICY_VERSION,
    schema_version: TOPIC_SELECTION_CONTEXT_RUNTIME_SCHEMA_VERSION,
    context_compiler_version: TOPIC_SELECTION_NEED_DISCOVERY_CONTEXT_COMPILER_VERSION,
    prompt_template_id: 'topic-selection-generate-need-candidate',
    prompt_template_version: 'v1',
    profile_hash: resolvedProfile.profile_hash,
    model_option_id: 'topic-selection.generate-need-candidate.single-agent.v1.openai-balanced',
    normalized_params_hash: hashA,
    output_contract: 'RankedCandidateDraftBatch@v1',
    redaction_policy: TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY,
  };
}

function promptIdentityInput() {
  const resolvedProfile = resolvedNeedGenerationProfile();
  return {
    prompt_template_id: 'topic-selection-generate-need-candidate',
    prompt_template_version: 'v1',
    prompt_variant_key: 'need_candidate_generation',
    invocation_slot_id: resolvedProfile.profile.invocation_slot_id,
    runtime_invocation_context_hash: hashA,
    context_packet_hashes: [hashA, hashB],
    compression_report_ref: null,
    compression_report_hash: null,
    compressed_context_hash: null,
    dynamic_material_refs_hash: null,
    output_contract: 'RankedCandidateDraftBatch@v1',
    context_policy_profile_hash: resolvedProfile.profile_hash,
    model_option_id: 'topic-selection.generate-need-candidate.single-agent.v1.openai-balanced',
    normalized_params_hash: hashA,
    runtime_modifiers_hash: hashB,
    redaction_policy: TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY,
    redacted_prompt_artifact_ref: ref('artifact_ref', 'redacted_prompt_001'),
    provenance_ref: ref('runtime_provenance', 'prompt_provenance_001'),
    rendered_prompt_hash: hashC,
  };
}

test('runtime key builder creates stable context cache keys with required profile and model fields', () => {
  const builder = new TopicSelectionLlmRuntimeKeyBuilderService();
  const result = builder.buildContextPacketCacheKey(keyBuilderInput());

  assert.match(result.hash, /^[a-f0-9]{64}$/);
  assert.equal(result.value.invocation_slot_id, TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation);
  assert.equal(result.value.context_family, 'v1a_n6_exploration');
  assert.equal(result.value.model_option_id, 'topic-selection.generate-need-candidate.single-agent.v1.openai-balanced');
  assert.equal(result.value.normalized_params_hash, hashA);
  assert.equal(result.value.redaction_policy, TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY);

  const repeated = builder.buildContextPacketCacheKey(keyBuilderInput());
  assert.equal(repeated.hash, result.hash);
  assert.deepEqual(repeated.value, result.value);
});

test('runtime key builder changes context cache hash on slot, context family, profile, or model drift', () => {
  const builder = new TopicSelectionLlmRuntimeKeyBuilderService();
  const base = builder.buildContextPacketCacheKey(keyBuilderInput()).hash;

  const slotDrift = builder.buildContextPacketCacheKey({
    ...keyBuilderInput(),
    invocation_slot_id: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.arbiter_final_synthesis,
  }).hash;
  assert.notEqual(slotDrift, base);

  const familyDrift = builder.buildContextPacketCacheKey({
    ...keyBuilderInput(),
    context_family: 'v1a_n6_arbiter',
  }).hash;
  assert.notEqual(familyDrift, base);

  const profileDrift = builder.buildContextPacketCacheKey({
    ...keyBuilderInput(),
    profile_hash: hashB,
  }).hash;
  assert.notEqual(profileDrift, base);

  const modelDrift = builder.buildContextPacketCacheKey({
    ...keyBuilderInput(),
    model_option_id: 'topic-selection.generate-need-candidate.single-agent.v1.openai-quality',
  }).hash;
  assert.notEqual(modelDrift, base);

  const runtimeInvocationContextDrift = builder.buildContextPacketCacheKey({
    ...keyBuilderInput(),
    runtime_invocation_context_hash: hashB,
  }).hash;
  assert.notEqual(runtimeInvocationContextDrift, base);
});

test('runtime key builder rejects provider keys without model option or normalized params hash', () => {
  const builder = new TopicSelectionLlmRuntimeKeyBuilderService();

  assert.throws(
    () => builder.buildContextPacketCacheKey({
      ...keyBuilderInput(),
      model_option_id: null,
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.errorCode === 'INVALID_PAYLOAD'
      && error.message === 'provider_llm runtime keys require model_option_id and normalized_params_hash.',
  );

  assert.throws(
    () => builder.buildContextPacketCacheKey({
      ...keyBuilderInput(),
      normalized_params_hash: null,
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
});

test('runtime key builder hashes input refs independent of source ref order', () => {
  const builder = new TopicSelectionLlmRuntimeKeyBuilderService();
  const first = builder.hashFunctionalRefs([
    ref('evidence_map', 'evidence_map_001'),
    ref('topic_scope', 'topic_scope_001'),
  ]);
  const second = builder.hashFunctionalRefs([
    ref('topic_scope', 'topic_scope_001'),
    ref('evidence_map', 'evidence_map_001'),
  ]);

  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test('runtime key builder creates prompt packet identity and binds variant, compression, and dynamic material hash', () => {
  const builder = new TopicSelectionLlmRuntimeKeyBuilderService();
  const base = builder.buildPromptPacketIdentity(promptIdentityInput());

  assert.match(base.hash, /^[a-f0-9]{64}$/);
  assert.equal(base.value.prompt_packet_hash, base.hash);
  assert.equal(base.value.prompt_variant_key, 'need_candidate_generation');
  assert.equal(base.value.redacted_prompt_artifact_ref.ref_id, 'redacted_prompt_001');

  const dynamicMaterial = builder.buildPromptPacketIdentity({
    ...promptIdentityInput(),
    prompt_variant_key: 'arbiter.final_synthesis',
    dynamic_material_refs_hash: hashB,
  });
  assert.notEqual(dynamicMaterial.hash, base.hash);
  assert.equal(dynamicMaterial.value.dynamic_material_refs_hash, hashB);
  assert.equal(dynamicMaterial.value.prompt_variant_key, 'arbiter.final_synthesis');

  const compressed = builder.buildPromptPacketIdentity({
    ...promptIdentityInput(),
    compression_report_ref: ref('artifact_ref', 'compression_report_001'),
    compression_report_hash: hashB,
    compressed_context_hash: hashA,
  });
  const compressionDrift = builder.buildPromptPacketIdentity({
    ...promptIdentityInput(),
    compression_report_ref: ref('artifact_ref', 'compression_report_001'),
    compression_report_hash: hashC,
    compressed_context_hash: hashA,
  });
  assert.notEqual(compressed.hash, base.hash);
  assert.notEqual(compressionDrift.hash, compressed.hash);
  assert.equal(compressed.value.compression_report_ref?.ref_id, 'compression_report_001');
  assert.equal(compressed.value.compression_report_hash, hashB);
  assert.equal(compressed.value.compressed_context_hash, hashA);

  const runtimeContextDrift = builder.buildPromptPacketIdentity({
    ...promptIdentityInput(),
    runtime_invocation_context_hash: hashB,
  });
  assert.notEqual(runtimeContextDrift.hash, base.hash);
});

test('runtime key builder rejects malformed prompt packet identity', () => {
  const builder = new TopicSelectionLlmRuntimeKeyBuilderService();

  assert.throws(
    () => builder.buildPromptPacketIdentity({
      ...promptIdentityInput(),
      prompt_variant_key: '',
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.errorCode === 'INVALID_PAYLOAD'
      && error.message.startsWith('prompt_packet_identity failed schema validation'),
  );
});
