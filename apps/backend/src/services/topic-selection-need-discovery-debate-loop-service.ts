import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import {
  type TopicSelectionAgentExecutionMode,
  topicSelectionNeedDiscoveryDebateIssueFrameSchema,
  topicSelectionNeedDiscoveryDeepCriticNotesSchema,
  topicSelectionNeedDiscoveryExplorerNotesSchema,
  topicSelectionRankedCandidateDraftBatchSchema,
  type TopicSelectionArtifactFunctionalRef,
  type TopicSelectionGenerateNeedCandidateArtifactRefEntry,
  type TopicSelectionGenerateNeedCandidateNodeInput,
  type TopicSelectionNeedDiscoveryDebateFinalSynthesisArtifact,
  type TopicSelectionNeedDiscoveryDebateIssueFrame,
  type TopicSelectionNeedDiscoveryDeepCriticNotes,
  type TopicSelectionNeedDiscoveryExplorerNotes,
  type TopicSelectionNeedDiscoveryRoleLevelSummary,
  type TopicSelectionNeedDiscoveryContextPacket,
  type TopicSelectionRankedCandidateDraftBatch,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import {
  createTopicSelectionV1aGenerateNeedCandidateDebateScenarioContract,
  TOPIC_SELECTION_NEED_DISCOVERY_DEBATE_POLICY_ID,
  TOPIC_SELECTION_V1A_GENERATE_NEED_CANDIDATE_NODE_ID,
  type TopicSelectionDebateInstancePolicy,
  type TopicSelectionDebateRoleStageSlot,
  type TopicSelectionV1aGenerateNeedCandidateDebateSlotExecutionOverrides,
  type TopicSelectionV1aGenerateNeedCandidateDebateSlotId,
  type TopicSelectionV1aGenerateNeedCandidateDebateSlotModelOptionOverrides,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-debate-scenario-contracts';
import { AppError } from '../errors/app-error.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';
import {
  type TopicSelectionAgentInvocationResult,
  type TopicSelectionAgentRunMode,
  type TopicSelectionCodexAssistedAgentOutput,
  type TopicSelectionMockedAgentOutput,
  TopicSelectionAgentOrchestratorService,
} from './topic-selection-agent-orchestrator-service.js';
import { TopicSelectionNeedDiscoveryArtifactBoundaryService } from './topic-selection-need-discovery-artifact-boundary-service.js';
const NEED_DISCOVERY_DEBATE_CONTRACT =
  createTopicSelectionV1aGenerateNeedCandidateDebateScenarioContract();

const NODE_ID = TOPIC_SELECTION_V1A_GENERATE_NEED_CANDIDATE_NODE_ID;
const DEBATE_POLICY_ID = TOPIC_SELECTION_NEED_DISCOVERY_DEBATE_POLICY_ID;

const ROLE_LEVEL_SUMMARY_PAYLOAD_SCHEMA = 'NeedDiscoveryRoleLevelSummary@v1' as const;
const FINAL_SYNTHESIS_PAYLOAD_SCHEMA = 'NeedDiscoveryDebateFinalSynthesisArtifact@v1' as const;

function roleStageSlot(slotId: string): TopicSelectionDebateRoleStageSlot {
  const slot = NEED_DISCOVERY_DEBATE_CONTRACT.role_stage_slots.find((item) => item.slot_id === slotId);
  if (!slot) {
    throw new Error(`Missing debate role/stage slot: ${slotId}`);
  }
  return slot;
}

const EXPLORER_SLOT = roleStageSlot('explorer.round_1_discovery');
const DEEP_CRITIC_SLOT = roleStageSlot('deep_critic.round_1_discovery');
const ISSUE_FRAME_SLOT = roleStageSlot('arbiter.issue_framing');
const FINAL_SYNTHESIS_SLOT = roleStageSlot('arbiter.final_synthesis');

export type TopicSelectionNeedDiscoveryDebateMockedOutputs = {
  explorer: Array<TopicSelectionMockedAgentOutput<TopicSelectionNeedDiscoveryExplorerNotes>>;
  deep_critic: Array<TopicSelectionMockedAgentOutput<TopicSelectionNeedDiscoveryDeepCriticNotes>>;
  arbiter_issue_frame: TopicSelectionMockedAgentOutput<TopicSelectionNeedDiscoveryDebateIssueFrame>;
  arbiter_final: TopicSelectionMockedAgentOutput<TopicSelectionRankedCandidateDraftBatch>;
};

export type TopicSelectionNeedDiscoveryDebateCodexResponses = {
  explorer?: Array<TopicSelectionCodexAssistedAgentOutput<TopicSelectionNeedDiscoveryExplorerNotes>>;
  deep_critic?: Array<TopicSelectionCodexAssistedAgentOutput<TopicSelectionNeedDiscoveryDeepCriticNotes>>;
  arbiter_issue_frame?: TopicSelectionCodexAssistedAgentOutput<TopicSelectionNeedDiscoveryDebateIssueFrame>;
  arbiter_final?: TopicSelectionCodexAssistedAgentOutput<TopicSelectionRankedCandidateDraftBatch>;
};

export type TopicSelectionNeedDiscoveryDebateLoopInput = {
  workspace_id?: string | null;
  title_card_id?: string | null;
  node_input: TopicSelectionGenerateNeedCandidateNodeInput;
  run_mode: TopicSelectionAgentRunMode;
  exploration_context_packet: TopicSelectionNeedDiscoveryContextPacket;
  arbiter_context_packet: TopicSelectionNeedDiscoveryContextPacket;
  debate_loop_id?: string | null;
  debate_policy_id?: string | null;
  round_index?: number | null;
  slot_execution_overrides?: TopicSelectionV1aGenerateNeedCandidateDebateSlotExecutionOverrides | null;
  slot_model_option_overrides?: TopicSelectionV1aGenerateNeedCandidateDebateSlotModelOptionOverrides | null;
  mocked_outputs?: TopicSelectionNeedDiscoveryDebateMockedOutputs | null;
  codex_responses?: TopicSelectionNeedDiscoveryDebateCodexResponses | null;
  model_option_id?: string | null;
  created_by?: 'human' | 'llm' | 'system' | 'hybrid';
};

export type TopicSelectionNeedDiscoveryDebateLoopResult = {
  schema_version: 'v1';
  debate_loop_id: string;
  debate_policy_id: string;
  round_index: number;
  status: 'succeeded' | 'blocked';
  ranked_candidate_draft_batch: TopicSelectionRankedCandidateDraftBatch | null;
  final_invocation_result: TopicSelectionAgentInvocationResult<unknown>;
  role_invocation_results: Array<TopicSelectionAgentInvocationResult<unknown>>;
  role_output_artifacts: TopicSelectionGenerateNeedCandidateArtifactRefEntry[];
  role_level_summary_artifacts: TopicSelectionGenerateNeedCandidateArtifactRefEntry[];
  issue_frame_artifact: TopicSelectionGenerateNeedCandidateArtifactRefEntry | null;
  final_synthesis_artifact: TopicSelectionGenerateNeedCandidateArtifactRefEntry | null;
  blocker_codes: string[];
  error_code?: string | null;
};

type RoleInvocationRecord<T> = {
  output: T | null;
  invocation: TopicSelectionAgentInvocationResult<T>;
  artifact: TopicSelectionGenerateNeedCandidateArtifactRefEntry | null;
};

type CompletedRoleInvocationRecord<T> = {
  output: T;
  invocation: TopicSelectionAgentInvocationResult<T>;
  artifact: TopicSelectionGenerateNeedCandidateArtifactRefEntry;
};

export class TopicSelectionNeedDiscoveryDebateLoopService {
  constructor(
    private readonly dependencies: {
      agentOrchestrator: TopicSelectionAgentOrchestratorService;
      artifactBoundary: TopicSelectionNeedDiscoveryArtifactBoundaryService;
    },
  ) {}

  async runNeedDiscoveryDebate(
    input: TopicSelectionNeedDiscoveryDebateLoopInput,
  ): Promise<TopicSelectionNeedDiscoveryDebateLoopResult> {
    this.assertInput(input);
    const debateLoopId = input.debate_loop_id?.trim() || `${input.node_input.node_attempt_id}.debate_loop_001`;
    const debatePolicyId = input.debate_policy_id?.trim() || DEBATE_POLICY_ID;
    const roundIndex = input.round_index ?? 1;

    const explorerRecords = await this.invokeExplorerRole(input, debateLoopId, debatePolicyId, roundIndex);
    const explorerBlocked = this.firstBlocked(explorerRecords.map((record) => record.invocation));
    if (explorerBlocked) {
      return this.blockedResult(debateLoopId, debatePolicyId, roundIndex, explorerBlocked, explorerRecords);
    }
    const deepCriticRecords = await this.invokeDeepCriticRole(input, debateLoopId, debatePolicyId, roundIndex);
    const allWorkerRecords = [...explorerRecords, ...deepCriticRecords];
    const deepCriticBlocked = this.firstBlocked(deepCriticRecords.map((record) => record.invocation));
    if (deepCriticBlocked) {
      return this.blockedResult(debateLoopId, debatePolicyId, roundIndex, deepCriticBlocked, allWorkerRecords);
    }
    const completedExplorerRecords = this.completedRecords(explorerRecords, 'explorer');
    const completedDeepCriticRecords = this.completedRecords(deepCriticRecords, 'deep_critic');

    const explorerSummary = this.explorerSummary(debateLoopId, roundIndex, completedExplorerRecords);
    const deepCriticSummary = this.deepCriticSummary(debateLoopId, roundIndex, completedDeepCriticRecords);
    const roleLevelSummaries = [explorerSummary, deepCriticSummary];
    const explorerSummaryArtifact = await this.recordRoleLevelSummary(input, explorerSummary);
    const deepCriticSummaryArtifact = await this.recordRoleLevelSummary(input, deepCriticSummary);
    const summaryArtifacts = [explorerSummaryArtifact, deepCriticSummaryArtifact];

    const issueFrameRecord = await this.invokeIssueFrame({
      input,
      debateLoopId,
      debatePolicyId,
      roundIndex,
      roleLevelSummaryRefs: summaryArtifacts.map((artifact) => artifact.artifact_ref),
      roleLevelSummaries,
      parentInvocationAttemptIds: allWorkerRecords.map((record) => record.invocation.provenance.invocation_attempt_id),
    });
    if (
      issueFrameRecord.invocation.status !== 'succeeded'
      || !issueFrameRecord.invocation.structured_output
      || !issueFrameRecord.artifact
    ) {
      return this.blockedResult(
        debateLoopId,
        debatePolicyId,
        roundIndex,
        issueFrameRecord.invocation,
        allWorkerRecords,
        summaryArtifacts,
        issueFrameRecord.artifact,
        [issueFrameRecord.invocation],
      );
    }

    const finalInvocation = await this.invokeFinalSynthesis({
      input,
      debateLoopId,
      debatePolicyId,
      roundIndex,
      issueFrameRef: issueFrameRecord.artifact.artifact_ref,
      issueFrame: issueFrameRecord.invocation.structured_output,
      roleLevelSummaryRefs: summaryArtifacts.map((artifact) => artifact.artifact_ref),
      roleLevelSummaries,
      parentInvocationAttemptIds: [
        ...allWorkerRecords.map((record) => record.invocation.provenance.invocation_attempt_id),
        issueFrameRecord.invocation.provenance.invocation_attempt_id,
      ],
    });
    if (finalInvocation.status !== 'succeeded' || !finalInvocation.structured_output) {
      return this.blockedResult(
        debateLoopId,
        debatePolicyId,
        roundIndex,
        finalInvocation,
        allWorkerRecords,
        summaryArtifacts,
        issueFrameRecord.artifact,
        [issueFrameRecord.invocation],
      );
    }

    const finalSynthesisArtifact = await this.recordFinalSynthesisArtifact({
      input,
      debateLoopId,
      roundIndex,
      finalInvocation,
      issueFrameRef: issueFrameRecord.artifact.artifact_ref,
      roleLevelSummaryRefs: summaryArtifacts.map((artifact) => artifact.artifact_ref),
    });

    return {
      schema_version: 'v1',
      debate_loop_id: debateLoopId,
      debate_policy_id: debatePolicyId,
      round_index: roundIndex,
      status: 'succeeded',
      ranked_candidate_draft_batch: finalInvocation.structured_output,
      final_invocation_result: finalInvocation,
      role_invocation_results: [
        ...allWorkerRecords.map((record) => record.invocation),
        issueFrameRecord.invocation,
      ],
      role_output_artifacts: this.presentArtifacts(allWorkerRecords.map((record) => record.artifact)),
      role_level_summary_artifacts: summaryArtifacts,
      issue_frame_artifact: issueFrameRecord.artifact,
      final_synthesis_artifact: finalSynthesisArtifact,
      blocker_codes: [],
      error_code: null,
    };
  }

  private async invokeExplorerRole(
    input: TopicSelectionNeedDiscoveryDebateLoopInput,
    debateLoopId: string,
    debatePolicyId: string,
    roundIndex: number,
  ): Promise<Array<RoleInvocationRecord<TopicSelectionNeedDiscoveryExplorerNotes>>> {
    const outputs = input.mocked_outputs?.explorer ?? [];
    const codexResponses = input.codex_responses?.explorer ?? [];
    const executionMode = this.slotExecutionMode(input, EXPLORER_SLOT);
    const modelOptionId = this.slotModelOptionId(input, EXPLORER_SLOT, executionMode);
    const instanceCount = this.instanceCount(
      executionMode,
      'explorer',
      outputs.length,
      codexResponses.length,
      EXPLORER_SLOT.instance_policy,
    );
    const records: Array<RoleInvocationRecord<TopicSelectionNeedDiscoveryExplorerNotes>> = [];
    for (let index = 0; index < instanceCount; index += 1) {
      const agentInstanceId = `explorer_${index + 1}`;
      const invocation = await this.dependencies.agentOrchestrator.invokeStructuredOutput<TopicSelectionNeedDiscoveryExplorerNotes>({
        ...this.baseInvocation(input, debateLoopId, debatePolicyId, roundIndex, 'explorer', 'round_1_discovery', agentInstanceId, executionMode, modelOptionId),
        profile_id: EXPLORER_SLOT.profile_id,
        output_contract: EXPLORER_SLOT.output_contract,
        prompt: {
          promptTemplateId: EXPLORER_SLOT.prompt_template_id,
          version: EXPLORER_SLOT.prompt_template_version,
        },
        schema_name: EXPLORER_SLOT.schema_name,
        schema: topicSelectionNeedDiscoveryExplorerNotesSchema as unknown as Record<string, unknown>,
        messages: this.roleMessages(input, 'explorer', 'Explore grounded candidate need angles.'),
        mocked_output: this.mockedRoleOutput(executionMode, outputs[index], `explorer[${index}]`),
        codex_response: this.codexRoleResponse(executionMode, codexResponses[index], `explorer[${index}]`),
      });
      const artifact = invocation.structured_output
        ? await this.recordRoleOutput(input, invocation, EXPLORER_SLOT.output_contract, invocation.structured_output)
        : null;
      if (!artifact) {
        records.push({ output: null, invocation, artifact: null });
        continue;
      }
      records.push({ output: invocation.structured_output, invocation, artifact });
    }
    return records;
  }

  private async invokeDeepCriticRole(
    input: TopicSelectionNeedDiscoveryDebateLoopInput,
    debateLoopId: string,
    debatePolicyId: string,
    roundIndex: number,
  ): Promise<Array<RoleInvocationRecord<TopicSelectionNeedDiscoveryDeepCriticNotes>>> {
    const outputs = input.mocked_outputs?.deep_critic ?? [];
    const codexResponses = input.codex_responses?.deep_critic ?? [];
    const executionMode = this.slotExecutionMode(input, DEEP_CRITIC_SLOT);
    const modelOptionId = this.slotModelOptionId(input, DEEP_CRITIC_SLOT, executionMode);
    const instanceCount = this.instanceCount(
      executionMode,
      'deep_critic',
      outputs.length,
      codexResponses.length,
      DEEP_CRITIC_SLOT.instance_policy,
    );
    const records: Array<RoleInvocationRecord<TopicSelectionNeedDiscoveryDeepCriticNotes>> = [];
    for (let index = 0; index < instanceCount; index += 1) {
      const agentInstanceId = `deep_critic_${index + 1}`;
      const invocation = await this.dependencies.agentOrchestrator.invokeStructuredOutput<TopicSelectionNeedDiscoveryDeepCriticNotes>({
        ...this.baseInvocation(input, debateLoopId, debatePolicyId, roundIndex, 'deep_critic', 'round_1_discovery', agentInstanceId, executionMode, modelOptionId),
        profile_id: DEEP_CRITIC_SLOT.profile_id,
        output_contract: DEEP_CRITIC_SLOT.output_contract,
        prompt: {
          promptTemplateId: DEEP_CRITIC_SLOT.prompt_template_id,
          version: DEEP_CRITIC_SLOT.prompt_template_version,
        },
        schema_name: DEEP_CRITIC_SLOT.schema_name,
        schema: topicSelectionNeedDiscoveryDeepCriticNotesSchema as unknown as Record<string, unknown>,
        messages: this.roleMessages(input, 'deep_critic', 'Stress-test candidate value, pseudo-gap risk, and missing evidence.'),
        mocked_output: this.mockedRoleOutput(executionMode, outputs[index], `deep_critic[${index}]`),
        codex_response: this.codexRoleResponse(executionMode, codexResponses[index], `deep_critic[${index}]`),
      });
      const artifact = invocation.structured_output
        ? await this.recordRoleOutput(input, invocation, DEEP_CRITIC_SLOT.output_contract, invocation.structured_output)
        : null;
      if (!artifact) {
        records.push({ output: null, invocation, artifact: null });
        continue;
      }
      records.push({ output: invocation.structured_output, invocation, artifact });
    }
    return records;
  }

  private async invokeIssueFrame(input: {
    input: TopicSelectionNeedDiscoveryDebateLoopInput;
    debateLoopId: string;
    debatePolicyId: string;
    roundIndex: number;
    roleLevelSummaryRefs: TopicSelectionArtifactFunctionalRef[];
    roleLevelSummaries: TopicSelectionNeedDiscoveryRoleLevelSummary[];
    parentInvocationAttemptIds: string[];
  }): Promise<RoleInvocationRecord<TopicSelectionNeedDiscoveryDebateIssueFrame>> {
    const executionMode = this.slotExecutionMode(input.input, ISSUE_FRAME_SLOT);
    const modelOptionId = this.slotModelOptionId(input.input, ISSUE_FRAME_SLOT, executionMode);
    const invocation = await this.dependencies.agentOrchestrator.invokeStructuredOutput<TopicSelectionNeedDiscoveryDebateIssueFrame>({
      ...this.baseInvocation(
        input.input,
        input.debateLoopId,
        input.debatePolicyId,
        input.roundIndex,
        'arbiter',
        'issue_framing',
        'arbiter_issue_frame',
        executionMode,
        modelOptionId,
        input.parentInvocationAttemptIds,
      ),
      profile_id: ISSUE_FRAME_SLOT.profile_id,
      output_contract: ISSUE_FRAME_SLOT.output_contract,
      prompt: {
        promptTemplateId: ISSUE_FRAME_SLOT.prompt_template_id,
        version: ISSUE_FRAME_SLOT.prompt_template_version,
      },
      schema_name: ISSUE_FRAME_SLOT.schema_name,
      schema: topicSelectionNeedDiscoveryDebateIssueFrameSchema as unknown as Record<string, unknown>,
      messages: this.arbiterMessages(input.input, 'Frame the discussion points for final synthesis.', {
        role_level_summary_refs: input.roleLevelSummaryRefs,
      }, {
        role_level_summaries: input.roleLevelSummaries,
      }),
      mocked_output: this.mockedRoleOutput(executionMode, input.input.mocked_outputs?.arbiter_issue_frame, 'arbiter_issue_frame'),
      codex_response: this.codexRoleResponse(executionMode, input.input.codex_responses?.arbiter_issue_frame, 'arbiter_issue_frame'),
    });
    const artifact = invocation.structured_output
      ? await this.recordRoleOutput(input.input, invocation, ISSUE_FRAME_SLOT.output_contract, invocation.structured_output)
      : null;
    return {
      output: invocation.structured_output,
      invocation,
      artifact,
    };
  }

  private async invokeFinalSynthesis(input: {
    input: TopicSelectionNeedDiscoveryDebateLoopInput;
    debateLoopId: string;
    debatePolicyId: string;
    roundIndex: number;
    issueFrameRef: TopicSelectionArtifactFunctionalRef;
    issueFrame: TopicSelectionNeedDiscoveryDebateIssueFrame;
    roleLevelSummaryRefs: TopicSelectionArtifactFunctionalRef[];
    roleLevelSummaries: TopicSelectionNeedDiscoveryRoleLevelSummary[];
    parentInvocationAttemptIds: string[];
  }): Promise<TopicSelectionAgentInvocationResult<TopicSelectionRankedCandidateDraftBatch>> {
    const executionMode = this.slotExecutionMode(input.input, FINAL_SYNTHESIS_SLOT);
    const modelOptionId = this.slotModelOptionId(input.input, FINAL_SYNTHESIS_SLOT, executionMode);
    return this.dependencies.agentOrchestrator.invokeStructuredOutput<TopicSelectionRankedCandidateDraftBatch>({
      ...this.baseInvocation(
        input.input,
        input.debateLoopId,
        input.debatePolicyId,
        input.roundIndex,
        'arbiter',
        'final_synthesis',
        'arbiter_final',
        executionMode,
        modelOptionId,
        input.parentInvocationAttemptIds,
        {
          arbiter_issue_frame_ref: input.issueFrameRef,
        },
      ),
      profile_id: FINAL_SYNTHESIS_SLOT.profile_id,
      output_contract: FINAL_SYNTHESIS_SLOT.output_contract,
      prompt: {
        promptTemplateId: FINAL_SYNTHESIS_SLOT.prompt_template_id,
        version: FINAL_SYNTHESIS_SLOT.prompt_template_version,
      },
      schema_name: FINAL_SYNTHESIS_SLOT.schema_name,
      schema: topicSelectionRankedCandidateDraftBatchSchema as unknown as Record<string, unknown>,
      messages: this.arbiterMessages(input.input, 'Synthesize final ranked candidate draft batch.', {
        issue_frame_ref: input.issueFrameRef,
        role_level_summary_refs: input.roleLevelSummaryRefs,
      }, {
        issue_frame: input.issueFrame,
        role_level_summaries: input.roleLevelSummaries,
      }),
      mocked_output: this.mockedRoleOutput(executionMode, input.input.mocked_outputs?.arbiter_final, 'arbiter_final'),
      codex_response: this.codexRoleResponse(executionMode, input.input.codex_responses?.arbiter_final, 'arbiter_final'),
    });
  }

  private baseInvocation(
    input: TopicSelectionNeedDiscoveryDebateLoopInput,
    debateLoopId: string,
    debatePolicyId: string,
    roundIndex: number,
    role: 'explorer' | 'deep_critic' | 'arbiter',
    stage: string,
    agentInstanceId: string,
    executionMode: TopicSelectionAgentExecutionMode,
    modelOptionId: string | null,
    parentInvocationAttemptIds: string[] = [],
    refs: {
      role_level_summary_ref?: TopicSelectionFunctionalRef | null;
      arbiter_issue_frame_ref?: TopicSelectionFunctionalRef | null;
      arbiter_final_artifact_ref?: TopicSelectionFunctionalRef | null;
    } = {},
  ) {
    const invocationAttemptId = `${input.node_input.node_attempt_id}.${debateLoopId}.${role}.${stage}.${agentInstanceId}`;
    return {
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id ?? null,
      node_id: NODE_ID,
      workflow_run_id: input.node_input.workflow_run_id,
      node_attempt_id: input.node_input.node_attempt_id,
      invocation_attempt_id: invocationAttemptId,
      execution_mode: executionMode,
      executor_kind: 'multi_agent_debate' as const,
      run_mode: input.run_mode,
      model_option_id: modelOptionId,
      input_refs: this.inputRefs(input.node_input),
      context_packet_refs: [
        input.node_input.exploration_context_ref,
        input.node_input.arbiter_context_ref,
      ],
      debate_extension: {
        debate_loop_id: debateLoopId,
        debate_policy_id: debatePolicyId,
        round_index: roundIndex,
        role,
        stage,
        agent_instance_id: agentInstanceId,
        parent_invocation_attempt_ids: parentInvocationAttemptIds,
        ...refs,
      },
      created_by: input.created_by ?? 'system',
    };
  }

  private async recordRoleOutput<T>(
    input: TopicSelectionNeedDiscoveryDebateLoopInput,
    invocation: TopicSelectionAgentInvocationResult<T>,
    payloadSchema: string,
    payload: T,
  ): Promise<TopicSelectionGenerateNeedCandidateArtifactRefEntry> {
    const artifact = await this.dependencies.artifactBoundary.recordArtifact({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id ?? null,
      workflow_run_id: input.node_input.workflow_run_id,
      node_attempt_id: input.node_input.node_attempt_id,
      artifact_key: payloadSchema === ISSUE_FRAME_SLOT.output_contract ? 'debate_issue_frame' : 'debate_role_output',
      payload_schema: payloadSchema,
      payload: payload as Record<string, unknown>,
      source_refs: this.uniqueRefs([
        input.node_input.exploration_context_ref,
        input.node_input.arbiter_context_ref,
        invocation.audit_artifact_ref ?? null,
      ]),
      created_by: input.created_by ?? 'system',
    });
    return artifact.artifact_entry;
  }

  private async recordRoleLevelSummary(
    input: TopicSelectionNeedDiscoveryDebateLoopInput,
    summary: TopicSelectionNeedDiscoveryRoleLevelSummary,
  ): Promise<TopicSelectionGenerateNeedCandidateArtifactRefEntry> {
    const artifact = await this.dependencies.artifactBoundary.recordArtifact({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id ?? null,
      workflow_run_id: input.node_input.workflow_run_id,
      node_attempt_id: input.node_input.node_attempt_id,
      artifact_key: 'debate_role_level_summary',
      payload_schema: ROLE_LEVEL_SUMMARY_PAYLOAD_SCHEMA,
      payload: summary as unknown as Record<string, unknown>,
      source_refs: summary.source_artifact_refs,
      created_by: input.created_by ?? 'system',
    });
    return artifact.artifact_entry;
  }

  private async recordFinalSynthesisArtifact(input: {
    input: TopicSelectionNeedDiscoveryDebateLoopInput;
    debateLoopId: string;
    roundIndex: number;
    finalInvocation: TopicSelectionAgentInvocationResult<TopicSelectionRankedCandidateDraftBatch>;
    issueFrameRef: TopicSelectionArtifactFunctionalRef;
    roleLevelSummaryRefs: TopicSelectionArtifactFunctionalRef[];
  }): Promise<TopicSelectionGenerateNeedCandidateArtifactRefEntry> {
    const batch = input.finalInvocation.structured_output;
    if (!batch) {
      throw new AppError(500, 'INTERNAL_ERROR', 'final synthesis artifact requires ranked candidate draft batch.');
    }
    const payload: TopicSelectionNeedDiscoveryDebateFinalSynthesisArtifact = {
      schema_version: 'v1',
      debate_loop_id: input.debateLoopId,
      round_index: input.roundIndex,
      role: 'arbiter',
      stage: 'final_synthesis',
      final_invocation_attempt_id: input.finalInvocation.provenance.invocation_attempt_id,
      final_invocation_audit_ref: input.finalInvocation.audit_artifact_ref ?? null,
      issue_frame_ref: input.issueFrameRef,
      role_level_summary_refs: input.roleLevelSummaryRefs,
      ranked_candidate_draft_batch_hash: this.hash(batch),
      terminal_result: batch.draft_batch.terminal_result,
      draft_count: batch.drafts.length,
      rejected_framing_count: batch.rejected_framings.length,
      unresolved_point_count: batch.unresolved_points.length,
    };
    const artifact = await this.dependencies.artifactBoundary.recordArtifact({
      workspace_id: input.input.workspace_id ?? null,
      title_card_id: input.input.title_card_id ?? null,
      workflow_run_id: input.input.node_input.workflow_run_id,
      node_attempt_id: input.input.node_input.node_attempt_id,
      artifact_key: 'debate_final_synthesis',
      payload_schema: FINAL_SYNTHESIS_PAYLOAD_SCHEMA,
      payload: payload as unknown as Record<string, unknown>,
      source_refs: this.uniqueRefs([
        input.issueFrameRef,
        ...input.roleLevelSummaryRefs,
        input.finalInvocation.audit_artifact_ref ?? null,
      ]),
      created_by: input.input.created_by ?? 'system',
    });
    return artifact.artifact_entry;
  }

  private explorerSummary(
    debateLoopId: string,
    roundIndex: number,
    records: Array<CompletedRoleInvocationRecord<TopicSelectionNeedDiscoveryExplorerNotes>>,
  ): TopicSelectionNeedDiscoveryRoleLevelSummary {
    const candidateNeedSignals = records.flatMap((record) =>
      record.output.candidate_angles.map((angle) => angle.candidate_need_hint ?? angle.summary),
    );
    return {
      schema_version: 'v1',
      debate_loop_id: debateLoopId,
      round_index: roundIndex,
      role: 'explorer',
      source_invocation_attempt_ids: records.map((record) => record.invocation.provenance.invocation_attempt_id),
      source_artifact_refs: records.map((record) => record.artifact.artifact_ref),
      summary: `Explorer surfaced ${candidateNeedSignals.length} candidate angle(s).`,
      candidate_need_signals: this.uniqueStrings(candidateNeedSignals),
      risk_signals: this.uniqueStrings(records.flatMap((record) => record.output.warnings)),
      evidence_refs: this.uniqueRefs(records.flatMap((record) => [
        ...record.output.evidence_refs,
        ...record.output.candidate_angles.flatMap((angle) => angle.evidence_refs),
      ])),
      unresolved_questions: this.uniqueStrings(records.flatMap((record) => record.output.unresolved_questions)),
    };
  }

  private deepCriticSummary(
    debateLoopId: string,
    roundIndex: number,
    records: Array<CompletedRoleInvocationRecord<TopicSelectionNeedDiscoveryDeepCriticNotes>>,
  ): TopicSelectionNeedDiscoveryRoleLevelSummary {
    const riskSignals = records.flatMap((record) => [
      ...record.output.critique_points.map((point) => point.summary),
      ...record.output.failure_modes,
      ...record.output.warnings,
    ]);
    return {
      schema_version: 'v1',
      debate_loop_id: debateLoopId,
      round_index: roundIndex,
      role: 'deep_critic',
      source_invocation_attempt_ids: records.map((record) => record.invocation.provenance.invocation_attempt_id),
      source_artifact_refs: records.map((record) => record.artifact.artifact_ref),
      summary: `Deep critic surfaced ${riskSignals.length} risk signal(s).`,
      candidate_need_signals: [],
      risk_signals: this.uniqueStrings(riskSignals),
      evidence_refs: this.uniqueRefs(records.flatMap((record) => [
        ...record.output.evidence_refs,
        ...record.output.critique_points.flatMap((point) => point.evidence_refs),
      ])),
      unresolved_questions: this.uniqueStrings(records.flatMap((record) => record.output.missing_evidence_questions)),
    };
  }

  private blockedResult(
    debateLoopId: string,
    debatePolicyId: string,
    roundIndex: number,
    blockingInvocation: TopicSelectionAgentInvocationResult<unknown>,
    records: Array<RoleInvocationRecord<unknown>>,
    roleLevelSummaryArtifacts: TopicSelectionGenerateNeedCandidateArtifactRefEntry[] = [],
    issueFrameArtifact: TopicSelectionGenerateNeedCandidateArtifactRefEntry | null = null,
    additionalRoleInvocations: Array<TopicSelectionAgentInvocationResult<unknown>> = [],
  ): TopicSelectionNeedDiscoveryDebateLoopResult {
    return {
      schema_version: 'v1',
      debate_loop_id: debateLoopId,
      debate_policy_id: debatePolicyId,
      round_index: roundIndex,
      status: 'blocked',
      ranked_candidate_draft_batch: null,
      final_invocation_result: blockingInvocation,
      role_invocation_results: [
        ...records.map((record) => record.invocation),
        ...additionalRoleInvocations,
      ],
      role_output_artifacts: records
        .map((record) => record.artifact)
        .filter((artifact): artifact is TopicSelectionGenerateNeedCandidateArtifactRefEntry => Boolean(artifact)),
      role_level_summary_artifacts: roleLevelSummaryArtifacts,
      issue_frame_artifact: issueFrameArtifact,
      final_synthesis_artifact: null,
      blocker_codes: blockingInvocation.blocker_codes.length > 0
        ? blockingInvocation.blocker_codes
        : ['DEBATE_INVOCATION_BLOCKED'],
      error_code: blockingInvocation.error_code ?? 'DEBATE_INVOCATION_BLOCKED',
    };
  }

  private completedRecords<T>(
    records: Array<RoleInvocationRecord<T>>,
    roleLabel: string,
  ): Array<CompletedRoleInvocationRecord<T>> {
    return records.map((record, index) => {
      if (!record.output || !record.artifact) {
        throw new AppError(
          500,
          'INTERNAL_ERROR',
          `succeeded debate ${roleLabel}[${index}] invocation is missing structured output artifact.`,
        );
      }
      return {
        output: record.output,
        invocation: record.invocation,
        artifact: record.artifact,
      };
    });
  }

  private presentArtifacts(
    artifacts: Array<TopicSelectionGenerateNeedCandidateArtifactRefEntry | null>,
  ): TopicSelectionGenerateNeedCandidateArtifactRefEntry[] {
    return artifacts.filter((artifact): artifact is TopicSelectionGenerateNeedCandidateArtifactRefEntry => Boolean(artifact));
  }

  private firstBlocked(
    invocations: Array<TopicSelectionAgentInvocationResult<unknown>>,
  ): TopicSelectionAgentInvocationResult<unknown> | null {
    return invocations.find((invocation) => invocation.status !== 'succeeded') ?? null;
  }

  private instanceCount(
    executionMode: TopicSelectionAgentExecutionMode,
    fieldName: 'explorer' | 'deep_critic',
    mockedCount: number,
    codexCount: number,
    instancePolicy: TopicSelectionDebateInstancePolicy,
  ): number {
    if (executionMode === 'mocked_llm') {
      if (mockedCount < instancePolicy.min_instances) {
        throw new AppError(
          400,
          'INVALID_PAYLOAD',
          `mocked_outputs.${fieldName} must include at least ${instancePolicy.min_instances} role invocation output(s).`,
        );
      }
      if (mockedCount > instancePolicy.max_instances) {
        throw new AppError(
          400,
          'INVALID_PAYLOAD',
          `mocked_outputs.${fieldName} must include at most ${instancePolicy.max_instances} role invocation output(s).`,
        );
      }
      return mockedCount;
    }
    if (executionMode === 'codex_assisted') {
      if (codexCount < instancePolicy.min_instances) {
        throw new AppError(
          400,
          'INVALID_PAYLOAD',
          `codex_responses.${fieldName} must include at least ${instancePolicy.min_instances} role invocation response(s).`,
        );
      }
      if (codexCount > instancePolicy.max_instances) {
        throw new AppError(
          400,
          'INVALID_PAYLOAD',
          `codex_responses.${fieldName} must include at most ${instancePolicy.max_instances} role invocation response(s).`,
        );
      }
      return codexCount;
    }
    return instancePolicy.default_instances;
  }

  private mockedRoleOutput<T>(
    executionMode: TopicSelectionAgentExecutionMode,
    output: TopicSelectionMockedAgentOutput<T> | undefined,
    fieldName: string,
  ): TopicSelectionMockedAgentOutput<T> | null {
    if (executionMode !== 'mocked_llm') {
      return null;
    }
    if (!output) {
      throw new AppError(400, 'INVALID_PAYLOAD', `mocked_outputs.${fieldName} is required for debate mocked_llm.`);
    }
    return output;
  }

  private codexRoleResponse<T>(
    executionMode: TopicSelectionAgentExecutionMode,
    response: TopicSelectionCodexAssistedAgentOutput<T> | undefined,
    fieldName: string,
  ): TopicSelectionCodexAssistedAgentOutput<T> | null {
    if (executionMode !== 'codex_assisted') {
      return null;
    }
    if (!response) {
      throw new AppError(400, 'INVALID_PAYLOAD', `codex_responses.${fieldName} is required for debate codex_assisted.`);
    }
    return response;
  }

  private roleMessages(
    input: TopicSelectionNeedDiscoveryDebateLoopInput,
    role: 'explorer' | 'deep_critic',
    instruction: string,
  ): Array<{ role: 'system' | 'user'; content: string }> {
    return [
      {
        role: 'system',
        content: [
          instruction,
          'Use only supplied context refs and payloads.',
          'Return only structured role notes.',
          'Do not write authority objects or include hidden reasoning.',
        ].join(' '),
      },
      {
        role: 'user',
        content: stableStringify({
          role,
          node_input: input.node_input,
          exploration_context: input.exploration_context_packet.payload,
        }),
      },
    ];
  }

  private arbiterMessages(
    input: TopicSelectionNeedDiscoveryDebateLoopInput,
    instruction: string,
    refs: Record<string, unknown>,
    debatePayloads: Record<string, unknown> = {},
  ): Array<{ role: 'system' | 'user'; content: string }> {
    return [
      {
        role: 'system',
        content: [
          instruction,
          'Use arbiter context, role-level summaries, and referenced artifacts only.',
          'Do not write authority objects or include hidden reasoning.',
        ].join(' '),
      },
      {
        role: 'user',
        content: stableStringify({
          node_input: input.node_input,
          arbiter_context: input.arbiter_context_packet.payload,
          refs,
          debate_payloads: debatePayloads,
        }),
      },
    ];
  }

  private inputRefs(input: TopicSelectionGenerateNeedCandidateNodeInput): TopicSelectionFunctionalRef[] {
    return this.uniqueRefs([
      input.topic_scope_ref,
      input.evidence_map_ref,
      input.evidence_strength_ref,
      input.resource_sample_set_ref ?? null,
      input.candidate_pool_projection_ref ?? null,
      ...input.search_snapshot_refs,
      ...input.resource_snapshot_refs,
      input.operator_reuse_approval_ref ?? null,
    ]);
  }

  private uniqueRefs<T extends TopicSelectionFunctionalRef>(
    refs: Array<T | null | undefined>,
  ): T[] {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const ref of refs) {
      if (!ref) {
        continue;
      }
      const key = `${ref.ref_type}:${ref.ref_id}:${ref.version_id ?? ''}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(ref);
    }
    return result;
  }

  private uniqueStrings(values: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const value of values) {
      const normalized = value.trim();
      if (!normalized || seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      result.push(normalized);
    }
    return result;
  }

  private assertInput(input: TopicSelectionNeedDiscoveryDebateLoopInput): void {
    this.assertKnownSlotExecutionOverrides(input);
    this.assertSlotModelOptionOverrides(input);
    if (input.exploration_context_packet.context_family !== 'exploration_context') {
      throw new AppError(400, 'INVALID_PAYLOAD', 'exploration_context_packet must be exploration_context.');
    }
    if (input.arbiter_context_packet.context_family !== 'arbiter_context') {
      throw new AppError(400, 'INVALID_PAYLOAD', 'arbiter_context_packet must be arbiter_context.');
    }
    if (input.round_index !== undefined && input.round_index !== null && input.round_index < 1) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'round_index must be positive.');
    }
    if (
      input.round_index !== undefined
      && input.round_index !== null
      && input.round_index > NEED_DISCOVERY_DEBATE_CONTRACT.failure_policy.max_rounds
    ) {
      throw new AppError(
        400,
        'INVALID_PAYLOAD',
        `round_index must be less than or equal to ${NEED_DISCOVERY_DEBATE_CONTRACT.failure_policy.max_rounds}.`,
      );
    }
  }

  private slotExecutionMode(
    input: TopicSelectionNeedDiscoveryDebateLoopInput,
    slot: TopicSelectionDebateRoleStageSlot,
  ): TopicSelectionAgentExecutionMode {
    const slotId = slot.slot_id as TopicSelectionV1aGenerateNeedCandidateDebateSlotId;
    const executionMode = input.slot_execution_overrides?.[slotId] ?? input.node_input.execution_mode;
    if (!slot.allowed_execution_modes.includes(executionMode)) {
      throw new AppError(
        400,
        'INVALID_PAYLOAD',
        `${slot.slot_id} does not allow execution_mode=${executionMode}.`,
      );
    }
    if (executionMode === 'codex_assisted' && !slot.codex_substitution_policy.allowed) {
      throw new AppError(
        400,
        'INVALID_PAYLOAD',
        `${slot.slot_id} does not allow codex_assisted substitution.`,
      );
    }
    if (
      executionMode === 'codex_assisted'
      && !slot.codex_substitution_policy.allowed_run_modes.includes(input.run_mode)
    ) {
      throw new AppError(
        400,
        'INVALID_PAYLOAD',
        `${slot.slot_id} does not allow codex_assisted in run_mode=${input.run_mode}.`,
      );
    }
    return executionMode;
  }

  private slotModelOptionId(
    input: TopicSelectionNeedDiscoveryDebateLoopInput,
    slot: TopicSelectionDebateRoleStageSlot,
    executionMode: TopicSelectionAgentExecutionMode,
  ): string | null {
    if (executionMode !== 'provider_llm') {
      return null;
    }
    const slotId = slot.slot_id as TopicSelectionV1aGenerateNeedCandidateDebateSlotId;
    return input.slot_model_option_overrides?.[slotId]?.trim()
      || input.model_option_id?.trim()
      || null;
  }

  private assertKnownSlotExecutionOverrides(
    input: TopicSelectionNeedDiscoveryDebateLoopInput,
  ): void {
    const overrides = input.slot_execution_overrides ?? {};
    const knownSlotIds = new Set(NEED_DISCOVERY_DEBATE_CONTRACT.role_stage_slots.map((slot) => slot.slot_id));
    for (const slotId of Object.keys(overrides)) {
      if (!knownSlotIds.has(slotId)) {
        throw new AppError(400, 'INVALID_PAYLOAD', `Unknown debate slot execution override: ${slotId}.`);
      }
    }
  }

  private assertSlotModelOptionOverrides(
    input: TopicSelectionNeedDiscoveryDebateLoopInput,
  ): void {
    const overrides = input.slot_model_option_overrides ?? {};
    if (typeof overrides !== 'object' || Array.isArray(overrides)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'slot_model_option_overrides must be an object keyed by debate slot id.');
    }
    const knownSlotIds = new Set(NEED_DISCOVERY_DEBATE_CONTRACT.role_stage_slots.map((slot) => slot.slot_id));
    for (const [slotId, modelOptionId] of Object.entries(overrides)) {
      if (!knownSlotIds.has(slotId)) {
        throw new AppError(400, 'INVALID_PAYLOAD', `Unknown debate slot model option override: ${slotId}.`);
      }
      if (typeof modelOptionId !== 'string' || !modelOptionId.trim()) {
        throw new AppError(400, 'INVALID_PAYLOAD', `${slotId} model_option_id override must be a non-empty string.`);
      }
      const slot = roleStageSlot(slotId);
      const executionMode = this.slotExecutionMode(input, slot);
      if (executionMode !== 'provider_llm') {
        throw new AppError(
          400,
          'INVALID_PAYLOAD',
          `${slotId} model_option_id override requires execution_mode=provider_llm.`,
        );
      }
    }
  }

  private hash(value: unknown): string {
    return sha256Text(stableStringify(value));
  }
}
