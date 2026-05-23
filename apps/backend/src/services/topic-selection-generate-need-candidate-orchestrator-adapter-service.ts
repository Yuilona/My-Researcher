import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import {
  topicSelectionRankedCandidateDraftBatchSchema,
  type TopicSelectionCandidateDraftAdmissionReport,
  type TopicSelectionGenerateNeedCandidateArtifactRefEntry,
  type TopicSelectionGenerateNeedCandidateNodeInput,
  type TopicSelectionNeedDiscoveryContextPacket,
  type TopicSelectionPersistNeedCandidateBatchCommand,
  type TopicSelectionRankedCandidateDraftBatch,
  type TopicSelectionRankedCandidateDraftBatchMinimumValidationReport,
  type TopicSelectionSupplementalRoundRoutingDecision,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import { AppError } from '../errors/app-error.js';
import {
  stableStringify,
} from './literature-content-processing-utils.js';
import {
  type TopicSelectionAgentInvocationResult,
  type TopicSelectionAgentRunMode,
  type TopicSelectionCodexAssistedAgentOutput,
  type TopicSelectionExecutorKind,
  type TopicSelectionMockedAgentOutput,
  TopicSelectionAgentOrchestratorService,
} from './topic-selection-agent-orchestrator-service.js';
import { TopicSelectionCandidateDraftAdmissionService } from './topic-selection-candidate-draft-admission-service.js';
import { TopicSelectionNeedDiscoveryArtifactBoundaryService } from './topic-selection-need-discovery-artifact-boundary-service.js';
import { TopicSelectionNeedDiscoveryContextCompilerService } from './topic-selection-need-discovery-context-compiler-service.js';
import {
  type TopicSelectionNeedDiscoveryDebateCodexResponses,
  type TopicSelectionNeedDiscoveryDebateLoopResult,
  TopicSelectionNeedDiscoveryDebateLoopService,
  type TopicSelectionNeedDiscoveryDebateMockedOutputs,
} from './topic-selection-need-discovery-debate-loop-service.js';
import type {
  TopicSelectionV1aGenerateNeedCandidateDebateSlotExecutionOverrides,
  TopicSelectionV1aGenerateNeedCandidateDebateSlotModelOptionOverrides,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-debate-scenario-contracts';
import {
  TopicSelectionPersistNeedCandidateBatchService,
  type TopicSelectionPersistNeedCandidateBatchResult,
} from './topic-selection-persist-need-candidate-batch-service.js';
import { TopicSelectionRankedCandidateDraftBatchValidatorService } from './topic-selection-ranked-candidate-draft-batch-validator-service.js';
import { TopicSelectionSupplementalRoundRoutingService } from './topic-selection-supplemental-round-routing-service.js';

const GENERATE_NEED_CANDIDATE_NODE_ID = 'topic-selection.v1a.generate-need-candidate.v1' as const;
const PROMPT_TEMPLATE_ID = 'topic-selection-generate-need-candidate';
const PROMPT_TEMPLATE_VERSION = 'v1';
const RANKED_BATCH_SCHEMA_NAME = 'topic_selection_ranked_candidate_draft_batch';
const RANKED_BATCH_PAYLOAD_SCHEMA = 'RankedCandidateDraftBatch@v1';
const MINIMUM_SCHEMA_VALIDATION_PAYLOAD_SCHEMA = 'RankedCandidateDraftBatchMinimumValidationReport@v1';
const CANDIDATE_DRAFT_ADMISSION_PAYLOAD_SCHEMA = 'CandidateDraftAdmissionReport@v1';
const SUPPLEMENTAL_ROUND_ROUTING_PAYLOAD_SCHEMA = 'SupplementalRoundRoutingDecision@v1';
const PERSIST_NEED_CANDIDATE_BATCH_PAYLOAD_SCHEMA = 'PersistNeedCandidateBatchCommand@v1';

export type TopicSelectionGenerateNeedCandidatePersistenceContext = {
  search_run_ref: TopicSelectionFunctionalRef;
  search_plan_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
};

export type TopicSelectionGenerateNeedCandidateOrchestratorAdapterInput = {
  workspace_id?: string | null;
  title_card_id?: string | null;
  node_input: TopicSelectionGenerateNeedCandidateNodeInput;
  run_mode: TopicSelectionAgentRunMode;
  executor_kind?: TopicSelectionExecutorKind;
  model_option_id?: string | null;
  debate_loop_id?: string | null;
  debate_policy_id?: string | null;
  debate_slot_execution_overrides?: TopicSelectionV1aGenerateNeedCandidateDebateSlotExecutionOverrides | null;
  debate_slot_model_option_overrides?: TopicSelectionV1aGenerateNeedCandidateDebateSlotModelOptionOverrides | null;
  debate_mocked_outputs?: TopicSelectionNeedDiscoveryDebateMockedOutputs | null;
  debate_codex_responses?: TopicSelectionNeedDiscoveryDebateCodexResponses | null;
  mocked_output?: TopicSelectionMockedAgentOutput<TopicSelectionRankedCandidateDraftBatch> | null;
  codex_response?: TopicSelectionCodexAssistedAgentOutput<TopicSelectionRankedCandidateDraftBatch> | null;
  current_round_index?: number | null;
  remaining_round_budget?: number | null;
  persist_admitted_candidates?: boolean;
  persistence_context?: TopicSelectionGenerateNeedCandidatePersistenceContext | null;
  created_by?: 'human' | 'llm' | 'system' | 'hybrid';
};

export type TopicSelectionGenerateNeedCandidateOrchestratorAdapterResult = {
  schema_version: 'v1';
  node_id: typeof GENERATE_NEED_CANDIDATE_NODE_ID;
  workflow_run_id: string;
  node_attempt_id: string;
  status: 'succeeded' | 'blocked' | 'require_human_review';
  ranked_candidate_draft_batch: TopicSelectionRankedCandidateDraftBatch | null;
  ranked_candidate_draft_batch_artifact?: TopicSelectionGenerateNeedCandidateArtifactRefEntry | null;
  minimum_schema_validation_report: TopicSelectionRankedCandidateDraftBatchMinimumValidationReport | null;
  minimum_schema_validation_report_artifact?: TopicSelectionGenerateNeedCandidateArtifactRefEntry | null;
  candidate_draft_admission_report: TopicSelectionCandidateDraftAdmissionReport | null;
  candidate_draft_admission_report_artifact?: TopicSelectionGenerateNeedCandidateArtifactRefEntry | null;
  supplemental_round_routing_decision: TopicSelectionSupplementalRoundRoutingDecision | null;
  supplemental_round_routing_decision_artifact?: TopicSelectionGenerateNeedCandidateArtifactRefEntry | null;
  persist_need_candidate_batch_command: TopicSelectionPersistNeedCandidateBatchCommand | null;
  persist_need_candidate_batch_command_artifact?: TopicSelectionGenerateNeedCandidateArtifactRefEntry | null;
  persist_need_candidate_batch_result?: TopicSelectionPersistNeedCandidateBatchResult | null;
  exploration_context_packet: TopicSelectionNeedDiscoveryContextPacket;
  arbiter_context_packet: TopicSelectionNeedDiscoveryContextPacket;
  invocation_result: TopicSelectionAgentInvocationResult<unknown>;
  debate_result?: TopicSelectionNeedDiscoveryDebateLoopResult | null;
  blocker_codes: string[];
  error_code?: string | null;
};

export class TopicSelectionGenerateNeedCandidateOrchestratorAdapterService {
  private readonly draftBatchValidator: TopicSelectionRankedCandidateDraftBatchValidatorService;
  private readonly candidateDraftAdmission: TopicSelectionCandidateDraftAdmissionService;
  private readonly supplementalRouting: TopicSelectionSupplementalRoundRoutingService;
  private readonly needCandidateBatchPersistence: TopicSelectionPersistNeedCandidateBatchService | null;
  private readonly debateLoop: TopicSelectionNeedDiscoveryDebateLoopService;

  constructor(
    private readonly dependencies: {
      contextCompiler: TopicSelectionNeedDiscoveryContextCompilerService;
      agentOrchestrator: TopicSelectionAgentOrchestratorService;
      artifactBoundary: TopicSelectionNeedDiscoveryArtifactBoundaryService;
      draftBatchValidator?: TopicSelectionRankedCandidateDraftBatchValidatorService;
      candidateDraftAdmission?: TopicSelectionCandidateDraftAdmissionService;
      supplementalRouting?: TopicSelectionSupplementalRoundRoutingService;
      needCandidateBatchPersistence?: TopicSelectionPersistNeedCandidateBatchService | null;
      debateLoop?: TopicSelectionNeedDiscoveryDebateLoopService;
    },
  ) {
    this.draftBatchValidator = dependencies.draftBatchValidator
      ?? new TopicSelectionRankedCandidateDraftBatchValidatorService();
    this.candidateDraftAdmission = dependencies.candidateDraftAdmission
      ?? new TopicSelectionCandidateDraftAdmissionService();
    this.supplementalRouting = dependencies.supplementalRouting
      ?? new TopicSelectionSupplementalRoundRoutingService();
    this.needCandidateBatchPersistence = dependencies.needCandidateBatchPersistence ?? null;
    this.debateLoop = dependencies.debateLoop
      ?? new TopicSelectionNeedDiscoveryDebateLoopService({
        agentOrchestrator: dependencies.agentOrchestrator,
        artifactBoundary: dependencies.artifactBoundary,
      });
  }

  async generateRankedCandidateDraftBatch(
    input: TopicSelectionGenerateNeedCandidateOrchestratorAdapterInput,
  ): Promise<TopicSelectionGenerateNeedCandidateOrchestratorAdapterResult> {
    this.assertNodeInput(input.node_input);
    const explorationContext = await this.dependencies.contextCompiler.resolveContextPacket(
      input.node_input.exploration_context_ref,
      {
        title_card_id: input.title_card_id,
        workflow_run_id: input.node_input.workflow_run_id,
        node_attempt_id: input.node_input.node_attempt_id,
        context_family: 'exploration_context',
        policy_version: input.node_input.policy_version,
        output_schema_version: input.node_input.schema_version,
        profile_id: input.node_input.profile_id,
        execution_mode: input.node_input.execution_mode,
      },
    );
    const arbiterContext = await this.dependencies.contextCompiler.resolveContextPacket(
      input.node_input.arbiter_context_ref,
      {
        title_card_id: input.title_card_id,
        workflow_run_id: input.node_input.workflow_run_id,
        node_attempt_id: input.node_input.node_attempt_id,
        context_family: 'arbiter_context',
        policy_version: input.node_input.policy_version,
        output_schema_version: input.node_input.schema_version,
        profile_id: input.node_input.profile_id,
        execution_mode: input.node_input.execution_mode,
      },
    );

    const debateResult = input.executor_kind === 'multi_agent_debate'
      ? await this.debateLoop.runNeedDiscoveryDebate({
        workspace_id: input.workspace_id ?? null,
        title_card_id: input.title_card_id ?? null,
        node_input: input.node_input,
        run_mode: input.run_mode,
        exploration_context_packet: explorationContext,
        arbiter_context_packet: arbiterContext,
        debate_loop_id: input.debate_loop_id ?? null,
        debate_policy_id: input.debate_policy_id ?? null,
        round_index: input.current_round_index ?? 1,
        slot_execution_overrides: input.debate_slot_execution_overrides ?? null,
        slot_model_option_overrides: input.debate_slot_model_option_overrides ?? null,
        mocked_outputs: input.debate_mocked_outputs ?? null,
        codex_responses: input.debate_codex_responses ?? null,
        model_option_id: input.model_option_id ?? null,
        created_by: input.created_by ?? 'system',
      })
      : null;
    const invocationResult = debateResult?.final_invocation_result
      ?? await this.dependencies.agentOrchestrator.invokeStructuredOutput<TopicSelectionRankedCandidateDraftBatch>({
        workspace_id: input.workspace_id ?? null,
        title_card_id: input.title_card_id ?? null,
        node_id: GENERATE_NEED_CANDIDATE_NODE_ID,
        workflow_run_id: input.node_input.workflow_run_id,
        node_attempt_id: input.node_input.node_attempt_id,
        execution_mode: input.node_input.execution_mode,
        executor_kind: input.executor_kind ?? 'single_agent',
        run_mode: input.run_mode,
        profile_id: input.node_input.profile_id,
        output_contract: RANKED_BATCH_PAYLOAD_SCHEMA,
        model_option_id: input.model_option_id ?? null,
        prompt: {
          promptTemplateId: PROMPT_TEMPLATE_ID,
          version: PROMPT_TEMPLATE_VERSION,
        },
        schema_name: RANKED_BATCH_SCHEMA_NAME,
        schema: topicSelectionRankedCandidateDraftBatchSchema as unknown as Record<string, unknown>,
        messages: this.buildMessages(input.node_input, explorationContext, arbiterContext),
        input_refs: this.inputRefs(input.node_input),
        context_packet_refs: [
          input.node_input.exploration_context_ref,
          input.node_input.arbiter_context_ref,
        ],
        mocked_output: input.mocked_output ?? null,
        codex_response: input.codex_response ?? null,
        created_by: input.created_by ?? 'system',
      });
    const rankedCandidateDraftBatch = debateResult?.ranked_candidate_draft_batch
      ?? invocationResult.structured_output as TopicSelectionRankedCandidateDraftBatch | null;

    if (invocationResult.status !== 'succeeded' || !rankedCandidateDraftBatch) {
      return {
        schema_version: 'v1',
        node_id: GENERATE_NEED_CANDIDATE_NODE_ID,
        workflow_run_id: input.node_input.workflow_run_id,
        node_attempt_id: input.node_input.node_attempt_id,
        status: 'blocked',
        ranked_candidate_draft_batch: null,
        ranked_candidate_draft_batch_artifact: null,
        minimum_schema_validation_report: null,
        minimum_schema_validation_report_artifact: null,
        candidate_draft_admission_report: null,
        candidate_draft_admission_report_artifact: null,
        supplemental_round_routing_decision: null,
        supplemental_round_routing_decision_artifact: null,
        persist_need_candidate_batch_command: null,
        persist_need_candidate_batch_command_artifact: null,
        persist_need_candidate_batch_result: null,
        exploration_context_packet: explorationContext,
        arbiter_context_packet: arbiterContext,
        invocation_result: invocationResult,
        debate_result: debateResult,
        blocker_codes: invocationResult.blocker_codes,
        error_code: invocationResult.error_code ?? 'AGENT_INVOCATION_BLOCKED',
      };
    }

    const minimumSchemaValidationReport = this.draftBatchValidator.validate({
      node_input: input.node_input,
      ranked_candidate_draft_batch: rankedCandidateDraftBatch,
      max_persisted_candidates: arbiterContext.context_family === 'arbiter_context'
        ? arbiterContext.payload.max_persisted_candidates
        : undefined,
    });
    const minimumSchemaValidationArtifact = await this.dependencies.artifactBoundary.recordArtifact({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id ?? null,
      workflow_run_id: input.node_input.workflow_run_id,
      node_attempt_id: input.node_input.node_attempt_id,
      artifact_key: 'minimum_schema_validation_report',
      payload_schema: MINIMUM_SCHEMA_VALIDATION_PAYLOAD_SCHEMA,
      payload: minimumSchemaValidationReport as unknown as Record<string, unknown>,
      source_refs: [
        input.node_input.exploration_context_ref,
        input.node_input.arbiter_context_ref,
        ...this.inputRefs(input.node_input),
      ],
      created_by: input.created_by ?? 'system',
    });

    if (!minimumSchemaValidationReport.valid) {
      return {
        schema_version: 'v1',
        node_id: GENERATE_NEED_CANDIDATE_NODE_ID,
        workflow_run_id: input.node_input.workflow_run_id,
        node_attempt_id: input.node_input.node_attempt_id,
        status: 'blocked',
        ranked_candidate_draft_batch: null,
        ranked_candidate_draft_batch_artifact: null,
        minimum_schema_validation_report: minimumSchemaValidationReport,
        minimum_schema_validation_report_artifact: minimumSchemaValidationArtifact.artifact_entry,
        candidate_draft_admission_report: null,
        candidate_draft_admission_report_artifact: null,
        supplemental_round_routing_decision: null,
        supplemental_round_routing_decision_artifact: null,
        persist_need_candidate_batch_command: null,
        persist_need_candidate_batch_command_artifact: null,
        persist_need_candidate_batch_result: null,
        exploration_context_packet: explorationContext,
        arbiter_context_packet: arbiterContext,
        invocation_result: invocationResult,
        debate_result: debateResult,
        blocker_codes: minimumSchemaValidationReport.blocking_reason_codes,
        error_code: 'INVALID_RANKED_CANDIDATE_DRAFT_BATCH',
      };
    }

    const rankedBatchArtifact = await this.dependencies.artifactBoundary.recordArtifact({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id ?? null,
      workflow_run_id: input.node_input.workflow_run_id,
      node_attempt_id: input.node_input.node_attempt_id,
      artifact_key: 'ranked_candidate_draft_batch',
      payload_schema: RANKED_BATCH_PAYLOAD_SCHEMA,
      payload: rankedCandidateDraftBatch as unknown as Record<string, unknown>,
      source_refs: [
        ...this.debateArtifactRefs(debateResult).map((artifact) => artifact.artifact_ref),
        input.node_input.exploration_context_ref,
        input.node_input.arbiter_context_ref,
        ...this.inputRefs(input.node_input),
      ],
      created_by: input.created_by ?? 'system',
    });

    const candidateDraftAdmissionReport = this.candidateDraftAdmission.createAdmissionReport({
      node_input: input.node_input,
      ranked_candidate_draft_batch: rankedCandidateDraftBatch,
      minimum_validation_report: minimumSchemaValidationReport,
      resolvable_refs: this.contextResolvableRefs(input.node_input, explorationContext, arbiterContext),
      candidate_pool_entries: this.candidatePoolEntries(arbiterContext),
      max_persisted_candidates: minimumSchemaValidationReport.max_persisted_candidates,
      remaining_round_budget: input.remaining_round_budget ?? 0,
    });
    const candidateDraftAdmissionArtifact = await this.dependencies.artifactBoundary.recordArtifact({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id ?? null,
      workflow_run_id: input.node_input.workflow_run_id,
      node_attempt_id: input.node_input.node_attempt_id,
      artifact_key: 'candidate_draft_admission_report',
      payload_schema: CANDIDATE_DRAFT_ADMISSION_PAYLOAD_SCHEMA,
      payload: candidateDraftAdmissionReport as unknown as Record<string, unknown>,
      source_refs: [
        rankedBatchArtifact.artifact_entry.artifact_ref,
        minimumSchemaValidationArtifact.artifact_entry.artifact_ref,
        input.node_input.exploration_context_ref,
        input.node_input.arbiter_context_ref,
      ],
      created_by: input.created_by ?? 'system',
    });

    const supplementalRoundRoutingDecision = this.supplementalRouting.createRoutingDecision({
      admission_report: candidateDraftAdmissionReport,
      current_round_index: input.current_round_index ?? 1,
      remaining_round_budget: input.remaining_round_budget ?? 0,
    });
    const supplementalRoundRoutingArtifact = await this.dependencies.artifactBoundary.recordArtifact({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id ?? null,
      workflow_run_id: input.node_input.workflow_run_id,
      node_attempt_id: input.node_input.node_attempt_id,
      artifact_key: 'supplemental_round_routing_decision',
      payload_schema: SUPPLEMENTAL_ROUND_ROUTING_PAYLOAD_SCHEMA,
      payload: supplementalRoundRoutingDecision as unknown as Record<string, unknown>,
      source_refs: [
        rankedBatchArtifact.artifact_entry.artifact_ref,
        minimumSchemaValidationArtifact.artifact_entry.artifact_ref,
        candidateDraftAdmissionArtifact.artifact_entry.artifact_ref,
        input.node_input.exploration_context_ref,
        input.node_input.arbiter_context_ref,
      ],
      created_by: input.created_by ?? 'system',
    });

    const adapterStatus = this.adapterStatusForRoutingDecision(supplementalRoundRoutingDecision);
    const blockerCodes = this.blockerCodesForRoutingDecision(
      supplementalRoundRoutingDecision,
      candidateDraftAdmissionReport,
    );
    const persistenceResult = await this.maybePersistAdmittedCandidates({
      input,
      rankedBatch: rankedCandidateDraftBatch,
      admissionReport: candidateDraftAdmissionReport,
      rankedBatchArtifact,
      candidateDraftAdmissionArtifact,
      supplementalRoundRoutingDecision,
      supplementalRoundRoutingArtifact,
    });

    return {
      schema_version: 'v1',
      node_id: GENERATE_NEED_CANDIDATE_NODE_ID,
      workflow_run_id: input.node_input.workflow_run_id,
      node_attempt_id: input.node_input.node_attempt_id,
      status: adapterStatus,
      ranked_candidate_draft_batch: rankedCandidateDraftBatch,
      ranked_candidate_draft_batch_artifact: rankedBatchArtifact.artifact_entry,
      minimum_schema_validation_report: minimumSchemaValidationReport,
      minimum_schema_validation_report_artifact: minimumSchemaValidationArtifact.artifact_entry,
      candidate_draft_admission_report: candidateDraftAdmissionReport,
      candidate_draft_admission_report_artifact: candidateDraftAdmissionArtifact.artifact_entry,
      supplemental_round_routing_decision: supplementalRoundRoutingDecision,
      supplemental_round_routing_decision_artifact: supplementalRoundRoutingArtifact.artifact_entry,
      persist_need_candidate_batch_command: persistenceResult?.command ?? null,
      persist_need_candidate_batch_command_artifact: persistenceResult?.commandArtifact ?? null,
      persist_need_candidate_batch_result: persistenceResult?.result ?? null,
      exploration_context_packet: explorationContext,
      arbiter_context_packet: arbiterContext,
      invocation_result: invocationResult,
      debate_result: debateResult,
      blocker_codes: blockerCodes,
      error_code: this.errorCodeForRoutingDecision(supplementalRoundRoutingDecision, candidateDraftAdmissionReport),
    };
  }

  private async maybePersistAdmittedCandidates(input: {
    input: TopicSelectionGenerateNeedCandidateOrchestratorAdapterInput;
    rankedBatch: TopicSelectionRankedCandidateDraftBatch;
    admissionReport: TopicSelectionCandidateDraftAdmissionReport;
    rankedBatchArtifact: { artifact_entry: TopicSelectionGenerateNeedCandidateArtifactRefEntry };
    candidateDraftAdmissionArtifact: { artifact_entry: TopicSelectionGenerateNeedCandidateArtifactRefEntry };
    supplementalRoundRoutingDecision: TopicSelectionSupplementalRoundRoutingDecision;
    supplementalRoundRoutingArtifact: { artifact_entry: TopicSelectionGenerateNeedCandidateArtifactRefEntry };
  }): Promise<{
    command: TopicSelectionPersistNeedCandidateBatchCommand;
    commandArtifact: TopicSelectionGenerateNeedCandidateArtifactRefEntry;
    result: TopicSelectionPersistNeedCandidateBatchResult;
  } | null> {
    if (
      !input.input.persist_admitted_candidates
      || input.supplementalRoundRoutingDecision.routing_decision !== 'finalize_with_admitted_batch'
    ) {
      return null;
    }
    if (!this.needCandidateBatchPersistence) {
      throw new AppError(
        400,
        'INVALID_PAYLOAD',
        'persist_admitted_candidates requires needCandidateBatchPersistence dependency.',
      );
    }
    if (!input.input.persistence_context) {
      throw new AppError(
        400,
        'INVALID_PAYLOAD',
        'persist_admitted_candidates requires persistence_context.',
      );
    }

    const command = this.needCandidateBatchPersistence.buildCommand({
      node_input: input.input.node_input,
      ranked_candidate_draft_batch: input.rankedBatch,
      admission_report: input.admissionReport,
      ranked_candidate_draft_batch_artifact_ref: input.rankedBatchArtifact.artifact_entry.artifact_ref,
      admission_report_artifact_ref: input.candidateDraftAdmissionArtifact.artifact_entry.artifact_ref,
      supplemental_routing_artifact_refs: [input.supplementalRoundRoutingArtifact.artifact_entry.artifact_ref],
    });
    const commandArtifact = await this.dependencies.artifactBoundary.recordArtifact({
      workspace_id: input.input.workspace_id ?? null,
      title_card_id: input.input.title_card_id ?? null,
      workflow_run_id: input.input.node_input.workflow_run_id,
      node_attempt_id: input.input.node_input.node_attempt_id,
      artifact_key: 'persist_need_candidate_batch_command',
      payload_schema: PERSIST_NEED_CANDIDATE_BATCH_PAYLOAD_SCHEMA,
      payload: command as unknown as Record<string, unknown>,
      source_refs: [
        input.rankedBatchArtifact.artifact_entry.artifact_ref,
        input.candidateDraftAdmissionArtifact.artifact_entry.artifact_ref,
        input.supplementalRoundRoutingArtifact.artifact_entry.artifact_ref,
      ],
      created_by: input.input.created_by ?? 'system',
    });
    const result = await this.needCandidateBatchPersistence.persistBatch({
      command,
      workspace_id: input.input.workspace_id ?? null,
      title_card_id: input.input.title_card_id ?? null,
      search_run_ref: input.input.persistence_context.search_run_ref,
      search_plan_ref: input.input.persistence_context.search_plan_ref,
      literature_snapshot_ref: input.input.persistence_context.literature_snapshot_ref,
      persist_command_artifact_ref: commandArtifact.artifact_entry.artifact_ref,
      created_by: input.input.created_by ?? 'system',
    });

    return {
      command,
      commandArtifact: commandArtifact.artifact_entry,
      result,
    };
  }

  private adapterStatusForRoutingDecision(
    decision: TopicSelectionSupplementalRoundRoutingDecision,
  ): TopicSelectionGenerateNeedCandidateOrchestratorAdapterResult['status'] {
    if (decision.routing_decision === 'require_human_review') {
      return 'require_human_review';
    }
    if (decision.routing_decision === 'block' || decision.routing_decision === 'reject_without_supplement') {
      return 'blocked';
    }
    return 'succeeded';
  }

  private blockerCodesForRoutingDecision(
    decision: TopicSelectionSupplementalRoundRoutingDecision,
    admissionReport: TopicSelectionCandidateDraftAdmissionReport,
  ): string[] {
    if (
      decision.routing_decision === 'finalize_with_admitted_batch'
      || decision.routing_decision === 'run_supplemental_round'
    ) {
      return [];
    }
    return this.uniqueStrings([
      ...admissionReport.blocking_reason_codes,
      ...decision.trigger_reason_codes,
    ]);
  }

  private errorCodeForRoutingDecision(
    decision: TopicSelectionSupplementalRoundRoutingDecision,
    admissionReport: TopicSelectionCandidateDraftAdmissionReport,
  ): string | null {
    if (
      decision.routing_decision === 'finalize_with_admitted_batch'
      || decision.routing_decision === 'run_supplemental_round'
      || decision.routing_decision === 'require_human_review'
    ) {
      return null;
    }
    return admissionReport.blocking_reason_codes[0]
      ?? decision.trigger_reason_codes[0]
      ?? 'NO_ADMISSIBLE_NEED_CANDIDATE';
  }

  private buildMessages(
    nodeInput: TopicSelectionGenerateNeedCandidateNodeInput,
    explorationContext: TopicSelectionNeedDiscoveryContextPacket,
    arbiterContext: TopicSelectionNeedDiscoveryContextPacket,
  ): Array<{ role: 'system' | 'user'; content: string }> {
    return [
      {
        role: 'system',
        content: [
          'Generate a RankedCandidateDraftBatch for the v1a topic-selection generate-need-candidate node.',
          'Use only the supplied refs and context packets.',
          'The candidate_pool_digest and sibling_candidate_digest describe existing sibling candidates for duplicate awareness only; an empty pool means there are no known duplicates, not that generation should stop.',
          'Generate new candidate drafts from the evidence signals, evidence_ref_table, resource sample digest, and challenge prompts.',
          'Do not create NeedCandidate, ValidatedNeed, TopicQuestionContract, SearchPlan, or any authority record.',
          'Do not include hidden reasoning, raw transcripts, provider logs, credentials, or secrets.',
          'Return only the structured output matching the ranked candidate draft batch schema.',
        ].join(' '),
      },
      {
        role: 'user',
        content: stableStringify({
          node_input: nodeInput,
          context_packets: {
            exploration_context: {
              input_refs_hash: explorationContext.input_refs_hash,
              payload_hash: explorationContext.payload_hash,
              cache_key: explorationContext.cache_key,
              payload: explorationContext.payload,
            },
            arbiter_context: {
              input_refs_hash: arbiterContext.input_refs_hash,
              payload_hash: arbiterContext.payload_hash,
              cache_key: arbiterContext.cache_key,
              payload: arbiterContext.payload,
            },
          },
          output_constraints: {
            schema_name: RANKED_BATCH_SCHEMA_NAME,
            max_persisted_candidates: arbiterContext.context_family === 'arbiter_context'
              ? arbiterContext.payload.max_persisted_candidates
              : 5,
            authority_write_boundary: 'artifact-only ranked draft batch; no authority writes',
            candidate_pool_digest_role: 'existing_sibling_candidates_for_duplicate_awareness',
            empty_candidate_pool_meaning: 'no known duplicate candidates; still generate new drafts from evidence',
            generation_source: 'evidence signals and refs, not pre-existing candidate pool entries',
          },
        }),
      },
    ];
  }

  private contextResolvableRefs(
    nodeInput: TopicSelectionGenerateNeedCandidateNodeInput,
    explorationContext: TopicSelectionNeedDiscoveryContextPacket,
    arbiterContext: TopicSelectionNeedDiscoveryContextPacket,
  ): TopicSelectionFunctionalRef[] {
    const arbiterPayload = arbiterContext.context_family === 'arbiter_context'
      ? arbiterContext.payload
      : null;
    return this.uniqueRefs([
      ...this.inputRefs(nodeInput),
      ...explorationContext.input_refs,
      ...arbiterContext.input_refs,
      ...this.extractFunctionalRefs(arbiterPayload?.evidence_ref_table),
      ...this.extractFunctionalRefs(arbiterPayload?.rejected_framing_table),
      ...this.extractFunctionalRefs(arbiterPayload?.unresolved_points),
    ]);
  }

  private candidatePoolEntries(
    arbiterContext: TopicSelectionNeedDiscoveryContextPacket,
  ): Array<{ normalized_candidate_key: string; candidate_ref: TopicSelectionFunctionalRef }> {
    if (arbiterContext.context_family !== 'arbiter_context') {
      return [];
    }
    const digest = arbiterContext.payload.candidate_pool_digest;
    if (!this.isRecord(digest) || !Array.isArray(digest.candidate_entries)) {
      return [];
    }
    return digest.candidate_entries
      .map((entry) => {
        if (!this.isRecord(entry) || typeof entry.normalized_candidate_key !== 'string') {
          return null;
        }
        const candidateRef = this.readFunctionalRef(entry.candidate_ref);
        if (!candidateRef) {
          return null;
        }
        return {
          normalized_candidate_key: entry.normalized_candidate_key,
          candidate_ref: candidateRef,
        };
      })
      .filter((entry): entry is { normalized_candidate_key: string; candidate_ref: TopicSelectionFunctionalRef } =>
        Boolean(entry),
      );
  }

  private debateArtifactRefs(
    debateResult: TopicSelectionNeedDiscoveryDebateLoopResult | null,
  ): TopicSelectionGenerateNeedCandidateArtifactRefEntry[] {
    if (!debateResult) {
      return [];
    }
    return [
      ...debateResult.role_output_artifacts,
      ...debateResult.role_level_summary_artifacts,
      debateResult.issue_frame_artifact,
      debateResult.final_synthesis_artifact,
    ].filter((artifact): artifact is TopicSelectionGenerateNeedCandidateArtifactRefEntry => Boolean(artifact));
  }

  private inputRefs(input: TopicSelectionGenerateNeedCandidateNodeInput): TopicSelectionFunctionalRef[] {
    return [
      input.topic_scope_ref,
      input.evidence_map_ref,
      input.evidence_strength_ref,
      input.resource_sample_set_ref,
      input.candidate_pool_projection_ref,
      ...input.search_snapshot_refs,
      ...input.resource_snapshot_refs,
      input.operator_reuse_approval_ref,
    ].filter((ref): ref is TopicSelectionFunctionalRef => Boolean(ref));
  }

  private extractFunctionalRefs(value: unknown): TopicSelectionFunctionalRef[] {
    if (Array.isArray(value)) {
      return value.flatMap((item) => this.extractFunctionalRefs(item));
    }
    const ref = this.readFunctionalRef(value);
    if (ref) {
      return [ref];
    }
    if (!this.isRecord(value)) {
      return [];
    }
    return Object.values(value).flatMap((item) => this.extractFunctionalRefs(item));
  }

  private readFunctionalRef(value: unknown): TopicSelectionFunctionalRef | null {
    if (!this.isRecord(value)) {
      return null;
    }
    if (typeof value.ref_type !== 'string' || typeof value.ref_id !== 'string') {
      return null;
    }
    return value as unknown as TopicSelectionFunctionalRef;
  }

  private uniqueRefs(refs: TopicSelectionFunctionalRef[]): TopicSelectionFunctionalRef[] {
    const seen = new Set<string>();
    const unique: TopicSelectionFunctionalRef[] = [];
    for (const ref of refs) {
      const key = `${ref.ref_type}:${ref.ref_id}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(ref);
    }
    return unique;
  }

  private uniqueStrings(values: string[]): string[] {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const value of values) {
      const normalized = value.trim();
      if (!normalized || seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      unique.push(normalized);
    }
    return unique;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
  }

  private assertNodeInput(input: TopicSelectionGenerateNeedCandidateNodeInput): void {
    this.assertNonEmpty(input.schema_version, 'schema_version');
    this.assertNonEmpty(input.workflow_run_id, 'workflow_run_id');
    this.assertNonEmpty(input.node_attempt_id, 'node_attempt_id');
    this.assertNonEmpty(input.profile_id, 'profile_id');
    this.assertNonEmpty(input.policy_version, 'policy_version');
    this.assertArtifactRef(input.exploration_context_ref, 'exploration_context_ref');
    this.assertArtifactRef(input.arbiter_context_ref, 'arbiter_context_ref');
    for (const [index, ref] of this.inputRefs(input).entries()) {
      this.assertFunctionalRef(ref, `input_ref[${index}]`);
    }
  }

  private assertArtifactRef(value: TopicSelectionFunctionalRef, fieldName: string): void {
    this.assertFunctionalRef(value, fieldName);
    if (value.ref_type !== 'artifact_ref') {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName}.ref_type must be artifact_ref.`);
    }
  }

  private assertFunctionalRef(value: TopicSelectionFunctionalRef, fieldName: string): void {
    if (!value || typeof value !== 'object') {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} must be a functional ref.`);
    }
    this.assertNonEmpty(value.ref_type, `${fieldName}.ref_type`);
    this.assertNonEmpty(value.ref_id, `${fieldName}.ref_id`);
  }

  private assertNonEmpty(value: string, fieldName: string): void {
    if (!value.trim()) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} cannot be empty.`);
    }
  }
}
