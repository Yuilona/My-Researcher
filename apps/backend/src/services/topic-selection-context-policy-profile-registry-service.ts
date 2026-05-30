import {
  Ajv,
  type ErrorObject,
  type ValidateFunction,
} from 'ajv';
import {
  TOPIC_SELECTION_CONTEXT_POLICY_PROFILE_REGISTRY_SCHEMA_VERSION,
  TOPIC_SELECTION_CONTEXT_POLICY_PROFILE_SCHEMA_VERSION,
  topicSelectionContextPolicyProfileRegistrySchema,
  type TopicSelectionContextExecutionModifier,
  type TopicSelectionContextFamily,
  type TopicSelectionContextFunctionalTemplate,
  type TopicSelectionContextPolicyProfile,
  type TopicSelectionContextPolicyProfileRegistry,
  type TopicSelectionContextSourceKind,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';
import { AppError } from '../errors/app-error.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';

export const TOPIC_SELECTION_CONTEXT_RUNTIME_POLICY_VERSION =
  'topic-selection-context-runtime-policy-v1' as const;
export const TOPIC_SELECTION_CONTEXT_RUNTIME_SCHEMA_VERSION =
  TOPIC_SELECTION_CONTEXT_POLICY_PROFILE_SCHEMA_VERSION;
export const TOPIC_SELECTION_NEED_DISCOVERY_CONTEXT_COMPILER_VERSION =
  'topic-selection-need-discovery-context-compiler-v1' as const;
export const TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY =
  'topic-selection-redacted-ref-backed-v1' as const;

export const TOPIC_SELECTION_V1A_N5_CONTEXT_RUNTIME_PROFILE_IDS = {
  evidence_extraction:
    'topic-selection.v1a.n5.evidence-extraction.context-runtime@v1',
} as const;

export const TOPIC_SELECTION_V1A_N5_INVOCATION_SLOT_IDS = {
  evidence_extraction: 'evidence_extraction',
} as const;

export const TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS = {
  need_candidate_generation:
    'topic-selection.v1a.n6.need-candidate-generation.context-runtime@v1',
  explorer_round_1_discovery:
    'topic-selection.v1a.n6.explorer-round-1.context-runtime@v1',
  deep_critic_round_1_discovery:
    'topic-selection.v1a.n6.deep-critic-round-1.context-runtime@v1',
  arbiter_issue_framing:
    'topic-selection.v1a.n6.arbiter-issue-framing.context-runtime@v1',
  arbiter_final_synthesis:
    'topic-selection.v1a.n6.arbiter-final-synthesis.context-runtime@v1',
} as const;

export const TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS = {
  need_candidate_generation: 'need_candidate_generation',
  explorer_round_1_discovery: 'explorer.round_1_discovery',
  deep_critic_round_1_discovery: 'deep_critic.round_1_discovery',
  arbiter_issue_framing: 'arbiter.issue_framing',
  arbiter_final_synthesis: 'arbiter.final_synthesis',
} as const;

export const TOPIC_SELECTION_V1A_N7_CONTEXT_RUNTIME_PROFILE_IDS = {
  adjudication_recommendation:
    'topic-selection.v1a.n7.need-adjudication.context-runtime@v1',
} as const;

export const TOPIC_SELECTION_V1A_N7_INVOCATION_SLOT_IDS = {
  adjudication_recommendation: 'adjudication_recommendation',
} as const;

export const TOPIC_SELECTION_V1A_N8_CONTEXT_RUNTIME_PROFILE_IDS = {
  confirmation_semantic_review:
    'topic-selection.v1a.n8.human-confirmation-semantic-review.context-runtime@v1',
} as const;

export const TOPIC_SELECTION_V1A_N8_INVOCATION_SLOT_IDS = {
  confirmation_semantic_review: 'confirmation_semantic_review',
} as const;

export type TopicSelectionContextPolicyProfileRegistryValidationIssueCode =
  | 'SCHEMA_VALIDATION_FAILED'
  | 'DUPLICATE_PROFILE_ID'
  | 'DUPLICATE_INVOCATION_SLOT_ID'
  | 'DURABLE_MEMORY_AUTHORITY_FORBIDDEN'
  | 'PROVIDER_REQUIRED_LIVE_POLICY_INVALID'
  | 'COMPRESSION_QUALITY_GATE_REQUIRED'
  | 'COMPRESSION_EXECUTOR_REQUIRED'
  | 'CACHE_KEY_FIELD_MISSING'
  | 'CACHE_POST_GATE_MISSING'
  | 'FORBIDDEN_PAYLOAD_CLASS_MISSING'
  | 'REQUIRED_PRESERVED_FACT_MISSING';

export interface TopicSelectionContextPolicyProfileRegistryValidationIssue {
  code: TopicSelectionContextPolicyProfileRegistryValidationIssueCode;
  message: string;
  context_policy_profile_id?: string;
  invocation_slot_id?: string;
  path?: string;
}

export interface TopicSelectionContextPolicyProfileRegistryValidationResult {
  valid: boolean;
  issue_count: number;
  issues: TopicSelectionContextPolicyProfileRegistryValidationIssue[];
}

export interface TopicSelectionResolvedContextPolicyProfile {
  profile: TopicSelectionContextPolicyProfile;
  profile_hash: string;
}

export interface ResolveTopicSelectionContextPolicyProfileInput {
  context_policy_profile_id: string;
  context_policy_profile_version?: string | null;
  invocation_slot_id?: string | null;
  expected_profile_hash?: string | null;
}

const PROFILE_VERSION = 'v1' as const;

const COMMON_SOURCE_KINDS: TopicSelectionContextSourceKind[] = [
  'authority_record',
  'ref_backed_artifact',
  'durable_memory',
  'prior_llm_output',
];

const COMMON_EXECUTION_MODIFIERS: TopicSelectionContextExecutionModifier[] = [
  'provider_required_live',
  'codex_exact_reuse_allowed',
  'mock_replay_allowed',
  'compression_allowed_with_quality_gate',
];

const COMMON_PRESERVED_FACT_KINDS = [
  'blocker',
  'residual_risk',
  'accepted_risk',
  'source_health_warning',
  'method_family_gap',
  'unresolved_challenge',
  'recheck_hint',
] as const;

const COMMON_FORBIDDEN_PAYLOAD_CLASSES = [
  'hidden_reasoning',
  'raw_provider_logs',
  'credentials',
  'secrets',
  'unredacted_private_content',
] as const;

const REQUIRED_CACHE_KEY_FIELDS = [
  'node_id',
  'invocation_slot_id',
  'execution_mode',
  'executor_kind',
  'context_family',
  'input_refs_hash',
  'context_packet_hashes',
  'prompt_packet_hash',
  'policy_version',
  'schema_version',
  'context_compiler_version',
  'prompt_template_id',
  'prompt_template_version',
  'profile_hash',
  'model_option_id',
  'normalized_params_hash',
  'output_contract',
  'redaction_policy',
] as const;

const REQUIRED_POST_CACHE_GATES = [
  'schema_validation',
  'deterministic_gate',
  'authority_boundary',
] as const;

function contextPolicyProfile(input: {
  context_policy_profile_id: string;
  invocation_slot_id: string;
  functional_template: TopicSelectionContextFunctionalTemplate;
  context_family: TopicSelectionContextFamily;
  estimated_input_token_target: number;
  estimated_output_token_budget: number;
  post_reuse_gates?: string[];
  allowed_source_kinds?: TopicSelectionContextSourceKind[];
}): TopicSelectionContextPolicyProfile {
  return {
    schema_version: TOPIC_SELECTION_CONTEXT_POLICY_PROFILE_SCHEMA_VERSION,
    context_policy_profile_id: input.context_policy_profile_id,
    context_policy_profile_version: PROFILE_VERSION,
    invocation_slot_id: input.invocation_slot_id,
    functional_template: input.functional_template,
    execution_modifiers: [...COMMON_EXECUTION_MODIFIERS],
    context_family: input.context_family,
    allowed_source_kinds: input.allowed_source_kinds ?? [...COMMON_SOURCE_KINDS],
    memory_policy: {
      allowed_memory_families: [
        'topic_selection_recheck_risk_memory',
        'topic_selection_need_discovery_decision_memory',
      ],
      required_use_labels: [
        'blocker',
        'residual_risk',
        'accepted_risk',
        'source_health_warning',
        'method_family_gap',
        'unresolved_challenge',
        'recheck_hint',
      ],
      stale_behavior: 'block',
      missing_required_memory_behavior: 'block',
      durable_memory_as_standalone_evidence: false,
    },
    compression_policy: {
      compression_mode: 'required_when_over_budget',
      allowed_executor_kinds: ['deterministic_structural', 'codex_assisted'],
      compression_strategy_id: 'topic-selection-context-compression',
      compression_strategy_version: 'v1',
      preserved_fact_kinds: [...COMMON_PRESERVED_FACT_KINDS],
      forbidden_payload_classes: [...COMMON_FORBIDDEN_PAYLOAD_CLASSES],
      quality_gate_required: true,
    },
    cache_policy: {
      cache_enabled: true,
      cache_scope: 'context_identity_preprocessing',
      exact_key_fields: [...REQUIRED_CACHE_KEY_FIELDS],
      stale_behavior: 'block',
      post_cache_gates: [...REQUIRED_POST_CACHE_GATES],
    },
    token_budget_policy: {
      estimated_input_token_target: input.estimated_input_token_target,
      estimated_output_token_budget: input.estimated_output_token_budget,
      context_window_tokens: 128000,
      token_estimate_safety_margin: 1.25,
      unknown_estimate_behavior: 'blocked_over_budget',
    },
    reuse_policy: {
      provider_llm_response_reuse: 'blocked',
      codex_exact_reuse_requires_approval: true,
      mock_replay_allowed: true,
      provider_required_live_behavior: 'live_call_required',
    },
    post_reuse_gates: input.post_reuse_gates ?? [
      'schema_validation',
      'deterministic_gate',
      'authority_boundary',
    ],
    provenance_policy: {
      runtime_audit_envelope_required: true,
      operator_audit_summary_required: true,
      human_trust_summary_required: input.functional_template === 'candidate_for_deterministic_gate',
      forbidden_persisted_payload_classes: [...COMMON_FORBIDDEN_PAYLOAD_CLASSES],
    },
    redaction_policy: TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY,
  };
}

const DEFAULT_TOPIC_SELECTION_CONTEXT_POLICY_PROFILE_REGISTRY:
  TopicSelectionContextPolicyProfileRegistry = {
    schema_version: TOPIC_SELECTION_CONTEXT_POLICY_PROFILE_REGISTRY_SCHEMA_VERSION,
    profiles: [
      contextPolicyProfile({
        context_policy_profile_id:
          TOPIC_SELECTION_V1A_N5_CONTEXT_RUNTIME_PROFILE_IDS.evidence_extraction,
        invocation_slot_id: TOPIC_SELECTION_V1A_N5_INVOCATION_SLOT_IDS.evidence_extraction,
        functional_template: 'candidate_for_deterministic_gate',
        context_family: 'v1a_n5_evidence_extraction',
        estimated_input_token_target: 32000,
        estimated_output_token_budget: 4096,
      }),
      contextPolicyProfile({
        context_policy_profile_id:
          TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.need_candidate_generation,
        invocation_slot_id: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
        functional_template: 'candidate_for_deterministic_gate',
        context_family: 'v1a_n6_exploration',
        estimated_input_token_target: 28000,
        estimated_output_token_budget: 4096,
      }),
      contextPolicyProfile({
        context_policy_profile_id:
          TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.explorer_round_1_discovery,
        invocation_slot_id: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.explorer_round_1_discovery,
        functional_template: 'support_only_semantic',
        context_family: 'v1a_n6_exploration',
        estimated_input_token_target: 24000,
        estimated_output_token_budget: 1600,
        post_reuse_gates: ['schema_validation', 'debate_role_boundary'],
      }),
      contextPolicyProfile({
        context_policy_profile_id:
          TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.deep_critic_round_1_discovery,
        invocation_slot_id: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.deep_critic_round_1_discovery,
        functional_template: 'support_only_semantic',
        context_family: 'v1a_n6_exploration',
        estimated_input_token_target: 24000,
        estimated_output_token_budget: 1600,
        post_reuse_gates: ['schema_validation', 'debate_role_boundary'],
      }),
      contextPolicyProfile({
        context_policy_profile_id:
          TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.arbiter_issue_framing,
        invocation_slot_id: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.arbiter_issue_framing,
        functional_template: 'support_only_semantic',
        context_family: 'v1a_n6_arbiter',
        estimated_input_token_target: 26000,
        estimated_output_token_budget: 1200,
        post_reuse_gates: ['schema_validation', 'dynamic_prompt_material_boundary'],
      }),
      contextPolicyProfile({
        context_policy_profile_id:
          TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.arbiter_final_synthesis,
        invocation_slot_id: TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.arbiter_final_synthesis,
        functional_template: 'candidate_for_deterministic_gate',
        context_family: 'v1a_n6_arbiter',
        estimated_input_token_target: 28000,
        estimated_output_token_budget: 4096,
      }),
      contextPolicyProfile({
        context_policy_profile_id:
          TOPIC_SELECTION_V1A_N7_CONTEXT_RUNTIME_PROFILE_IDS.adjudication_recommendation,
        invocation_slot_id: TOPIC_SELECTION_V1A_N7_INVOCATION_SLOT_IDS.adjudication_recommendation,
        functional_template: 'candidate_for_deterministic_gate',
        context_family: 'v1a_n7_need_adjudication_support',
        estimated_input_token_target: 18000,
        estimated_output_token_budget: 2048,
      }),
      contextPolicyProfile({
        context_policy_profile_id:
          TOPIC_SELECTION_V1A_N8_CONTEXT_RUNTIME_PROFILE_IDS.confirmation_semantic_review,
        invocation_slot_id: TOPIC_SELECTION_V1A_N8_INVOCATION_SLOT_IDS.confirmation_semantic_review,
        functional_template: 'human_review_advisory',
        context_family: 'v1a_n8_human_confirmation_semantic_review',
        estimated_input_token_target: 10000,
        estimated_output_token_budget: 1200,
        post_reuse_gates: [
          'schema_validation',
          'semantic_review_gate',
          'human_authority_boundary',
        ],
      }),
    ],
  };

function cloneRegistry(
  registry: TopicSelectionContextPolicyProfileRegistry,
): TopicSelectionContextPolicyProfileRegistry {
  return JSON.parse(JSON.stringify(registry)) as TopicSelectionContextPolicyProfileRegistry;
}

export function createDefaultTopicSelectionContextPolicyProfileRegistry():
  TopicSelectionContextPolicyProfileRegistry {
  return cloneRegistry(DEFAULT_TOPIC_SELECTION_CONTEXT_POLICY_PROFILE_REGISTRY);
}

export class TopicSelectionContextPolicyProfileRegistryService {
  private readonly ajv = new Ajv({
    allErrors: true,
    strict: false,
    removeAdditional: false,
  });
  private readonly registry: TopicSelectionContextPolicyProfileRegistry;
  private readonly validator: ValidateFunction;

  constructor(options: {
    registry?: TopicSelectionContextPolicyProfileRegistry;
  } = {}) {
    this.registry = cloneRegistry(options.registry ?? DEFAULT_TOPIC_SELECTION_CONTEXT_POLICY_PROFILE_REGISTRY);
    this.validator = this.ajv.compile(topicSelectionContextPolicyProfileRegistrySchema);
  }

  validateRegistry(
    registry: TopicSelectionContextPolicyProfileRegistry = this.registry,
  ): TopicSelectionContextPolicyProfileRegistryValidationResult {
    const issues: TopicSelectionContextPolicyProfileRegistryValidationIssue[] = [];
    const schemaValid = this.validator(registry);
    if (!schemaValid) {
      issues.push(...this.schemaIssues(this.validator.errors ?? []));
      return this.validationResult(issues);
    }

    this.validateProfiles(registry, issues);
    return this.validationResult(issues);
  }

  resolveProfile(
    input: ResolveTopicSelectionContextPolicyProfileInput,
  ): TopicSelectionResolvedContextPolicyProfile {
    const validation = this.validateRegistry();
    if (!validation.valid) {
      throw new AppError(
        500,
        'INTERNAL_ERROR',
        `Topic-selection context policy profile registry is invalid: ${
          validation.issues[0]?.code ?? 'UNKNOWN'
        }.`,
      );
    }

    const profile = this.registry.profiles.find(
      (item) => item.context_policy_profile_id === input.context_policy_profile_id,
    );
    if (!profile) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'context policy profile does not exist.');
    }
    if (
      input.context_policy_profile_version
      && input.context_policy_profile_version !== profile.context_policy_profile_version
    ) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'context policy profile version mismatch.');
    }
    if (input.invocation_slot_id && input.invocation_slot_id !== profile.invocation_slot_id) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'invocation_slot_id does not match context policy profile.');
    }

    const profileHash = this.hash(profile);
    if (input.expected_profile_hash && input.expected_profile_hash !== profileHash) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'context policy profile hash drift detected.');
    }

    return {
      profile,
      profile_hash: profileHash,
    };
  }

  private validateProfiles(
    registry: TopicSelectionContextPolicyProfileRegistry,
    issues: TopicSelectionContextPolicyProfileRegistryValidationIssue[],
  ): void {
    const seenProfileIds = new Set<string>();
    const seenSlotIds = new Set<string>();
    for (const profile of registry.profiles) {
      if (seenProfileIds.has(profile.context_policy_profile_id)) {
        this.pushIssue(
          issues,
          'DUPLICATE_PROFILE_ID',
          'context_policy_profile_id must be unique.',
          profile,
        );
      }
      seenProfileIds.add(profile.context_policy_profile_id);

      if (seenSlotIds.has(profile.invocation_slot_id)) {
        this.pushIssue(
          issues,
          'DUPLICATE_INVOCATION_SLOT_ID',
          'invocation_slot_id must be unique inside the first-slice registry.',
          profile,
        );
      }
      seenSlotIds.add(profile.invocation_slot_id);

      this.validateProfile(profile, issues);
    }
  }

  private validateProfile(
    profile: TopicSelectionContextPolicyProfile,
    issues: TopicSelectionContextPolicyProfileRegistryValidationIssue[],
  ): void {
    if (profile.memory_policy.durable_memory_as_standalone_evidence) {
      this.pushIssue(
        issues,
        'DURABLE_MEMORY_AUTHORITY_FORBIDDEN',
        'durable memory cannot satisfy authority evidence by itself.',
        profile,
      );
    }

    if (
      profile.execution_modifiers.includes('provider_required_live')
      && (
        profile.reuse_policy.provider_llm_response_reuse !== 'blocked'
        || profile.reuse_policy.provider_required_live_behavior !== 'live_call_required'
      )
    ) {
      this.pushIssue(
        issues,
        'PROVIDER_REQUIRED_LIVE_POLICY_INVALID',
        'provider_required_live profiles must block provider response reuse and require live calls.',
        profile,
      );
    }

    if (
      profile.compression_policy.compression_mode !== 'disallowed'
      && !profile.compression_policy.quality_gate_required
    ) {
      this.pushIssue(
        issues,
        'COMPRESSION_QUALITY_GATE_REQUIRED',
        'compression requires a quality gate.',
        profile,
      );
    }
    if (
      profile.compression_policy.compression_mode !== 'disallowed'
      && profile.compression_policy.allowed_executor_kinds.length === 0
    ) {
      this.pushIssue(
        issues,
        'COMPRESSION_EXECUTOR_REQUIRED',
        'compression requires at least one allowed executor kind.',
        profile,
      );
    }

    for (const field of REQUIRED_CACHE_KEY_FIELDS) {
      if (!profile.cache_policy.exact_key_fields.includes(field)) {
        this.pushIssue(
          issues,
          'CACHE_KEY_FIELD_MISSING',
          `cache key field ${field} is required by T-112.`,
          profile,
        );
      }
    }

    for (const gate of REQUIRED_POST_CACHE_GATES) {
      if (
        profile.functional_template === 'candidate_for_deterministic_gate'
        && !profile.cache_policy.post_cache_gates.includes(gate)
      ) {
        this.pushIssue(
          issues,
          'CACHE_POST_GATE_MISSING',
          `candidate-bearing profiles must run ${gate} after cache hits.`,
          profile,
        );
      }
    }

    for (const payloadClass of COMMON_FORBIDDEN_PAYLOAD_CLASSES) {
      if (
        !profile.compression_policy.forbidden_payload_classes.includes(payloadClass)
        || !profile.provenance_policy.forbidden_persisted_payload_classes.includes(payloadClass)
      ) {
        this.pushIssue(
          issues,
          'FORBIDDEN_PAYLOAD_CLASS_MISSING',
          `forbidden payload class ${payloadClass} must be declared.`,
          profile,
        );
      }
    }

    for (const factKind of COMMON_PRESERVED_FACT_KINDS) {
      if (!profile.compression_policy.preserved_fact_kinds.includes(factKind)) {
        this.pushIssue(
          issues,
          'REQUIRED_PRESERVED_FACT_MISSING',
          `compression must preserve ${factKind}.`,
          profile,
        );
      }
    }
  }

  private schemaIssues(
    errors: ErrorObject[],
  ): TopicSelectionContextPolicyProfileRegistryValidationIssue[] {
    return errors.map((error) => ({
      code: 'SCHEMA_VALIDATION_FAILED',
      message: `${error.instancePath || '/'} ${error.message ?? 'schema validation failed'}`,
      path: error.instancePath || '/',
    }));
  }

  private pushIssue(
    issues: TopicSelectionContextPolicyProfileRegistryValidationIssue[],
    code: TopicSelectionContextPolicyProfileRegistryValidationIssueCode,
    message: string,
    profile: TopicSelectionContextPolicyProfile,
  ): void {
    issues.push({
      code,
      message,
      context_policy_profile_id: profile.context_policy_profile_id,
      invocation_slot_id: profile.invocation_slot_id,
    });
  }

  private validationResult(
    issues: TopicSelectionContextPolicyProfileRegistryValidationIssue[],
  ): TopicSelectionContextPolicyProfileRegistryValidationResult {
    return {
      valid: issues.length === 0,
      issue_count: issues.length,
      issues,
    };
  }

  private hash(value: unknown): string {
    return sha256Text(stableStringify(value));
  }
}
