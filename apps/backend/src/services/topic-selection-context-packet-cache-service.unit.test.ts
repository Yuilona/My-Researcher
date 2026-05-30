import assert from 'node:assert/strict';
import test from 'node:test';
import type { TopicSelectionFunctionalRef } from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionContextPacketCacheKey,
  TopicSelectionContextPolicyProfile,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';
import {
  TOPIC_SELECTION_CONTEXT_RUNTIME_POLICY_VERSION,
  TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY,
  TOPIC_SELECTION_CONTEXT_RUNTIME_SCHEMA_VERSION,
  TOPIC_SELECTION_NEED_DISCOVERY_CONTEXT_COMPILER_VERSION,
  TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS,
  TopicSelectionContextPolicyProfileRegistryService,
} from './topic-selection-context-policy-profile-registry-service.js';
import {
  InMemoryTopicSelectionContextPacketCacheStore,
  TopicSelectionContextPacketCacheService,
  type TopicSelectionContextPacketCacheStoreEntry,
} from './topic-selection-context-packet-cache-service.js';
import { TopicSelectionLlmRuntimeKeyBuilderService } from './topic-selection-llm-runtime-key-builder-service.js';

const hashA = 'a'.repeat(64);
const hashB = 'b'.repeat(64);
const hashC = 'c'.repeat(64);
const hashD = 'd'.repeat(64);

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

function buildCacheKey(): {
  cacheKey: TopicSelectionContextPacketCacheKey;
  cacheKeyHash: string;
  profile: TopicSelectionContextPolicyProfile;
  profileHash: string;
} {
  const resolvedProfile = resolvedNeedGenerationProfile();
  const key = new TopicSelectionLlmRuntimeKeyBuilderService().buildContextPacketCacheKey({
    node_id: 'topic-selection.v1a.generate-need-candidate.v1',
    invocation_slot_id: resolvedProfile.profile.invocation_slot_id,
    execution_mode: 'provider_llm',
    executor_kind: 'single_agent',
    context_family: resolvedProfile.profile.context_family,
    input_refs_hash: hashA,
    context_packet_hashes: [hashB],
    prompt_packet_hash: hashC,
    policy_version: TOPIC_SELECTION_CONTEXT_RUNTIME_POLICY_VERSION,
    schema_version: TOPIC_SELECTION_CONTEXT_RUNTIME_SCHEMA_VERSION,
    context_compiler_version: TOPIC_SELECTION_NEED_DISCOVERY_CONTEXT_COMPILER_VERSION,
    prompt_template_id: 'topic-selection-generate-need-candidate',
    prompt_template_version: 'v1',
    profile_hash: resolvedProfile.profile_hash,
    model_option_id: 'topic-selection.generate-need-candidate.single-agent.v1.openai-balanced',
    normalized_params_hash: hashD,
    output_contract: 'RankedCandidateDraftBatch@v1',
    redaction_policy: TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY,
  });
  return {
    cacheKey: key.value,
    cacheKeyHash: key.hash,
    profile: resolvedProfile.profile,
    profileHash: resolvedProfile.profile_hash,
  };
}

function cacheEntry(
  overrides: Partial<TopicSelectionContextPacketCacheStoreEntry> = {},
): TopicSelectionContextPacketCacheStoreEntry {
  const { cacheKeyHash, profile, profileHash } = buildCacheKey();
  return {
    cache_key_hash: cacheKeyHash,
    artifact_ref: ref('artifact_ref', 'context_packet_001'),
    artifact_hash: hashA,
    context_family: profile.context_family,
    context_policy_profile_id: profile.context_policy_profile_id,
    context_policy_profile_version: profile.context_policy_profile_version,
    context_policy_profile_hash: profileHash,
    source_refs_hash: hashA,
    freshness_status: 'fresh',
    provenance_ref: ref('artifact_ref', 'cache_provenance_001'),
    ...overrides,
  };
}

test('context packet cache exact hit returns existing artifact ref', async () => {
  const { cacheKey, profile, profileHash } = buildCacheKey();
  const service = new TopicSelectionContextPacketCacheService({
    store: new InMemoryTopicSelectionContextPacketCacheStore([cacheEntry()]),
  });

  const result = await service.lookup({
    cache_key: cacheKey,
    context_policy_profile: profile,
    context_policy_profile_hash: profileHash,
    provenance_ref: ref('artifact_ref', 'lookup_provenance_001'),
  });

  assert.equal(result.cache_result, 'hit');
  assert.equal(result.artifact_ref?.ref_id, 'context_packet_001');
  assert.equal(result.artifact_hash, hashA);
  assert.equal(result.freshness_status, 'fresh');
});

test('context packet cache stale entry blocks or misses according to profile policy', async () => {
  const { cacheKey, profile, profileHash } = buildCacheKey();
  const staleEntry = cacheEntry({
    freshness_status: 'stale',
  });
  const blockingService = new TopicSelectionContextPacketCacheService({
    store: new InMemoryTopicSelectionContextPacketCacheStore([staleEntry]),
  });

  const blocked = await blockingService.lookup({
    cache_key: cacheKey,
    context_policy_profile: profile,
    context_policy_profile_hash: profileHash,
    provenance_ref: ref('artifact_ref', 'lookup_provenance_001'),
  });
  assert.equal(blocked.cache_result, 'blocked_stale');
  assert.equal(blocked.artifact_ref, null);

  const missProfile: TopicSelectionContextPolicyProfile = {
    ...profile,
    cache_policy: {
      ...profile.cache_policy,
      stale_behavior: 'miss',
    },
  };
  const missingService = new TopicSelectionContextPacketCacheService({
    store: new InMemoryTopicSelectionContextPacketCacheStore([staleEntry]),
  });
  const missed = await missingService.lookup({
    cache_key: cacheKey,
    context_policy_profile: missProfile,
    context_policy_profile_hash: profileHash,
    provenance_ref: ref('artifact_ref', 'lookup_provenance_001'),
  });
  assert.equal(missed.cache_result, 'miss');
  assert.equal(missed.freshness_status, 'stale');
});

test('context packet cache blocks context-family and source-ref drift', async () => {
  const { cacheKey, profile, profileHash } = buildCacheKey();
  const familyDriftService = new TopicSelectionContextPacketCacheService({
    store: new InMemoryTopicSelectionContextPacketCacheStore([
      cacheEntry({
        context_family: 'v1a_n6_arbiter',
      }),
    ]),
  });

  const familyDrift = await familyDriftService.lookup({
    cache_key: cacheKey,
    context_policy_profile: profile,
    context_policy_profile_hash: profileHash,
    provenance_ref: ref('artifact_ref', 'lookup_provenance_001'),
  });
  assert.equal(familyDrift.cache_result, 'blocked_drift');
  assert.equal(familyDrift.artifact_ref, null);

  const sourceDriftService = new TopicSelectionContextPacketCacheService({
    store: new InMemoryTopicSelectionContextPacketCacheStore([
      cacheEntry({
        source_refs_hash: hashB,
      }),
    ]),
  });
  const sourceDrift = await sourceDriftService.lookup({
    cache_key: cacheKey,
    context_policy_profile: profile,
    context_policy_profile_hash: profileHash,
    provenance_ref: ref('artifact_ref', 'lookup_provenance_001'),
  });
  assert.equal(sourceDrift.cache_result, 'blocked_drift');
});

test('context packet cache disabled profile returns not applicable', async () => {
  const { cacheKey, profile, profileHash } = buildCacheKey();
  const disabledProfile: TopicSelectionContextPolicyProfile = {
    ...profile,
    cache_policy: {
      ...profile.cache_policy,
      cache_enabled: false,
    },
  };
  const service = new TopicSelectionContextPacketCacheService();

  const result = await service.lookup({
    cache_key: cacheKey,
    context_policy_profile: disabledProfile,
    context_policy_profile_hash: profileHash,
    provenance_ref: ref('artifact_ref', 'lookup_provenance_001'),
  });

  assert.equal(result.cache_result, 'not_applicable');
  assert.equal(result.artifact_ref, null);
  assert.equal(result.freshness_status, 'unknown');
});

test('context packet cache records fresh artifacts with put-if-absent semantics', async () => {
  const { cacheKey, profile, profileHash } = buildCacheKey();
  const store = new InMemoryTopicSelectionContextPacketCacheStore();
  const service = new TopicSelectionContextPacketCacheService({ store });

  const first = await service.recordFreshArtifact({
    cache_key: cacheKey,
    context_policy_profile: profile,
    context_policy_profile_hash: profileHash,
    artifact_ref: ref('artifact_ref', 'context_packet_001'),
    artifact_hash: hashA,
    provenance_ref: ref('artifact_ref', 'cache_provenance_001'),
  });
  assert.equal(first.inserted, true);
  assert.equal(first.entry.artifact_ref.ref_id, 'context_packet_001');

  const second = await service.recordFreshArtifact({
    cache_key: cacheKey,
    context_policy_profile: profile,
    context_policy_profile_hash: profileHash,
    artifact_ref: ref('artifact_ref', 'context_packet_002'),
    artifact_hash: hashB,
    provenance_ref: ref('artifact_ref', 'cache_provenance_002'),
  });
  assert.equal(second.inserted, false);
  assert.equal(second.entry.artifact_ref.ref_id, 'context_packet_001');
});
