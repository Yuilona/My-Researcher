import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  TopicSelectionContextPolicyProfile,
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';
import { AppError } from '../errors/app-error.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';
import {
  TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS,
  TopicSelectionContextPolicyProfileRegistryService,
} from './topic-selection-context-policy-profile-registry-service.js';
import {
  InMemoryTopicSelectionPromptPacketCacheStore,
  TopicSelectionPromptPacketCacheService,
  type TopicSelectionPromptPacketCacheStoreEntry,
} from './topic-selection-prompt-packet-cache-service.js';
import { TopicSelectionPromptPacketRuntimeService } from './topic-selection-prompt-packet-runtime-service.js';

const hashA = 'a'.repeat(64);
const hashB = 'b'.repeat(64);

function ref(refType: string, refId: string): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    version_id: 'v1',
    title_card_id: 'title_card_001',
  };
}

function resolvedProfile() {
  return new TopicSelectionContextPolicyProfileRegistryService().resolveProfile({
    context_policy_profile_id:
      TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.need_candidate_generation,
    invocation_slot_id:
      TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
  });
}

function promptPacket() {
  const resolved = resolvedProfile();
  return new TopicSelectionPromptPacketRuntimeService().buildPromptPacket({
    title_card_id: 'title_card_001',
    workflow_run_id: 'workflow_run_001',
    node_id: 'topic-selection.v1a.generate-need-candidate.v1',
    node_attempt_id: 'node_attempt_001',
    prompt_template_id: 'topic-selection-generate-need-candidate',
    prompt_template_version: 'v1',
    prompt_variant_key: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
    invocation_slot_id: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
    runtime_invocation_context_hash: hashA,
    messages: [
      {
        role: 'system',
        content: 'Return a grounded ranked candidate draft batch.',
      },
      {
        role: 'user',
        content: '{"context_packet_ref":"artifact_ref_001"}',
      },
    ],
    source_refs: [ref('artifact_ref', 'context_packet_001')],
    context_packet_hashes: [hashA],
    output_contract: 'RankedCandidateDraftBatch@v1',
    context_policy_profile: resolved.profile,
    context_policy_profile_hash: resolved.profile_hash,
    model_option_id: 'model_option_001',
    normalized_params_hash: hashB,
    runtime_modifiers_hash: hashA,
    redaction_policy: resolved.profile.redaction_policy,
  });
}

function artifactHash(value: unknown): string {
  return sha256Text(stableStringify(value));
}

function cacheEntry(
  overrides: Partial<TopicSelectionPromptPacketCacheStoreEntry> = {},
): TopicSelectionPromptPacketCacheStoreEntry {
  const resolved = resolvedProfile();
  const packet = promptPacket();
  return {
    prompt_packet_hash: packet.identity.prompt_packet_hash,
    prompt_template_id: packet.identity.prompt_template_id,
    prompt_template_version: packet.identity.prompt_template_version,
    prompt_variant_key: packet.identity.prompt_variant_key,
    invocation_slot_id: packet.identity.invocation_slot_id,
    context_policy_profile_id: resolved.profile.context_policy_profile_id,
    context_policy_profile_version: resolved.profile.context_policy_profile_version,
    context_policy_profile_hash: resolved.profile_hash,
    output_contract: packet.identity.output_contract,
    redaction_policy: packet.identity.redaction_policy,
    context_packet_hashes_hash: artifactHash(packet.identity.context_packet_hashes),
    compression_report_hash: packet.identity.compression_report_hash,
    compressed_context_hash: packet.identity.compressed_context_hash,
    dynamic_material_refs_hash: packet.identity.dynamic_material_refs_hash,
    model_option_id: packet.identity.model_option_id,
    normalized_params_hash: packet.identity.normalized_params_hash,
    runtime_modifiers_hash: packet.identity.runtime_modifiers_hash,
    redacted_prompt_artifact_ref: ref('artifact_ref', 'redacted_prompt_artifact_001'),
    redacted_prompt_artifact_hash: artifactHash(packet.redacted_prompt_artifact),
    prompt_quality_report_ref: ref('artifact_ref', 'prompt_quality_report_001'),
    prompt_quality_report_hash: artifactHash(packet.prompt_quality_report),
    quality_decision: packet.prompt_quality_report.quality_decision,
    freshness_status: 'fresh',
    provenance_ref: ref('artifact_ref', 'prompt_packet_cache_provenance_001'),
    blocker_codes: packet.blocker_codes,
    warning_codes: packet.warning_codes,
    ...overrides,
  };
}

test('prompt packet cache exact hit returns redacted prompt and quality report refs', async () => {
  const resolved = resolvedProfile();
  const packet = promptPacket();
  const service = new TopicSelectionPromptPacketCacheService({
    store: new InMemoryTopicSelectionPromptPacketCacheStore([cacheEntry()]),
  });

  const result = await service.lookup({
    identity: packet.identity,
    context_policy_profile: resolved.profile,
    context_policy_profile_hash: resolved.profile_hash,
    provenance_ref: ref('artifact_ref', 'lookup_provenance_001'),
  });

  assert.equal(result.cache_result, 'hit');
  assert.equal(result.redacted_prompt_artifact_ref?.ref_id, 'redacted_prompt_artifact_001');
  assert.equal(result.prompt_quality_report_ref?.ref_id, 'prompt_quality_report_001');
  assert.equal(result.quality_decision, 'warn');
});

test('prompt packet cache stale entry blocks or misses according to profile policy', async () => {
  const resolved = resolvedProfile();
  const packet = promptPacket();
  const service = new TopicSelectionPromptPacketCacheService({
    store: new InMemoryTopicSelectionPromptPacketCacheStore([
      cacheEntry({
        freshness_status: 'stale',
      }),
    ]),
  });

  const blocked = await service.lookup({
    identity: packet.identity,
    context_policy_profile: resolved.profile,
    context_policy_profile_hash: resolved.profile_hash,
    provenance_ref: ref('artifact_ref', 'lookup_provenance_001'),
  });
  assert.equal(blocked.cache_result, 'blocked_stale');
  assert.equal(blocked.redacted_prompt_artifact_ref, null);

  const missProfile: TopicSelectionContextPolicyProfile = {
    ...resolved.profile,
    cache_policy: {
      ...resolved.profile.cache_policy,
      stale_behavior: 'miss',
    },
  };
  const missed = await service.lookup({
    identity: packet.identity,
    context_policy_profile: missProfile,
    context_policy_profile_hash: resolved.profile_hash,
    provenance_ref: ref('artifact_ref', 'lookup_provenance_001'),
  });
  assert.equal(missed.cache_result, 'miss');
  assert.equal(missed.freshness_status, 'stale');
});

test('prompt packet cache blocks identity and stored-entry drift', async () => {
  const resolved = resolvedProfile();
  const packet = promptPacket();
  const service = new TopicSelectionPromptPacketCacheService({
    store: new InMemoryTopicSelectionPromptPacketCacheStore([
      cacheEntry({
        output_contract: 'DriftedOutput@v1',
      }),
    ]),
  });

  const storedDrift = await service.lookup({
    identity: packet.identity,
    context_policy_profile: resolved.profile,
    context_policy_profile_hash: resolved.profile_hash,
    provenance_ref: ref('artifact_ref', 'lookup_provenance_001'),
  });
  assert.equal(storedDrift.cache_result, 'blocked_drift');

  const identityDrift = await new TopicSelectionPromptPacketCacheService().lookup({
    identity: {
      ...packet.identity,
      context_policy_profile_hash: hashA,
    },
    context_policy_profile: resolved.profile,
    context_policy_profile_hash: resolved.profile_hash,
    provenance_ref: ref('artifact_ref', 'lookup_provenance_002'),
  });
  assert.equal(identityDrift.cache_result, 'blocked_drift');
});

test('prompt packet cache disabled profile returns not applicable and rejects recording', async () => {
  const resolved = resolvedProfile();
  const packet = promptPacket();
  const disabledProfile: TopicSelectionContextPolicyProfile = {
    ...resolved.profile,
    cache_policy: {
      ...resolved.profile.cache_policy,
      cache_enabled: false,
    },
  };
  const service = new TopicSelectionPromptPacketCacheService();

  const result = await service.lookup({
    identity: packet.identity,
    context_policy_profile: disabledProfile,
    context_policy_profile_hash: resolved.profile_hash,
    provenance_ref: ref('artifact_ref', 'lookup_provenance_001'),
  });
  assert.equal(result.cache_result, 'not_applicable');

  await assert.rejects(
    () => service.recordFreshArtifacts({
      identity: packet.identity,
      context_policy_profile: disabledProfile,
      context_policy_profile_hash: resolved.profile_hash,
      redacted_prompt_artifact_ref: ref('artifact_ref', 'redacted_prompt_artifact_001'),
      redacted_prompt_artifact_hash: artifactHash(packet.redacted_prompt_artifact),
      prompt_quality_report_ref: ref('artifact_ref', 'prompt_quality_report_001'),
      prompt_quality_report_hash: artifactHash(packet.prompt_quality_report),
      quality_decision: packet.prompt_quality_report.quality_decision,
      provenance_ref: ref('artifact_ref', 'prompt_packet_cache_provenance_001'),
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
});

test('prompt packet cache records fresh artifacts with put-if-absent semantics', async () => {
  const resolved = resolvedProfile();
  const packet = promptPacket();
  const store = new InMemoryTopicSelectionPromptPacketCacheStore();
  const service = new TopicSelectionPromptPacketCacheService({ store });

  const first = await service.recordFreshArtifacts({
    identity: packet.identity,
    context_policy_profile: resolved.profile,
    context_policy_profile_hash: resolved.profile_hash,
    redacted_prompt_artifact_ref: ref('artifact_ref', 'redacted_prompt_artifact_001'),
    redacted_prompt_artifact_hash: artifactHash(packet.redacted_prompt_artifact),
    prompt_quality_report_ref: ref('artifact_ref', 'prompt_quality_report_001'),
    prompt_quality_report_hash: artifactHash(packet.prompt_quality_report),
    quality_decision: packet.prompt_quality_report.quality_decision,
    provenance_ref: ref('artifact_ref', 'prompt_packet_cache_provenance_001'),
    warning_codes: packet.warning_codes,
  });
  assert.equal(first.inserted, true);

  const second = await service.recordFreshArtifacts({
    identity: packet.identity,
    context_policy_profile: resolved.profile,
    context_policy_profile_hash: resolved.profile_hash,
    redacted_prompt_artifact_ref: ref('artifact_ref', 'redacted_prompt_artifact_002'),
    redacted_prompt_artifact_hash: hashA,
    prompt_quality_report_ref: ref('artifact_ref', 'prompt_quality_report_002'),
    prompt_quality_report_hash: hashB,
    quality_decision: packet.prompt_quality_report.quality_decision,
    provenance_ref: ref('artifact_ref', 'prompt_packet_cache_provenance_002'),
  });
  assert.equal(second.inserted, false);
  assert.equal(second.entry.redacted_prompt_artifact_ref.ref_id, 'redacted_prompt_artifact_001');
});
