import {
  Ajv,
  type ValidateFunction,
} from 'ajv';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import {
  topicSelectionContextPacketCacheKeySchema,
  topicSelectionContextPacketCacheResultEnvelopeSchema,
  type TopicSelectionContextPacketCacheKey,
  type TopicSelectionContextPacketCacheResultEnvelope,
  type TopicSelectionContextPolicyProfile,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';
import { AppError } from '../errors/app-error.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';

export type TopicSelectionContextPacketFreshnessStatus =
  TopicSelectionContextPacketCacheResultEnvelope['freshness_status'];

export interface TopicSelectionContextPacketCacheStoreEntry {
  cache_key_hash: string;
  artifact_ref: TopicSelectionFunctionalRef;
  artifact_hash: string;
  context_family: TopicSelectionContextPacketCacheKey['context_family'];
  context_policy_profile_id: string;
  context_policy_profile_version: string;
  context_policy_profile_hash: string;
  source_refs_hash: string;
  freshness_status: TopicSelectionContextPacketFreshnessStatus;
  provenance_ref: TopicSelectionFunctionalRef;
}

export interface TopicSelectionContextPacketCachePutResult {
  entry: TopicSelectionContextPacketCacheStoreEntry;
  inserted: boolean;
}

export interface TopicSelectionContextPacketCacheStore {
  findByCacheKeyHash(cacheKeyHash: string): Promise<TopicSelectionContextPacketCacheStoreEntry | null>;
  putIfAbsent(
    entry: TopicSelectionContextPacketCacheStoreEntry,
  ): Promise<TopicSelectionContextPacketCachePutResult>;
}

export interface LookupTopicSelectionContextPacketCacheInput {
  cache_key: TopicSelectionContextPacketCacheKey;
  context_policy_profile: TopicSelectionContextPolicyProfile;
  context_policy_profile_hash: string;
  source_refs_hash?: string | null;
  provenance_ref: TopicSelectionFunctionalRef;
}

export interface RecordTopicSelectionContextPacketCacheArtifactInput {
  cache_key: TopicSelectionContextPacketCacheKey;
  context_policy_profile: TopicSelectionContextPolicyProfile;
  context_policy_profile_hash: string;
  artifact_ref: TopicSelectionFunctionalRef;
  artifact_hash: string;
  source_refs_hash?: string | null;
  provenance_ref: TopicSelectionFunctionalRef;
}

export class InMemoryTopicSelectionContextPacketCacheStore
implements TopicSelectionContextPacketCacheStore {
  private readonly entries = new Map<string, TopicSelectionContextPacketCacheStoreEntry>();

  constructor(initialEntries: TopicSelectionContextPacketCacheStoreEntry[] = []) {
    for (const entry of initialEntries) {
      this.entries.set(entry.cache_key_hash, entry);
    }
  }

  async findByCacheKeyHash(
    cacheKeyHash: string,
  ): Promise<TopicSelectionContextPacketCacheStoreEntry | null> {
    return this.entries.get(cacheKeyHash) ?? null;
  }

  async putIfAbsent(
    entry: TopicSelectionContextPacketCacheStoreEntry,
  ): Promise<TopicSelectionContextPacketCachePutResult> {
    const existing = this.entries.get(entry.cache_key_hash);
    if (existing) {
      return {
        entry: existing,
        inserted: false,
      };
    }
    this.entries.set(entry.cache_key_hash, entry);
    return {
      entry,
      inserted: true,
    };
  }
}

export class TopicSelectionContextPacketCacheService {
  private readonly ajv = new Ajv({
    allErrors: true,
    strict: false,
    removeAdditional: false,
  });
  private readonly cacheKeyValidator: ValidateFunction;
  private readonly cacheResultValidator: ValidateFunction;
  private readonly store: TopicSelectionContextPacketCacheStore;

  constructor(options: {
    store?: TopicSelectionContextPacketCacheStore;
  } = {}) {
    this.store = options.store ?? new InMemoryTopicSelectionContextPacketCacheStore();
    this.cacheKeyValidator = this.ajv.compile(topicSelectionContextPacketCacheKeySchema);
    this.cacheResultValidator = this.ajv.compile(topicSelectionContextPacketCacheResultEnvelopeSchema);
  }

  async lookup(
    input: LookupTopicSelectionContextPacketCacheInput,
  ): Promise<TopicSelectionContextPacketCacheResultEnvelope> {
    this.assertCacheKey(input.cache_key);
    const cacheKeyHash = this.hash(input.cache_key);
    const sourceRefsHash = input.source_refs_hash ?? input.cache_key.input_refs_hash;
    if (this.isCacheDisabled(input.context_policy_profile, input.cache_key)) {
      return this.buildEnvelope({
        cache_result: 'not_applicable',
        cache_key_hash: cacheKeyHash,
        cache_key: input.cache_key,
        context_policy_profile: input.context_policy_profile,
        context_policy_profile_hash: input.context_policy_profile_hash,
        source_refs_hash: sourceRefsHash,
        freshness_status: 'unknown',
        provenance_ref: input.provenance_ref,
      });
    }

    if (this.hasProfileKeyDrift(input.context_policy_profile, input.context_policy_profile_hash, input.cache_key)) {
      return this.buildEnvelope({
        cache_result: 'blocked_drift',
        cache_key_hash: cacheKeyHash,
        cache_key: input.cache_key,
        context_policy_profile: input.context_policy_profile,
        context_policy_profile_hash: input.context_policy_profile_hash,
        source_refs_hash: sourceRefsHash,
        freshness_status: 'drifted',
        provenance_ref: input.provenance_ref,
      });
    }

    const entry = await this.store.findByCacheKeyHash(cacheKeyHash);
    if (!entry) {
      return this.buildEnvelope({
        cache_result: 'miss',
        cache_key_hash: cacheKeyHash,
        cache_key: input.cache_key,
        context_policy_profile: input.context_policy_profile,
        context_policy_profile_hash: input.context_policy_profile_hash,
        source_refs_hash: sourceRefsHash,
        freshness_status: 'unknown',
        provenance_ref: input.provenance_ref,
      });
    }

    if (this.hasEntryDrift(
      entry,
      input.context_policy_profile,
      input.context_policy_profile_hash,
      input.cache_key,
      sourceRefsHash,
    )) {
      return this.buildEnvelope({
        cache_result: 'blocked_drift',
        cache_key_hash: cacheKeyHash,
        cache_key: input.cache_key,
        context_policy_profile: input.context_policy_profile,
        context_policy_profile_hash: input.context_policy_profile_hash,
        source_refs_hash: sourceRefsHash,
        freshness_status: 'drifted',
        provenance_ref: entry.provenance_ref,
      });
    }

    if (entry.freshness_status === 'fresh') {
      return this.buildEnvelope({
        cache_result: 'hit',
        cache_key_hash: cacheKeyHash,
        cache_key: input.cache_key,
        context_policy_profile: input.context_policy_profile,
        context_policy_profile_hash: input.context_policy_profile_hash,
        source_refs_hash: sourceRefsHash,
        freshness_status: 'fresh',
        artifact_ref: entry.artifact_ref,
        artifact_hash: entry.artifact_hash,
        provenance_ref: entry.provenance_ref,
      });
    }

    if (entry.freshness_status === 'stale') {
      const staleBehavior = input.context_policy_profile.cache_policy.stale_behavior;
      return this.buildEnvelope({
        cache_result: staleBehavior === 'block' ? 'blocked_stale' : 'miss',
        cache_key_hash: cacheKeyHash,
        cache_key: input.cache_key,
        context_policy_profile: input.context_policy_profile,
        context_policy_profile_hash: input.context_policy_profile_hash,
        source_refs_hash: sourceRefsHash,
        freshness_status: 'stale',
        provenance_ref: entry.provenance_ref,
      });
    }

    return this.buildEnvelope({
      cache_result: entry.freshness_status === 'drifted' ? 'blocked_drift' : 'miss',
      cache_key_hash: cacheKeyHash,
      cache_key: input.cache_key,
      context_policy_profile: input.context_policy_profile,
      context_policy_profile_hash: input.context_policy_profile_hash,
      source_refs_hash: sourceRefsHash,
      freshness_status: entry.freshness_status,
      provenance_ref: entry.provenance_ref,
    });
  }

  async recordFreshArtifact(
    input: RecordTopicSelectionContextPacketCacheArtifactInput,
  ): Promise<TopicSelectionContextPacketCachePutResult> {
    this.assertCacheKey(input.cache_key);
    if (this.isCacheDisabled(input.context_policy_profile, input.cache_key)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Cannot record context packet cache artifact when cache is disabled.');
    }
    if (this.hasProfileKeyDrift(input.context_policy_profile, input.context_policy_profile_hash, input.cache_key)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Cannot record context packet cache artifact for a drifted profile/key pair.');
    }

    const cacheKeyHash = this.hash(input.cache_key);
    const sourceRefsHash = input.source_refs_hash ?? input.cache_key.input_refs_hash;
    const entry: TopicSelectionContextPacketCacheStoreEntry = {
      cache_key_hash: cacheKeyHash,
      artifact_ref: input.artifact_ref,
      artifact_hash: input.artifact_hash,
      context_family: input.cache_key.context_family,
      context_policy_profile_id: input.context_policy_profile.context_policy_profile_id,
      context_policy_profile_version: input.context_policy_profile.context_policy_profile_version,
      context_policy_profile_hash: input.context_policy_profile_hash,
      source_refs_hash: sourceRefsHash,
      freshness_status: 'fresh',
      provenance_ref: input.provenance_ref,
    };

    this.buildEnvelope({
      cache_result: 'hit',
      cache_key_hash: cacheKeyHash,
      cache_key: input.cache_key,
      context_policy_profile: input.context_policy_profile,
      context_policy_profile_hash: input.context_policy_profile_hash,
      source_refs_hash: sourceRefsHash,
      freshness_status: 'fresh',
      artifact_ref: input.artifact_ref,
      artifact_hash: input.artifact_hash,
      provenance_ref: input.provenance_ref,
    });
    return this.store.putIfAbsent(entry);
  }

  private isCacheDisabled(
    profile: TopicSelectionContextPolicyProfile,
    cacheKey: TopicSelectionContextPacketCacheKey,
  ): boolean {
    return !profile.cache_policy.cache_enabled
      || profile.cache_policy.cache_scope === 'disabled'
      || cacheKey.cache_scope === 'disabled';
  }

  private hasProfileKeyDrift(
    profile: TopicSelectionContextPolicyProfile,
    profileHash: string,
    cacheKey: TopicSelectionContextPacketCacheKey,
  ): boolean {
    return cacheKey.invocation_slot_id !== profile.invocation_slot_id
      || cacheKey.context_family !== profile.context_family
      || cacheKey.profile_hash !== profileHash
      || cacheKey.schema_version !== profile.schema_version
      || cacheKey.cache_scope !== profile.cache_policy.cache_scope
      || cacheKey.redaction_policy !== profile.redaction_policy;
  }

  private hasEntryDrift(
    entry: TopicSelectionContextPacketCacheStoreEntry,
    profile: TopicSelectionContextPolicyProfile,
    profileHash: string,
    cacheKey: TopicSelectionContextPacketCacheKey,
    sourceRefsHash: string,
  ): boolean {
    return entry.context_family !== cacheKey.context_family
      || entry.context_family !== profile.context_family
      || entry.context_policy_profile_id !== profile.context_policy_profile_id
      || entry.context_policy_profile_version !== profile.context_policy_profile_version
      || entry.context_policy_profile_hash !== profileHash
      || entry.source_refs_hash !== sourceRefsHash;
  }

  private buildEnvelope(input: {
    cache_result: TopicSelectionContextPacketCacheResultEnvelope['cache_result'];
    cache_key_hash: string;
    cache_key: TopicSelectionContextPacketCacheKey;
    context_policy_profile: TopicSelectionContextPolicyProfile;
    context_policy_profile_hash: string;
    source_refs_hash: string;
    freshness_status: TopicSelectionContextPacketFreshnessStatus;
    artifact_ref?: TopicSelectionFunctionalRef | null;
    artifact_hash?: string | null;
    provenance_ref: TopicSelectionFunctionalRef;
  }): TopicSelectionContextPacketCacheResultEnvelope {
    const envelope: TopicSelectionContextPacketCacheResultEnvelope = {
      cache_result: input.cache_result,
      artifact_ref: input.artifact_ref ?? null,
      artifact_hash: input.artifact_hash ?? null,
      cache_key_hash: input.cache_key_hash,
      context_family: input.cache_key.context_family,
      context_policy_profile_id: input.context_policy_profile.context_policy_profile_id,
      context_policy_profile_version: input.context_policy_profile.context_policy_profile_version,
      context_policy_profile_hash: input.context_policy_profile_hash,
      source_refs_hash: input.source_refs_hash,
      freshness_status: input.freshness_status,
      provenance_ref: input.provenance_ref,
    };
    this.assertCacheResultEnvelope(envelope);
    return envelope;
  }

  private assertCacheKey(value: TopicSelectionContextPacketCacheKey): void {
    if (this.cacheKeyValidator(value)) {
      return;
    }
    const firstError = this.cacheKeyValidator.errors?.[0];
    throw new AppError(
      400,
      'INVALID_PAYLOAD',
      `context packet cache key failed schema validation at ${firstError?.instancePath || '/'}: ${
        firstError?.message ?? 'invalid payload'
      }`,
    );
  }

  private assertCacheResultEnvelope(value: TopicSelectionContextPacketCacheResultEnvelope): void {
    if (this.cacheResultValidator(value)) {
      return;
    }
    const firstError = this.cacheResultValidator.errors?.[0];
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      `context packet cache result failed schema validation at ${firstError?.instancePath || '/'}: ${
        firstError?.message ?? 'invalid result'
      }`,
    );
  }

  private hash(value: unknown): string {
    return sha256Text(stableStringify(value));
  }
}
