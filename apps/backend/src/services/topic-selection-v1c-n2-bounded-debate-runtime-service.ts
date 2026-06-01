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
  type TopicSelectionDynamicPromptMaterialRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';
import type {
  TopicSelectionExecutorKind,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-agent-invocation-contracts';
import type {
  TopicSelectionPromotionInputSnapshotHandoff,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-promotion-input-contracts';
import { AppError } from '../errors/app-error.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import {
  TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY,
  TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_CONTEXT_RUNTIME_PROFILE_IDS,
  TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_INVOCATION_SLOT_IDS,
  TopicSelectionContextPolicyProfileRegistryService,
  type TopicSelectionResolvedContextPolicyProfile,
} from './topic-selection-context-policy-profile-registry-service.js';
import {
  TOPIC_SELECTION_V1C_BOUNDED_MICRO_DEBATE_PROFILE_ID,
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
import {
  TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER,
  type TopicSelectionV1cN2BoundedDebateAdmissionExpectedIdentity,
  type TopicSelectionV1cN2BoundedDebateRoleArtifact,
  type TopicSelectionV1cN2BoundedDebateRoleOutput,
  type TopicSelectionV1cN2BoundedDebateRoleSlotId,
} from './topic-selection-v1c-n2-bounded-debate-admission-service.js';

export interface TopicSelectionV1cN2BoundedDebateContextPacket {
  schema_version: 'TopicSelectionV1cN2BoundedDebateContextPacket@v1';
  node_id: typeof NODE_ID;
  workflow_run_id: string;
  node_attempt_id: string;
  slot_id: TopicSelectionV1cN2BoundedDebateRoleSlotId;
  invocation_slot_id: TopicSelectionV1cN2BoundedDebateRoleSlotId;
  context_family: 'v1c_n2_bounded_promotion_support';
  policy_version: string;
  context_policy_profile_id: string;
  context_policy_profile_version: string;
  context_policy_profile_hash: string;
  redaction_policy: typeof TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY;
  non_authority: true;
  promotion_input_snapshot_ref: TopicSelectionFunctionalRef;
  promotion_input_snapshot_hash: string;
  topic_package_ref: TopicSelectionFunctionalRef;
  topic_question_ref: TopicSelectionFunctionalRef;
  topic_question_contract_ref: TopicSelectionFunctionalRef;
  answerability_plan_ref: TopicSelectionFunctionalRef;
  research_slice_ref: TopicSelectionFunctionalRef;
  claim_ceiling: string | null;
  contribution_summary: string | null;
  evaluation_plan: string | null;
  selected_evidence_refs: TopicSelectionFunctionalRef[];
  accepted_risk_refs: TopicSelectionFunctionalRef[];
  blocker_refs: TopicSelectionFunctionalRef[];
  recheck_request_refs: TopicSelectionFunctionalRef[];
  memory_suggestion_refs: TopicSelectionFunctionalRef[];
  readiness_check_refs: TopicSelectionFunctionalRef[];
  allowed_refs: TopicSelectionFunctionalRef[];
  source_refs: TopicSelectionFunctionalRef[];
  source_hashes: Record<string, string>;
  prior_role_artifact_hashes: Partial<Record<TopicSelectionV1cN2BoundedDebateRoleSlotId, string>>;
}

export interface GenerateTopicSelectionV1cN2BoundedDebateRoleInput {
  handoff: TopicSelectionPromotionInputSnapshotHandoff;
  slot_id: TopicSelectionV1cN2BoundedDebateRoleSlotId;
  prior_role_artifacts?: TopicSelectionV1cN2BoundedDebateRoleArtifact[];
  workflow_run_id: string;
  node_attempt_id: string;
  policy_version?: string | null;
  execution_mode: TopicSelectionAgentExecutionMode;
  run_mode?: TopicSelectionAgentRunMode | null;
  model_option_id?: string | null;
  codex_response?: TopicSelectionCodexAssistedAgentOutput<TopicSelectionV1cN2BoundedDebateRoleOutput> | null;
  mocked_output?: TopicSelectionMockedAgentOutput<TopicSelectionV1cN2BoundedDebateRoleOutput> | null;
  created_by?: 'human' | 'llm' | 'system' | 'hybrid';
}

export type TopicSelectionV1cN2BoundedDebateRoleGenerationResult =
  | {
    status: 'succeeded';
    role_artifact: TopicSelectionV1cN2BoundedDebateRoleArtifact;
    structured_output: TopicSelectionV1cN2BoundedDebateRoleOutput;
    invocation_result: TopicSelectionAgentInvocationResult<TopicSelectionV1cN2BoundedDebateRoleOutput>;
    context_packet_ref: TopicSelectionArtifactFunctionalRef;
    context_packet_hash: string;
  }
  | {
    status: 'blocked';
    invocation_result: TopicSelectionAgentInvocationResult<TopicSelectionV1cN2BoundedDebateRoleOutput>;
    context_packet_ref: TopicSelectionArtifactFunctionalRef;
    context_packet_hash: string;
  };

type N2RuntimeSlotBinding = {
  slot_id: TopicSelectionV1cN2BoundedDebateRoleSlotId;
  invocation_slot_id: TopicSelectionV1cN2BoundedDebateRoleSlotId;
  context_policy_profile_id: string;
  output_contract: 'TopicSelectionV1cBoundedMicroDebateRoleOrFinal@v1';
  model_profile_id: typeof TOPIC_SELECTION_V1C_BOUNDED_MICRO_DEBATE_PROFILE_ID;
  prompt_template_id: 'topic-selection-v1c-promotion-support-bounded-micro-debate';
  prompt_template_version: '1';
  schema: Record<string, unknown>;
};

const NODE_ID = 'topic-selection.v1c.generate-promotion-support.v1' as const;
const OUTPUT_CONTRACT = 'TopicSelectionV1cBoundedMicroDebateRoleOrFinal@v1' as const;
const PROMPT_TEMPLATE_ID = 'topic-selection-v1c-promotion-support-bounded-micro-debate' as const;
const PROMPT_TEMPLATE_VERSION = '1' as const;
const DEFAULT_POLICY_VERSION = 'topic-selection-v1c-n2-bounded-debate-runtime-v1' as const;

const ROLE_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  required: ['schema_version', 'role_slot'],
  properties: {
    schema_version: { type: 'string', minLength: 1 },
    role_slot: { enum: [...TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER] },
  },
} as const;

export class TopicSelectionV1cN2BoundedDebateRuntimeService {
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

  async generateRoleArtifact(
    input: GenerateTopicSelectionV1cN2BoundedDebateRoleInput,
  ): Promise<TopicSelectionV1cN2BoundedDebateRoleGenerationResult> {
    this.assertHandoff(input.handoff);
    const binding = this.slotBinding(input.slot_id);
    const runMode = input.run_mode ?? this.defaultRunMode(input.execution_mode);
    const priorRoleArtifactHashes = this.priorRoleArtifactHashes(input.prior_role_artifacts ?? []);
    const sourceHashes = this.sourceHashes(input.handoff, priorRoleArtifactHashes);
    const runtimeProfile = this.resolveRuntimeProfile(binding);
    const runtimeInvocationContextHash = this.runtimeInvocationContextHash(
      binding,
      sourceHashes,
      priorRoleArtifactHashes,
    );
    const contextPacket = this.buildContextPacket({
      input,
      binding,
      runtimeProfile,
      runtimeInvocationContextHash,
      sourceHashes,
      priorRoleArtifactHashes,
    });
    const contextPacketHash = this.hash(contextPacket);
    const contextArtifact = await this.controlPlane.recordArtifactRef({
      workspace_id: input.handoff.snapshot.workspace_id ?? null,
      title_card_id: input.handoff.snapshot.title_card_id,
      artifact_kind: 'diagnostic',
      storage_kind: 'inline',
      workflow_run_id: input.workflow_run_id,
      payload: contextPacket as unknown as Record<string, unknown>,
      checksum: contextPacketHash,
      created_by: input.created_by ?? 'system',
    });
    const contextPacketRef = this.toArtifactFunctionalRef(contextArtifact);
    const dynamicMaterialRefs = this.dynamicMaterialRefs(input.prior_role_artifacts ?? []);

    const invocation = await this.agentOrchestrator.invokeStructuredOutput<TopicSelectionV1cN2BoundedDebateRoleOutput>({
      workspace_id: input.handoff.snapshot.workspace_id ?? null,
      title_card_id: input.handoff.snapshot.title_card_id,
      node_id: NODE_ID,
      workflow_run_id: input.workflow_run_id,
      node_attempt_id: input.node_attempt_id,
      invocation_attempt_id: `${input.node_attempt_id}.${input.slot_id}.runtime_role`,
      execution_mode: input.execution_mode,
      executor_kind: this.executorKind(input.execution_mode),
      run_mode: runMode,
      profile_id: binding.model_profile_id,
      output_contract: binding.output_contract,
      model_option_id: input.model_option_id ?? null,
      prompt: {
        promptTemplateId: binding.prompt_template_id,
        version: binding.prompt_template_version,
      },
      prompt_variant_key: binding.invocation_slot_id,
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
        dynamic_material_refs: dynamicMaterialRefs,
        context_payloads: [contextPacket],
      },
      codex_response: input.codex_response ?? null,
      mocked_output: input.mocked_output ?? null,
      created_by: input.created_by ?? 'system',
    });

    if (invocation.status !== 'succeeded' || !invocation.structured_output) {
      return {
        status: 'blocked',
        invocation_result: invocation,
        context_packet_ref: contextPacketRef,
        context_packet_hash: contextPacketHash,
      };
    }

    const roleArtifact = await this.recordRoleArtifact({
      input,
      binding,
      runMode,
      structuredOutput: invocation.structured_output,
      invocation,
      runtimeProfile,
      runtimeInvocationContextHash,
      sourceHashes,
      priorRoleArtifactHashes,
    });
    return {
      status: 'succeeded',
      role_artifact: roleArtifact,
      structured_output: invocation.structured_output,
      invocation_result: invocation,
      context_packet_ref: contextPacketRef,
      context_packet_hash: contextPacketHash,
    };
  }

  buildAdmissionExpectedIdentity(input: {
    handoff: TopicSelectionPromotionInputSnapshotHandoff;
    slot_id: TopicSelectionV1cN2BoundedDebateRoleSlotId;
    prior_role_artifacts?: TopicSelectionV1cN2BoundedDebateRoleArtifact[];
    workflow_run_id: string;
    node_attempt_id: string;
    policy_version?: string | null;
    execution_mode: TopicSelectionAgentExecutionMode;
    run_mode: TopicSelectionAgentRunMode;
    model_option_id?: string | null;
    normalized_payload_hash: string;
  }): TopicSelectionV1cN2BoundedDebateAdmissionExpectedIdentity {
    const binding = this.slotBinding(input.slot_id);
    const priorRoleArtifactHashes = this.priorRoleArtifactHashes(input.prior_role_artifacts ?? []);
    const sourceHashes = this.sourceHashes(input.handoff, priorRoleArtifactHashes);
    const runtimeProfile = this.resolveRuntimeProfile(binding);
    const runtimeInvocationContextHash = this.runtimeInvocationContextHash(
      binding,
      sourceHashes,
      priorRoleArtifactHashes,
    );
    const contextPacket = this.buildContextPacket({
      input: {
        handoff: input.handoff,
        workflow_run_id: input.workflow_run_id,
        node_attempt_id: input.node_attempt_id,
        policy_version: input.policy_version,
      },
      binding,
      runtimeProfile,
      runtimeInvocationContextHash,
      sourceHashes,
      priorRoleArtifactHashes,
    });
    const modelProfile = this.resolveModelProfile(
      binding,
      input.execution_mode,
      input.run_mode,
      input.model_option_id ?? null,
    );
    const promptPacket = this.promptPacketRuntime.buildPromptPacket({
      title_card_id: input.handoff.snapshot.title_card_id,
      workflow_run_id: input.workflow_run_id,
      node_id: NODE_ID,
      node_attempt_id: input.node_attempt_id,
      prompt_template_id: binding.prompt_template_id,
      prompt_template_version: binding.prompt_template_version,
      prompt_variant_key: binding.invocation_slot_id,
      invocation_slot_id: binding.invocation_slot_id,
      runtime_invocation_context_hash: runtimeInvocationContextHash,
      messages: this.messages(binding, contextPacket),
      source_refs: contextPacket.source_refs,
      context_packet_hashes: [this.hash(contextPacket)],
      dynamic_material_refs: this.dynamicMaterialRefs(input.prior_role_artifacts ?? []),
      output_contract: binding.output_contract,
      context_policy_profile: runtimeProfile.profile,
      context_policy_profile_hash: runtimeProfile.profile_hash,
      model_option_id: modelProfile.selected_model_option?.option_id ?? null,
      normalized_params_hash: modelProfile.normalized_params_hash,
      runtime_modifiers_hash: this.runtimeModifiersHash({
        executionMode: input.execution_mode,
        executorKind: this.executorKind(input.execution_mode),
        runMode: input.run_mode,
        runtimeInvocationContextHash,
      }),
      redaction_policy: runtimeProfile.profile.redaction_policy,
    });
    return {
      slot_id: input.slot_id,
      output_contract: binding.output_contract,
      context_policy_profile_id: runtimeProfile.profile.context_policy_profile_id,
      context_policy_profile_version: runtimeProfile.profile.context_policy_profile_version,
      context_policy_profile_hash: runtimeProfile.profile_hash,
      prompt_variant_key: binding.invocation_slot_id,
      prompt_packet_hash: promptPacket.identity.prompt_packet_hash,
      runtime_invocation_context_hash: runtimeInvocationContextHash,
      redaction_policy: runtimeProfile.profile.redaction_policy,
      source_hashes: sourceHashes,
      prior_role_artifact_hashes: priorRoleArtifactHashes,
      normalized_payload_hash: input.normalized_payload_hash,
    };
  }

  private async recordRoleArtifact(input: {
    input: GenerateTopicSelectionV1cN2BoundedDebateRoleInput;
    binding: N2RuntimeSlotBinding;
    runMode: TopicSelectionAgentRunMode;
    structuredOutput: TopicSelectionV1cN2BoundedDebateRoleOutput;
    invocation: TopicSelectionAgentInvocationResult<TopicSelectionV1cN2BoundedDebateRoleOutput>;
    runtimeProfile: TopicSelectionResolvedContextPolicyProfile;
    runtimeInvocationContextHash: string;
    sourceHashes: Record<string, string>;
    priorRoleArtifactHashes: Partial<Record<TopicSelectionV1cN2BoundedDebateRoleSlotId, string>>;
  }): Promise<TopicSelectionV1cN2BoundedDebateRoleArtifact> {
    if (!input.invocation.audit_artifact_ref) {
      throw new AppError(500, 'INTERNAL_ERROR', 'runtime-verified N2 bounded debate role requires an audit artifact ref.');
    }
    const auditArtifact = await this.controlPlane.getArtifactRef(input.invocation.audit_artifact_ref.ref_id);
    const auditHash = this.requiredChecksum(auditArtifact, 'runtime audit artifact');
    const outputHash = this.hash(input.structuredOutput);
    if (input.invocation.provenance.structured_output_hash !== outputHash) {
      throw new AppError(500, 'INTERNAL_ERROR', 'N2 bounded debate structured output hash drift detected.');
    }
    const outputArtifact = await this.controlPlane.recordArtifactRef({
      workspace_id: input.input.handoff.snapshot.workspace_id ?? null,
      title_card_id: input.input.handoff.snapshot.title_card_id,
      artifact_kind: 'structured_output',
      storage_kind: 'inline',
      workflow_run_id: input.input.workflow_run_id,
      payload: input.structuredOutput,
      checksum: outputHash,
      created_by: input.input.created_by ?? 'system',
    });
    const outputRef = this.toArtifactFunctionalRef(outputArtifact);
    return {
      slot_id: input.binding.slot_id,
      node_id: NODE_ID,
      workflow_run_id: input.input.workflow_run_id,
      node_attempt_id: input.input.node_attempt_id,
      policy_version: input.input.policy_version ?? DEFAULT_POLICY_VERSION,
      execution_mode: input.input.execution_mode,
      run_mode: input.runMode,
      allowed_effect: 'support_only',
      role_artifact_ref: outputRef,
      role_artifact_hash: outputHash,
      normalized_output_ref: outputRef,
      normalized_output_hash: outputHash,
      output_contract: input.binding.output_contract,
      profile_id: input.binding.model_profile_id,
      model_option_id: input.invocation.provenance.model_option_id,
      prompt_packet_hash: input.invocation.provenance.prompt_packet_hash,
      structured_output_hash: outputHash,
      context_policy_profile_id: input.runtimeProfile.profile.context_policy_profile_id,
      context_policy_profile_version: input.runtimeProfile.profile.context_policy_profile_version,
      context_policy_profile_hash: input.runtimeProfile.profile_hash,
      prompt_variant_key: input.binding.invocation_slot_id,
      runtime_invocation_context_hash: input.runtimeInvocationContextHash,
      redaction_policy: input.runtimeProfile.profile.redaction_policy,
      source_hashes: input.sourceHashes,
      prior_role_artifact_hashes: input.priorRoleArtifactHashes,
      runtime_audit_ref: input.invocation.audit_artifact_ref,
      runtime_audit_hash: auditHash,
      provenance_ref: input.invocation.audit_artifact_ref,
      runtime_provenance_class: 'runtime_verified',
      compression_report_ref: input.invocation.provenance.compression_report_ref ?? null,
      compression_report_hash: input.invocation.provenance.compression_report_hash ?? null,
      compressed_context_hash: input.invocation.provenance.compressed_context_hash ?? null,
    };
  }

  private buildContextPacket(input: {
    input: Pick<GenerateTopicSelectionV1cN2BoundedDebateRoleInput, 'handoff' | 'workflow_run_id' | 'node_attempt_id' | 'policy_version'>;
    binding: N2RuntimeSlotBinding;
    runtimeProfile: TopicSelectionResolvedContextPolicyProfile;
    runtimeInvocationContextHash: string;
    sourceHashes: Record<string, string>;
    priorRoleArtifactHashes: Partial<Record<TopicSelectionV1cN2BoundedDebateRoleSlotId, string>>;
  }): TopicSelectionV1cN2BoundedDebateContextPacket {
    const handoff = input.input.handoff;
    const selectedEvidenceRefs = handoff.evidence_refs.map((item) => item.evidence_ref);
    const allowedRefs = this.allowedRefs(handoff);
    return {
      schema_version: 'TopicSelectionV1cN2BoundedDebateContextPacket@v1',
      node_id: NODE_ID,
      workflow_run_id: input.input.workflow_run_id,
      node_attempt_id: input.input.node_attempt_id,
      slot_id: input.binding.slot_id,
      invocation_slot_id: input.binding.invocation_slot_id,
      context_family: 'v1c_n2_bounded_promotion_support',
      policy_version: input.input.policy_version ?? DEFAULT_POLICY_VERSION,
      context_policy_profile_id: input.runtimeProfile.profile.context_policy_profile_id,
      context_policy_profile_version: input.runtimeProfile.profile.context_policy_profile_version,
      context_policy_profile_hash: input.runtimeProfile.profile_hash,
      redaction_policy: TOPIC_SELECTION_CONTEXT_RUNTIME_REDACTION_POLICY,
      non_authority: true,
      promotion_input_snapshot_ref: handoff.promotion_input_snapshot_ref,
      promotion_input_snapshot_hash: handoff.snapshot_hashes.promotion_input_snapshot_hash,
      topic_package_ref: handoff.topic_package_ref,
      topic_question_ref: handoff.topic_question_ref,
      topic_question_contract_ref: handoff.topic_question_contract_ref,
      answerability_plan_ref: handoff.answerability_plan_ref,
      research_slice_ref: handoff.research_slice_ref,
      claim_ceiling: this.extractClaimCeiling(handoff),
      contribution_summary: this.stringFromPath(handoff.snapshot.package_snapshot, ['contribution_summary']),
      evaluation_plan: this.stringFromPath(handoff.snapshot.package_snapshot, ['evaluation_plan']),
      selected_evidence_refs: selectedEvidenceRefs,
      accepted_risk_refs: handoff.accepted_risk_refs,
      blocker_refs: handoff.blocker_refs,
      recheck_request_refs: handoff.recheck_request_refs,
      memory_suggestion_refs: handoff.memory_suggestion_refs,
      readiness_check_refs: handoff.readiness_check_refs,
      allowed_refs: allowedRefs,
      source_refs: allowedRefs,
      source_hashes: input.sourceHashes,
      prior_role_artifact_hashes: input.priorRoleArtifactHashes,
    };
  }

  private messages(
    binding: N2RuntimeSlotBinding,
    contextPacket: TopicSelectionV1cN2BoundedDebateContextPacket,
  ): Array<{ role: 'system' | 'user'; content: string }> {
    return [
      {
        role: 'system',
        content: [
          'Act as exactly one fixed role in the Topic Selection v1c N2 bounded micro-debate.',
          'Use only the supplied frozen N1 handoff refs, hashes, context packet, and prior role artifact hashes.',
          'Do not output gate disposition, promotion decision, human decision, PaperProjectBridge, PaperProject, WorkOrder, downstream feedback, or recheck authority fields.',
          'Intermediate role outputs are diagnostic support only; only synthesizer final can be admitted as advisory N2 support after deterministic admission.',
          'Return only JSON matching the requested output contract.',
        ].join(' '),
      },
      {
        role: 'user',
        content: stableStringify({
          output_contract: binding.output_contract,
          role_slot: binding.slot_id,
          context_packet: contextPacket,
          output_boundary: 'support_only_non_authority',
        }),
      },
    ];
  }

  private sourceHashes(
    handoff: TopicSelectionPromotionInputSnapshotHandoff,
    priorRoleArtifactHashes: Partial<Record<TopicSelectionV1cN2BoundedDebateRoleSlotId, string>>,
  ): Record<string, string> {
    return {
      bundle_hash: handoff.snapshot_hashes.bundle_hash,
      package_snapshot_hash: handoff.snapshot_hashes.package_snapshot_hash,
      package_draft_input_snapshot_hash: handoff.snapshot_hashes.package_draft_input_snapshot_hash,
      promotion_input_snapshot_hash: handoff.snapshot_hashes.promotion_input_snapshot_hash,
      topic_package_ref_hash: this.hash(handoff.topic_package_ref),
      topic_question_contract_ref_hash: this.hash(handoff.topic_question_contract_ref),
      answerability_plan_ref_hash: this.hash(handoff.answerability_plan_ref),
      selected_evidence_refs_hash: this.hash(handoff.evidence_refs.map((item) => item.evidence_ref)),
      accepted_risk_refs_hash: this.hash(handoff.accepted_risk_refs),
      blocker_refs_hash: this.hash(handoff.blocker_refs),
      recheck_request_refs_hash: this.hash(handoff.recheck_request_refs),
      memory_suggestion_refs_hash: this.hash(handoff.memory_suggestion_refs),
      readiness_check_refs_hash: this.hash(handoff.readiness_check_refs),
      prior_role_artifact_hashes_hash: this.hash(priorRoleArtifactHashes),
    };
  }

  private runtimeInvocationContextHash(
    binding: N2RuntimeSlotBinding,
    sourceHashes: Record<string, string>,
    priorRoleArtifactHashes: Partial<Record<TopicSelectionV1cN2BoundedDebateRoleSlotId, string>>,
  ): string {
    return this.hash({
      schema_version: TOPIC_SELECTION_RUNTIME_INVOCATION_CONTEXT_SCHEMA_VERSION,
      invocation_slot_id: binding.invocation_slot_id,
      scenario_context: {
        identity_policy: 'semantic_identity',
        scenario_id: 'v1c_n2_bounded_promotion_support',
        scenario_case_id: binding.slot_id,
        semantic_scenario_key: this.hash(sourceHashes),
      },
      loop_context: {
        loop_kind: 'debate_round',
        loop_stage: binding.slot_id,
        current_round_index: TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER.indexOf(binding.slot_id) + 1,
        remaining_round_budget:
          TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER.length
          - TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER.indexOf(binding.slot_id)
          - 1,
        loopback_source_node_id: null,
        repair_origin_ref: null,
        repair_origin_hash: null,
      },
      debate_context: {
        debate_loop_id: 'v1c_n2_bounded_micro_debate',
        debate_policy_id: 'topic-selection.v1c.n2.bounded-micro-debate.v1',
        round_index: TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER.indexOf(binding.slot_id) + 1,
        role: null,
        stage: binding.slot_id,
        agent_instance_id: null,
        parent_invocation_attempt_ids_hash: this.hash(priorRoleArtifactHashes),
        dynamic_material_refs_hash: this.hash(priorRoleArtifactHashes),
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

  private dynamicMaterialRefs(
    priorRoleArtifacts: TopicSelectionV1cN2BoundedDebateRoleArtifact[],
  ): TopicSelectionDynamicPromptMaterialRecord[] {
    return priorRoleArtifacts.map((artifact) => ({
      material_ref: artifact.role_artifact_ref,
      material_hash: artifact.role_artifact_hash,
      generated_by_invocation_slot_id: artifact.slot_id,
      generation_policy_ref: {
        ref_type: 'context_policy_profile',
        ref_id: artifact.context_policy_profile_id,
      },
      allowed_to_influence_prompt: true,
      cannot_override_prompt_template: true,
    }));
  }

  private priorRoleArtifactHashes(
    priorRoleArtifacts: TopicSelectionV1cN2BoundedDebateRoleArtifact[],
  ): Partial<Record<TopicSelectionV1cN2BoundedDebateRoleSlotId, string>> {
    const hashes: Partial<Record<TopicSelectionV1cN2BoundedDebateRoleSlotId, string>> = {};
    for (const artifact of priorRoleArtifacts) {
      hashes[artifact.slot_id] = artifact.role_artifact_hash;
    }
    return hashes;
  }

  private resolveRuntimeProfile(binding: N2RuntimeSlotBinding): TopicSelectionResolvedContextPolicyProfile {
    return this.contextPolicyProfileRegistry.resolveProfile({
      context_policy_profile_id: binding.context_policy_profile_id,
      invocation_slot_id: binding.invocation_slot_id,
    });
  }

  private resolveModelProfile(
    binding: N2RuntimeSlotBinding,
    executionMode: TopicSelectionAgentExecutionMode,
    runMode: TopicSelectionAgentRunMode,
    modelOptionId: string | null,
  ): TopicSelectionResolvedModelProfile {
    return this.modelProfileRegistry.resolveProfile({
      profile_id: binding.model_profile_id,
      execution_mode: executionMode,
      run_mode: runMode,
      model_option_id: modelOptionId,
    });
  }

  private slotBinding(slotId: TopicSelectionV1cN2BoundedDebateRoleSlotId): N2RuntimeSlotBinding {
    if (slotId === TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_INVOCATION_SLOT_IDS.promotion_supporter_draft) {
      return {
        slot_id: slotId,
        invocation_slot_id: slotId,
        context_policy_profile_id:
          TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_CONTEXT_RUNTIME_PROFILE_IDS.promotion_supporter_draft,
        output_contract: OUTPUT_CONTRACT,
        model_profile_id: TOPIC_SELECTION_V1C_BOUNDED_MICRO_DEBATE_PROFILE_ID,
        prompt_template_id: PROMPT_TEMPLATE_ID,
        prompt_template_version: PROMPT_TEMPLATE_VERSION,
        schema: ROLE_OUTPUT_SCHEMA as unknown as Record<string, unknown>,
      };
    }
    if (slotId === TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_INVOCATION_SLOT_IDS.reviewer_critic_review) {
      return {
        slot_id: slotId,
        invocation_slot_id: slotId,
        context_policy_profile_id:
          TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_CONTEXT_RUNTIME_PROFILE_IDS.reviewer_critic_review,
        output_contract: OUTPUT_CONTRACT,
        model_profile_id: TOPIC_SELECTION_V1C_BOUNDED_MICRO_DEBATE_PROFILE_ID,
        prompt_template_id: PROMPT_TEMPLATE_ID,
        prompt_template_version: PROMPT_TEMPLATE_VERSION,
        schema: ROLE_OUTPUT_SCHEMA as unknown as Record<string, unknown>,
      };
    }
    if (slotId === TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_INVOCATION_SLOT_IDS.promotion_supporter_repair) {
      return {
        slot_id: slotId,
        invocation_slot_id: slotId,
        context_policy_profile_id:
          TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_CONTEXT_RUNTIME_PROFILE_IDS.promotion_supporter_repair,
        output_contract: OUTPUT_CONTRACT,
        model_profile_id: TOPIC_SELECTION_V1C_BOUNDED_MICRO_DEBATE_PROFILE_ID,
        prompt_template_id: PROMPT_TEMPLATE_ID,
        prompt_template_version: PROMPT_TEMPLATE_VERSION,
        schema: ROLE_OUTPUT_SCHEMA as unknown as Record<string, unknown>,
      };
    }
    if (slotId === TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_INVOCATION_SLOT_IDS.synthesizer_final) {
      return {
        slot_id: slotId,
        invocation_slot_id: slotId,
        context_policy_profile_id:
          TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_CONTEXT_RUNTIME_PROFILE_IDS.synthesizer_final,
        output_contract: OUTPUT_CONTRACT,
        model_profile_id: TOPIC_SELECTION_V1C_BOUNDED_MICRO_DEBATE_PROFILE_ID,
        prompt_template_id: PROMPT_TEMPLATE_ID,
        prompt_template_version: PROMPT_TEMPLATE_VERSION,
        schema: ROLE_OUTPUT_SCHEMA as unknown as Record<string, unknown>,
      };
    }
    throw new AppError(400, 'INVALID_PAYLOAD', `Unsupported v1c N2 bounded debate slot: ${slotId}.`);
  }

  private allowedRefs(handoff: TopicSelectionPromotionInputSnapshotHandoff): TopicSelectionFunctionalRef[] {
    return this.uniqueRefs([
      handoff.promotion_input_snapshot_ref,
      handoff.topic_package_ref,
      handoff.package_trace_boundary_check_ref,
      handoff.package_readiness_assessment_ref,
      handoff.topic_value_assessment_ref,
      handoff.value_reasoning_memo_ref,
      handoff.value_disposition_decision_ref,
      handoff.topic_question_ref,
      handoff.topic_question_contract_ref,
      handoff.answerability_plan_ref,
      handoff.research_slice_ref,
      ...handoff.validated_need_refs,
      ...handoff.evidence_refs.map((item) => item.evidence_ref),
      ...handoff.accepted_risk_refs,
      ...handoff.blocker_refs,
      ...handoff.memory_suggestion_refs,
      ...handoff.recheck_request_refs,
      ...handoff.readiness_check_refs,
    ]);
  }

  private extractClaimCeiling(handoff: TopicSelectionPromotionInputSnapshotHandoff): string | null {
    return this.stringFromPath(handoff.snapshot.package_snapshot, ['claim_ceiling'])
      ?? this.stringFromPath(handoff.snapshot.package_snapshot, ['package_payload', 'claim_ceiling'])
      ?? this.stringFromPath(handoff.snapshot.package_snapshot, ['package_payload', 'claim_ceiling_summary'])
      ?? this.stringFromPath(handoff.snapshot.package_draft_input_snapshot, ['question_contract', 'claim_ceiling']);
  }

  private stringFromPath(value: unknown, path: string[]): string | null {
    let current: unknown = value;
    for (const key of path) {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        return null;
      }
      current = (current as Record<string, unknown>)[key];
    }
    return typeof current === 'string' && current.trim().length > 0 ? current : null;
  }

  private assertHandoff(handoff: TopicSelectionPromotionInputSnapshotHandoff): void {
    if (handoff.closure_status !== 'ready_for_gate') {
      throw new AppError(400, 'INVALID_PAYLOAD', 'N2 bounded debate requires a ready_for_gate promotion input handoff.');
    }
    if (!handoff.snapshot_hashes.promotion_input_snapshot_hash || !handoff.promotion_input_snapshot_ref) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'N2 bounded debate requires promotion input snapshot ref and hash.');
    }
  }

  private defaultRunMode(executionMode: TopicSelectionAgentExecutionMode): TopicSelectionAgentRunMode {
    return executionMode === 'mocked_llm' ? 'test' : 'acceptance';
  }

  private executorKind(executionMode: TopicSelectionAgentExecutionMode): TopicSelectionExecutorKind {
    if (executionMode === 'codex_assisted') {
      return 'codex_assisted';
    }
    return 'single_agent';
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
