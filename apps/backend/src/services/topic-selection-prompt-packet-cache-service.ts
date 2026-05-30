import {
  Ajv,
  type ValidateFunction,
} from 'ajv';
import {
  topicSelectionPromptPacketCacheResultEnvelopeSchema,
  topicSelectionPromptPacketIdentitySchema,
  type TopicSelectionContextPolicyProfile,
  type TopicSelectionFunctionalRef,
  type TopicSelectionPromptPacketCacheResultEnvelope,
  type TopicSelectionPromptPacketIdentity,
  type TopicSelectionPromptQualityDecision,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';
import type {
  TopicSelectionPromptPacketCachePutResult,
  TopicSelectionPromptPacketCacheStore,
  TopicSelectionPromptPacketCacheStoreEntry,
  TopicSelectionPromptPacketFreshnessStatus,
} from '../repositories/topic-selection-prompt-packet-cache-store.repository.js';
import { AppError } from '../errors/app-error.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';

export type {
  TopicSelectionPromptPacketCachePutResult,
  TopicSelectionPromptPacketCacheStore,
  TopicSelectionPromptPacketCacheStoreEntry,
  TopicSelectionPromptPacketFreshnessStatus,
} from '../repositories/topic-selection-prompt-packet-cache-store.repository.js';

export interface LookupTopicSelectionPromptPacketCacheInput {
  identity: TopicSelectionPromptPacketIdentity;
  context_policy_profile: TopicSelectionContextPolicyProfile;
  context_policy_profile_hash: string;
  provenance_ref: TopicSelectionFunctionalRef;
}

export interface RecordTopicSelectionPromptPacketCacheArtifactInput {
  identity: TopicSelectionPromptPacketIdentity;
  context_policy_profile: TopicSelectionContextPolicyProfile;
  context_policy_profile_hash: string;
  redacted_prompt_artifact_ref: TopicSelectionFunctionalRef;
  redacted_prompt_artifact_hash: string;
  prompt_quality_report_ref: TopicSelectionFunctionalRef;
  prompt_quality_report_hash: string;
  quality_decision: TopicSelectionPromptQualityDecision;
  provenance_ref: TopicSelectionFunctionalRef;
  blocker_codes?: string[];
  warning_codes?: string[];
}

export class InMemoryTopicSelectionPromptPacketCacheStore
implements TopicSelectionPromptPacketCacheStore {
  private readonly entries = new Map<string, TopicSelectionPromptPacketCacheStoreEntry>();

  constructor(initialEntries: TopicSelectionPromptPacketCacheStoreEntry[] = []) {
    for (const entry of initialEntries) {
      this.entries.set(entry.prompt_packet_hash, entry);
    }
  }

  async findByPromptPacketHash(
    promptPacketHash: string,
  ): Promise<TopicSelectionPromptPacketCacheStoreEntry | null> {
    return this.entries.get(promptPacketHash) ?? null;
  }

  async putIfAbsent(
    entry: TopicSelectionPromptPacketCacheStoreEntry,
  ): Promise<TopicSelectionPromptPacketCachePutResult> {
    const existing = this.entries.get(entry.prompt_packet_hash);
    if (existing) {
      return {
        entry: existing,
        inserted: false,
      };
    }
    this.entries.set(entry.prompt_packet_hash, entry);
    return {
      entry,
      inserted: true,
    };
  }
}

export class TopicSelectionPromptPacketCacheService {
  private readonly ajv = new Ajv({
    allErrors: true,
    strict: false,
    removeAdditional: false,
  });
  private readonly identityValidator: ValidateFunction;
  private readonly cacheResultValidator: ValidateFunction;
  private readonly store: TopicSelectionPromptPacketCacheStore;

  constructor(options: {
    store?: TopicSelectionPromptPacketCacheStore;
  } = {}) {
    this.store = options.store ?? new InMemoryTopicSelectionPromptPacketCacheStore();
    this.identityValidator = this.ajv.compile(topicSelectionPromptPacketIdentitySchema);
    this.cacheResultValidator = this.ajv.compile(topicSelectionPromptPacketCacheResultEnvelopeSchema);
  }

  async lookup(
    input: LookupTopicSelectionPromptPacketCacheInput,
  ): Promise<TopicSelectionPromptPacketCacheResultEnvelope> {
    this.assertIdentity(input.identity);
    if (this.isCacheDisabled(input.context_policy_profile)) {
      return this.buildEnvelope({
        cache_result: 'not_applicable',
        identity: input.identity,
        context_policy_profile: input.context_policy_profile,
        context_policy_profile_hash: input.context_policy_profile_hash,
        freshness_status: 'unknown',
        provenance_ref: input.provenance_ref,
      });
    }
    if (this.hasProfileIdentityDrift(
      input.context_policy_profile,
      input.context_policy_profile_hash,
      input.identity,
    )) {
      return this.buildEnvelope({
        cache_result: 'blocked_drift',
        identity: input.identity,
        context_policy_profile: input.context_policy_profile,
        context_policy_profile_hash: input.context_policy_profile_hash,
        freshness_status: 'drifted',
        provenance_ref: input.provenance_ref,
      });
    }

    const entry = await this.store.findByPromptPacketHash(input.identity.prompt_packet_hash);
    if (!entry) {
      return this.buildEnvelope({
        cache_result: 'miss',
        identity: input.identity,
        context_policy_profile: input.context_policy_profile,
        context_policy_profile_hash: input.context_policy_profile_hash,
        freshness_status: 'unknown',
        provenance_ref: input.provenance_ref,
      });
    }

    if (this.hasEntryDrift(
      entry,
      input.context_policy_profile,
      input.context_policy_profile_hash,
      input.identity,
    )) {
      return this.buildEnvelope({
        cache_result: 'blocked_drift',
        identity: input.identity,
        context_policy_profile: input.context_policy_profile,
        context_policy_profile_hash: input.context_policy_profile_hash,
        freshness_status: 'drifted',
        provenance_ref: entry.provenance_ref,
      });
    }

    if (entry.freshness_status === 'fresh') {
      return this.buildEnvelope({
        cache_result: 'hit',
        identity: input.identity,
        context_policy_profile: input.context_policy_profile,
        context_policy_profile_hash: input.context_policy_profile_hash,
        redacted_prompt_artifact_ref: entry.redacted_prompt_artifact_ref,
        redacted_prompt_artifact_hash: entry.redacted_prompt_artifact_hash,
        prompt_quality_report_ref: entry.prompt_quality_report_ref,
        prompt_quality_report_hash: entry.prompt_quality_report_hash,
        quality_decision: entry.quality_decision,
        freshness_status: 'fresh',
        provenance_ref: entry.provenance_ref,
        blocker_codes: entry.blocker_codes,
        warning_codes: entry.warning_codes,
      });
    }

    if (entry.freshness_status === 'stale') {
      const staleBehavior = input.context_policy_profile.cache_policy.stale_behavior;
      return this.buildEnvelope({
        cache_result: staleBehavior === 'block' ? 'blocked_stale' : 'miss',
        identity: input.identity,
        context_policy_profile: input.context_policy_profile,
        context_policy_profile_hash: input.context_policy_profile_hash,
        freshness_status: 'stale',
        provenance_ref: entry.provenance_ref,
      });
    }

    return this.buildEnvelope({
      cache_result: entry.freshness_status === 'drifted' ? 'blocked_drift' : 'miss',
      identity: input.identity,
      context_policy_profile: input.context_policy_profile,
      context_policy_profile_hash: input.context_policy_profile_hash,
      freshness_status: entry.freshness_status,
      provenance_ref: entry.provenance_ref,
    });
  }

  async recordFreshArtifacts(
    input: RecordTopicSelectionPromptPacketCacheArtifactInput,
  ): Promise<TopicSelectionPromptPacketCachePutResult> {
    this.assertIdentity(input.identity);
    if (this.isCacheDisabled(input.context_policy_profile)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Cannot record prompt packet cache artifacts when cache is disabled.');
    }
    if (this.hasProfileIdentityDrift(
      input.context_policy_profile,
      input.context_policy_profile_hash,
      input.identity,
    )) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Cannot record prompt packet cache artifacts for a drifted profile/identity pair.');
    }

    const entry: TopicSelectionPromptPacketCacheStoreEntry = {
      prompt_packet_hash: input.identity.prompt_packet_hash,
      prompt_template_id: input.identity.prompt_template_id,
      prompt_template_version: input.identity.prompt_template_version,
      prompt_variant_key: input.identity.prompt_variant_key,
      invocation_slot_id: input.identity.invocation_slot_id,
      context_policy_profile_id: input.context_policy_profile.context_policy_profile_id,
      context_policy_profile_version: input.context_policy_profile.context_policy_profile_version,
      context_policy_profile_hash: input.context_policy_profile_hash,
      output_contract: input.identity.output_contract,
      redaction_policy: input.identity.redaction_policy,
      context_packet_hashes_hash: this.hash(input.identity.context_packet_hashes),
      compression_report_hash: input.identity.compression_report_hash,
      compressed_context_hash: input.identity.compressed_context_hash,
      dynamic_material_refs_hash: input.identity.dynamic_material_refs_hash,
      model_option_id: input.identity.model_option_id,
      normalized_params_hash: input.identity.normalized_params_hash,
      runtime_modifiers_hash: input.identity.runtime_modifiers_hash,
      redacted_prompt_artifact_ref: input.redacted_prompt_artifact_ref,
      redacted_prompt_artifact_hash: input.redacted_prompt_artifact_hash,
      prompt_quality_report_ref: input.prompt_quality_report_ref,
      prompt_quality_report_hash: input.prompt_quality_report_hash,
      quality_decision: input.quality_decision,
      freshness_status: 'fresh',
      provenance_ref: input.provenance_ref,
      blocker_codes: this.uniqueStrings(input.blocker_codes ?? []),
      warning_codes: this.uniqueStrings(input.warning_codes ?? []),
    };

    this.buildEnvelope({
      cache_result: 'hit',
      identity: input.identity,
      context_policy_profile: input.context_policy_profile,
      context_policy_profile_hash: input.context_policy_profile_hash,
      redacted_prompt_artifact_ref: input.redacted_prompt_artifact_ref,
      redacted_prompt_artifact_hash: input.redacted_prompt_artifact_hash,
      prompt_quality_report_ref: input.prompt_quality_report_ref,
      prompt_quality_report_hash: input.prompt_quality_report_hash,
      quality_decision: input.quality_decision,
      freshness_status: 'fresh',
      provenance_ref: input.provenance_ref,
      blocker_codes: entry.blocker_codes,
      warning_codes: entry.warning_codes,
    });
    return this.store.putIfAbsent(entry);
  }

  private isCacheDisabled(profile: TopicSelectionContextPolicyProfile): boolean {
    return !profile.cache_policy.cache_enabled
      || profile.cache_policy.cache_scope === 'disabled';
  }

  private hasProfileIdentityDrift(
    profile: TopicSelectionContextPolicyProfile,
    profileHash: string,
    identity: TopicSelectionPromptPacketIdentity,
  ): boolean {
    return identity.invocation_slot_id !== profile.invocation_slot_id
      || identity.context_policy_profile_hash !== profileHash
      || identity.redaction_policy !== profile.redaction_policy;
  }

  private hasEntryDrift(
    entry: TopicSelectionPromptPacketCacheStoreEntry,
    profile: TopicSelectionContextPolicyProfile,
    profileHash: string,
    identity: TopicSelectionPromptPacketIdentity,
  ): boolean {
    return entry.prompt_packet_hash !== identity.prompt_packet_hash
      || entry.prompt_template_id !== identity.prompt_template_id
      || entry.prompt_template_version !== identity.prompt_template_version
      || entry.prompt_variant_key !== identity.prompt_variant_key
      || entry.invocation_slot_id !== identity.invocation_slot_id
      || entry.context_policy_profile_id !== profile.context_policy_profile_id
      || entry.context_policy_profile_version !== profile.context_policy_profile_version
      || entry.context_policy_profile_hash !== profileHash
      || entry.output_contract !== identity.output_contract
      || entry.redaction_policy !== identity.redaction_policy
      || entry.context_packet_hashes_hash !== this.hash(identity.context_packet_hashes)
      || entry.compression_report_hash !== identity.compression_report_hash
      || entry.compressed_context_hash !== identity.compressed_context_hash
      || entry.dynamic_material_refs_hash !== identity.dynamic_material_refs_hash
      || entry.model_option_id !== identity.model_option_id
      || entry.normalized_params_hash !== identity.normalized_params_hash
      || entry.runtime_modifiers_hash !== identity.runtime_modifiers_hash;
  }

  private buildEnvelope(input: {
    cache_result: TopicSelectionPromptPacketCacheResultEnvelope['cache_result'];
    identity: TopicSelectionPromptPacketIdentity;
    context_policy_profile: TopicSelectionContextPolicyProfile;
    context_policy_profile_hash: string;
    redacted_prompt_artifact_ref?: TopicSelectionFunctionalRef | null;
    redacted_prompt_artifact_hash?: string | null;
    prompt_quality_report_ref?: TopicSelectionFunctionalRef | null;
    prompt_quality_report_hash?: string | null;
    quality_decision?: TopicSelectionPromptQualityDecision | null;
    freshness_status: TopicSelectionPromptPacketFreshnessStatus;
    provenance_ref: TopicSelectionFunctionalRef;
    blocker_codes?: string[];
    warning_codes?: string[];
  }): TopicSelectionPromptPacketCacheResultEnvelope {
    const envelope: TopicSelectionPromptPacketCacheResultEnvelope = {
      cache_result: input.cache_result,
      prompt_packet_hash: input.identity.prompt_packet_hash,
      prompt_template_id: input.identity.prompt_template_id,
      prompt_template_version: input.identity.prompt_template_version,
      prompt_variant_key: input.identity.prompt_variant_key,
      invocation_slot_id: input.identity.invocation_slot_id,
      context_policy_profile_id: input.context_policy_profile.context_policy_profile_id,
      context_policy_profile_version: input.context_policy_profile.context_policy_profile_version,
      context_policy_profile_hash: input.context_policy_profile_hash,
      output_contract: input.identity.output_contract,
      redaction_policy: input.identity.redaction_policy,
      redacted_prompt_artifact_ref: input.redacted_prompt_artifact_ref ?? null,
      redacted_prompt_artifact_hash: input.redacted_prompt_artifact_hash ?? null,
      prompt_quality_report_ref: input.prompt_quality_report_ref ?? null,
      prompt_quality_report_hash: input.prompt_quality_report_hash ?? null,
      quality_decision: input.quality_decision ?? null,
      freshness_status: input.freshness_status,
      provenance_ref: input.provenance_ref,
      blocker_codes: this.uniqueStrings(input.blocker_codes ?? []),
      warning_codes: this.uniqueStrings(input.warning_codes ?? []),
    };
    this.assertCacheResultEnvelope(envelope);
    return envelope;
  }

  private assertIdentity(value: TopicSelectionPromptPacketIdentity): void {
    if (this.identityValidator(value)) {
      return;
    }
    const firstError = this.identityValidator.errors?.[0];
    throw new AppError(
      400,
      'INVALID_PAYLOAD',
      `prompt packet identity failed schema validation at ${firstError?.instancePath || '/'}: ${
        firstError?.message ?? 'invalid payload'
      }`,
    );
  }

  private assertCacheResultEnvelope(value: TopicSelectionPromptPacketCacheResultEnvelope): void {
    if (this.cacheResultValidator(value)) {
      return;
    }
    const firstError = this.cacheResultValidator.errors?.[0];
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      `prompt packet cache result failed schema validation at ${firstError?.instancePath || '/'}: ${
        firstError?.message ?? 'invalid result'
      }`,
    );
  }

  private uniqueStrings(values: string[]): string[] {
    return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
  }

  private hash(value: unknown): string {
    return sha256Text(stableStringify(value));
  }
}
