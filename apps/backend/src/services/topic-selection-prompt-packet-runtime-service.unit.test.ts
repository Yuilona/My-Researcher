import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../errors/app-error.js';
import {
  TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS,
  TopicSelectionContextPolicyProfileRegistryService,
} from './topic-selection-context-policy-profile-registry-service.js';
import {
  TOPIC_SELECTION_REDACTED_PROMPT_PACKET_ARTIFACT_SCHEMA_VERSION,
  TopicSelectionPromptPacketRuntimeService,
} from './topic-selection-prompt-packet-runtime-service.js';

const service = new TopicSelectionPromptPacketRuntimeService();

function resolvedProfile() {
  return new TopicSelectionContextPolicyProfileRegistryService().resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.need_candidate_generation,
    invocation_slot_id:
      TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
  });
}

function promptPacketInput(overrides: Record<string, unknown> = {}) {
  const resolved = resolvedProfile();
  return {
    title_card_id: 'title_card_001',
    workflow_run_id: 'workflow_run_001',
    node_id: 'topic-selection.v1a.generate-need-candidate.v1',
    node_attempt_id: 'node_attempt_001',
    prompt_template_id: 'topic-selection-generate-need-candidate',
    prompt_template_version: 'v1',
    prompt_variant_key: 'need_candidate_generation',
    invocation_slot_id: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
    messages: [
      {
        role: 'system' as const,
        content: 'Return a grounded ranked candidate draft batch.',
      },
      {
        role: 'user' as const,
        content: '{"context_packet_ref":"artifact_ref_001"}',
      },
    ],
    source_refs: [
      {
        ref_type: 'artifact_ref',
        ref_id: 'context_packet_001',
        title_card_id: 'title_card_001',
      },
    ],
    context_packet_hashes: ['b'.repeat(64)],
    output_contract: 'RankedCandidateDraftBatch@v1',
    context_policy_profile: resolved.profile,
    context_policy_profile_hash: resolved.profile_hash,
    model_option_id: 'model_option_001',
    normalized_params_hash: 'c'.repeat(64),
    runtime_modifiers_hash: 'd'.repeat(64),
    redaction_policy: resolved.profile.redaction_policy,
    ...overrides,
  };
}

test('prompt packet runtime creates redacted prompt artifact and passing quality report', () => {
  const result = service.buildPromptPacket(promptPacketInput());

  assert.match(result.identity.prompt_packet_hash, /^[a-f0-9]{64}$/);
  assert.equal(result.identity.prompt_variant_key, 'need_candidate_generation');
  assert.equal(result.redacted_prompt_artifact.prompt_packet_hash, result.identity.prompt_packet_hash);
  assert.equal(result.prompt_quality_report.quality_decision, 'warn');
  assert.equal(
    result.prompt_quality_report.warning_codes.includes('PROMPT_DYNAMIC_MATERIAL_NOT_APPLICABLE'),
    true,
  );
  const serializedArtifact = JSON.stringify(result.redacted_prompt_artifact);
  assert.equal(serializedArtifact.includes('Return a grounded ranked candidate draft batch'), false);
  assert.equal(serializedArtifact.includes('context_packet_ref'), false);
  assert.equal(TOPIC_SELECTION_REDACTED_PROMPT_PACKET_ARTIFACT_SCHEMA_VERSION, 'TopicSelectionRedactedPromptPacketArtifact@v1');
});

test('prompt packet runtime blocks forbidden prompt secrets and raw provider log text', () => {
  const result = service.buildPromptPacket(promptPacketInput({
    messages: [
      {
        role: 'system',
        content: 'Return JSON only.',
      },
      {
        role: 'user',
        content: 'raw_provider_log says api_key=local-secret should never be sent.',
      },
    ],
  }));

  assert.equal(result.prompt_quality_report.quality_decision, 'block');
  assert.deepEqual(result.blocker_codes, ['PROMPT_FORBIDDEN_SECRET_OR_RAW_LOG']);
});

test('prompt packet runtime allows governance markers that prohibit hidden reasoning', () => {
  const result = service.buildPromptPacket(promptPacketInput({
    messages: [
      {
        role: 'system',
        content: 'Return JSON only and do not include hidden reasoning.',
      },
      {
        role: 'user',
        content: '{"materialization_rules":["source_claim_only","no_hidden_reasoning"],"topic":"risk-aware RAG adaptation"}',
      },
    ],
  }));

  assert.equal(result.prompt_quality_report.quality_decision, 'warn');
  assert.equal(result.blocker_codes.includes('PROMPT_FORBIDDEN_SECRET_OR_RAW_LOG'), false);
});

test('prompt packet runtime rejects profile hash and slot drift', () => {
  assert.throws(
    () => service.buildPromptPacket(promptPacketInput({
      context_policy_profile_hash: 'a'.repeat(64),
    })),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  assert.throws(
    () => service.buildPromptPacket(promptPacketInput({
      invocation_slot_id: 'arbiter.final_synthesis',
    })),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
});

test('prompt packet runtime blocks missing source refs without persisting prompt text', () => {
  const result = service.buildPromptPacket(promptPacketInput({
    source_refs: [],
    context_packet_hashes: [],
  }));

  assert.equal(result.prompt_quality_report.quality_decision, 'block');
  assert.equal(result.blocker_codes.includes('PROMPT_REQUIRED_CONTEXT_REFS_MISSING'), true);
  assert.equal(result.redacted_prompt_artifact.source_refs[0]?.ref_type, 'node_attempt');
});
