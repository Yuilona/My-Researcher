import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
  TopicSelectionPromptPacketCacheStoreEntry,
} from '../topic-selection-prompt-packet-cache-store.repository.js';
import { PrismaTopicSelectionPromptPacketCacheStore } from './prisma-topic-selection-prompt-packet-cache-store.js';

const hashA = 'a'.repeat(64);
const hashB = 'b'.repeat(64);
const hashC = 'c'.repeat(64);

type StoredPromptPacketCacheRow = Record<string, unknown> & {
  promptPacketHash: string;
};

class FakePromptPacketCacheIndexDelegate {
  readonly rows = new Map<string, StoredPromptPacketCacheRow>();
  createCallCount = 0;
  throwMissingTable = false;

  async findUnique(input: {
    where: { promptPacketHash: string };
  }): Promise<StoredPromptPacketCacheRow | null> {
    if (this.throwMissingTable) {
      throw new Prisma.PrismaClientKnownRequestError('table does not exist', {
        code: 'P2021',
        clientVersion: 'test',
      });
    }
    return this.rows.get(input.where.promptPacketHash) ?? null;
  }

  async create(input: {
    data: StoredPromptPacketCacheRow;
  }): Promise<StoredPromptPacketCacheRow> {
    this.createCallCount += 1;
    if (this.throwMissingTable) {
      throw new Prisma.PrismaClientKnownRequestError('table does not exist', {
        code: 'P2021',
        clientVersion: 'test',
      });
    }
    if (this.rows.has(input.data.promptPacketHash)) {
      throw new Prisma.PrismaClientKnownRequestError('duplicate prompt packet cache row', {
        code: 'P2002',
        clientVersion: 'test',
      });
    }
    this.rows.set(input.data.promptPacketHash, input.data);
    return input.data;
  }
}

function fakePrisma(delegate: FakePromptPacketCacheIndexDelegate): PrismaClient {
  return {
    topicSelectionPromptPacketCacheIndex: delegate,
  } as unknown as PrismaClient;
}

function ref(refId: string) {
  return {
    ref_type: 'artifact_ref',
    ref_id: refId,
    version_id: 'v1',
    title_card_id: 'title_card_001',
  };
}

function entry(
  overrides: Partial<TopicSelectionPromptPacketCacheStoreEntry> = {},
): TopicSelectionPromptPacketCacheStoreEntry {
  return {
    prompt_packet_hash: hashA,
    prompt_template_id: 'topic-selection-generate-need-candidate',
    prompt_template_version: 'v1',
    prompt_variant_key: 'need_candidate_generation',
    invocation_slot_id: 'need_candidate_generation',
    context_policy_profile_id: 'topic-selection.v1a.n6.need-candidate-generation.context-runtime@v1',
    context_policy_profile_version: 'v1',
    context_policy_profile_hash: hashB,
    output_contract: 'RankedCandidateDraftBatch@v1',
    redaction_policy: 'topic-selection-redacted-ref-backed-v1',
    context_packet_hashes_hash: hashC,
    compression_report_hash: null,
    compressed_context_hash: null,
    dynamic_material_refs_hash: null,
    model_option_id: 'topic-selection.generate-need-candidate.single-agent.v1.openai-balanced',
    normalized_params_hash: hashA,
    runtime_modifiers_hash: hashB,
    redacted_prompt_artifact_ref: ref('redacted_prompt_artifact_001'),
    redacted_prompt_artifact_hash: hashC,
    prompt_quality_report_ref: ref('prompt_quality_report_001'),
    prompt_quality_report_hash: hashA,
    quality_decision: 'pass',
    freshness_status: 'fresh',
    provenance_ref: ref('prompt_packet_cache_provenance_001'),
    blocker_codes: [],
    warning_codes: ['PROMPT_CONTEXT_HASH_BOUND'],
    ...overrides,
  };
}

test('Prisma prompt packet cache store persists exact artifact-ref index rows without payloads', async () => {
  const delegate = new FakePromptPacketCacheIndexDelegate();
  const store = new PrismaTopicSelectionPromptPacketCacheStore(fakePrisma(delegate), {
    now: () => new Date('2026-05-30T00:00:00.000Z'),
  });

  const result = await store.putIfAbsent(entry());

  assert.equal(result.inserted, true);
  assert.equal(result.entry.prompt_packet_hash, hashA);
  assert.equal(result.entry.redacted_prompt_artifact_ref.ref_id, 'redacted_prompt_artifact_001');
  assert.equal(result.entry.prompt_quality_report_ref.ref_id, 'prompt_quality_report_001');
  assert.deepEqual(result.entry.warning_codes, ['PROMPT_CONTEXT_HASH_BOUND']);

  const row = delegate.rows.get(hashA);
  assert.ok(row);
  assert.equal(row.createdAt instanceof Date, true);
  assert.equal(row.updatedAt instanceof Date, true);
  assert.equal(Object.hasOwn(row, 'messages'), false);
  assert.equal(Object.hasOwn(row, 'promptPayload'), false);
  assert.equal(Object.hasOwn(row, 'providerResponse'), false);
  assert.equal(Object.hasOwn(row, 'providerTelemetry'), false);
});

test('Prisma prompt packet cache store returns existing row on duplicate put-if-absent', async () => {
  const delegate = new FakePromptPacketCacheIndexDelegate();
  const store = new PrismaTopicSelectionPromptPacketCacheStore(fakePrisma(delegate), {
    now: () => new Date('2026-05-30T00:00:00.000Z'),
  });

  const first = await store.putIfAbsent(entry({
    redacted_prompt_artifact_ref: ref('redacted_prompt_artifact_first'),
  }));
  const second = await store.putIfAbsent(entry({
    redacted_prompt_artifact_ref: ref('redacted_prompt_artifact_second'),
  }));

  assert.equal(first.inserted, true);
  assert.equal(second.inserted, false);
  assert.equal(second.entry.redacted_prompt_artifact_ref.ref_id, 'redacted_prompt_artifact_first');
  assert.equal(delegate.createCallCount, 1);
});

test('Prisma prompt packet cache store maps existing rows back to cache entries', async () => {
  const delegate = new FakePromptPacketCacheIndexDelegate();
  const store = new PrismaTopicSelectionPromptPacketCacheStore(fakePrisma(delegate), {
    now: () => new Date('2026-05-30T00:00:00.000Z'),
  });

  await store.putIfAbsent(entry({
    compression_report_hash: hashB,
    compressed_context_hash: hashC,
    dynamic_material_refs_hash: hashA,
    blocker_codes: ['PROMPT_QUALITY_GATE_BLOCKED'],
    freshness_status: 'stale',
    quality_decision: 'block',
  }));

  const found = await store.findByPromptPacketHash(hashA);

  assert.equal(found?.compression_report_hash, hashB);
  assert.equal(found?.compressed_context_hash, hashC);
  assert.equal(found?.dynamic_material_refs_hash, hashA);
  assert.deepEqual(found?.blocker_codes, ['PROMPT_QUALITY_GATE_BLOCKED']);
  assert.equal(found?.freshness_status, 'stale');
  assert.equal(found?.quality_decision, 'block');
});

test('Prisma prompt packet cache store can bypass missing-table cache failures', async () => {
  const delegate = new FakePromptPacketCacheIndexDelegate();
  delegate.throwMissingTable = true;
  const store = new PrismaTopicSelectionPromptPacketCacheStore(fakePrisma(delegate), {
    allowMissingTableFallback: true,
    now: () => new Date('2026-05-30T00:00:00.000Z'),
  });

  const found = await store.findByPromptPacketHash(hashA);
  const recorded = await store.putIfAbsent(entry());

  assert.equal(found, null);
  assert.equal(recorded.inserted, false);
  assert.equal(recorded.entry.prompt_packet_hash, hashA);
});
