import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionAgentExecutionMode,
  TopicSelectionNeedDiscoveryArbiterContextPayload,
  TopicSelectionNeedDiscoveryExplorationContextPayload,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import type {
  TopicSelectionExecutorKind,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-agent-invocation-contracts';
import type {
  TopicSelectionAgentRunMode,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-agent-profile-contracts';
import {
  TOPIC_SELECTION_RUNTIME_INVOCATION_CONTEXT_SCHEMA_VERSION,
  type TopicSelectionRuntimeLoopKind,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';
import { AppError } from '../errors/app-error.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';
import type {
  NeedDiscoveryRuntimeContextCacheInput,
} from './topic-selection-need-discovery-context-compiler-service.js';
import { TopicSelectionContextPacketCacheService } from './topic-selection-context-packet-cache-service.js';
import {
  TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS,
  TopicSelectionContextPolicyProfileRegistryService,
} from './topic-selection-context-policy-profile-registry-service.js';
import {
  TopicSelectionModelProfileRegistryService,
} from './topic-selection-model-profile-registry-service.js';

const GENERATE_NEED_CANDIDATE_NODE_ID = 'topic-selection.v1a.generate-need-candidate.v1' as const;
const N6_PROMPT_TEMPLATE_ID = 'topic-selection-generate-need-candidate' as const;
const N6_PROMPT_TEMPLATE_VERSION = 'v1' as const;
const N6_OUTPUT_CONTRACT = 'RankedCandidateDraftBatch@v1' as const;

export interface BuildTopicSelectionV1aN6RuntimeContextCacheInput {
  cache_service?: TopicSelectionContextPacketCacheService | null;
  title_card_id?: string | null;
  node_attempt_id: string;
  input_refs: TopicSelectionFunctionalRef[];
  policy_version: string;
  output_schema_version: string;
  profile_id: string;
  execution_mode: TopicSelectionAgentExecutionMode;
  run_mode: TopicSelectionAgentRunMode;
  executor_kind?: TopicSelectionExecutorKind | null;
  model_option_id?: string | null;
  scenario_id?: string | null;
  scenario_case_id?: string | null;
  current_round_index?: number | null;
  remaining_round_budget?: number | null;
  exploration_payload: TopicSelectionNeedDiscoveryExplorationContextPayload;
  arbiter_payload: TopicSelectionNeedDiscoveryArbiterContextPayload;
}

export class TopicSelectionV1aN6RuntimeContextCacheBindingService {
  private readonly contextPolicyProfileRegistry: TopicSelectionContextPolicyProfileRegistryService;
  private readonly modelProfileRegistry: TopicSelectionModelProfileRegistryService;

  constructor(options: {
    contextPolicyProfileRegistry?: TopicSelectionContextPolicyProfileRegistryService;
    modelProfileRegistry?: TopicSelectionModelProfileRegistryService;
  } = {}) {
    this.contextPolicyProfileRegistry = options.contextPolicyProfileRegistry
      ?? new TopicSelectionContextPolicyProfileRegistryService();
    this.modelProfileRegistry = options.modelProfileRegistry
      ?? new TopicSelectionModelProfileRegistryService();
  }

  build(
    input: BuildTopicSelectionV1aN6RuntimeContextCacheInput,
  ): NeedDiscoveryRuntimeContextCacheInput | null {
    const cacheService = input.cache_service ?? null;
    if (!cacheService) {
      return null;
    }
    this.assertInput(input);

    const executorKind = input.executor_kind ?? 'single_agent';
    const modelProfile = this.modelProfileRegistry.resolveProfile({
      profile_id: input.profile_id,
      execution_mode: input.execution_mode,
      run_mode: input.run_mode,
      model_option_id: input.model_option_id ?? null,
    });
    const modelOptionId = modelProfile.selected_model_option?.option_id ?? null;
    const explorationProfile = this.contextPolicyProfileRegistry.resolveProfile({
      context_policy_profile_id:
        TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.need_candidate_generation,
      invocation_slot_id:
        TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
    });
    const arbiterProfile = this.contextPolicyProfileRegistry.resolveProfile({
      context_policy_profile_id:
        TOPIC_SELECTION_V1A_N6_CONTEXT_RUNTIME_PROFILE_IDS.arbiter_final_synthesis,
      invocation_slot_id:
        TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.arbiter_final_synthesis,
    });
    const explorationPayloadHash = this.hash(input.exploration_payload);
    const arbiterPayloadHash = this.hash(input.arbiter_payload);
    const explorationRuntimeInvocationContextHash = this.runtimeInvocationContextHash({
      invocationSlotId:
        TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
      scenarioId: input.scenario_id,
      scenarioCaseId: input.scenario_case_id ?? null,
      loopKind: this.n6RuntimeLoopKind(input),
      loopStage: 'need_candidate_generation',
      currentRoundIndex: input.current_round_index ?? 1,
      remainingRoundBudget: input.remaining_round_budget ?? null,
    });
    const arbiterRuntimeInvocationContextHash = this.runtimeInvocationContextHash({
      invocationSlotId:
        TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.arbiter_final_synthesis,
      scenarioId: input.scenario_id,
      scenarioCaseId: input.scenario_case_id ?? null,
      loopKind: this.n6RuntimeLoopKind(input),
      loopStage: 'arbiter_final_synthesis',
      currentRoundIndex: input.current_round_index ?? 1,
      remainingRoundBudget: input.remaining_round_budget ?? null,
    });

    return {
      cache_service: cacheService,
      exploration_context: {
        context_policy_profile: explorationProfile.profile,
        context_policy_profile_hash: explorationProfile.profile_hash,
        executor_kind: executorKind,
        runtime_invocation_context_hash: explorationRuntimeInvocationContextHash,
        prompt_packet_hash: this.contextCachePromptSeedHash({
          input,
          invocationSlotId:
            TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
          runtimeInvocationContextHash: explorationRuntimeInvocationContextHash,
          contextPacketHashes: [explorationPayloadHash, arbiterPayloadHash],
        }),
        prompt_template_id: N6_PROMPT_TEMPLATE_ID,
        prompt_template_version: N6_PROMPT_TEMPLATE_VERSION,
        model_option_id: modelOptionId,
        normalized_params_hash: modelProfile.normalized_params_hash,
        output_contract: N6_OUTPUT_CONTRACT,
        context_packet_hashes: [explorationPayloadHash],
        provenance_ref: this.ref(
          'runtime_context_cache_binding',
          `${input.node_attempt_id}_n6_exploration_context_cache`,
          input.title_card_id ?? null,
        ),
      },
      arbiter_context: {
        context_policy_profile: arbiterProfile.profile,
        context_policy_profile_hash: arbiterProfile.profile_hash,
        executor_kind: executorKind,
        runtime_invocation_context_hash: arbiterRuntimeInvocationContextHash,
        prompt_packet_hash: this.contextCachePromptSeedHash({
          input,
          invocationSlotId:
            TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.arbiter_final_synthesis,
          runtimeInvocationContextHash: arbiterRuntimeInvocationContextHash,
          contextPacketHashes: [arbiterPayloadHash],
        }),
        prompt_template_id: N6_PROMPT_TEMPLATE_ID,
        prompt_template_version: N6_PROMPT_TEMPLATE_VERSION,
        model_option_id: modelOptionId,
        normalized_params_hash: modelProfile.normalized_params_hash,
        output_contract: N6_OUTPUT_CONTRACT,
        context_packet_hashes: [arbiterPayloadHash],
        provenance_ref: this.ref(
          'runtime_context_cache_binding',
          `${input.node_attempt_id}_n6_arbiter_context_cache`,
          input.title_card_id ?? null,
        ),
      },
    };
  }

  private contextCachePromptSeedHash(input: {
    input: BuildTopicSelectionV1aN6RuntimeContextCacheInput;
    invocationSlotId: string;
    runtimeInvocationContextHash: string;
    contextPacketHashes: string[];
  }): string {
    return this.hash({
      node_id: GENERATE_NEED_CANDIDATE_NODE_ID,
      invocation_slot_id: input.invocationSlotId,
      runtime_invocation_context_hash: input.runtimeInvocationContextHash,
      prompt_template_id: N6_PROMPT_TEMPLATE_ID,
      prompt_template_version: N6_PROMPT_TEMPLATE_VERSION,
      output_contract: N6_OUTPUT_CONTRACT,
      input_refs_hash: this.hash(input.input.input_refs),
      context_packet_hashes: input.contextPacketHashes,
      policy_version: input.input.policy_version,
      output_schema_version: input.input.output_schema_version,
      profile_id: input.input.profile_id,
      execution_mode: input.input.execution_mode,
      executor_kind: input.input.executor_kind ?? 'single_agent',
      model_option_id: input.input.model_option_id ?? null,
      run_mode: input.input.run_mode,
    });
  }

  private runtimeInvocationContextHash(input: {
    invocationSlotId: string;
    scenarioId?: string | null;
    scenarioCaseId?: string | null;
    loopKind?: TopicSelectionRuntimeLoopKind;
    loopStage?: string | null;
    currentRoundIndex?: number | null;
    remainingRoundBudget?: number | null;
  }): string {
    const semanticScenarioKey = this.semanticScenarioKey(input.scenarioId ?? null, input.scenarioCaseId ?? null);
    return this.hash({
      schema_version: TOPIC_SELECTION_RUNTIME_INVOCATION_CONTEXT_SCHEMA_VERSION,
      invocation_slot_id: input.invocationSlotId,
      scenario_context: semanticScenarioKey
        ? {
          identity_policy: 'semantic_identity',
          scenario_id: input.scenarioId ?? null,
          scenario_case_id: input.scenarioCaseId ?? null,
          semantic_scenario_key: semanticScenarioKey,
        }
        : {
          identity_policy: 'not_semantic',
          scenario_id: null,
          scenario_case_id: null,
          semantic_scenario_key: null,
        },
      loop_context: {
        loop_kind: input.loopKind ?? 'not_applicable',
        loop_stage: input.loopStage ?? null,
        current_round_index: input.currentRoundIndex ?? null,
        remaining_round_budget: input.remainingRoundBudget ?? null,
        loopback_source_node_id: null,
        repair_origin_ref: null,
        repair_origin_hash: null,
      },
      debate_context: {
        debate_loop_id: null,
        debate_policy_id: null,
        round_index: null,
        role: null,
        stage: null,
        agent_instance_id: null,
        parent_invocation_attempt_ids_hash: null,
        dynamic_material_refs_hash: null,
      },
    });
  }

  private n6RuntimeLoopKind(
    input: Pick<BuildTopicSelectionV1aN6RuntimeContextCacheInput, 'current_round_index'>,
  ): TopicSelectionRuntimeLoopKind {
    return (input.current_round_index ?? 1) > 1
      ? 'supplemental_round'
      : 'initial';
  }

  private semanticScenarioKey(
    scenarioId: string | null,
    scenarioCaseId: string | null,
  ): string | null {
    const normalizedScenarioId = scenarioId?.trim() || null;
    const normalizedScenarioCaseId = scenarioCaseId?.trim() || null;
    const semanticMarker = [normalizedScenarioId, normalizedScenarioCaseId]
      .some((value) => value?.includes('semantic-runtime-identity') || value?.startsWith('semantic:'));
    if (!semanticMarker) {
      return null;
    }
    return this.hash({
      scenario_id: normalizedScenarioId,
      scenario_case_id: normalizedScenarioCaseId,
    });
  }

  private ref(
    refType: string,
    refId: string,
    titleCardId: string | null,
  ): TopicSelectionFunctionalRef {
    return {
      ref_type: refType,
      ref_id: refId,
      title_card_id: titleCardId,
    };
  }

  private assertInput(input: BuildTopicSelectionV1aN6RuntimeContextCacheInput): void {
    this.assertNonEmpty(input.node_attempt_id, 'node_attempt_id');
    this.assertNonEmpty(input.policy_version, 'policy_version');
    this.assertNonEmpty(input.output_schema_version, 'output_schema_version');
    this.assertNonEmpty(input.profile_id, 'profile_id');
    if (!Array.isArray(input.input_refs) || input.input_refs.length === 0) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'input_refs must contain at least one functional ref.');
    }
  }

  private assertNonEmpty(value: string | null | undefined, field: string): void {
    if (!value?.trim()) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${field} is required.`);
    }
  }

  private hash(value: unknown): string {
    return sha256Text(stableStringify(value));
  }
}
