import {
  Ajv,
  type ValidateFunction,
} from 'ajv';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import {
  TOPIC_SELECTION_PROMPT_QUALITY_REPORT_SCHEMA_VERSION,
  topicSelectionPromptQualityReportSchema,
  topicSelectionRedactedPromptPacketArtifactSchema,
  type TopicSelectionContextPolicyProfile,
  type TopicSelectionDynamicPromptMaterialRecord,
  type TopicSelectionPromptPacketIdentity,
  type TopicSelectionPromptQualityReport,
  type TopicSelectionRedactedPromptPacketArtifact,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';
import { AppError } from '../errors/app-error.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';
import { TopicSelectionLlmRuntimeKeyBuilderService } from './topic-selection-llm-runtime-key-builder-service.js';

export const TOPIC_SELECTION_REDACTED_PROMPT_PACKET_ARTIFACT_SCHEMA_VERSION =
  'TopicSelectionRedactedPromptPacketArtifact@v1' as const;

export type TopicSelectionPromptPacketRuntimeMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
};

export type BuildTopicSelectionPromptPacketRuntimeInput = {
  title_card_id?: string | null;
  workflow_run_id: string;
  node_id: string;
  node_attempt_id: string;
  prompt_template_id: string;
  prompt_template_version: string;
  prompt_variant_key: string;
  invocation_slot_id: string;
  messages: TopicSelectionPromptPacketRuntimeMessage[];
  source_refs: TopicSelectionFunctionalRef[];
  context_packet_hashes?: string[];
  compression_report_ref?: TopicSelectionFunctionalRef | null;
  compression_report_hash?: string | null;
  compressed_context_hash?: string | null;
  dynamic_material_refs?: TopicSelectionDynamicPromptMaterialRecord[];
  output_contract: string;
  context_policy_profile: TopicSelectionContextPolicyProfile;
  context_policy_profile_hash: string;
  model_option_id?: string | null;
  normalized_params_hash?: string | null;
  runtime_modifiers_hash: string;
  redaction_policy?: string | null;
  rendered_prompt_hash?: string | null;
};

export type TopicSelectionPromptPacketRuntimeResult = {
  identity: TopicSelectionPromptPacketIdentity;
  redacted_prompt_artifact: TopicSelectionRedactedPromptPacketArtifact;
  prompt_quality_report: TopicSelectionPromptQualityReport;
  blocker_codes: string[];
  warning_codes: string[];
};

const FORBIDDEN_PROMPT_VALUE_PATTERNS = [
  /(^|[^A-Za-z0-9])hidden[_-]?reasoning\s*[:=]/iu,
  /(^|[^A-Za-z0-9])chain[_-]?of[_-]?thought\s*[:=]/iu,
  /(^|[^A-Za-z0-9])raw[_-]?provider[_-]?log\s*[:=]/iu,
  /Bearer\s+[A-Za-z0-9._~+/=-]+/iu,
  /(^|[^A-Za-z0-9])sk-[A-Za-z0-9_-]{12,}/iu,
  /\bapi[_-]?key\s*[:=]\s*[^\s,;}]+/iu,
  /\bsecret\s*[:=]\s*[^\s,;}]+/iu,
] as const;

export class TopicSelectionPromptPacketRuntimeService {
  private readonly ajv = new Ajv({
    allErrors: true,
    strict: false,
    removeAdditional: false,
  });
  private readonly redactedPromptValidator: ValidateFunction;
  private readonly promptQualityReportValidator: ValidateFunction;
  private readonly keyBuilder: TopicSelectionLlmRuntimeKeyBuilderService;

  constructor(options: {
    keyBuilder?: TopicSelectionLlmRuntimeKeyBuilderService;
  } = {}) {
    this.keyBuilder = options.keyBuilder ?? new TopicSelectionLlmRuntimeKeyBuilderService();
    this.redactedPromptValidator = this.ajv.compile(topicSelectionRedactedPromptPacketArtifactSchema);
    this.promptQualityReportValidator = this.ajv.compile(topicSelectionPromptQualityReportSchema);
  }

  buildPromptPacket(
    input: BuildTopicSelectionPromptPacketRuntimeInput,
  ): TopicSelectionPromptPacketRuntimeResult {
    this.assertInput(input);
    const sourceRefs = input.source_refs.length > 0
      ? this.uniqueRefs(input.source_refs)
      : [this.nodeAttemptRef(input)];
    const contextPacketHashes = input.context_packet_hashes?.length
      ? [...input.context_packet_hashes]
      : input.source_refs.length > 0
        ? [this.hash(input.source_refs)]
        : [this.hash(this.nodeAttemptRef(input))];
    const renderedPromptHash = input.rendered_prompt_hash?.trim()
      || this.hash({
        messages: input.messages,
        prompt_template_id: input.prompt_template_id,
        prompt_template_version: input.prompt_template_version,
        prompt_variant_key: input.prompt_variant_key,
      });
    const executablePromptHash = this.hash({
      messages: input.messages,
      output_contract: input.output_contract,
      prompt_template_id: input.prompt_template_id,
      prompt_template_version: input.prompt_template_version,
      prompt_variant_key: input.prompt_variant_key,
    });
    const redactedPromptArtifactRef = this.syntheticRef(
      'redacted_prompt_artifact',
      'redacted_prompt',
      {
        executable_prompt_hash: executablePromptHash,
        node_attempt_id: input.node_attempt_id,
        prompt_template_id: input.prompt_template_id,
      },
      input.title_card_id ?? null,
    );
    const provenanceRef = this.syntheticRef(
      'prompt_packet_provenance',
      'prompt_provenance',
      {
        node_attempt_id: input.node_attempt_id,
        rendered_prompt_hash: renderedPromptHash,
        runtime_modifiers_hash: input.runtime_modifiers_hash,
      },
      input.title_card_id ?? null,
    );
    const dynamicMaterialRefs = input.dynamic_material_refs ?? [];
    const dynamicMaterialRefsHash = dynamicMaterialRefs.length > 0
      ? this.hash(dynamicMaterialRefs)
      : null;
    const identity = this.keyBuilder.buildPromptPacketIdentity({
      prompt_template_id: input.prompt_template_id,
      prompt_template_version: input.prompt_template_version,
      prompt_variant_key: input.prompt_variant_key,
      invocation_slot_id: input.invocation_slot_id,
      context_packet_hashes: contextPacketHashes,
      compression_report_ref: input.compression_report_ref ?? null,
      compression_report_hash: input.compression_report_hash ?? null,
      compressed_context_hash: input.compressed_context_hash ?? null,
      dynamic_material_refs_hash: dynamicMaterialRefsHash,
      output_contract: input.output_contract,
      context_policy_profile_hash: input.context_policy_profile_hash,
      model_option_id: input.model_option_id ?? null,
      normalized_params_hash: input.normalized_params_hash ?? null,
      runtime_modifiers_hash: input.runtime_modifiers_hash,
      redaction_policy: input.redaction_policy ?? input.context_policy_profile.redaction_policy,
      redacted_prompt_artifact_ref: redactedPromptArtifactRef,
      provenance_ref: provenanceRef,
      rendered_prompt_hash: renderedPromptHash,
    }).value;

    const redactedPromptArtifact: TopicSelectionRedactedPromptPacketArtifact = {
      artifact_ref: redactedPromptArtifactRef,
      prompt_packet_hash: identity.prompt_packet_hash,
      prompt_template_id: input.prompt_template_id,
      prompt_template_version: input.prompt_template_version,
      prompt_variant_key: input.prompt_variant_key,
      messages: input.messages.map((message, index) => {
        const contentHash = this.hash(message.content);
        return {
          role: message.role,
          content_hash: contentHash,
          redacted_content_ref: this.syntheticRef(
            'redacted_prompt_message',
            `redacted_prompt_message_${index}`,
            {
              content_hash: contentHash,
              node_attempt_id: input.node_attempt_id,
              prompt_packet_hash: identity.prompt_packet_hash,
            },
            input.title_card_id ?? null,
          ),
        };
      }),
      source_refs: sourceRefs,
      redaction_policy: identity.redaction_policy,
      provenance_ref: provenanceRef,
    };

    this.assertSchema(
      'redacted_prompt_packet_artifact',
      this.redactedPromptValidator,
      redactedPromptArtifact,
    );

    const blockerCodes = this.promptBlockerCodes(input);
    const warningCodes = this.promptWarningCodes(input, contextPacketHashes);
    const promptQualityReportRef = this.syntheticRef(
      'prompt_quality_report',
      'prompt_quality_report',
      {
        node_attempt_id: input.node_attempt_id,
        prompt_packet_hash: identity.prompt_packet_hash,
      },
      input.title_card_id ?? null,
    );
    const promptQualityReport: TopicSelectionPromptQualityReport = {
      schema_version: TOPIC_SELECTION_PROMPT_QUALITY_REPORT_SCHEMA_VERSION,
      prompt_quality_report_ref: promptQualityReportRef,
      prompt_packet_hash: identity.prompt_packet_hash,
      prompt_template_id: input.prompt_template_id,
      prompt_template_version: input.prompt_template_version,
      prompt_variant_key: input.prompt_variant_key,
      invocation_slot_id: input.invocation_slot_id,
      context_policy_profile_hash: input.context_policy_profile_hash,
      rendered_input_hash: this.hash({
        context_packet_hashes: contextPacketHashes,
        dynamic_material_refs: dynamicMaterialRefs,
        source_refs: sourceRefs,
      }),
      executable_prompt_hash: executablePromptHash,
      redacted_prompt_artifact_ref: redactedPromptArtifactRef,
      dynamic_material_refs: dynamicMaterialRefs,
      quality_decision: blockerCodes.length > 0
        ? 'block'
        : warningCodes.length > 0
          ? 'warn'
          : 'pass',
      check_codes: this.uniqueStrings([
        'PROMPT_TEMPLATE_BOUND',
        'PROMPT_VARIANT_BOUND',
        'OUTPUT_CONTRACT_BOUND',
        'REDACTED_PROMPT_ARTIFACT_REF_BACKED',
        ...(
          contextPacketHashes.length > 0
            ? ['PROMPT_CONTEXT_HASH_BOUND']
            : []
        ),
      ]),
      blocker_codes: this.uniqueStrings(blockerCodes),
      warning_codes: this.uniqueStrings(warningCodes),
    };

    this.assertSchema('prompt_quality_report', this.promptQualityReportValidator, promptQualityReport);

    return {
      identity,
      redacted_prompt_artifact: redactedPromptArtifact,
      prompt_quality_report: promptQualityReport,
      blocker_codes: promptQualityReport.blocker_codes,
      warning_codes: promptQualityReport.warning_codes,
    };
  }

  private assertInput(input: BuildTopicSelectionPromptPacketRuntimeInput): void {
    this.assertNonEmpty(input.workflow_run_id, 'workflow_run_id');
    this.assertNonEmpty(input.node_id, 'node_id');
    this.assertNonEmpty(input.node_attempt_id, 'node_attempt_id');
    this.assertNonEmpty(input.prompt_template_id, 'prompt_template_id');
    this.assertNonEmpty(input.prompt_template_version, 'prompt_template_version');
    this.assertNonEmpty(input.prompt_variant_key, 'prompt_variant_key');
    this.assertNonEmpty(input.invocation_slot_id, 'invocation_slot_id');
    this.assertNonEmpty(input.output_contract, 'output_contract');
    this.assertNonEmpty(input.context_policy_profile_hash, 'context_policy_profile_hash');
    if (input.context_policy_profile_hash !== this.hash(input.context_policy_profile)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'context policy profile hash drift detected for prompt packet.');
    }
    if (input.invocation_slot_id !== input.context_policy_profile.invocation_slot_id) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'prompt packet invocation slot does not match context profile.');
    }
    if (input.messages.length === 0) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'prompt packet requires at least one message.');
    }
    const redactionPolicy = input.redaction_policy ?? input.context_policy_profile.redaction_policy;
    if (redactionPolicy !== input.context_policy_profile.redaction_policy) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'prompt redaction policy drift detected.');
    }
  }

  private promptBlockerCodes(input: BuildTopicSelectionPromptPacketRuntimeInput): string[] {
    const blockers: string[] = [];
    if (!input.prompt_variant_key.trim()) {
      blockers.push('PROMPT_VARIANT_KEY_MISSING');
    }
    if (input.source_refs.length === 0) {
      blockers.push('PROMPT_REQUIRED_CONTEXT_REFS_MISSING');
    }
    if (input.messages.some((message) => this.containsForbiddenPromptValue(message.content))) {
      blockers.push('PROMPT_FORBIDDEN_SECRET_OR_RAW_LOG');
    }
    const invalidDynamicMaterial = (input.dynamic_material_refs ?? [])
      .some((material) => material.allowed_to_influence_prompt !== true || material.cannot_override_prompt_template !== true);
    if (invalidDynamicMaterial) {
      blockers.push('PROMPT_DYNAMIC_MATERIAL_POLICY_INVALID');
    }
    return this.uniqueStrings(blockers);
  }

  private promptWarningCodes(
    input: BuildTopicSelectionPromptPacketRuntimeInput,
    contextPacketHashes: string[],
  ): string[] {
    const warnings: string[] = [];
    if (contextPacketHashes.length === 0) {
      warnings.push('PROMPT_CONTEXT_HASH_UNAVAILABLE');
    }
    if ((input.dynamic_material_refs ?? []).length === 0) {
      warnings.push('PROMPT_DYNAMIC_MATERIAL_NOT_APPLICABLE');
    }
    return this.uniqueStrings(warnings);
  }

  private containsForbiddenPromptValue(value: string): boolean {
    return FORBIDDEN_PROMPT_VALUE_PATTERNS.some((pattern) => pattern.test(value));
  }

  private syntheticRef(
    refType: string,
    prefix: string,
    value: unknown,
    titleCardId: string | null,
  ): TopicSelectionFunctionalRef {
    return {
      ref_type: refType,
      ref_id: `${prefix}_${this.hash(value).slice(0, 32)}`,
      title_card_id: titleCardId,
    };
  }

  private nodeAttemptRef(input: BuildTopicSelectionPromptPacketRuntimeInput): TopicSelectionFunctionalRef {
    return {
      ref_type: 'node_attempt',
      ref_id: input.node_attempt_id,
      title_card_id: input.title_card_id ?? null,
    };
  }

  private assertNonEmpty(value: string | null | undefined, fieldName: string): void {
    if (!value?.trim()) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} is required.`);
    }
  }

  private assertSchema(name: string, validator: ValidateFunction, value: unknown): void {
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

  private uniqueRefs(refs: TopicSelectionFunctionalRef[]): TopicSelectionFunctionalRef[] {
    const seen = new Set<string>();
    const unique: TopicSelectionFunctionalRef[] = [];
    for (const ref of refs) {
      const key = stableStringify({
        ref_type: ref.ref_type,
        ref_id: ref.ref_id,
        version_id: ref.version_id ?? null,
        title_card_id: ref.title_card_id ?? null,
      });
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(ref);
    }
    return unique;
  }

  private uniqueStrings(values: string[]): string[] {
    return [...new Set(values.filter((value) => value.trim().length > 0))];
  }

  private hash(value: unknown): string {
    return sha256Text(stableStringify(value));
  }
}
