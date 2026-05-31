import {
  Ajv,
  type ValidateFunction,
} from 'ajv';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import {
  topicSelectionContextPacketCacheKeySchema,
  topicSelectionPromptPacketIdentitySchema,
  type TopicSelectionContextFamily,
  type TopicSelectionContextPacketCacheKey,
  type TopicSelectionPromptPacketIdentity,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';
import type {
  TopicSelectionAgentExecutionMode,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import type {
  TopicSelectionExecutorKind,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-agent-invocation-contracts';
import { AppError } from '../errors/app-error.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';

export interface TopicSelectionRuntimeKeyBuildResult<T> {
  value: T;
  hash: string;
}

export interface BuildTopicSelectionContextPacketCacheKeyInput {
  node_id: string;
  invocation_slot_id: string;
  execution_mode: TopicSelectionAgentExecutionMode;
  executor_kind: TopicSelectionExecutorKind;
  context_family: TopicSelectionContextFamily;
  runtime_invocation_context_hash: string;
  input_refs?: TopicSelectionFunctionalRef[];
  input_refs_hash?: string | null;
  context_packet_hashes: string[];
  prompt_packet_hash: string;
  policy_version: string;
  schema_version: string;
  context_compiler_version: string;
  prompt_template_id: string;
  prompt_template_version: string;
  profile_hash: string;
  model_option_id?: string | null;
  normalized_params_hash?: string | null;
  output_contract: string;
  redaction_policy: string;
  cache_scope?: 'context_identity_preprocessing' | 'disabled';
}

export interface BuildTopicSelectionPromptPacketIdentityInput {
  prompt_template_id: string;
  prompt_template_version: string;
  prompt_variant_key: string;
  invocation_slot_id: string;
  runtime_invocation_context_hash: string;
  context_packet_hashes: string[];
  compression_report_ref?: TopicSelectionFunctionalRef | null;
  compression_report_hash?: string | null;
  compressed_context_hash?: string | null;
  dynamic_material_refs_hash?: string | null;
  output_contract: string;
  context_policy_profile_hash: string;
  model_option_id?: string | null;
  normalized_params_hash?: string | null;
  runtime_modifiers_hash: string;
  redaction_policy: string;
  redacted_prompt_artifact_ref: TopicSelectionFunctionalRef;
  provenance_ref: TopicSelectionFunctionalRef;
  rendered_prompt_hash: string;
}

type ValidatorName = 'context_packet_cache_key' | 'prompt_packet_identity';

export class TopicSelectionLlmRuntimeKeyBuilderService {
  private readonly ajv = new Ajv({
    allErrors: true,
    strict: false,
    removeAdditional: false,
  });
  private readonly contextPacketCacheKeyValidator: ValidateFunction;
  private readonly promptPacketIdentityValidator: ValidateFunction;

  constructor() {
    this.contextPacketCacheKeyValidator = this.ajv.compile(topicSelectionContextPacketCacheKeySchema);
    this.promptPacketIdentityValidator = this.ajv.compile(topicSelectionPromptPacketIdentitySchema);
  }

  buildContextPacketCacheKey(
    input: BuildTopicSelectionContextPacketCacheKeyInput,
  ): TopicSelectionRuntimeKeyBuildResult<TopicSelectionContextPacketCacheKey> {
    const key: TopicSelectionContextPacketCacheKey = {
      node_id: input.node_id,
      invocation_slot_id: input.invocation_slot_id,
      execution_mode: input.execution_mode,
      executor_kind: input.executor_kind,
      context_family: input.context_family,
      runtime_invocation_context_hash: input.runtime_invocation_context_hash,
      input_refs_hash: input.input_refs_hash ?? this.hashFunctionalRefs(input.input_refs ?? []),
      context_packet_hashes: [...input.context_packet_hashes],
      prompt_packet_hash: input.prompt_packet_hash,
      policy_version: input.policy_version,
      schema_version: input.schema_version,
      context_compiler_version: input.context_compiler_version,
      prompt_template_id: input.prompt_template_id,
      prompt_template_version: input.prompt_template_version,
      profile_hash: input.profile_hash,
      model_option_id: input.model_option_id ?? null,
      normalized_params_hash: input.normalized_params_hash ?? null,
      output_contract: input.output_contract,
      redaction_policy: input.redaction_policy,
      cache_scope: input.cache_scope ?? 'context_identity_preprocessing',
    };

    this.assertProviderKeyCompleteness(key);
    this.assertSchema('context_packet_cache_key', this.contextPacketCacheKeyValidator, key);
    return {
      value: key,
      hash: this.hash(key),
    };
  }

  buildPromptPacketIdentity(
    input: BuildTopicSelectionPromptPacketIdentityInput,
  ): TopicSelectionRuntimeKeyBuildResult<TopicSelectionPromptPacketIdentity> {
    const hashInput = {
      prompt_template_id: input.prompt_template_id,
      prompt_template_version: input.prompt_template_version,
      prompt_variant_key: input.prompt_variant_key,
      invocation_slot_id: input.invocation_slot_id,
      runtime_invocation_context_hash: input.runtime_invocation_context_hash,
      context_packet_hashes: [...input.context_packet_hashes],
      compression_report_ref: input.compression_report_ref ?? null,
      compression_report_hash: input.compression_report_hash ?? null,
      compressed_context_hash: input.compressed_context_hash ?? null,
      dynamic_material_refs_hash: input.dynamic_material_refs_hash ?? null,
      output_contract: input.output_contract,
      context_policy_profile_hash: input.context_policy_profile_hash,
      model_option_id: input.model_option_id ?? null,
      normalized_params_hash: input.normalized_params_hash ?? null,
      runtime_modifiers_hash: input.runtime_modifiers_hash,
      redaction_policy: input.redaction_policy,
      redacted_prompt_artifact_ref: input.redacted_prompt_artifact_ref,
      provenance_ref: input.provenance_ref,
      rendered_prompt_hash: input.rendered_prompt_hash,
    };
    const promptPacketHash = this.hash(hashInput);
    const identity: TopicSelectionPromptPacketIdentity = {
      prompt_packet_hash: promptPacketHash,
      prompt_template_id: input.prompt_template_id,
      prompt_template_version: input.prompt_template_version,
      prompt_variant_key: input.prompt_variant_key,
      invocation_slot_id: input.invocation_slot_id,
      runtime_invocation_context_hash: input.runtime_invocation_context_hash,
      context_packet_hashes: [...input.context_packet_hashes],
      compression_report_ref: input.compression_report_ref ?? null,
      compression_report_hash: input.compression_report_hash ?? null,
      compressed_context_hash: input.compressed_context_hash ?? null,
      dynamic_material_refs_hash: input.dynamic_material_refs_hash ?? null,
      output_contract: input.output_contract,
      context_policy_profile_hash: input.context_policy_profile_hash,
      model_option_id: input.model_option_id ?? null,
      normalized_params_hash: input.normalized_params_hash ?? null,
      runtime_modifiers_hash: input.runtime_modifiers_hash,
      redaction_policy: input.redaction_policy,
      redacted_prompt_artifact_ref: input.redacted_prompt_artifact_ref,
      provenance_ref: input.provenance_ref,
    };

    this.assertSchema('prompt_packet_identity', this.promptPacketIdentityValidator, identity);
    return {
      value: identity,
      hash: promptPacketHash,
    };
  }

  hashPayload(value: unknown): string {
    return this.hash(value);
  }

  hashFunctionalRefs(refs: TopicSelectionFunctionalRef[]): string {
    const normalized = refs
      .map((item) => ({
        ref_type: item.ref_type,
        ref_id: item.ref_id,
        version_id: item.version_id ?? null,
        title_card_id: item.title_card_id ?? null,
      }))
      .sort((left, right) => stableStringify(left).localeCompare(stableStringify(right)));
    return this.hash(normalized);
  }

  private assertProviderKeyCompleteness(key: TopicSelectionContextPacketCacheKey): void {
    if (
      key.execution_mode === 'provider_llm'
      && (!key.model_option_id || !key.normalized_params_hash)
    ) {
      throw new AppError(
        400,
        'INVALID_PAYLOAD',
        'provider_llm runtime keys require model_option_id and normalized_params_hash.',
      );
    }
  }

  private assertSchema(
    name: ValidatorName,
    validator: ValidateFunction,
    value: unknown,
  ): void {
    if (validator(value)) {
      return;
    }
    const firstError = validator.errors?.[0];
    throw new AppError(
      400,
      'INVALID_PAYLOAD',
      `${name} failed schema validation at ${firstError?.instancePath || '/'}: ${
        firstError?.message ?? 'invalid payload'
      }`,
    );
  }

  private hash(value: unknown): string {
    return sha256Text(stableStringify(value));
  }
}
