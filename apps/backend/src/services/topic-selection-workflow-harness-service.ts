import type {
  TopicSelectionActorType,
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionAgentExecutionMode,
  TopicSelectionArtifactFunctionalRef,
  TopicSelectionGenerateNeedCandidateArtifactRefEntry,
  TopicSelectionGenerateNeedCandidateNodeInput,
  TopicSelectionNeedDiscoveryArbiterContextPayload,
  TopicSelectionNeedDiscoveryExplorationContextPayload,
  TopicSelectionRankedCandidateDraftBatch,
  TopicSelectionSupplementalRoundRoutingDecisionKind,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import { AppError } from '../errors/app-error.js';
import type {
  TopicSelectionAgentRunMode,
  TopicSelectionCodexAssistedAgentOutput,
  TopicSelectionExecutorKind,
  TopicSelectionMockedAgentOutput,
} from './topic-selection-agent-orchestrator-service.js';
import {
  type CompileNeedDiscoveryContextPairInput,
  type TopicSelectionNeedDiscoveryCompiledContextPairResult,
  TopicSelectionNeedDiscoveryContextCompilerService,
} from './topic-selection-need-discovery-context-compiler-service.js';
import { TopicSelectionNeedDiscoveryArtifactBoundaryService } from './topic-selection-need-discovery-artifact-boundary-service.js';
import {
  type TopicSelectionGenerateNeedCandidateOrchestratorAdapterResult,
  type TopicSelectionGenerateNeedCandidatePersistenceContext,
  TopicSelectionGenerateNeedCandidateOrchestratorAdapterService,
} from './topic-selection-generate-need-candidate-orchestrator-adapter-service.js';
import type {
  TopicSelectionNeedDiscoveryDebateCodexResponses,
  TopicSelectionNeedDiscoveryDebateMockedOutputs,
} from './topic-selection-need-discovery-debate-loop-service.js';
import type {
  TopicSelectionV1aGenerateNeedCandidateDebateSlotExecutionOverrides,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-debate-scenario-contracts';

const GENERATE_NEED_CANDIDATE_NODE_ID = 'topic-selection.v1a.generate-need-candidate.v1' as const;
const HARNESS_TRACE_PAYLOAD_SCHEMA = 'WorkflowHarnessGenerateNeedCandidateScenarioTrace@v1';

export type TopicSelectionWorkflowHarnessAssertion = {
  assertion_id: string;
  passed: boolean;
  message: string;
  expected?: unknown;
  actual?: unknown;
};

export type TopicSelectionWorkflowHarnessExpectation = {
  status?: TopicSelectionGenerateNeedCandidateOrchestratorAdapterResult['status'];
  routing_decision?: TopicSelectionSupplementalRoundRoutingDecisionKind | null;
  admitted_draft_count?: number | null;
  persisted_candidate_count?: number | null;
  error_code?: string | null;
  blocker_codes?: string[];
  persistence?: 'required' | 'forbidden' | 'optional';
};

export type TopicSelectionWorkflowHarnessGenerateNeedCandidateInput = {
  scenario_id: string;
  scenario_case_id?: string | null;
  workspace_id?: string | null;
  title_card_id: string;
  workflow_run_id: string;
  input_snapshot_id?: string | null;
  node_attempt_id: string;
  topic_scope_ref: TopicSelectionFunctionalRef;
  evidence_map_ref: TopicSelectionFunctionalRef;
  evidence_strength_ref: TopicSelectionFunctionalRef;
  resource_sample_set_ref?: TopicSelectionFunctionalRef | null;
  candidate_pool_projection_ref?: TopicSelectionFunctionalRef | null;
  search_snapshot_refs: TopicSelectionFunctionalRef[];
  resource_snapshot_refs: TopicSelectionFunctionalRef[];
  context_input_refs?: TopicSelectionFunctionalRef[];
  policy_version: string;
  output_schema_version: string;
  profile_id: string;
  execution_mode: TopicSelectionAgentExecutionMode;
  run_mode: TopicSelectionAgentRunMode;
  executor_kind?: TopicSelectionExecutorKind;
  debate_loop_id?: string | null;
  debate_policy_id?: string | null;
  debate_slot_execution_overrides?: TopicSelectionV1aGenerateNeedCandidateDebateSlotExecutionOverrides | null;
  debate_mocked_outputs?: TopicSelectionNeedDiscoveryDebateMockedOutputs | null;
  debate_codex_responses?: TopicSelectionNeedDiscoveryDebateCodexResponses | null;
  exploration_payload: TopicSelectionNeedDiscoveryExplorationContextPayload;
  arbiter_payload: TopicSelectionNeedDiscoveryArbiterContextPayload;
  mocked_output?: TopicSelectionMockedAgentOutput<TopicSelectionRankedCandidateDraftBatch> | null;
  codex_response?: TopicSelectionCodexAssistedAgentOutput<TopicSelectionRankedCandidateDraftBatch> | null;
  model_option_id?: string | null;
  current_round_index?: number | null;
  remaining_round_budget?: number | null;
  persist_admitted_candidates?: boolean;
  persistence_context?: TopicSelectionGenerateNeedCandidatePersistenceContext | null;
  expectations?: TopicSelectionWorkflowHarnessExpectation;
  created_by?: TopicSelectionActorType;
};

export type TopicSelectionWorkflowHarnessTraceSnapshot = {
  schema_version: 'topic-selection-workflow-harness-trace-v1';
  scenario_id: string;
  scenario_case_id: string | null;
  node_id: typeof GENERATE_NEED_CANDIDATE_NODE_ID;
  workflow_run_id: string;
  node_attempt_id: string;
  scenario_status: 'passed' | 'failed';
  execution_mode: TopicSelectionAgentExecutionMode;
  run_mode: TopicSelectionAgentRunMode;
  adapter_status: TopicSelectionGenerateNeedCandidateOrchestratorAdapterResult['status'];
  routing_decision: TopicSelectionSupplementalRoundRoutingDecisionKind | null;
  context_packet_refs: TopicSelectionArtifactFunctionalRef[];
  artifact_refs: TopicSelectionArtifactFunctionalRef[];
  authority_refs: TopicSelectionFunctionalRef[];
  warning_codes: string[];
  blocker_codes: string[];
  assertions: TopicSelectionWorkflowHarnessAssertion[];
  created_at: string;
};

export type TopicSelectionWorkflowHarnessGenerateNeedCandidateResult = {
  schema_version: 'v1';
  scenario_id: string;
  scenario_case_id: string | null;
  node_id: typeof GENERATE_NEED_CANDIDATE_NODE_ID;
  workflow_run_id: string;
  node_attempt_id: string;
  scenario_status: 'passed' | 'failed';
  node_input: TopicSelectionGenerateNeedCandidateNodeInput;
  compiled_context: TopicSelectionNeedDiscoveryCompiledContextPairResult;
  adapter_result: TopicSelectionGenerateNeedCandidateOrchestratorAdapterResult;
  assertions: TopicSelectionWorkflowHarnessAssertion[];
  harness_trace_snapshot: TopicSelectionWorkflowHarnessTraceSnapshot;
  harness_trace_artifact: TopicSelectionGenerateNeedCandidateArtifactRefEntry;
};

export class TopicSelectionWorkflowHarnessService {
  private readonly now: () => string;

  constructor(
    private readonly dependencies: {
      contextCompiler: TopicSelectionNeedDiscoveryContextCompilerService;
      generateNeedCandidateAdapter: TopicSelectionGenerateNeedCandidateOrchestratorAdapterService;
      artifactBoundary: TopicSelectionNeedDiscoveryArtifactBoundaryService;
    },
    options: {
      now?: () => string;
    } = {},
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async runGenerateNeedCandidateScenario(
    input: TopicSelectionWorkflowHarnessGenerateNeedCandidateInput,
  ): Promise<TopicSelectionWorkflowHarnessGenerateNeedCandidateResult> {
    this.assertScenarioInput(input);
    const compiledContext = await this.dependencies.contextCompiler.compileContextPair(
      this.contextCompileInput(input),
    );
    const nodeInput = this.nodeInput(input, compiledContext);
    const adapterResult = await this.dependencies.generateNeedCandidateAdapter.generateRankedCandidateDraftBatch({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      node_input: nodeInput,
      run_mode: input.run_mode,
      executor_kind: input.executor_kind,
      model_option_id: input.model_option_id ?? null,
      debate_loop_id: input.debate_loop_id ?? null,
      debate_policy_id: input.debate_policy_id ?? null,
      debate_slot_execution_overrides: input.debate_slot_execution_overrides ?? null,
      debate_mocked_outputs: input.debate_mocked_outputs ?? null,
      debate_codex_responses: input.debate_codex_responses ?? null,
      mocked_output: input.mocked_output ?? null,
      codex_response: input.codex_response ?? null,
      current_round_index: input.current_round_index ?? null,
      remaining_round_budget: input.remaining_round_budget ?? null,
      persist_admitted_candidates: input.persist_admitted_candidates ?? false,
      persistence_context: input.persistence_context ?? null,
      created_by: input.created_by ?? 'system',
    });

    const assertions = this.evaluateAssertions(input, adapterResult);
    const scenarioStatus = assertions.every((assertion) => assertion.passed) ? 'passed' : 'failed';
    const traceSnapshot = this.traceSnapshot({
      input,
      compiledContext,
      adapterResult,
      assertions,
      scenarioStatus,
    });
    const traceArtifact = await this.dependencies.artifactBoundary.recordArtifact({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      workflow_run_id: input.workflow_run_id,
      node_attempt_id: input.node_attempt_id,
      artifact_key: 'discovery_audit',
      payload_schema: HARNESS_TRACE_PAYLOAD_SCHEMA,
      payload: traceSnapshot as unknown as Record<string, unknown>,
      source_refs: this.traceSourceRefs(compiledContext, adapterResult),
      created_by: input.created_by ?? 'system',
    });

    return {
      schema_version: 'v1',
      scenario_id: input.scenario_id,
      scenario_case_id: input.scenario_case_id ?? null,
      node_id: GENERATE_NEED_CANDIDATE_NODE_ID,
      workflow_run_id: input.workflow_run_id,
      node_attempt_id: input.node_attempt_id,
      scenario_status: scenarioStatus,
      node_input: nodeInput,
      compiled_context: compiledContext,
      adapter_result: adapterResult,
      assertions,
      harness_trace_snapshot: traceSnapshot,
      harness_trace_artifact: traceArtifact.artifact_entry,
    };
  }

  private contextCompileInput(
    input: TopicSelectionWorkflowHarnessGenerateNeedCandidateInput,
  ): CompileNeedDiscoveryContextPairInput {
    return {
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      workflow_run_id: input.workflow_run_id,
      input_snapshot_id: input.input_snapshot_id ?? null,
      node_attempt_id: input.node_attempt_id,
      input_refs: input.context_input_refs ?? this.defaultContextInputRefs(input),
      policy_version: input.policy_version,
      output_schema_version: input.output_schema_version,
      profile_id: input.profile_id,
      execution_mode: input.execution_mode,
      exploration_payload: input.exploration_payload,
      arbiter_payload: input.arbiter_payload,
      created_by: input.created_by ?? 'system',
    };
  }

  private nodeInput(
    input: TopicSelectionWorkflowHarnessGenerateNeedCandidateInput,
    compiledContext: TopicSelectionNeedDiscoveryCompiledContextPairResult,
  ): TopicSelectionGenerateNeedCandidateNodeInput {
    return {
      schema_version: input.output_schema_version,
      workflow_run_id: input.workflow_run_id,
      node_attempt_id: input.node_attempt_id,
      topic_scope_ref: input.topic_scope_ref,
      evidence_map_ref: input.evidence_map_ref,
      evidence_strength_ref: input.evidence_strength_ref,
      resource_sample_set_ref: input.resource_sample_set_ref ?? null,
      candidate_pool_projection_ref: input.candidate_pool_projection_ref ?? null,
      search_snapshot_refs: input.search_snapshot_refs,
      resource_snapshot_refs: input.resource_snapshot_refs,
      exploration_context_ref: compiledContext.exploration_context_ref,
      arbiter_context_ref: compiledContext.arbiter_context_ref,
      execution_mode: input.execution_mode,
      profile_id: input.profile_id,
      policy_version: input.policy_version,
      operator_reuse_approval_ref: null,
    };
  }

  private evaluateAssertions(
    input: TopicSelectionWorkflowHarnessGenerateNeedCandidateInput,
    adapterResult: TopicSelectionGenerateNeedCandidateOrchestratorAdapterResult,
  ): TopicSelectionWorkflowHarnessAssertion[] {
    const expectations = input.expectations ?? {};
    const assertions: TopicSelectionWorkflowHarnessAssertion[] = [
      this.assertion(
        'execution_mode_propagated',
        adapterResult.invocation_result.provenance.execution_mode === input.execution_mode,
        'Agent invocation provenance must use the scenario execution mode.',
        input.execution_mode,
        adapterResult.invocation_result.provenance.execution_mode,
      ),
      this.assertion(
        'node_attempt_propagated',
        adapterResult.node_attempt_id === input.node_attempt_id,
        'Adapter result must belong to the scenario node attempt.',
        input.node_attempt_id,
        adapterResult.node_attempt_id,
      ),
      this.assertion(
        'persistence_requires_finalize',
        !adapterResult.persist_need_candidate_batch_result
          || adapterResult.supplemental_round_routing_decision?.routing_decision === 'finalize_with_admitted_batch',
        'NeedCandidate persistence may only happen after finalize_with_admitted_batch routing.',
        'finalize_with_admitted_batch',
        adapterResult.supplemental_round_routing_decision?.routing_decision ?? null,
      ),
    ];

    if (input.persist_admitted_candidates !== true) {
      assertions.push(this.assertion(
        'explicit_persistence_only',
        adapterResult.persist_need_candidate_batch_result === null,
        'Harness scenarios must not persist NeedCandidates unless persist_admitted_candidates is explicit.',
        null,
        adapterResult.persist_need_candidate_batch_result,
      ));
    }
    if (expectations.status) {
      assertions.push(this.assertion(
        'expected_adapter_status',
        adapterResult.status === expectations.status,
        'Adapter status must match scenario expectation.',
        expectations.status,
        adapterResult.status,
      ));
    }
    if (expectations.routing_decision !== undefined) {
      assertions.push(this.assertion(
        'expected_routing_decision',
        (adapterResult.supplemental_round_routing_decision?.routing_decision ?? null) === expectations.routing_decision,
        'Supplemental routing decision must match scenario expectation.',
        expectations.routing_decision,
        adapterResult.supplemental_round_routing_decision?.routing_decision ?? null,
      ));
    }
    if (expectations.admitted_draft_count !== undefined && expectations.admitted_draft_count !== null) {
      const admittedCount = adapterResult.candidate_draft_admission_report?.draft_results
        .filter((result) => result.decision === 'admit').length ?? 0;
      assertions.push(this.assertion(
        'expected_admitted_draft_count',
        admittedCount === expectations.admitted_draft_count,
        'Admitted draft count must match scenario expectation.',
        expectations.admitted_draft_count,
        admittedCount,
      ));
    }
    if (expectations.persisted_candidate_count !== undefined && expectations.persisted_candidate_count !== null) {
      const persistedCount = adapterResult.persist_need_candidate_batch_result?.persisted_candidate_refs.length ?? 0;
      assertions.push(this.assertion(
        'expected_persisted_candidate_count',
        persistedCount === expectations.persisted_candidate_count,
        'Persisted NeedCandidate count must match scenario expectation.',
        expectations.persisted_candidate_count,
        persistedCount,
      ));
    }
    if (expectations.error_code !== undefined) {
      assertions.push(this.assertion(
        'expected_error_code',
        (adapterResult.error_code ?? null) === expectations.error_code,
        'Adapter error code must match scenario expectation.',
        expectations.error_code,
        adapterResult.error_code ?? null,
      ));
    }
    if (expectations.blocker_codes) {
      const missing = expectations.blocker_codes.filter((code) => !adapterResult.blocker_codes.includes(code));
      assertions.push(this.assertion(
        'expected_blocker_codes',
        missing.length === 0,
        'Adapter blocker codes must include expected scenario blockers.',
        expectations.blocker_codes,
        adapterResult.blocker_codes,
      ));
    }
    if (expectations.persistence === 'required') {
      assertions.push(this.assertion(
        'expected_persistence_required',
        Boolean(adapterResult.persist_need_candidate_batch_command && adapterResult.persist_need_candidate_batch_result),
        'Scenario requires a persisted NeedCandidate batch command and result.',
        'persisted batch result',
        adapterResult.persist_need_candidate_batch_result,
      ));
    }
    if (expectations.persistence === 'forbidden') {
      assertions.push(this.assertion(
        'expected_persistence_forbidden',
        adapterResult.persist_need_candidate_batch_command === null
          && adapterResult.persist_need_candidate_batch_result === null,
        'Scenario forbids authority persistence.',
        null,
        adapterResult.persist_need_candidate_batch_result,
      ));
    }
    return assertions;
  }

  private traceSnapshot(input: {
    input: TopicSelectionWorkflowHarnessGenerateNeedCandidateInput;
    compiledContext: TopicSelectionNeedDiscoveryCompiledContextPairResult;
    adapterResult: TopicSelectionGenerateNeedCandidateOrchestratorAdapterResult;
    assertions: TopicSelectionWorkflowHarnessAssertion[];
    scenarioStatus: 'passed' | 'failed';
  }): TopicSelectionWorkflowHarnessTraceSnapshot {
    return {
      schema_version: 'topic-selection-workflow-harness-trace-v1',
      scenario_id: input.input.scenario_id,
      scenario_case_id: input.input.scenario_case_id ?? null,
      node_id: GENERATE_NEED_CANDIDATE_NODE_ID,
      workflow_run_id: input.input.workflow_run_id,
      node_attempt_id: input.input.node_attempt_id,
      scenario_status: input.scenarioStatus,
      execution_mode: input.input.execution_mode,
      run_mode: input.input.run_mode,
      adapter_status: input.adapterResult.status,
      routing_decision: input.adapterResult.supplemental_round_routing_decision?.routing_decision ?? null,
      context_packet_refs: [
        input.compiledContext.exploration_context_ref,
        input.compiledContext.arbiter_context_ref,
      ],
      artifact_refs: this.uniqueArtifactRefs([
        input.compiledContext.exploration_context_ref,
        input.compiledContext.arbiter_context_ref,
        ...this.adapterArtifactRefs(input.adapterResult),
      ]),
      authority_refs: input.adapterResult.persist_need_candidate_batch_result?.persisted_candidate_refs ?? [],
      warning_codes: input.adapterResult.invocation_result.warning_codes,
      blocker_codes: input.adapterResult.blocker_codes,
      assertions: input.assertions,
      created_at: this.now(),
    };
  }

  private traceSourceRefs(
    compiledContext: TopicSelectionNeedDiscoveryCompiledContextPairResult,
    adapterResult: TopicSelectionGenerateNeedCandidateOrchestratorAdapterResult,
  ): TopicSelectionFunctionalRef[] {
    return this.uniqueRefs([
      compiledContext.exploration_context_ref,
      compiledContext.arbiter_context_ref,
      adapterResult.invocation_result.audit_artifact_ref ?? null,
      ...this.adapterArtifactRefs(adapterResult),
      ...(adapterResult.persist_need_candidate_batch_result?.persisted_candidate_refs ?? []),
    ]);
  }

  private adapterArtifactRefs(
    adapterResult: TopicSelectionGenerateNeedCandidateOrchestratorAdapterResult,
  ): TopicSelectionArtifactFunctionalRef[] {
    return [
      adapterResult.ranked_candidate_draft_batch_artifact?.artifact_ref ?? null,
      ...(adapterResult.debate_result?.role_output_artifacts.map((artifact) => artifact.artifact_ref) ?? []),
      ...(adapterResult.debate_result?.role_level_summary_artifacts.map((artifact) => artifact.artifact_ref) ?? []),
      adapterResult.debate_result?.issue_frame_artifact?.artifact_ref ?? null,
      adapterResult.debate_result?.final_synthesis_artifact?.artifact_ref ?? null,
      adapterResult.minimum_schema_validation_report_artifact?.artifact_ref ?? null,
      adapterResult.candidate_draft_admission_report_artifact?.artifact_ref ?? null,
      adapterResult.supplemental_round_routing_decision_artifact?.artifact_ref ?? null,
      adapterResult.persist_need_candidate_batch_command_artifact?.artifact_ref ?? null,
    ].filter((ref): ref is TopicSelectionArtifactFunctionalRef => Boolean(ref));
  }

  private defaultContextInputRefs(
    input: TopicSelectionWorkflowHarnessGenerateNeedCandidateInput,
  ): TopicSelectionFunctionalRef[] {
    return this.uniqueRefs([
      input.topic_scope_ref,
      input.evidence_map_ref,
      input.evidence_strength_ref,
      input.resource_sample_set_ref ?? null,
      input.candidate_pool_projection_ref ?? null,
      ...input.search_snapshot_refs,
      ...input.resource_snapshot_refs,
    ]);
  }

  private assertion(
    assertionId: string,
    passed: boolean,
    message: string,
    expected?: unknown,
    actual?: unknown,
  ): TopicSelectionWorkflowHarnessAssertion {
    return {
      assertion_id: assertionId,
      passed,
      message,
      expected,
      actual,
    };
  }

  private assertScenarioInput(input: TopicSelectionWorkflowHarnessGenerateNeedCandidateInput): void {
    this.assertNonEmpty(input.scenario_id, 'scenario_id');
    this.assertNonEmpty(input.title_card_id, 'title_card_id');
    this.assertNonEmpty(input.workflow_run_id, 'workflow_run_id');
    this.assertNonEmpty(input.node_attempt_id, 'node_attempt_id');
    this.assertNonEmpty(input.policy_version, 'policy_version');
    this.assertNonEmpty(input.output_schema_version, 'output_schema_version');
    this.assertNonEmpty(input.profile_id, 'profile_id');
    this.assertFunctionalRef(input.topic_scope_ref, 'topic_scope_ref');
    this.assertFunctionalRef(input.evidence_map_ref, 'evidence_map_ref');
    this.assertFunctionalRef(input.evidence_strength_ref, 'evidence_strength_ref');
    if (input.resource_sample_set_ref) {
      this.assertFunctionalRef(input.resource_sample_set_ref, 'resource_sample_set_ref');
    }
    if (input.candidate_pool_projection_ref) {
      this.assertFunctionalRef(input.candidate_pool_projection_ref, 'candidate_pool_projection_ref');
    }
    this.assertFunctionalRefs(input.search_snapshot_refs, 'search_snapshot_refs');
    this.assertFunctionalRefs(input.resource_snapshot_refs, 'resource_snapshot_refs');
    if (input.context_input_refs) {
      this.assertFunctionalRefs(input.context_input_refs, 'context_input_refs');
    }
  }

  private assertFunctionalRefs(value: unknown, fieldName: string): asserts value is TopicSelectionFunctionalRef[] {
    if (!Array.isArray(value)) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} must be an array.`);
    }
    value.forEach((ref, index) => this.assertFunctionalRef(ref, `${fieldName}[${index}]`));
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

  private uniqueRefs(refs: Array<TopicSelectionFunctionalRef | null | undefined>): TopicSelectionFunctionalRef[] {
    const seen = new Set<string>();
    const result: TopicSelectionFunctionalRef[] = [];
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

  private uniqueArtifactRefs(
    refs: Array<TopicSelectionArtifactFunctionalRef | null | undefined>,
  ): TopicSelectionArtifactFunctionalRef[] {
    return this.uniqueRefs(refs).filter((ref): ref is TopicSelectionArtifactFunctionalRef =>
      ref.ref_type === 'artifact_ref',
    );
  }
}
