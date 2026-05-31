import type {
  LlmCallTelemetry,
  LlmStructuredOutputRequest,
  LlmStructuredOutputResponse,
} from './llm-gateway.js';
import { BackendLlmGateway } from './llm-gateway.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';
import {
  TopicSelectionAgentOrchestratorService,
  type TopicSelectionAgentInvocationRequest,
  type TopicSelectionAgentInvocationResult,
  type TopicSelectionAgentOrchestratorLlmGateway,
} from './topic-selection-agent-orchestrator-service.js';
import {
  TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS,
  TOPIC_SELECTION_V1B_N6_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1B_N6_INVOCATION_SLOT_IDS,
  TopicSelectionContextPolicyProfileRegistryService,
} from './topic-selection-context-policy-profile-registry-service.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import {
  TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
  TOPIC_SELECTION_V1B_TOPIC_QUESTION_CANDIDATES_SINGLE_AGENT_PROFILE_ID,
  TopicSelectionModelProfileRegistryService,
} from './topic-selection-model-profile-registry-service.js';

export type TopicSelectionProviderCanaryProviderId = 'openai' | 'dashscope';

export type TopicSelectionProviderCanaryCandidateDraftBatch = {
  batch_id: string;
  drafts: Array<{
    draft_id: string;
    candidate_need: string;
  }>;
};

export interface TopicSelectionProviderCanaryLiveRequiredEvidence {
  provider_id: TopicSelectionProviderCanaryProviderId;
  model_option_id: string;
  provider_required_live: true;
  provider_call_count: number;
  first_status: TopicSelectionAgentInvocationResult<TopicSelectionProviderCanaryCandidateDraftBatch>['status'];
  second_status: TopicSelectionAgentInvocationResult<TopicSelectionProviderCanaryCandidateDraftBatch>['status'];
  first_prompt_packet_hash: string | null;
  second_prompt_packet_hash: string | null;
  prompt_artifact_ref_reused: boolean;
  prompt_quality_report_ref_reused: boolean;
  provider_response_cache_statuses: Array<string | null>;
  response_reuse_refs: Array<string | null>;
  telemetry: LlmCallTelemetry[];
}

export interface TopicSelectionProviderCanaryOverBudgetEvidence {
  provider_id: TopicSelectionProviderCanaryProviderId;
  model_option_id: string;
  provider_call_count: number;
  status: TopicSelectionAgentInvocationResult<TopicSelectionProviderCanaryCandidateDraftBatch>['status'];
  error_code: string | null | undefined;
  token_budget_gate_decision: string | null;
  blocker_codes: string[];
}

type CountingGateway = TopicSelectionAgentOrchestratorLlmGateway & {
  readonly callCount: number;
  readonly telemetry: LlmCallTelemetry[];
};

class CountingTopicSelectionProviderCanaryGateway implements CountingGateway {
  readonly requests: LlmStructuredOutputRequest[] = [];
  readonly telemetry: LlmCallTelemetry[] = [];

  constructor(private readonly delegate: TopicSelectionAgentOrchestratorLlmGateway) {}

  get callCount(): number {
    return this.requests.length;
  }

  async createStructuredOutput<T>(
    request: LlmStructuredOutputRequest,
  ): Promise<LlmStructuredOutputResponse<T>> {
    this.requests.push(request);
    const response = await this.delegate.createStructuredOutput<T>(request);
    this.telemetry.push(response.telemetry);
    return response;
  }
}

export class TopicSelectionProviderCanaryService {
  private readonly llmGateway: TopicSelectionAgentOrchestratorLlmGateway;
  private readonly controlPlane: TopicSelectionControlPlaneService;
  private readonly modelProfileRegistry: TopicSelectionModelProfileRegistryService;
  private readonly contextProfileRegistry: TopicSelectionContextPolicyProfileRegistryService;
  private readonly now: () => string;

  constructor(options: {
    controlPlane: TopicSelectionControlPlaneService;
    llmGateway?: TopicSelectionAgentOrchestratorLlmGateway;
    modelProfileRegistry?: TopicSelectionModelProfileRegistryService;
    contextProfileRegistry?: TopicSelectionContextPolicyProfileRegistryService;
    now?: () => string;
  }) {
    this.controlPlane = options.controlPlane;
    this.llmGateway = options.llmGateway ?? new BackendLlmGateway();
    this.modelProfileRegistry = options.modelProfileRegistry ?? new TopicSelectionModelProfileRegistryService();
    this.contextProfileRegistry = options.contextProfileRegistry
      ?? new TopicSelectionContextPolicyProfileRegistryService();
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async runPromptCacheLiveRequiredCanary(
    input: { provider_id: TopicSelectionProviderCanaryProviderId },
  ): Promise<TopicSelectionProviderCanaryLiveRequiredEvidence> {
    const modelOptionId = this.modelOptionId(input.provider_id);
    const countingGateway = new CountingTopicSelectionProviderCanaryGateway(this.llmGateway);
    const orchestrator = this.makeOrchestrator(countingGateway);
    const invocation = this.providerInvocation(input.provider_id, {
      estimated_input_tokens_override: 1000,
    });
    const first = await orchestrator.invokeStructuredOutput<TopicSelectionProviderCanaryCandidateDraftBatch>(
      invocation,
    );
    const second = await orchestrator.invokeStructuredOutput<TopicSelectionProviderCanaryCandidateDraftBatch>(
      invocation,
    );

    return {
      provider_id: input.provider_id,
      model_option_id: modelOptionId,
      provider_required_live: true,
      provider_call_count: countingGateway.callCount,
      first_status: first.status,
      second_status: second.status,
      first_prompt_packet_hash: first.provenance.prompt_packet_hash ?? null,
      second_prompt_packet_hash: second.provenance.prompt_packet_hash ?? null,
      prompt_artifact_ref_reused:
        first.provenance.redacted_prompt_artifact_ref?.ref_id ===
        second.provenance.redacted_prompt_artifact_ref?.ref_id,
      prompt_quality_report_ref_reused:
        first.provenance.prompt_quality_report_ref?.ref_id ===
        second.provenance.prompt_quality_report_ref?.ref_id,
      provider_response_cache_statuses: [
        first.provenance.cache_status ?? null,
        second.provenance.cache_status ?? null,
      ],
      response_reuse_refs: [
        first.provenance.response_reuse_ref ?? null,
        second.provenance.response_reuse_ref ?? null,
      ],
      telemetry: countingGateway.telemetry,
    };
  }

  async runOverBudgetZeroCallCanary(
    input: { provider_id: TopicSelectionProviderCanaryProviderId },
  ): Promise<TopicSelectionProviderCanaryOverBudgetEvidence> {
    const modelOptionId = this.modelOptionId(input.provider_id);
    const countingGateway = new CountingTopicSelectionProviderCanaryGateway(this.llmGateway);
    const orchestrator = this.makeOrchestrator(countingGateway);
    const result = await orchestrator.invokeStructuredOutput<TopicSelectionProviderCanaryCandidateDraftBatch>(
      this.providerInvocation(input.provider_id, {
        estimated_input_tokens_override: 200_000,
        compression_already_applied: true,
      }),
    );

    return {
      provider_id: input.provider_id,
      model_option_id: modelOptionId,
      provider_call_count: countingGateway.callCount,
      status: result.status,
      error_code: result.error_code,
      token_budget_gate_decision: result.token_budget_gate_result?.decision ?? null,
      blocker_codes: result.blocker_codes,
    };
  }

  async runV1bN6PromptCacheLiveRequiredCanary(
    input: { provider_id: TopicSelectionProviderCanaryProviderId },
  ): Promise<TopicSelectionProviderCanaryLiveRequiredEvidence> {
    const modelOptionId = this.v1bN6ModelOptionId(input.provider_id);
    const countingGateway = new CountingTopicSelectionProviderCanaryGateway(this.llmGateway);
    const orchestrator = this.makeOrchestrator(countingGateway);
    const invocation = this.v1bN6ProviderInvocation(input.provider_id, {
      estimated_input_tokens_override: 1000,
    });
    const first = await orchestrator.invokeStructuredOutput<TopicSelectionProviderCanaryCandidateDraftBatch>(
      invocation,
    );
    const second = await orchestrator.invokeStructuredOutput<TopicSelectionProviderCanaryCandidateDraftBatch>(
      invocation,
    );

    return this.liveRequiredEvidence({
      providerId: input.provider_id,
      modelOptionId,
      first,
      second,
      countingGateway,
    });
  }

  async runV1bN6OverBudgetZeroCallCanary(
    input: { provider_id: TopicSelectionProviderCanaryProviderId },
  ): Promise<TopicSelectionProviderCanaryOverBudgetEvidence> {
    const modelOptionId = this.v1bN6ModelOptionId(input.provider_id);
    const countingGateway = new CountingTopicSelectionProviderCanaryGateway(this.llmGateway);
    const orchestrator = this.makeOrchestrator(countingGateway);
    const result = await orchestrator.invokeStructuredOutput<TopicSelectionProviderCanaryCandidateDraftBatch>(
      this.v1bN6ProviderInvocation(input.provider_id, {
        estimated_input_tokens_override: 200_000,
        compression_already_applied: true,
      }),
    );

    return {
      provider_id: input.provider_id,
      model_option_id: modelOptionId,
      provider_call_count: countingGateway.callCount,
      status: result.status,
      error_code: result.error_code,
      token_budget_gate_decision: result.token_budget_gate_result?.decision ?? null,
      blocker_codes: result.blocker_codes,
    };
  }

  private makeOrchestrator(
    llmGateway: TopicSelectionAgentOrchestratorLlmGateway,
  ): TopicSelectionAgentOrchestratorService {
    return new TopicSelectionAgentOrchestratorService({
      controlPlane: this.controlPlane,
      llmGateway,
      modelProfileRegistry: this.modelProfileRegistry,
      now: this.now,
    });
  }

  private providerInvocation(
    providerId: TopicSelectionProviderCanaryProviderId,
    runtimeOptions: {
      estimated_input_tokens_override: number;
      compression_already_applied?: boolean;
    },
  ): TopicSelectionAgentInvocationRequest<TopicSelectionProviderCanaryCandidateDraftBatch> {
    const resolvedContextProfile = this.contextProfileRegistry.resolveProfile({
      context_policy_profile_id:
        TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.need_candidate_generation,
      invocation_slot_id:
        TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
    });
    this.assertProviderRequiredLiveProfile(
      resolvedContextProfile.profile.execution_modifiers,
    );

    return {
      workspace_id: 'workspace_provider_canary',
      title_card_id: 'title_card_provider_canary',
      node_id: 'topic-selection.v1a.generate-need-candidate.v1',
      workflow_run_id: `provider_canary_${providerId}_workflow_run_001`,
      node_attempt_id: `provider_canary_${providerId}_node_attempt_001`,
      execution_mode: 'provider_llm',
      executor_kind: 'single_agent',
      run_mode: 'acceptance',
      profile_id: TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
      model_option_id: this.modelOptionId(providerId),
      output_contract: 'RankedCandidateDraftBatch@v1',
      prompt: {
        promptTemplateId: 'topic-selection-provider-canary-live-required',
        version: 'v1',
      },
      schema_name: 'topic_selection_provider_canary_ranked_candidate_draft_batch',
      schema: this.canarySchema(),
      messages: [
        {
          role: 'system',
          content:
            'Return only JSON matching the requested schema for a provider live invocation canary.',
        },
        {
          role: 'user',
          content:
            'Return one synthetic canary draft with draft_id "draft_canary_001" and candidate_need "provider live invocation canary".',
        },
      ],
      context_packet_refs: [
        {
          ref_type: 'artifact_ref',
          ref_id: `provider_canary_${providerId}_context_packet_001`,
          title_card_id: 'title_card_provider_canary',
        },
      ],
      runtime_token_budget: {
        context_policy_profile: resolvedContextProfile.profile,
        context_policy_profile_hash: resolvedContextProfile.profile_hash,
        estimated_input_tokens_override: runtimeOptions.estimated_input_tokens_override,
        compression_already_applied: runtimeOptions.compression_already_applied ?? false,
      },
      created_by: 'system',
    };
  }

  private v1bN6ProviderInvocation(
    providerId: TopicSelectionProviderCanaryProviderId,
    runtimeOptions: {
      estimated_input_tokens_override: number;
      compression_already_applied?: boolean;
    },
  ): TopicSelectionAgentInvocationRequest<TopicSelectionProviderCanaryCandidateDraftBatch> {
    const resolvedContextProfile = this.contextProfileRegistry.resolveProfile({
      context_policy_profile_id:
        TOPIC_SELECTION_V1B_N6_CONTEXT_RUNTIME_PROFILE_IDS.question_candidate_draft,
      invocation_slot_id:
        TOPIC_SELECTION_V1B_N6_INVOCATION_SLOT_IDS.question_candidate_draft,
    });
    this.assertProviderRequiredLiveProfile(
      resolvedContextProfile.profile.execution_modifiers,
    );

    return {
      workspace_id: 'workspace_provider_canary',
      title_card_id: 'title_card_provider_canary',
      node_id: 'topic-selection.v1b.generate-topic-question-candidates.v1',
      workflow_run_id: `provider_canary_v1b_n6_${providerId}_workflow_run_001`,
      node_attempt_id: `provider_canary_v1b_n6_${providerId}_node_attempt_001`,
      invocation_attempt_id: `provider_canary_v1b_n6_${providerId}_initial_from_n5`,
      execution_mode: 'provider_llm',
      executor_kind: 'single_agent',
      run_mode: 'acceptance',
      profile_id: TOPIC_SELECTION_V1B_TOPIC_QUESTION_CANDIDATES_SINGLE_AGENT_PROFILE_ID,
      model_option_id: this.v1bN6ModelOptionId(providerId),
      output_contract: 'TopicQuestionCandidateSetDraft@v1',
      prompt: {
        promptTemplateId: 'topic-selection-v1b-n6-provider-canary-live-required',
        version: 'v1',
      },
      prompt_variant_key: 'n6_question_candidate_draft.initial_from_n5',
      schema_name: 'topic_selection_v1b_n6_provider_canary_draft',
      schema: this.canarySchema(),
      messages: [
        {
          role: 'system',
          content:
            'Return only JSON matching the requested schema for a v1b N6 provider live invocation canary.',
        },
        {
          role: 'user',
          content:
            'Return one synthetic canary draft with draft_id "draft_canary_001" and candidate_need "v1b N6 provider live invocation canary".',
        },
      ],
      context_packet_refs: [
        {
          ref_type: 'artifact_ref',
          ref_id: `provider_canary_v1b_n6_${providerId}_context_packet_001`,
          title_card_id: 'title_card_provider_canary',
        },
      ],
      runtime_token_budget: {
        context_policy_profile: resolvedContextProfile.profile,
        context_policy_profile_hash: resolvedContextProfile.profile_hash,
        runtime_invocation_context_hash: this.hash({
          scenario_id: 'v1b_n6_topic_question_generation',
          scenario_case_id: 'provider_canary_initial_from_n5',
          provider_id: providerId,
        }),
        estimated_input_tokens_override: runtimeOptions.estimated_input_tokens_override,
        compression_already_applied: runtimeOptions.compression_already_applied ?? false,
      },
      created_by: 'system',
    };
  }

  private liveRequiredEvidence(input: {
    providerId: TopicSelectionProviderCanaryProviderId;
    modelOptionId: string;
    first: TopicSelectionAgentInvocationResult<TopicSelectionProviderCanaryCandidateDraftBatch>;
    second: TopicSelectionAgentInvocationResult<TopicSelectionProviderCanaryCandidateDraftBatch>;
    countingGateway: CountingGateway;
  }): TopicSelectionProviderCanaryLiveRequiredEvidence {
    return {
      provider_id: input.providerId,
      model_option_id: input.modelOptionId,
      provider_required_live: true,
      provider_call_count: input.countingGateway.callCount,
      first_status: input.first.status,
      second_status: input.second.status,
      first_prompt_packet_hash: input.first.provenance.prompt_packet_hash ?? null,
      second_prompt_packet_hash: input.second.provenance.prompt_packet_hash ?? null,
      prompt_artifact_ref_reused:
        input.first.provenance.redacted_prompt_artifact_ref?.ref_id ===
        input.second.provenance.redacted_prompt_artifact_ref?.ref_id,
      prompt_quality_report_ref_reused:
        input.first.provenance.prompt_quality_report_ref?.ref_id ===
        input.second.provenance.prompt_quality_report_ref?.ref_id,
      provider_response_cache_statuses: [
        input.first.provenance.cache_status ?? null,
        input.second.provenance.cache_status ?? null,
      ],
      response_reuse_refs: [
        input.first.provenance.response_reuse_ref ?? null,
        input.second.provenance.response_reuse_ref ?? null,
      ],
      telemetry: input.countingGateway.telemetry,
    };
  }

  private modelOptionId(providerId: TopicSelectionProviderCanaryProviderId): string {
    const suffix = providerId === 'openai'
      ? 'openai-balanced'
      : 'dashscope-thinking-budget';
    return `${TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID}.${suffix}`;
  }

  private v1bN6ModelOptionId(providerId: TopicSelectionProviderCanaryProviderId): string {
    const suffix = providerId === 'openai'
      ? 'openai-balanced'
      : 'dashscope-thinking-budget';
    return `${TOPIC_SELECTION_V1B_TOPIC_QUESTION_CANDIDATES_SINGLE_AGENT_PROFILE_ID}.${suffix}`;
  }

  private assertProviderRequiredLiveProfile(executionModifiers: string[]): void {
    if (!executionModifiers.includes('provider_required_live')) {
      throw new Error('Provider canary requires a context profile with provider_required_live.');
    }
  }

  private canarySchema(): Record<string, unknown> {
    return {
      type: 'object',
      additionalProperties: false,
      required: ['batch_id', 'drafts'],
      properties: {
        batch_id: { type: 'string', minLength: 1 },
        drafts: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['draft_id', 'candidate_need'],
            properties: {
              draft_id: { type: 'string', minLength: 1 },
              candidate_need: { type: 'string', minLength: 1 },
            },
          },
        },
      },
    };
  }

  private hash(value: unknown): string {
    return sha256Text(stableStringify(value));
  }
}
