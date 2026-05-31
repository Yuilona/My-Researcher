import type {
  TopicSelectionArtifactRefRecord,
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionAgentExecutionMode,
  TopicSelectionArtifactFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import type {
  TopicSelectionAgentRunMode,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-agent-profile-contracts';
import {
  TOPIC_SELECTION_RUNTIME_INVOCATION_CONTEXT_SCHEMA_VERSION,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';
import {
  type TopicSelectionExecutorKind,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-agent-invocation-contracts';
import {
  TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_NODE_POLICIES,
  type TopicSelectionV1bN6HarnessFrozenInputPayload,
  type TopicSelectionV1bTopicQuestionCandidateSetDraftPayload,
  type TopicSelectionV1bWorkflowHarnessRunRequest,
  type TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef,
  topicSelectionV1bTopicQuestionCandidateSetDraftPayloadSchema,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-workflow-harness-contracts';
import { AppError } from '../errors/app-error.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import {
  TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY,
  TOPIC_SELECTION_V1B_N6_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1B_N6_INVOCATION_SLOT_IDS,
  TopicSelectionContextPolicyProfileRegistryService,
  type TopicSelectionResolvedContextPolicyProfile,
} from './topic-selection-context-policy-profile-registry-service.js';
import {
  TopicSelectionModelProfileRegistryService,
  type TopicSelectionResolvedModelProfile,
} from './topic-selection-model-profile-registry-service.js';
import {
  TopicSelectionAgentOrchestratorService,
  type TopicSelectionAgentInvocationResult,
  type TopicSelectionCodexAssistedAgentOutput,
  type TopicSelectionMockedAgentOutput,
} from './topic-selection-agent-orchestrator-service.js';
import {
  TopicSelectionPromptPacketRuntimeService,
} from './topic-selection-prompt-packet-runtime-service.js';
import type {
  TopicSelectionV1bN6DraftAdmissionExpectedIdentity,
  TopicSelectionV1bN6DraftSlotId,
} from './topic-selection-v1b-n6-draft-admission-service.js';

export type TopicSelectionV1bN6DraftGenerationMode = 'initial_from_n5';

export type TopicSelectionV1bN6DraftRuntimeContextPacket = {
  schema_version: 'TopicSelectionV1bN6DraftRuntimeContextPacket@v1';
  node_id: 'topic-selection.v1b.generate-topic-question-candidates.v1';
  workflow_run_id: string;
  node_attempt_id: string;
  slot_id: TopicSelectionV1bN6DraftSlotId;
  invocation_slot_id: string;
  generation_mode: TopicSelectionV1bN6DraftGenerationMode;
  context_family: 'v1b_n6_topic_question_generation';
  policy_version: string;
  context_policy_profile_id: string;
  context_policy_profile_version: string;
  context_policy_profile_hash: string;
  redaction_policy: typeof TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY;
  non_authority: true;
  source_refs: TopicSelectionFunctionalRef[];
  source_hashes: Record<string, string>;
  frozen_input_payload: TopicSelectionV1bN6HarnessFrozenInputPayload;
};

export type GenerateTopicSelectionV1bN6RuntimeDraftInput = {
  request: TopicSelectionV1bWorkflowHarnessRunRequest;
  generation_mode: TopicSelectionV1bN6DraftGenerationMode;
  execution_mode: Extract<TopicSelectionAgentExecutionMode, 'codex_assisted' | 'mocked_llm'>;
  run_mode?: TopicSelectionAgentRunMode | null;
  codex_response?: TopicSelectionCodexAssistedAgentOutput<TopicSelectionV1bTopicQuestionCandidateSetDraftPayload> | null;
  mocked_output?: TopicSelectionMockedAgentOutput<TopicSelectionV1bTopicQuestionCandidateSetDraftPayload> | null;
  created_by?: TopicSelectionV1bWorkflowHarnessRunRequest['created_by'];
};

export type TopicSelectionV1bN6RuntimeDraftGenerationResult =
  | {
    status: 'succeeded';
    semantic_artifact: TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef;
    structured_output: TopicSelectionV1bTopicQuestionCandidateSetDraftPayload;
    invocation_result: TopicSelectionAgentInvocationResult<TopicSelectionV1bTopicQuestionCandidateSetDraftPayload>;
    context_packet_ref: TopicSelectionArtifactFunctionalRef;
    context_packet_hash: string;
  }
  | {
    status: 'blocked';
    invocation_result: TopicSelectionAgentInvocationResult<TopicSelectionV1bTopicQuestionCandidateSetDraftPayload>;
    context_packet_ref: TopicSelectionArtifactFunctionalRef;
    context_packet_hash: string;
  };

type N6RuntimeSlotBinding = {
  slot_id: TopicSelectionV1bN6DraftSlotId;
  invocation_slot_id: string;
  generation_mode: TopicSelectionV1bN6DraftGenerationMode;
  context_policy_profile_id: string;
  output_contract: string;
  model_profile_id: string;
  prompt_template_id: string;
  prompt_template_version: string;
  prompt_variant_key: string;
  schema: Record<string, unknown>;
};

const NODE_ID = 'topic-selection.v1b.generate-topic-question-candidates.v1' as const;
const PROMPT_TEMPLATE_VERSION = 'v1' as const;

export class TopicSelectionV1bN6DraftRuntimeService {
  private readonly contextPolicyProfileRegistry: TopicSelectionContextPolicyProfileRegistryService;
  private readonly modelProfileRegistry: TopicSelectionModelProfileRegistryService;
  private readonly promptPacketRuntime: TopicSelectionPromptPacketRuntimeService;
  private readonly agentOrchestrator: TopicSelectionAgentOrchestratorService;

  constructor(
    private readonly controlPlane: TopicSelectionControlPlaneService,
    options: {
      agentOrchestrator?: TopicSelectionAgentOrchestratorService;
      contextPolicyProfileRegistry?: TopicSelectionContextPolicyProfileRegistryService;
      modelProfileRegistry?: TopicSelectionModelProfileRegistryService;
      promptPacketRuntime?: TopicSelectionPromptPacketRuntimeService;
    } = {},
  ) {
    this.contextPolicyProfileRegistry = options.contextPolicyProfileRegistry
      ?? new TopicSelectionContextPolicyProfileRegistryService();
    this.modelProfileRegistry = options.modelProfileRegistry ?? new TopicSelectionModelProfileRegistryService();
    this.promptPacketRuntime = options.promptPacketRuntime ?? new TopicSelectionPromptPacketRuntimeService();
    this.agentOrchestrator = options.agentOrchestrator ?? new TopicSelectionAgentOrchestratorService({
      controlPlane,
      modelProfileRegistry: this.modelProfileRegistry,
    });
  }

  async generateDraftArtifact(
    input: GenerateTopicSelectionV1bN6RuntimeDraftInput,
  ): Promise<TopicSelectionV1bN6RuntimeDraftGenerationResult> {
    const frozenPayload = this.assertN6FrozenPayload(input.request);
    const binding = this.slotBinding(input.generation_mode);
    const runMode = input.run_mode ?? input.request.run_mode ?? this.defaultRunMode(input.execution_mode);
    const sourceHashes = this.sourceHashes(input.request, frozenPayload);
    const runtimeProfile = this.resolveRuntimeProfile(binding);
    const runtimeInvocationContextHash = this.runtimeInvocationContextHash(binding, sourceHashes);
    const contextPacket = this.buildContextPacket({
      request: input.request,
      frozenPayload,
      binding,
      runtimeProfile,
      runtimeInvocationContextHash,
      sourceHashes,
    });
    const contextPacketHash = this.hash(contextPacket);
    const contextArtifact = await this.controlPlane.recordArtifactRef({
      workspace_id: input.request.workspace_id ?? null,
      title_card_id: input.request.title_card_id ?? null,
      artifact_kind: 'diagnostic',
      storage_kind: 'inline',
      workflow_run_id: input.request.workflow_run_id,
      payload: contextPacket as unknown as Record<string, unknown>,
      checksum: contextPacketHash,
      created_by: input.created_by ?? input.request.created_by ?? 'system',
    });
    const contextPacketRef = this.toArtifactFunctionalRef(contextArtifact);
    const invocation = await this.agentOrchestrator.invokeStructuredOutput<TopicSelectionV1bTopicQuestionCandidateSetDraftPayload>({
      workspace_id: input.request.workspace_id ?? null,
      title_card_id: input.request.title_card_id ?? null,
      node_id: input.request.node_id,
      workflow_run_id: input.request.workflow_run_id,
      node_attempt_id: input.request.node_attempt_id,
      invocation_attempt_id: `${input.request.node_attempt_id}.${binding.prompt_variant_key}.runtime_draft`,
      execution_mode: input.execution_mode,
      executor_kind: this.executorKind(input.execution_mode),
      run_mode: runMode,
      profile_id: binding.model_profile_id,
      output_contract: binding.output_contract,
      model_option_id: null,
      prompt: {
        promptTemplateId: binding.prompt_template_id,
        version: binding.prompt_template_version,
      },
      prompt_variant_key: binding.prompt_variant_key,
      schema_name: binding.output_contract,
      schema: binding.schema,
      messages: this.messages(binding, contextPacket),
      input_refs: contextPacket.source_refs,
      context_packet_refs: [contextPacketRef],
      context_packet_hashes: [contextPacketHash],
      runtime_token_budget: {
        context_policy_profile: runtimeProfile.profile,
        context_policy_profile_hash: runtimeProfile.profile_hash,
        runtime_invocation_context_hash: runtimeInvocationContextHash,
        context_payloads: [contextPacket],
      },
      codex_response: input.codex_response ?? null,
      mocked_output: input.mocked_output ?? null,
      created_by: input.created_by ?? input.request.created_by ?? 'system',
    });

    if (invocation.status !== 'succeeded' || !invocation.structured_output) {
      return {
        status: 'blocked',
        invocation_result: invocation,
        context_packet_ref: contextPacketRef,
        context_packet_hash: contextPacketHash,
      };
    }

    const semanticArtifact = await this.recordSemanticDraftArtifact({
      request: input.request,
      binding,
      runMode,
      executionMode: input.execution_mode,
      structuredOutput: invocation.structured_output,
      invocation,
      runtimeProfile,
      runtimeInvocationContextHash,
      sourceHashes,
      createdBy: input.created_by ?? input.request.created_by ?? 'system',
    });
    return {
      status: 'succeeded',
      semantic_artifact: semanticArtifact,
      structured_output: invocation.structured_output,
      invocation_result: invocation,
      context_packet_ref: contextPacketRef,
      context_packet_hash: contextPacketHash,
    };
  }

  buildAdmissionExpectedIdentity(input: {
    request: TopicSelectionV1bWorkflowHarnessRunRequest;
    frozenPayload: TopicSelectionV1bN6HarnessFrozenInputPayload;
    generationMode: TopicSelectionV1bN6DraftGenerationMode;
    normalizedPayloadHash: string;
    executionMode: Extract<TopicSelectionAgentExecutionMode, 'codex_assisted' | 'mocked_llm'>;
    runMode: TopicSelectionAgentRunMode;
    profileId: string;
    modelOptionId: string | null;
  }): TopicSelectionV1bN6DraftAdmissionExpectedIdentity {
    const binding = this.slotBinding(input.generationMode);
    if (input.profileId !== binding.model_profile_id) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'v1b N6 draft profile does not match runtime slot binding.');
    }
    if (input.modelOptionId) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'v1b N6 draft first slice does not allow provider model options.');
    }
    const sourceHashes = this.sourceHashes(input.request, input.frozenPayload);
    const runtimeProfile = this.resolveRuntimeProfile(binding);
    const runtimeInvocationContextHash = this.runtimeInvocationContextHash(binding, sourceHashes);
    const contextPacket = this.buildContextPacket({
      request: input.request,
      frozenPayload: input.frozenPayload,
      binding,
      runtimeProfile,
      runtimeInvocationContextHash,
      sourceHashes,
    });
    const modelProfile = this.resolveModelProfile(binding, input.executionMode, input.runMode);
    const promptPacket = this.promptPacketRuntime.buildPromptPacket({
      title_card_id: input.request.title_card_id ?? null,
      workflow_run_id: input.request.workflow_run_id,
      node_id: input.request.node_id,
      node_attempt_id: input.request.node_attempt_id,
      prompt_template_id: binding.prompt_template_id,
      prompt_template_version: binding.prompt_template_version,
      prompt_variant_key: binding.prompt_variant_key,
      invocation_slot_id: binding.invocation_slot_id,
      runtime_invocation_context_hash: runtimeInvocationContextHash,
      messages: this.messages(binding, contextPacket),
      source_refs: contextPacket.source_refs,
      context_packet_hashes: [this.hash(contextPacket)],
      output_contract: binding.output_contract,
      context_policy_profile: runtimeProfile.profile,
      context_policy_profile_hash: runtimeProfile.profile_hash,
      model_option_id: modelProfile.selected_model_option?.option_id ?? null,
      normalized_params_hash: modelProfile.normalized_params_hash,
      runtime_modifiers_hash: this.runtimeModifiersHash({
        executionMode: input.executionMode,
        executorKind: this.executorKind(input.executionMode),
        runMode: input.runMode,
        runtimeInvocationContextHash,
      }),
      redaction_policy: runtimeProfile.profile.redaction_policy,
    });
    return {
      slot_id: binding.slot_id,
      output_contract: binding.output_contract,
      context_policy_profile_id: runtimeProfile.profile.context_policy_profile_id,
      context_policy_profile_version: runtimeProfile.profile.context_policy_profile_version,
      context_policy_profile_hash: runtimeProfile.profile_hash,
      prompt_variant_key: binding.prompt_variant_key,
      prompt_packet_hash: promptPacket.identity.prompt_packet_hash,
      runtime_invocation_context_hash: runtimeInvocationContextHash,
      redaction_policy: runtimeProfile.profile.redaction_policy,
      source_hashes: sourceHashes,
      normalized_payload_hash: input.normalizedPayloadHash,
    };
  }

  private async recordSemanticDraftArtifact(input: {
    request: TopicSelectionV1bWorkflowHarnessRunRequest;
    binding: N6RuntimeSlotBinding;
    runMode: TopicSelectionAgentRunMode;
    executionMode: Extract<TopicSelectionAgentExecutionMode, 'codex_assisted' | 'mocked_llm'>;
    structuredOutput: TopicSelectionV1bTopicQuestionCandidateSetDraftPayload;
    invocation: TopicSelectionAgentInvocationResult<TopicSelectionV1bTopicQuestionCandidateSetDraftPayload>;
    runtimeProfile: TopicSelectionResolvedContextPolicyProfile;
    runtimeInvocationContextHash: string;
    sourceHashes: Record<string, string>;
    createdBy: TopicSelectionV1bWorkflowHarnessRunRequest['created_by'];
  }): Promise<TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef> {
    if (!input.invocation.audit_artifact_ref) {
      throw new AppError(500, 'INTERNAL_ERROR', 'runtime-verified N6 draft requires an audit artifact ref.');
    }
    const auditArtifact = await this.controlPlane.getArtifactRef(input.invocation.audit_artifact_ref.ref_id);
    const auditHash = this.requiredChecksum(auditArtifact, 'runtime audit artifact');
    const outputHash = this.hash(input.structuredOutput);
    if (input.invocation.provenance.structured_output_hash !== outputHash) {
      throw new AppError(500, 'INTERNAL_ERROR', 'N6 runtime draft structured output hash drift detected.');
    }
    const outputArtifact = await this.controlPlane.recordArtifactRef({
      workspace_id: input.request.workspace_id ?? null,
      title_card_id: input.request.title_card_id ?? null,
      artifact_kind: 'structured_output',
      storage_kind: 'inline',
      workflow_run_id: input.request.workflow_run_id,
      payload: input.structuredOutput as unknown as Record<string, unknown>,
      checksum: outputHash,
      created_by: input.createdBy ?? 'system',
    });
    const outputRef = this.toArtifactFunctionalRef(outputArtifact);
    return {
      slot_id: input.binding.slot_id,
      node_id: NODE_ID,
      execution_mode: input.executionMode,
      run_mode: input.runMode,
      allowed_effect: 'model_draft_for_gate',
      support_artifact_ref: outputRef,
      support_artifact_hash: outputHash,
      normalized_output_ref: outputRef,
      normalized_output_hash: outputHash,
      output_contract: input.binding.output_contract,
      profile_id: input.binding.model_profile_id as TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef['profile_id'],
      model_option_id: input.invocation.provenance.model_option_id,
      input_hash: input.request.frozen_input.frozen_input_hash ?? this.hash(input.request.frozen_input),
      prompt_packet_hash: input.invocation.provenance.prompt_packet_hash,
      structured_output_hash: outputHash,
      adapter_policy_version: input.request.policy_version,
      slot_spec_hash: this.hash(this.slotPolicy()),
      provenance_ref: input.invocation.audit_artifact_ref,
      runtime_provenance_class: 'runtime_verified',
      context_policy_profile_id: input.runtimeProfile.profile.context_policy_profile_id,
      context_policy_profile_version: input.runtimeProfile.profile.context_policy_profile_version,
      context_policy_profile_hash: input.runtimeProfile.profile_hash,
      prompt_variant_key: input.binding.prompt_variant_key,
      runtime_invocation_context_hash: input.runtimeInvocationContextHash,
      redaction_policy: input.runtimeProfile.profile.redaction_policy,
      source_hashes: input.sourceHashes,
      runtime_audit_ref: input.invocation.audit_artifact_ref,
      runtime_audit_hash: auditHash,
      compression_report_ref: input.invocation.provenance.compression_report_ref ?? null,
      compression_report_hash: input.invocation.provenance.compression_report_hash ?? null,
      compressed_context_hash: input.invocation.provenance.compressed_context_hash ?? null,
    };
  }

  private buildContextPacket(input: {
    request: TopicSelectionV1bWorkflowHarnessRunRequest;
    frozenPayload: TopicSelectionV1bN6HarnessFrozenInputPayload;
    binding: N6RuntimeSlotBinding;
    runtimeProfile: TopicSelectionResolvedContextPolicyProfile;
    runtimeInvocationContextHash: string;
    sourceHashes: Record<string, string>;
  }): TopicSelectionV1bN6DraftRuntimeContextPacket {
    return {
      schema_version: 'TopicSelectionV1bN6DraftRuntimeContextPacket@v1',
      node_id: NODE_ID,
      workflow_run_id: input.request.workflow_run_id,
      node_attempt_id: input.request.node_attempt_id,
      slot_id: input.binding.slot_id,
      invocation_slot_id: input.binding.invocation_slot_id,
      generation_mode: input.binding.generation_mode,
      context_family: 'v1b_n6_topic_question_generation',
      policy_version: input.request.policy_version,
      context_policy_profile_id: input.runtimeProfile.profile.context_policy_profile_id,
      context_policy_profile_version: input.runtimeProfile.profile.context_policy_profile_version,
      context_policy_profile_hash: input.runtimeProfile.profile_hash,
      redaction_policy: TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY,
      non_authority: true,
      source_refs: this.sourceRefs(input.request, input.frozenPayload),
      source_hashes: input.sourceHashes,
      frozen_input_payload: input.frozenPayload,
    };
  }

  private messages(
    binding: N6RuntimeSlotBinding,
    contextPacket: TopicSelectionV1bN6DraftRuntimeContextPacket,
  ): Array<{ role: 'system' | 'user'; content: string }> {
    return [
      {
        role: 'system',
        content: [
          'Generate a non-authority topic-question candidate draft for v1b N6.',
          'Use only the supplied refs, hashes, and context packet.',
          'Do not create QuestionFrame, TopicQuestionCandidate, CandidateSet, N6ToN7 handoff, package, recheck, or authority records.',
          'Do not override deterministic N6 gates, route policy, executable prompts, or ref/hash lineage.',
          'Return only JSON matching TopicQuestionCandidateSetDraft@v1.',
        ].join(' '),
      },
      {
        role: 'user',
        content: stableStringify({
          output_contract: binding.output_contract,
          slot_id: binding.slot_id,
          generation_mode: binding.generation_mode,
          context_packet: contextPacket,
          output_boundary: 'model_draft_before_deterministic_gate',
        }),
      },
    ];
  }

  private sourceHashes(
    request: TopicSelectionV1bWorkflowHarnessRunRequest,
    payload: TopicSelectionV1bN6HarnessFrozenInputPayload,
  ): Record<string, string> {
    return {
      frozen_input_hash: request.frozen_input.frozen_input_hash ?? this.hash(request.frozen_input),
      n5_handoff_hash: payload.n5_handoff_hash,
      constraint_profile_hash: payload.constraint_profile_hash,
      intake_readiness_hash: payload.intake_readiness_hash,
      research_slice_hash: payload.research_slice_hash,
      research_slice_selection_hash: payload.research_slice_selection_hash,
      research_slice_option_set_hash: payload.research_slice_option_set_hash,
      selected_slice_option_hash: payload.selected_slice_option_hash,
    };
  }

  private sourceRefs(
    request: TopicSelectionV1bWorkflowHarnessRunRequest,
    payload: TopicSelectionV1bN6HarnessFrozenInputPayload,
  ): TopicSelectionFunctionalRef[] {
    return this.uniqueRefs([
      ...request.frozen_input.source_refs,
      payload.constraint_profile_ref,
      payload.intake_readiness_ref,
      payload.research_slice_ref,
      payload.research_slice_selection_ref,
      payload.research_slice_option_set_ref,
      payload.selected_slice_option_ref,
    ]);
  }

  private runtimeInvocationContextHash(
    binding: N6RuntimeSlotBinding,
    sourceHashes: Record<string, string>,
  ): string {
    return this.hash({
      schema_version: TOPIC_SELECTION_RUNTIME_INVOCATION_CONTEXT_SCHEMA_VERSION,
      invocation_slot_id: binding.invocation_slot_id,
      scenario_context: {
        identity_policy: 'semantic_identity',
        scenario_id: 'v1b_n6_topic_question_generation',
        scenario_case_id: binding.generation_mode,
        semantic_scenario_key: this.hash(sourceHashes),
      },
      loop_context: {
        loop_kind: 'initial',
        loop_stage: 'n6_initial_from_n5',
        current_round_index: 1,
        remaining_round_budget: null,
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

  private runtimeModifiersHash(input: {
    executionMode: TopicSelectionAgentExecutionMode;
    executorKind: TopicSelectionExecutorKind;
    runMode: TopicSelectionAgentRunMode;
    runtimeInvocationContextHash: string;
  }): string {
    return this.hash({
      compression_already_applied: false,
      runtime_invocation_context_hash: input.runtimeInvocationContextHash,
      execution_mode: input.executionMode,
      executor_kind: input.executorKind,
      run_mode: input.runMode,
    });
  }

  private resolveRuntimeProfile(binding: N6RuntimeSlotBinding): TopicSelectionResolvedContextPolicyProfile {
    return this.contextPolicyProfileRegistry.resolveProfile({
      context_policy_profile_id: binding.context_policy_profile_id,
      invocation_slot_id: binding.invocation_slot_id,
    });
  }

  private resolveModelProfile(
    binding: N6RuntimeSlotBinding,
    executionMode: TopicSelectionAgentExecutionMode,
    runMode: TopicSelectionAgentRunMode,
  ): TopicSelectionResolvedModelProfile {
    return this.modelProfileRegistry.resolveProfile({
      profile_id: binding.model_profile_id,
      execution_mode: executionMode,
      run_mode: runMode,
      model_option_id: null,
    });
  }

  private slotBinding(generationMode: TopicSelectionV1bN6DraftGenerationMode): N6RuntimeSlotBinding {
    const slot = this.slotPolicy();
    return {
      slot_id: 'n6_question_candidate_draft',
      invocation_slot_id: TOPIC_SELECTION_V1B_N6_INVOCATION_SLOT_IDS.question_candidate_draft,
      generation_mode: generationMode,
      context_policy_profile_id: TOPIC_SELECTION_V1B_N6_CONTEXT_RUNTIME_PROFILE_IDS.question_candidate_draft,
      output_contract: slot.output_contract,
      model_profile_id: slot.default_profile_id,
      prompt_template_id: 'topic-selection.v1b.n6.question-candidate-draft.runtime-initial',
      prompt_template_version: PROMPT_TEMPLATE_VERSION,
      prompt_variant_key: `n6_question_candidate_draft.${generationMode}`,
      schema: topicSelectionV1bTopicQuestionCandidateSetDraftPayloadSchema as unknown as Record<string, unknown>,
    };
  }

  private slotPolicy() {
    const policy = TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_NODE_POLICIES
      .find((item) => item.node_id === NODE_ID);
    const slot = policy?.semantic_support_slots.find((item) => item.slot_id === 'n6_question_candidate_draft');
    if (!slot) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Unsupported v1b N6 draft slot.');
    }
    return slot;
  }

  private assertN6FrozenPayload(
    request: TopicSelectionV1bWorkflowHarnessRunRequest,
  ): TopicSelectionV1bN6HarnessFrozenInputPayload {
    if (request.node_id !== NODE_ID) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'N6 draft runtime requires the v1b N6 node id.');
    }
    const payload = request.frozen_input.payload as Partial<TopicSelectionV1bN6HarnessFrozenInputPayload>;
    if (
      !payload.n5_handoff_hash
      || !payload.constraint_profile_ref
      || !payload.constraint_profile_hash
      || !payload.intake_readiness_ref
      || !payload.intake_readiness_hash
      || !payload.research_slice_ref
      || !payload.research_slice_hash
      || !payload.research_slice_selection_ref
      || !payload.research_slice_selection_hash
      || !payload.research_slice_option_set_ref
      || !payload.research_slice_option_set_hash
      || !payload.selected_slice_option_ref
      || !payload.selected_slice_option_hash
    ) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'N6 draft runtime requires a complete N6 frozen payload.');
    }
    return payload as TopicSelectionV1bN6HarnessFrozenInputPayload;
  }

  private defaultRunMode(executionMode: TopicSelectionAgentExecutionMode): TopicSelectionAgentRunMode {
    return executionMode === 'mocked_llm' ? 'test' : 'acceptance';
  }

  private executorKind(executionMode: TopicSelectionAgentExecutionMode): TopicSelectionExecutorKind {
    return executionMode === 'codex_assisted' ? 'codex_assisted' : 'single_agent';
  }

  private toArtifactFunctionalRef(record: TopicSelectionArtifactRefRecord): TopicSelectionArtifactFunctionalRef {
    return {
      ref_type: 'artifact_ref',
      ref_id: record.artifact_ref_id,
      title_card_id: record.title_card_id ?? null,
    };
  }

  private requiredChecksum(record: TopicSelectionArtifactRefRecord | null, label: string): string {
    if (!record?.checksum) {
      throw new AppError(500, 'INTERNAL_ERROR', `${label} checksum is required.`);
    }
    return record.checksum;
  }

  private uniqueRefs(values: Array<TopicSelectionFunctionalRef | null | undefined>): TopicSelectionFunctionalRef[] {
    const seen = new Set<string>();
    const refs: TopicSelectionFunctionalRef[] = [];
    for (const ref of values) {
      if (!ref) {
        continue;
      }
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
      refs.push(ref);
    }
    return refs;
  }

  private hash(value: unknown): string {
    return sha256Text(stableStringify(value));
  }
}
