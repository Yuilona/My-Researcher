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
  type TopicSelectionV1bResearchSliceOptionSetDraftPayload,
  type TopicSelectionV1bTopicQuestionCandidateSetDraftPayload,
  type TopicSelectionV1bTopicValueAssessmentDraftPayload,
  topicSelectionV1bResearchSliceOptionSetDraftPayloadSchema,
  topicSelectionV1bTopicQuestionCandidateSetDraftPayloadSchema,
  topicSelectionV1bTopicValueAssessmentDraftPayloadSchema,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-workflow-harness-contracts';
import {
  TOPIC_SELECTION_VALUE_DIMENSIONS,
  TOPIC_SELECTION_VALUE_GATE_KEYS,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-value-assessment-contracts';
import {
  TopicSelectionAgentOrchestratorService,
  type TopicSelectionAgentInvocationRequest,
  type TopicSelectionAgentInvocationResult,
  type TopicSelectionAgentOrchestratorLlmGateway,
} from './topic-selection-agent-orchestrator-service.js';
import {
  TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS,
  TOPIC_SELECTION_V1B_N4_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1B_N4_INVOCATION_SLOT_IDS,
  TOPIC_SELECTION_V1B_N6_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1B_N6_INVOCATION_SLOT_IDS,
  TOPIC_SELECTION_V1B_N8_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1B_N8_INVOCATION_SLOT_IDS,
  TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_INVOCATION_SLOT_IDS,
  TopicSelectionContextPolicyProfileRegistryService,
} from './topic-selection-context-policy-profile-registry-service.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import {
  TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
  TOPIC_SELECTION_V1C_BOUNDED_MICRO_DEBATE_PROFILE_ID,
  TOPIC_SELECTION_V1B_RESEARCH_SLICE_OPTIONS_SINGLE_AGENT_PROFILE_ID,
  TOPIC_SELECTION_V1B_TOPIC_QUESTION_CANDIDATES_SINGLE_AGENT_PROFILE_ID,
  TOPIC_SELECTION_V1B_TOPIC_VALUE_ASSESSMENT_SINGLE_AGENT_PROFILE_ID,
  TopicSelectionModelProfileRegistryService,
} from './topic-selection-model-profile-registry-service.js';
import type {
  TopicSelectionV1cN2BoundedDebateRoleOutput,
  TopicSelectionV1cN2BoundedDebateRoleSlotId,
} from './topic-selection-v1c-n2-bounded-debate-admission-service.js';

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
  first_status: TopicSelectionAgentInvocationResult<unknown>['status'];
  second_status: TopicSelectionAgentInvocationResult<unknown>['status'];
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
  status: TopicSelectionAgentInvocationResult<unknown>['status'];
  error_code: string | null | undefined;
  token_budget_gate_decision: string | null;
  blocker_codes: string[];
}

export interface TopicSelectionProviderCanarySlotLiveRequiredEvidence
  extends TopicSelectionProviderCanaryLiveRequiredEvidence {
  invocation_slot_id: string;
  context_policy_profile_id: string;
  model_profile_id: string;
  canary_surface: 'production_runtime_slot';
}

export interface TopicSelectionProviderCanarySlotOverBudgetEvidence
  extends TopicSelectionProviderCanaryOverBudgetEvidence {
  invocation_slot_id: string;
  context_policy_profile_id: string;
  model_profile_id: string;
  canary_surface: 'production_runtime_slot';
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

  async runV1bN4PromptCacheLiveRequiredCanary(
    input: { provider_id: TopicSelectionProviderCanaryProviderId },
  ): Promise<TopicSelectionProviderCanaryLiveRequiredEvidence> {
    const modelOptionId = this.v1bN4ModelOptionId(input.provider_id);
    const countingGateway = new CountingTopicSelectionProviderCanaryGateway(this.llmGateway);
    const orchestrator = this.makeOrchestrator(countingGateway);
    const invocation = this.v1bN4ProviderInvocation(input.provider_id, {
      estimated_input_tokens_override: 1000,
    });
    const first = await orchestrator.invokeStructuredOutput<TopicSelectionV1bResearchSliceOptionSetDraftPayload>(
      invocation,
    );
    const second = await orchestrator.invokeStructuredOutput<TopicSelectionV1bResearchSliceOptionSetDraftPayload>(
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

  async runV1bN4OverBudgetZeroCallCanary(
    input: { provider_id: TopicSelectionProviderCanaryProviderId },
  ): Promise<TopicSelectionProviderCanaryOverBudgetEvidence> {
    const modelOptionId = this.v1bN4ModelOptionId(input.provider_id);
    const countingGateway = new CountingTopicSelectionProviderCanaryGateway(this.llmGateway);
    const orchestrator = this.makeOrchestrator(countingGateway);
    const result = await orchestrator.invokeStructuredOutput<TopicSelectionV1bResearchSliceOptionSetDraftPayload>(
      this.v1bN4ProviderInvocation(input.provider_id, {
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
    const first = await orchestrator.invokeStructuredOutput<TopicSelectionV1bTopicQuestionCandidateSetDraftPayload>(
      invocation,
    );
    const second = await orchestrator.invokeStructuredOutput<TopicSelectionV1bTopicQuestionCandidateSetDraftPayload>(
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
    const result = await orchestrator.invokeStructuredOutput<TopicSelectionV1bTopicQuestionCandidateSetDraftPayload>(
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

  async runV1bN8PromptCacheLiveRequiredCanary(
    input: { provider_id: TopicSelectionProviderCanaryProviderId },
  ): Promise<TopicSelectionProviderCanaryLiveRequiredEvidence> {
    const modelOptionId = this.v1bN8ModelOptionId(input.provider_id);
    const countingGateway = new CountingTopicSelectionProviderCanaryGateway(this.llmGateway);
    const orchestrator = this.makeOrchestrator(countingGateway);
    const invocation = this.v1bN8ProviderInvocation(input.provider_id, {
      estimated_input_tokens_override: 1000,
    });
    const first = await orchestrator.invokeStructuredOutput<TopicSelectionV1bTopicValueAssessmentDraftPayload>(
      invocation,
    );
    const second = await orchestrator.invokeStructuredOutput<TopicSelectionV1bTopicValueAssessmentDraftPayload>(
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

  async runV1bN8OverBudgetZeroCallCanary(
    input: { provider_id: TopicSelectionProviderCanaryProviderId },
  ): Promise<TopicSelectionProviderCanaryOverBudgetEvidence> {
    const modelOptionId = this.v1bN8ModelOptionId(input.provider_id);
    const countingGateway = new CountingTopicSelectionProviderCanaryGateway(this.llmGateway);
    const orchestrator = this.makeOrchestrator(countingGateway);
    const result = await orchestrator.invokeStructuredOutput<TopicSelectionV1bTopicValueAssessmentDraftPayload>(
      this.v1bN8ProviderInvocation(input.provider_id, {
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

  async runV1cN2PromptCacheLiveRequiredCanary(input: {
    provider_id: TopicSelectionProviderCanaryProviderId;
    slot_id: TopicSelectionV1cN2BoundedDebateRoleSlotId;
  }): Promise<TopicSelectionProviderCanarySlotLiveRequiredEvidence> {
    const modelOptionId = this.v1cN2ModelOptionId(input.provider_id);
    const contextPolicyProfileId = this.v1cN2ContextPolicyProfileId(input.slot_id);
    const countingGateway = new CountingTopicSelectionProviderCanaryGateway(this.llmGateway);
    const orchestrator = this.makeOrchestrator(countingGateway);
    const invocation = this.v1cN2ProviderInvocation(input.provider_id, input.slot_id, {
      estimated_input_tokens_override: 1000,
    });
    const first = await orchestrator.invokeStructuredOutput<TopicSelectionV1cN2BoundedDebateRoleOutput>(
      invocation,
    );
    const second = await orchestrator.invokeStructuredOutput<TopicSelectionV1cN2BoundedDebateRoleOutput>(
      invocation,
    );

    return {
      ...this.liveRequiredEvidence({
        providerId: input.provider_id,
        modelOptionId,
        first,
        second,
        countingGateway,
      }),
      invocation_slot_id: input.slot_id,
      context_policy_profile_id: contextPolicyProfileId,
      model_profile_id: TOPIC_SELECTION_V1C_BOUNDED_MICRO_DEBATE_PROFILE_ID,
      canary_surface: 'production_runtime_slot',
    };
  }

  async runV1cN2OverBudgetZeroCallCanary(input: {
    provider_id: TopicSelectionProviderCanaryProviderId;
    slot_id: TopicSelectionV1cN2BoundedDebateRoleSlotId;
  }): Promise<TopicSelectionProviderCanarySlotOverBudgetEvidence> {
    const modelOptionId = this.v1cN2ModelOptionId(input.provider_id);
    const contextPolicyProfileId = this.v1cN2ContextPolicyProfileId(input.slot_id);
    const countingGateway = new CountingTopicSelectionProviderCanaryGateway(this.llmGateway);
    const orchestrator = this.makeOrchestrator(countingGateway);
    const result = await orchestrator.invokeStructuredOutput<TopicSelectionV1cN2BoundedDebateRoleOutput>(
      this.v1cN2ProviderInvocation(input.provider_id, input.slot_id, {
        estimated_input_tokens_override: 200_000,
        compression_already_applied: true,
      }),
    );

    return {
      provider_id: input.provider_id,
      model_option_id: modelOptionId,
      invocation_slot_id: input.slot_id,
      context_policy_profile_id: contextPolicyProfileId,
      model_profile_id: TOPIC_SELECTION_V1C_BOUNDED_MICRO_DEBATE_PROFILE_ID,
      canary_surface: 'production_runtime_slot',
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

  private v1cN2ProviderInvocation(
    providerId: TopicSelectionProviderCanaryProviderId,
    slotId: TopicSelectionV1cN2BoundedDebateRoleSlotId,
    runtimeOptions: {
      estimated_input_tokens_override: number;
      compression_already_applied?: boolean;
    },
  ): TopicSelectionAgentInvocationRequest<TopicSelectionV1cN2BoundedDebateRoleOutput> {
    const contextPolicyProfileId = this.v1cN2ContextPolicyProfileId(slotId);
    const resolvedContextProfile = this.contextProfileRegistry.resolveProfile({
      context_policy_profile_id: contextPolicyProfileId,
      invocation_slot_id: slotId,
    });
    this.assertProviderRequiredLiveProfile(
      resolvedContextProfile.profile.execution_modifiers,
    );
    const slotKey = this.slotKey(slotId);

    return {
      workspace_id: 'workspace_provider_canary',
      title_card_id: 'title_card_provider_canary',
      node_id: 'topic-selection.v1c.generate-promotion-support.v1',
      workflow_run_id: `provider_canary_v1c_n2_${slotKey}_${providerId}_workflow_run_001`,
      node_attempt_id: `provider_canary_v1c_n2_${slotKey}_${providerId}_node_attempt_001`,
      invocation_attempt_id: `provider_canary_v1c_n2_${slotKey}_${providerId}_runtime_role`,
      execution_mode: 'provider_llm',
      executor_kind: 'single_agent',
      run_mode: 'acceptance',
      profile_id: TOPIC_SELECTION_V1C_BOUNDED_MICRO_DEBATE_PROFILE_ID,
      model_option_id: this.v1cN2ModelOptionId(providerId),
      output_contract: 'TopicSelectionV1cBoundedMicroDebateRoleOrFinal@v1',
      prompt: {
        promptTemplateId: 'topic-selection-v1c-promotion-support-bounded-micro-debate',
        version: '1',
      },
      prompt_variant_key: slotId,
      schema_name: 'topic_selection_v1c_n2_provider_canary_role',
      schema: this.v1cN2CanarySchema(slotId),
      messages: [
        {
          role: 'system',
          content:
            'Return only JSON matching TopicSelectionV1cBoundedMicroDebateRoleOrFinal@v1 for a v1c N2 provider live invocation canary.',
        },
        {
          role: 'user',
          content: [
            'Return one synthetic bounded micro-debate role output.',
            'Use the supplied reference draft values exactly unless JSON Schema validation requires a small correction.',
            stableStringify(this.v1cN2CanaryReferenceDraft(slotId)),
          ].join(' '),
        },
      ],
      context_packet_refs: [
        {
          ref_type: 'artifact_ref',
          ref_id: `provider_canary_v1c_n2_${slotKey}_${providerId}_context_packet_001`,
          title_card_id: 'title_card_provider_canary',
        },
      ],
      runtime_token_budget: {
        context_policy_profile: resolvedContextProfile.profile,
        context_policy_profile_hash: resolvedContextProfile.profile_hash,
        runtime_invocation_context_hash: this.hash({
          scenario_id: 'v1c_n2_bounded_promotion_support',
          scenario_case_id: slotId,
          provider_id: providerId,
        }),
        estimated_input_tokens_override: runtimeOptions.estimated_input_tokens_override,
        compression_already_applied: runtimeOptions.compression_already_applied ?? false,
      },
      created_by: 'system',
    };
  }

  private v1bN4ProviderInvocation(
    providerId: TopicSelectionProviderCanaryProviderId,
    runtimeOptions: {
      estimated_input_tokens_override: number;
      compression_already_applied?: boolean;
    },
  ): TopicSelectionAgentInvocationRequest<TopicSelectionV1bResearchSliceOptionSetDraftPayload> {
    const resolvedContextProfile = this.contextProfileRegistry.resolveProfile({
      context_policy_profile_id:
        TOPIC_SELECTION_V1B_N4_CONTEXT_RUNTIME_PROFILE_IDS.research_slice_option_draft,
      invocation_slot_id:
        TOPIC_SELECTION_V1B_N4_INVOCATION_SLOT_IDS.research_slice_option_draft,
    });
    this.assertProviderRequiredLiveProfile(
      resolvedContextProfile.profile.execution_modifiers,
    );

    return {
      workspace_id: 'workspace_provider_canary',
      title_card_id: 'title_card_provider_canary',
      node_id: 'topic-selection.v1b.generate-research-slice-options.v1',
      workflow_run_id: `provider_canary_v1b_n4_${providerId}_workflow_run_001`,
      node_attempt_id: `provider_canary_v1b_n4_${providerId}_node_attempt_001`,
      invocation_attempt_id: `provider_canary_v1b_n4_${providerId}_initial_from_n3`,
      execution_mode: 'provider_llm',
      executor_kind: 'single_agent',
      run_mode: 'acceptance',
      profile_id: TOPIC_SELECTION_V1B_RESEARCH_SLICE_OPTIONS_SINGLE_AGENT_PROFILE_ID,
      model_option_id: this.v1bN4ModelOptionId(providerId),
      output_contract: 'ResearchSliceOptionSetDraft@v1',
      prompt: {
        promptTemplateId: 'topic-selection-v1b-n4-provider-canary-live-required',
        version: 'v1',
      },
      prompt_variant_key: 'n4_research_slice_option_draft.initial_from_n3',
      schema_name: 'topic_selection_v1b_n4_provider_canary_draft',
      schema: topicSelectionV1bResearchSliceOptionSetDraftPayloadSchema as unknown as Record<string, unknown>,
      messages: [
        {
          role: 'system',
          content:
            'Return only JSON matching ResearchSliceOptionSetDraft@v1 for a v1b N4 provider live invocation canary.',
        },
        {
          role: 'user',
          content: [
            'Return one synthetic research-slice option set draft.',
            'Use the supplied reference draft values exactly unless JSON Schema validation requires a small correction.',
            stableStringify(this.v1bN4CanaryReferenceDraft()),
          ].join(' '),
        },
      ],
      context_packet_refs: [
        {
          ref_type: 'artifact_ref',
          ref_id: `provider_canary_v1b_n4_${providerId}_context_packet_001`,
          title_card_id: 'title_card_provider_canary',
        },
      ],
      runtime_token_budget: {
        context_policy_profile: resolvedContextProfile.profile,
        context_policy_profile_hash: resolvedContextProfile.profile_hash,
        runtime_invocation_context_hash: this.hash({
          scenario_id: 'v1b_n4_research_slice_option_generation',
          scenario_case_id: 'provider_canary_initial_from_n3',
          provider_id: providerId,
        }),
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
  ): TopicSelectionAgentInvocationRequest<TopicSelectionV1bTopicQuestionCandidateSetDraftPayload> {
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
      schema: topicSelectionV1bTopicQuestionCandidateSetDraftPayloadSchema as unknown as Record<string, unknown>,
      messages: [
        {
          role: 'system',
          content:
            'Return only JSON matching TopicQuestionCandidateSetDraft@v1 for a v1b N6 provider live invocation canary.',
        },
        {
          role: 'user',
          content: [
            'Return one synthetic topic-question candidate set draft.',
            'Use the supplied reference draft values exactly unless JSON Schema validation requires a small correction.',
            stableStringify(this.v1bN6CanaryReferenceDraft()),
          ].join(' '),
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

  private v1bN8ProviderInvocation(
    providerId: TopicSelectionProviderCanaryProviderId,
    runtimeOptions: {
      estimated_input_tokens_override: number;
      compression_already_applied?: boolean;
    },
  ): TopicSelectionAgentInvocationRequest<TopicSelectionV1bTopicValueAssessmentDraftPayload> {
    const resolvedContextProfile = this.contextProfileRegistry.resolveProfile({
      context_policy_profile_id:
        TOPIC_SELECTION_V1B_N8_CONTEXT_RUNTIME_PROFILE_IDS.value_assessment_draft,
      invocation_slot_id:
        TOPIC_SELECTION_V1B_N8_INVOCATION_SLOT_IDS.value_assessment_draft,
    });
    this.assertProviderRequiredLiveProfile(
      resolvedContextProfile.profile.execution_modifiers,
    );

    return {
      workspace_id: 'workspace_provider_canary',
      title_card_id: 'title_card_provider_canary',
      node_id: 'topic-selection.v1b.assess-topic-value.v1',
      workflow_run_id: `provider_canary_v1b_n8_${providerId}_workflow_run_001`,
      node_attempt_id: `provider_canary_v1b_n8_${providerId}_node_attempt_001`,
      invocation_attempt_id: `provider_canary_v1b_n8_${providerId}_initial_from_n7`,
      execution_mode: 'provider_llm',
      executor_kind: 'single_agent',
      run_mode: 'acceptance',
      profile_id: TOPIC_SELECTION_V1B_TOPIC_VALUE_ASSESSMENT_SINGLE_AGENT_PROFILE_ID,
      model_option_id: this.v1bN8ModelOptionId(providerId),
      output_contract: 'TopicValueAssessmentDraft@v1',
      prompt: {
        promptTemplateId: 'topic-selection-v1b-n8-provider-canary-live-required',
        version: 'v1',
      },
      prompt_variant_key: 'n8_value_assessment_draft.initial_from_n7',
      schema_name: 'topic_selection_v1b_n8_provider_canary_draft',
      schema: topicSelectionV1bTopicValueAssessmentDraftPayloadSchema as unknown as Record<string, unknown>,
      messages: [
        {
          role: 'system',
          content:
            'Return only JSON matching TopicValueAssessmentDraft@v1 for a v1b N8 provider live invocation canary.',
        },
        {
          role: 'user',
          content: [
            'Return one synthetic topic-value assessment draft.',
            'Use the supplied reference draft values exactly unless JSON Schema validation requires a small correction.',
            stableStringify(this.v1bN8CanaryReferenceDraft()),
          ].join(' '),
        },
      ],
      context_packet_refs: [
        {
          ref_type: 'artifact_ref',
          ref_id: `provider_canary_v1b_n8_${providerId}_context_packet_001`,
          title_card_id: 'title_card_provider_canary',
        },
      ],
      runtime_token_budget: {
        context_policy_profile: resolvedContextProfile.profile,
        context_policy_profile_hash: resolvedContextProfile.profile_hash,
        runtime_invocation_context_hash: this.hash({
          scenario_id: 'v1b_n8_topic_value_assessment',
          scenario_case_id: 'provider_canary_initial_from_n7',
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
    first: TopicSelectionAgentInvocationResult<unknown>;
    second: TopicSelectionAgentInvocationResult<unknown>;
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

  private v1bN4ModelOptionId(providerId: TopicSelectionProviderCanaryProviderId): string {
    const suffix = providerId === 'openai'
      ? 'openai-balanced'
      : 'dashscope-thinking-budget';
    return `${TOPIC_SELECTION_V1B_RESEARCH_SLICE_OPTIONS_SINGLE_AGENT_PROFILE_ID}.${suffix}`;
  }

  private v1bN6ModelOptionId(providerId: TopicSelectionProviderCanaryProviderId): string {
    const suffix = providerId === 'openai'
      ? 'openai-balanced'
      : 'dashscope-thinking-budget';
    return `${TOPIC_SELECTION_V1B_TOPIC_QUESTION_CANDIDATES_SINGLE_AGENT_PROFILE_ID}.${suffix}`;
  }

  private v1bN8ModelOptionId(providerId: TopicSelectionProviderCanaryProviderId): string {
    const suffix = providerId === 'openai'
      ? 'openai-balanced'
      : 'dashscope-thinking-budget';
    return `${TOPIC_SELECTION_V1B_TOPIC_VALUE_ASSESSMENT_SINGLE_AGENT_PROFILE_ID}.${suffix}`;
  }

  private v1cN2ModelOptionId(providerId: TopicSelectionProviderCanaryProviderId): string {
    const suffix = providerId === 'openai'
      ? 'openai-balanced'
      : 'dashscope-thinking-budget';
    return `${TOPIC_SELECTION_V1C_BOUNDED_MICRO_DEBATE_PROFILE_ID}.${suffix}`;
  }

  private v1cN2ContextPolicyProfileId(slotId: TopicSelectionV1cN2BoundedDebateRoleSlotId): string {
    if (slotId === TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_INVOCATION_SLOT_IDS.promotion_supporter_draft) {
      return TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_CONTEXT_RUNTIME_PROFILE_IDS.promotion_supporter_draft;
    }
    if (slotId === TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_INVOCATION_SLOT_IDS.reviewer_critic_review) {
      return TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_CONTEXT_RUNTIME_PROFILE_IDS.reviewer_critic_review;
    }
    if (slotId === TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_INVOCATION_SLOT_IDS.promotion_supporter_repair) {
      return TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_CONTEXT_RUNTIME_PROFILE_IDS.promotion_supporter_repair;
    }
    return TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_CONTEXT_RUNTIME_PROFILE_IDS.synthesizer_final;
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

  private v1bN4CanaryReferenceDraft(): TopicSelectionV1bResearchSliceOptionSetDraftPayload {
    const evidenceRef = this.ref('evidence_unit', 'provider_canary_evidence_001');
    const needRef = this.ref('validated_need', 'provider_canary_need_001');
    return {
      recommended_option_key: 'provider_canary_slice',
      comparison_axes: ['runtime provenance', 'evidence traceability'],
      comparison_summary:
        'The synthetic slice is suitable only for validating N4 provider-live prompt-cache semantics.',
      missing_option_types: [],
      unresolved_disagreements: [],
      human_review_triggers: [],
      options: [
        {
          option_key: 'provider_canary_slice',
          source_validated_need_refs: [needRef],
          slice_statement:
            'Validate provider-live runtime semantics for v1b N4 research-slice option drafting.',
          problem_space: 'Runtime provenance and prompt-cache behavior in topic selection.',
          target_setting: 'Local-first CS paper engineering assistant workflows.',
          target_community: 'LLM systems researchers',
          included_boundaries: ['N4 provider canary prompt-cache and token-budget semantics'],
          excluded_boundaries: ['business authority creation', 'topic promotion decision', 'full paper implementation'],
          contribution_type_candidate: 'workflow_system',
          support_evidence_refs: [evidenceRef],
          challenge_evidence_refs: [evidenceRef],
          baseline_evidence_refs: [evidenceRef],
          context_evidence_refs: [evidenceRef],
          resource_assumptions: ['The canary uses synthetic ref-backed runtime evidence only.'],
          data_assumptions: ['No business corpus data is used as authority in this canary.'],
          evaluation_path:
            'Run the provider canary twice and verify prompt packet reuse does not become provider response reuse.',
          baseline_assumptions: ['A transport-only provider check is insufficient for N4 runtime semantics.'],
          hard_blockers: [],
          dependency_risks: ['Provider structured output behavior may drift.'],
          slice_budget: { max_nodes: 1 },
          expected_claim:
            'The shared runtime can keep v1b N4 provider-required calls live while reusing prompt packet metadata.',
          fallback_claim: 'The canary validates N4 provider transport and runtime provenance only.',
          observable_success_criteria: ['two provider calls occur', 'response reuse refs remain null'],
          main_risks: ['Synthetic provider canary output is non-authority.'],
          baseline_risk: 'medium',
          execution_risk: 'medium',
          scope_risk: 'low',
          claim_ceiling_alignment: {
            status: 'aligned',
            rationale: 'The claim is bounded to runtime semantics and auditability.',
            confidence: 0.78,
          },
          confidence: 0.8,
          requires_human_review: false,
          human_review_triggers: [],
          details_payload: {
            canary: true,
            non_authority: true,
          },
        },
      ],
    };
  }

  private v1bN6CanaryReferenceDraft(): TopicSelectionV1bTopicQuestionCandidateSetDraftPayload {
    const evidenceRef = this.ref('evidence_unit', 'provider_canary_evidence_001');
    const boundaryRef = this.ref('research_slice_boundary', 'provider_canary_boundary_001');
    const needRef = this.ref('validated_need', 'provider_canary_need_001');
    return {
      question_frame: {
        target_setting: 'Local-first CS paper engineering assistant workflows.',
        target_community: 'LLM systems researchers',
        object_scope: 'v1b N6 provider live invocation canary',
        task_scope: 'topic-question candidate generation and runtime provenance checks',
        intervention_or_approach: 'Shared runtime provider canary over AgentOrchestrator and BackendLlmGateway',
        comparison_baseline: 'transport-only provider canary without the N6 output contract',
        observable_outcome: 'valid structured TopicQuestionCandidateSetDraft output and live provider telemetry',
        assumption_refs: [],
        evidence_refs: [evidenceRef],
        frame_payload: {
          canary: true,
          non_authority: true,
        },
      },
      recommended_candidate_keys: ['provider_canary_candidate'],
      generation_notes: ['Synthetic canary draft for provider/runtime validation only.'],
      human_review_triggers: [],
      candidates: [
        {
          candidate_key: 'provider_canary_candidate',
          main_question:
            'How can a shared LLM runtime preserve provider-live semantics for v1b N6 topic-question generation?',
          sub_questions: [
            'Which prompt-cache and token-budget signals must remain auditable before deterministic N6 gates run?',
          ],
          question_type: 'system',
          contribution_hypothesis: 'system',
          source_validated_need_refs: [needRef],
          answerability_plan: {
            datasets_or_resources: ['provider canary trace fixtures'],
            metrics: ['provider call count', 'prompt packet hash equality', 'response reuse absence'],
            baselines: ['transport-only canary'],
            ablations_or_comparisons: ['prompt cache hit without response reuse'],
            evaluation_setting: 'local/dev provider canary execution',
            dependency_risks: ['provider structured output behavior may drift'],
            open_dependencies: [],
            known_gaps: [],
            required_evidence_refs: [evidenceRef],
          },
          answerability_verdict: 'answerable',
          expected_claim:
            'The shared runtime can keep provider-required calls live while reusing prompt packet metadata.',
          fallback_claim: 'The canary validates provider transport and runtime provenance for N6.',
          max_claim_strength: 'Bounded workflow-runtime claim only.',
          observable_success_criteria: ['two provider calls occur', 'response reuse refs remain null'],
          boundary_check: {
            preserved_boundary_refs: [boundaryRef],
            excluded_boundary_refs: [],
            boundary_violations: [],
            prohibited_claims: ['business authority creation', 'topic promotion decision'],
            allowed_refinements: ['tighten canary wording'],
          },
          traceability_check: {
            support_evidence_refs: [evidenceRef],
            challenge_evidence_refs: [evidenceRef],
            baseline_evidence_refs: [evidenceRef],
            context_evidence_refs: [evidenceRef],
            mapped_evidence_refs: [evidenceRef],
            unmapped_assumptions: [],
          },
          falsification_conditions: [
            {
              condition_type: 'claim_overstrong',
              severity: 'hard',
              statement: 'If response reuse is non-null, the provider-live runtime claim is false.',
              trigger_evidence_refs: [evidenceRef],
              trigger_source_refs: [needRef],
              related_contract_fields: ['response_reuse_refs'],
              expected_action: 'lower_claim_strength',
              check_timing: 'before_value_assessment',
              confidence: 'high',
            },
          ],
          risk_notes: ['Synthetic provider canary output is non-authority.'],
          blockers: [],
          objections: [],
          human_review_triggers: [],
          confidence: 0.8,
        },
      ],
    };
  }

  private v1bN8CanaryReferenceDraft(): TopicSelectionV1bTopicValueAssessmentDraftPayload {
    const contractRef = this.ref('topic_question_contract', 'provider_canary_contract_001');
    const evidenceRef = this.ref('evidence_unit', 'provider_canary_evidence_001');
    return {
      readiness_status: 'ready_with_accepted_risk',
      strongest_claim_if_success:
        'The shared runtime can keep N8 provider-required calls live while preserving prompt-cache provenance.',
      fallback_claim_if_success: 'The canary validates N8 provider transport and runtime provenance only.',
      hard_gates: TOPIC_SELECTION_VALUE_GATE_KEYS.map((gateKey) => ({
        gate_key: gateKey,
        verdict: gateKey === 'answerability_sanity' ? 'pass_with_risk' : 'pass',
        severity: gateKey === 'answerability_sanity' ? 'warning' : 'info',
        overridable_with_risk: gateKey === 'answerability_sanity',
        rationale: `${gateKey} is satisfied for the synthetic non-authority N8 provider canary.`,
        refs: [contractRef],
      })),
      dimension_scores: TOPIC_SELECTION_VALUE_DIMENSIONS.map((dimensionKey) => ({
        dimension_key: dimensionKey,
        score: dimensionKey === 'reviewer_risk' ? 72 : 80,
        rationale: `${dimensionKey} is adequate for a synthetic provider/runtime canary.`,
        evidence_refs: [evidenceRef],
        uncertainty: 'medium',
      })),
      risk_penalty: {
        residual_risk: 'provider output quality may drift and remains non-authority',
      },
      reviewer_objections: ['Synthetic provider canary output is not business authority.'],
      ceiling_case: 'The canary can show provider-live runtime semantics, not topic value.',
      base_case: 'The canary validates prompt cache and provider telemetry separation for N8.',
      floor_case: 'The canary still blocks unsafe over-budget provider execution.',
      recommended_disposition: 'advance_to_package',
      total_score: 76,
      value_summary:
        'The synthetic N8 canary is value-positive only as runtime evidence for prompt-cache/provider semantics.',
      confidence: 0.78,
      accepted_risk_refs: [],
      blocker_refs: [],
      risk_notes: ['Provider response reuse must remain null for this canary.'],
      reasoning_memo: {
        recommendation: 'advance_to_package',
        value_thesis: 'The N8 provider canary is useful because it verifies provider-live behavior at the value-draft slot.',
        significance: 'It gives workflow agents evidence that prompt packet reuse does not become response reuse.',
        originality: 'The canary targets N8 value-draft runtime provenance rather than generic provider transport.',
        claim_leverage: 'The claim is bounded to runtime semantics and auditability.',
        reviewer_risks: ['Synthetic output does not prove topic quality.'],
        effort_to_value: 'The canary has high diagnostic value for low implementation effort.',
        strategic_fit: 'It supports reviewer-aligned workflow robustness checks.',
        negative_memory_check: 'No negative memory is allowed to become standalone evidence.',
        evidence_backed_rationale: 'Prompt hashes, cache metadata, and provider telemetry are ref-backed runtime evidence.',
        top_objections: ['Provider output may require normalization in full workflow runs.'],
        uncertainty: 'Medium uncertainty remains for live provider schema drift.',
        disposition_bridge: 'Use this only as non-authority provider/runtime evidence.',
        requires_critic_review: false,
        critic_triggers: [],
        cited_refs: [contractRef, evidenceRef],
      },
    };
  }

  private v1cN2CanaryReferenceDraft(
    slotId: TopicSelectionV1cN2BoundedDebateRoleSlotId,
  ): TopicSelectionV1cN2BoundedDebateRoleOutput {
    const evidenceRef = this.ref('evidence_unit', 'provider_canary_evidence_001');
    const riskRef = this.ref('accepted_risk', 'provider_canary_accepted_risk_001');
    const recheckRef = this.ref('recheck_request', 'provider_canary_recheck_001');
    if (slotId === TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_INVOCATION_SLOT_IDS.promotion_supporter_draft) {
      return {
        schema_version: 'topic-selection-v1c-n2-bounded-micro-debate-role.v1',
        role_slot: slotId,
        support_summary: 'Synthetic provider canary support draft for N2 runtime semantics.',
        support_points: [{
          point_id: 'provider_canary_support_point_001',
          point: 'The provider call is live while the prompt packet may be reused.',
          source_refs: [evidenceRef],
        }],
        risk_acknowledgements: [{ risk_ref: riskRef, handling: 'Carry forward as non-authority canary evidence.' }],
        recheck_obligations: [{ recheck_ref: recheckRef, handling: 'Carry forward without creating recheck authority.' }],
      };
    }
    if (slotId === TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_INVOCATION_SLOT_IDS.reviewer_critic_review) {
      return {
        schema_version: 'topic-selection-v1c-n2-bounded-micro-debate-role.v1',
        role_slot: slotId,
        critic_findings: [{
          finding_id: 'provider_canary_finding_001',
          severity: 'warning',
          issue: 'Provider output remains non-authority and must preserve response non-reuse semantics.',
          required_resolution: 'The synthesizer final must retain the provider-live runtime boundary.',
          source_refs: [evidenceRef],
        }],
        required_repairs: ['Preserve provider-live response non-reuse and ref-backed context boundaries.'],
      };
    }
    if (slotId === TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_INVOCATION_SLOT_IDS.promotion_supporter_repair) {
      return {
        schema_version: 'topic-selection-v1c-n2-bounded-micro-debate-role.v1',
        role_slot: slotId,
        repaired_summary: 'Synthetic repair preserves the provider-live runtime boundary.',
        accepted_findings: ['provider_canary_finding_001'],
        rebutted_findings: [],
        repair_actions: [{
          finding_id: 'provider_canary_finding_001',
          resolution_status: 'accepted_and_repaired',
          repair_note: 'Explicitly retained null response reuse and prompt-cache-only reuse semantics.',
          source_refs: [evidenceRef],
        }],
      };
    }
    return {
      schema_version: 'topic-selection-v1c-n2-bounded-micro-debate-final.v1',
      role_slot: slotId,
      final_support_summary: 'Synthetic final support validates N2 provider-live runtime semantics.',
      dossier_markdown: 'Prompt packet reuse is allowed, provider response reuse remains blocked, and output is non-authority.',
      reviewer_questions: ['Does deterministic admission still own promotion support authority?'],
      risk_notes: [{ risk_ref: riskRef, note: 'Synthetic provider canary output is non-authority.' }],
      recheck_notes: [{ recheck_ref: recheckRef, note: 'No recheck authority is created by the provider output.' }],
      n3_semantic_layer: {
        claim_ceiling_alignment: {
          status: 'addressed',
          summary: 'Runtime-only claim; no topic quality authority.',
          source_refs: [evidenceRef],
        },
        contribution_summary: {
          status: 'addressed',
          summary: 'Provider canary validates runtime provenance only.',
          source_refs: [evidenceRef],
        },
        evaluation_plan_summary: {
          status: 'addressed',
          summary: 'Evaluate prompt-cache telemetry and null response reuse refs.',
          source_refs: [evidenceRef],
        },
        evidence_support_map: {
          status: 'addressed',
          evidence_refs: [evidenceRef],
        },
        accepted_risk_acknowledgements: {
          status: 'addressed',
          risk_refs: [riskRef],
        },
        recheck_obligation_summary: {
          status: 'addressed',
          recheck_refs: [recheckRef],
        },
        critic_finding_resolution_map: [{
          finding_id: 'provider_canary_finding_001',
          resolution_status: 'accepted_and_repaired',
          resolution_note: 'Provider output remains non-authority and response reuse remains null.',
          source_refs: [evidenceRef],
        }],
        readiness_coverage_items: [
          { slot: 'provider_live_non_reuse', status: 'addressed', source_refs: [evidenceRef] },
        ],
      },
    };
  }

  private v1cN2CanarySchema(slotId: TopicSelectionV1cN2BoundedDebateRoleSlotId): Record<string, unknown> {
    return this.schemaFromTemplate(this.v1cN2CanaryReferenceDraft(slotId), { slotId });
  }

  private schemaFromTemplate(
    value: unknown,
    options: { slotId?: TopicSelectionV1cN2BoundedDebateRoleSlotId } = {},
    path: string[] = [],
  ): Record<string, unknown> {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return {
          type: 'array',
          maxItems: 0,
          items: {},
        };
      }
      if (value.every((item) => this.isFunctionalRef(item))) {
        return {
          type: 'array',
          minItems: value.length,
          items: value.length === 1
            ? this.exactFunctionalRefSchema(value[0] as ReturnType<typeof this.ref>)
            : {
                anyOf: value.map((item) => this.exactFunctionalRefSchema(item as ReturnType<typeof this.ref>)),
              },
        };
      }
      return {
        type: 'array',
        minItems: value.length,
        items: this.schemaFromTemplate(value[0], options, [...path, '0']),
      };
    }
    if (value === null) {
      return { type: 'null' };
    }
    if (typeof value === 'boolean') {
      return { type: 'boolean' };
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
    }
    if (typeof value === 'string') {
      const fieldName = path.at(-1);
      if (fieldName === 'role_slot' && options.slotId) {
        return { type: 'string', enum: [options.slotId] };
      }
      if (fieldName === 'schema_version') {
        return { type: 'string', enum: [value] };
      }
      return { type: 'string', minLength: 1 };
    }
    if (value && typeof value === 'object') {
      if (this.isFunctionalRef(value)) {
        return this.exactFunctionalRefSchema(value as ReturnType<typeof this.ref>);
      }
      const properties = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, child]) => [
          key,
          this.schemaFromTemplate(child, options, [...path, key]),
        ]),
      );
      return {
        type: 'object',
        additionalProperties: false,
        required: Object.keys(properties),
        properties,
      };
    }
    return {};
  }

  private isFunctionalRef(value: unknown): boolean {
    return Boolean(
      value
      && typeof value === 'object'
      && !Array.isArray(value)
      && typeof (value as Record<string, unknown>).ref_type === 'string'
      && typeof (value as Record<string, unknown>).ref_id === 'string'
      && typeof (value as Record<string, unknown>).title_card_id === 'string'
      && Object.prototype.hasOwnProperty.call(value, 'version_id'),
    );
  }

  private exactFunctionalRefSchema(ref: ReturnType<typeof this.ref>): Record<string, unknown> {
    return {
      type: 'object',
      additionalProperties: false,
      required: ['ref_type', 'ref_id', 'title_card_id', 'version_id'],
      properties: {
        ref_type: { type: 'string', enum: [ref.ref_type] },
        ref_id: { type: 'string', enum: [ref.ref_id] },
        title_card_id: { type: 'string', enum: [ref.title_card_id] },
        version_id: ref.version_id === null
          ? { type: 'null' }
          : { type: 'string', enum: [ref.version_id] },
      },
    };
  }

  private ref(refType: string, refId: string) {
    return {
      ref_type: refType,
      ref_id: refId,
      title_card_id: 'title_card_provider_canary',
      version_id: null,
    };
  }

  private hash(value: unknown): string {
    return sha256Text(stableStringify(value));
  }

  private slotKey(slotId: string): string {
    return slotId.replace(/[^a-zA-Z0-9]+/gu, '_').replace(/^_+|_+$/gu, '');
  }
}
