import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionArtifactFunctionalRef,
  TopicSelectionNeedDiscoveryArbiterContextPayload,
  TopicSelectionNeedDiscoveryDebateIssueFrame,
  TopicSelectionNeedDiscoveryDeepCriticNotes,
  TopicSelectionNeedDiscoveryExplorerNotes,
  TopicSelectionNeedDiscoveryExplorationContextPayload,
  TopicSelectionRankedCandidateDraftBatch,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import { AppError } from '../errors/app-error.js';
import { InMemoryTopicSelectionControlPlaneRepository } from '../repositories/in-memory-topic-selection-control-plane-repository.js';
import { InMemoryTopicSelectionNeedValidationRepository } from '../repositories/in-memory-topic-selection-need-validation-repository.js';
import { TopicSelectionAgentOrchestratorService } from './topic-selection-agent-orchestrator-service.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import {
  type LlmCallTelemetry,
  type LlmStructuredOutputRequest,
  type LlmStructuredOutputResponse,
} from './llm-gateway.js';
import { TopicSelectionGenerateNeedCandidateOrchestratorAdapterService } from './topic-selection-generate-need-candidate-orchestrator-adapter-service.js';
import { TopicSelectionNeedDiscoveryArtifactBoundaryService } from './topic-selection-need-discovery-artifact-boundary-service.js';
import { TopicSelectionNeedDiscoveryContextCompilerService } from './topic-selection-need-discovery-context-compiler-service.js';
import { TopicSelectionPersistNeedCandidateBatchService } from './topic-selection-persist-need-candidate-batch-service.js';
import { TopicSelectionRankedCandidateDraftBatchValidatorService } from './topic-selection-ranked-candidate-draft-batch-validator-service.js';
import {
  type TopicSelectionWorkflowHarnessGenerateNeedCandidateInput,
  TopicSelectionWorkflowHarnessService,
} from './topic-selection-workflow-harness-service.js';
import {
  TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
  TOPIC_SELECTION_NEED_DISCOVERY_ARBITER_FINAL_PROFILE_ID,
} from './topic-selection-model-profile-registry-service.js';

class StubLlmGateway {
  readonly calls: LlmStructuredOutputRequest[] = [];

  constructor(private readonly output: TopicSelectionRankedCandidateDraftBatch) {}

  async createStructuredOutput<T>(
    request: LlmStructuredOutputRequest,
  ): Promise<LlmStructuredOutputResponse<T>> {
    this.calls.push(request);
    return {
      parsed: this.output as T,
      raw: { output: this.output },
      telemetry: telemetry(),
    };
  }
}

async function makeRuntime() {
  const controlPlaneRepository = new InMemoryTopicSelectionControlPlaneRepository();
  let sequence = 0;
  const controlPlane = new TopicSelectionControlPlaneService(controlPlaneRepository, {
    idFactory: (prefix) => `${prefix}_${++sequence}`,
    now: () => '2026-05-19T00:00:00.000Z',
  });
  const artifactBoundary = new TopicSelectionNeedDiscoveryArtifactBoundaryService(controlPlane);
  const contextCompiler = new TopicSelectionNeedDiscoveryContextCompilerService(artifactBoundary, {
    now: () => '2026-05-19T00:00:00.000Z',
  });
  const needValidationRepository = new InMemoryTopicSelectionNeedValidationRepository();
  const needCandidateBatchPersistence = new TopicSelectionPersistNeedCandidateBatchService(
    needValidationRepository,
    { now: () => '2026-05-19T00:00:00.000Z' },
  );
  const llmGateway = new StubLlmGateway(rankedBatch());
  const agentOrchestrator = new TopicSelectionAgentOrchestratorService({
    controlPlane,
    llmGateway,
    now: () => '2026-05-19T00:00:00.000Z',
  });
  const generateNeedCandidateAdapter = new TopicSelectionGenerateNeedCandidateOrchestratorAdapterService({
    contextCompiler,
    agentOrchestrator,
    artifactBoundary,
    draftBatchValidator: new TopicSelectionRankedCandidateDraftBatchValidatorService({
      now: () => '2026-05-19T00:00:00.000Z',
    }),
    needCandidateBatchPersistence,
  });
  const workflowHarness = new TopicSelectionWorkflowHarnessService({
    contextCompiler,
    generateNeedCandidateAdapter,
    artifactBoundary,
  }, {
    now: () => '2026-05-19T00:00:00.000Z',
  });

  return {
    workflowHarness,
    controlPlaneRepository,
    needValidationRepository,
    llmGateway,
  };
}

function ref(refType: string, refId: string): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: 'title_card_001',
  };
}

function artifactRef(refId: string): TopicSelectionArtifactFunctionalRef {
  return {
    ref_type: 'artifact_ref',
    ref_id: refId,
    title_card_id: 'title_card_001',
  };
}

function telemetry(): LlmCallTelemetry {
  return {
    provider_id: 'openai',
    model_id: 'gpt-test',
    profile_id: TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
    prompt_template_id: 'topic-selection-generate-need-candidate',
    prompt_template_version: 'v1',
    elapsed_ms: 12,
    request_count: 1,
    retry_count: 0,
    timeout_count: 0,
    rate_limit_count: 0,
    input_tokens: null,
    output_tokens: null,
    embedding_input_tokens: null,
    total_tokens: null,
    cost_usd: null,
  };
}

function explorationPayload(): TopicSelectionNeedDiscoveryExplorationContextPayload {
  return {
    topic_scope: {
      title_card_id: 'title_card_001',
      domain: 'RAG fine-tuning safety',
    },
    evidence_signal_digest: {
      support_count: 2,
      challenge_count: 1,
    },
    resource_sample_digest: {
      sample_set_id: 'sample_set_001',
      role_counts: { support: 2, challenge: 1, baseline: 1 },
    },
    search_coverage_digest: {
      coverage: 'partial',
    },
    sibling_candidate_digest: {
      candidate_count: 0,
    },
    decision_memory_digest: {
      required_challenges: ['avoid pseudo-gap framing'],
    },
    exploration_prompts: ['Generate specific, evidence-grounded candidate needs.'],
    challenge_prompts: ['Identify prior-art conflicts and pseudo-gap risks.'],
    allowed_outputs: ['ranked_candidate_draft_batch'],
    forbidden_outputs: ['need_candidate_authority_write', 'validated_need_write'],
  };
}

function arbiterPayload(): TopicSelectionNeedDiscoveryArbiterContextPayload {
  return {
    node_policy_ref: ref('node_policy', 'generate_need_candidate_v1'),
    output_schema_ref: ref('schema', 'ranked_candidate_draft_batch_v1'),
    authority_boundary: {
      authority_object: 'NeedCandidate',
      forbidden: ['NeedCandidateSet', 'ValidatedNeed', 'TopicQuestionContract'],
    },
    max_persisted_candidates: 5,
    deterministic_gate_checklist: ['schema_validation', 'admission_gates'],
    role_level_summaries: [{ role: 'single_agent', summary: 'context-ready' }],
    candidate_pool_digest: { candidate_count: 0 },
    evidence_ref_table: [
      { evidence_ref: ref('evidence_unit', 'support_001'), role: 'support' },
      { evidence_ref: ref('evidence_unit', 'challenge_001'), role: 'challenge' },
      { evidence_ref: ref('evidence_unit', 'baseline_001'), role: 'baseline' },
      { evidence_ref: ref('evidence_conflict', 'conflict_001'), role: 'challenge' },
      { evidence_ref: ref('evidence_strength_assessment', 'strength_001'), role: 'strength' },
    ],
    rejected_framing_table: [],
    unresolved_points: [],
    batch_ranking_rules: ['rank grounded drafts first'],
    persistence_rules: ['artifact-only until admission gates'],
    failure_rules: ['block when malformed'],
  };
}

function rankedBatch(nodeAttemptId = 'node_attempt_001'): TopicSelectionRankedCandidateDraftBatch {
  return {
    schema_version: 'v1',
    draft_batch: {
      batch_id: nodeAttemptId === 'node_attempt_001' ? 'draft_batch_001' : `draft_batch_${nodeAttemptId}`,
      node_attempt_id: nodeAttemptId,
      terminal_result: 'finalize',
      ranking_rationale: 'Grounded in support and challenge evidence.',
      max_persisted_candidates: 5,
    },
    drafts: [
      {
        draft_id: 'draft_001',
        rank: 1,
        candidate_need: 'Need a risk-aware evaluation workflow for RAG fine-tuning.',
        unmet_need_statement: 'Existing studies do not isolate retrieval-risk effects during fine-tuning.',
        mechanism_type: 'evaluation_gap',
        mechanism_summary: 'Risk-aware evaluation gap.',
        mechanism_payload: { axis: 'retrieval-risk' },
        scope_notes: 'CS literature workflow only.',
        non_goal_notes: null,
        prior_art_status: 'partial_solution_known',
        evidence_role_bundle: {
          support_unit_refs: [ref('evidence_unit', 'support_001')],
          challenge_unit_refs: [ref('evidence_unit', 'challenge_001')],
          baseline_unit_refs: [ref('evidence_unit', 'baseline_001')],
          context_unit_refs: [],
        },
        conflict_refs: [ref('evidence_conflict', 'conflict_001')],
        strength_assessment_refs: [ref('evidence_strength_assessment', 'strength_001')],
        accepted_risk_refs: [],
        gap_codes: ['risk_evaluation_gap'],
        speculative: false,
        confidence: 0.82,
      },
    ],
    rejected_framings: [],
    unresolved_points: [],
  };
}

function explorerNotes(agentInstanceId: string, angleId: string): TopicSelectionNeedDiscoveryExplorerNotes {
  return {
    schema_version: 'v1',
    debate_loop_id: 'debate_loop_001',
    round_index: 1,
    role: 'explorer',
    stage: 'round_1_discovery',
    agent_instance_id: agentInstanceId,
    candidate_angles: [
      {
        angle_id: angleId,
        summary: 'Evaluate RAG fine-tuning risk interactions.',
        candidate_need_hint: 'Need a risk-aware evaluation workflow for RAG fine-tuning.',
        evidence_refs: [ref('evidence_unit', 'support_001')],
      },
    ],
    evidence_refs: [ref('evidence_unit', 'support_001')],
    unresolved_questions: ['Which retrieval risks survive fine-tuning?'],
    warnings: [],
  };
}

function deepCriticNotes(): TopicSelectionNeedDiscoveryDeepCriticNotes {
  return {
    schema_version: 'v1',
    debate_loop_id: 'debate_loop_001',
    round_index: 1,
    role: 'deep_critic',
    stage: 'round_1_discovery',
    agent_instance_id: 'deep_critic_1',
    critique_points: [
      {
        critique_id: 'critique_001',
        summary: 'Pseudo-gap risk unless challenge evidence is carried into evaluation.',
        severity: 'high',
        evidence_refs: [ref('evidence_unit', 'challenge_001')],
      },
    ],
    failure_modes: ['overstating novelty without benchmark comparison'],
    missing_evidence_questions: ['What benchmark baseline exists?'],
    evidence_refs: [ref('evidence_unit', 'challenge_001')],
    warnings: ['baseline coverage is thin'],
  };
}

function issueFrame(): TopicSelectionNeedDiscoveryDebateIssueFrame {
  return {
    schema_version: 'v1',
    debate_loop_id: 'debate_loop_001',
    round_index: 1,
    role: 'arbiter',
    stage: 'issue_framing',
    frame_id: 'issue_frame_001',
    focused_questions: ['Can the candidate need stay grounded while carrying challenge evidence?'],
    requested_roles: ['explorer', 'deep_critic'],
    source_role_summary_refs: [artifactRef('role_summary_explorer'), artifactRef('role_summary_deep_critic')],
    stop_condition: null,
  };
}

function normalizedCandidateKey(batch = rankedBatch()): string {
  const draft = batch.drafts[0];
  return `${draft.candidate_need} ${draft.unmet_need_statement}`
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

function scenarioInput(
  overrides: Partial<TopicSelectionWorkflowHarnessGenerateNeedCandidateInput> = {},
): TopicSelectionWorkflowHarnessGenerateNeedCandidateInput {
  return {
    scenario_id: 'topic-selection.debate.v1a-need-discovery.v1',
    scenario_case_id: 'mocked-finalize-persist',
    workspace_id: 'workspace_001',
    title_card_id: 'title_card_001',
    workflow_run_id: 'workflow_run_001',
    input_snapshot_id: 'input_snapshot_001',
    node_attempt_id: 'node_attempt_001',
    topic_scope_ref: ref('topic_scope', 'topic_scope_001'),
    evidence_map_ref: ref('evidence_map', 'evidence_map_001'),
    evidence_strength_ref: ref('evidence_strength_assessment', 'strength_001'),
    resource_sample_set_ref: ref('resource_sample_set', 'sample_set_001'),
    candidate_pool_projection_ref: null,
    search_snapshot_refs: [ref('search_run', 'search_run_001')],
    resource_snapshot_refs: [ref('literature_snapshot', 'literature_snapshot_001')],
    policy_version: 'v1',
    output_schema_version: 'v1',
    profile_id: TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
    execution_mode: 'mocked_llm',
    run_mode: 'acceptance',
    exploration_payload: explorationPayload(),
    arbiter_payload: arbiterPayload(),
    mocked_output: {
      fixture_id: 'fixture_generate_need_candidate_happy_path',
      output: rankedBatch(),
    },
    persist_admitted_candidates: true,
    persistence_context: {
      search_run_ref: ref('search_run', 'search_run_001'),
      search_plan_ref: ref('search_plan', 'search_plan_001'),
      literature_snapshot_ref: ref('literature_snapshot', 'literature_snapshot_001'),
    },
    expectations: {
      status: 'succeeded',
      routing_decision: 'finalize_with_admitted_batch',
      admitted_draft_count: 1,
      persisted_candidate_count: 1,
      persistence: 'required',
    },
    ...overrides,
  };
}

test('workflow harness runs generate-need-candidate finalize scenario through persistence boundary', async () => {
  const { workflowHarness, controlPlaneRepository, needValidationRepository, llmGateway } = await makeRuntime();
  const result = await workflowHarness.runGenerateNeedCandidateScenario(scenarioInput());

  assert.equal(result.scenario_status, 'passed');
  assert.equal(result.adapter_result.status, 'succeeded');
  assert.equal(
    result.adapter_result.supplemental_round_routing_decision?.routing_decision,
    'finalize_with_admitted_batch',
  );
  assert.equal(result.adapter_result.persist_need_candidate_batch_result?.persisted_candidate_refs.length, 1);
  assert.equal((await needValidationRepository.listNeedCandidatesByTitleCardId('title_card_001')).length, 1);
  assert.equal(result.harness_trace_artifact.artifact_key, 'discovery_audit');
  assert.equal(
    result.harness_trace_snapshot.authority_refs[0]?.ref_type,
    'need_candidate',
  );
  assert.equal(llmGateway.calls.length, 0);

  const artifacts = await controlPlaneRepository.listArtifactRefsByWorkflowRunId('workflow_run_001');
  assert.equal(
    artifacts.some((artifact) =>
      JSON.stringify(artifact.payload).includes('"payload_schema":"WorkflowHarnessGenerateNeedCandidateScenarioTrace@v1"'),
    ),
    true,
  );
});

test('workflow harness can drive mocked multi-agent debate without authority persistence', async () => {
  const { workflowHarness, controlPlaneRepository, needValidationRepository, llmGateway } = await makeRuntime();
  const result = await workflowHarness.runGenerateNeedCandidateScenario(scenarioInput({
    scenario_case_id: 'mocked-debate-finalize-artifact-only',
    profile_id: TOPIC_SELECTION_NEED_DISCOVERY_ARBITER_FINAL_PROFILE_ID,
    executor_kind: 'multi_agent_debate',
    debate_loop_id: 'debate_loop_001',
    mocked_output: null,
    debate_mocked_outputs: {
      explorer: [
        { fixture_id: 'fixture_explorer_1', output: explorerNotes('explorer_1', 'angle_001') },
        { fixture_id: 'fixture_explorer_2', output: explorerNotes('explorer_2', 'angle_002') },
      ],
      deep_critic: [
        { fixture_id: 'fixture_deep_critic_1', output: deepCriticNotes() },
      ],
      arbiter_issue_frame: {
        fixture_id: 'fixture_arbiter_issue_frame',
        output: issueFrame(),
      },
      arbiter_final: {
        fixture_id: 'fixture_arbiter_final',
        output: rankedBatch(),
      },
    },
    persist_admitted_candidates: false,
    expectations: {
      status: 'succeeded',
      routing_decision: 'finalize_with_admitted_batch',
      admitted_draft_count: 1,
      persisted_candidate_count: 0,
      persistence: 'forbidden',
    },
  }));

  assert.equal(result.scenario_status, 'passed');
  assert.equal(result.adapter_result.debate_result?.status, 'succeeded');
  assert.equal(result.adapter_result.debate_result?.role_invocation_results.length, 4);
  assert.equal(result.adapter_result.debate_result?.role_output_artifacts.length, 3);
  assert.equal(result.adapter_result.debate_result?.role_level_summary_artifacts.length, 2);
  assert.equal(result.adapter_result.debate_result?.issue_frame_artifact?.artifact_key, 'debate_issue_frame');
  assert.equal(result.adapter_result.debate_result?.final_synthesis_artifact?.artifact_key, 'debate_final_synthesis');
  assert.equal(result.adapter_result.invocation_result.provenance.executor_kind, 'multi_agent_debate');
  assert.equal(result.adapter_result.invocation_result.provenance.debate_extension?.role, 'arbiter');
  assert.equal(result.adapter_result.persist_need_candidate_batch_result, null);
  assert.equal((await needValidationRepository.listNeedCandidatesByTitleCardId('title_card_001')).length, 0);
  assert.equal(llmGateway.calls.length, 0);
  assert.equal(
    result.harness_trace_snapshot.artifact_refs.some((ref) =>
      ref.ref_id === result.adapter_result.debate_result?.final_synthesis_artifact?.artifact_ref.ref_id,
    ),
    true,
  );

  const artifacts = await controlPlaneRepository.listArtifactRefsByWorkflowRunId('workflow_run_001');
  const payloads = artifacts.map((artifact) => JSON.stringify(artifact.payload));
  assert.equal(payloads.some((payload) => payload.includes('"artifact_key":"debate_role_output"')), true);
  assert.equal(payloads.some((payload) => payload.includes('"artifact_key":"debate_final_synthesis"')), true);
});

test('workflow harness can route supplemental rounds without authority persistence', async () => {
  const { workflowHarness, needValidationRepository } = await makeRuntime();
  const supplementalBatch = rankedBatch();
  supplementalBatch.drafts[0] = {
    ...supplementalBatch.drafts[0],
    speculative: true,
    scope_notes: null,
    non_goal_notes: null,
    conflict_refs: [],
    evidence_role_bundle: {
      ...supplementalBatch.drafts[0].evidence_role_bundle,
      challenge_unit_refs: [],
    },
  };

  const result = await workflowHarness.runGenerateNeedCandidateScenario(scenarioInput({
    scenario_case_id: 'mocked-supplemental-routing',
    mocked_output: {
      fixture_id: 'fixture_supplemental_round_candidate',
      output: supplementalBatch,
    },
    current_round_index: 1,
    remaining_round_budget: 1,
    persist_admitted_candidates: true,
    expectations: {
      status: 'succeeded',
      routing_decision: 'run_supplemental_round',
      admitted_draft_count: 0,
      persisted_candidate_count: 0,
      persistence: 'forbidden',
    },
  }));

  assert.equal(result.scenario_status, 'passed');
  assert.equal(result.adapter_result.candidate_draft_admission_report?.draft_results[0]?.decision, 'return_for_supplemental_round');
  assert.equal(result.adapter_result.supplemental_round_routing_decision?.routing_decision, 'run_supplemental_round');
  assert.deepEqual(result.adapter_result.supplemental_round_routing_decision?.allowed_roles, ['explorer', 'deep_critic']);
  assert.equal(result.adapter_result.persist_need_candidate_batch_command, null);
  assert.equal((await needValidationRepository.listNeedCandidatesByTitleCardId('title_card_001')).length, 0);
});

test('workflow harness captures negative admission blockers and stops before persistence', async () => {
  const { workflowHarness, needValidationRepository } = await makeRuntime();
  const unresolvedBatch = rankedBatch();
  unresolvedBatch.drafts[0] = {
    ...unresolvedBatch.drafts[0],
    evidence_role_bundle: {
      ...unresolvedBatch.drafts[0].evidence_role_bundle,
      support_unit_refs: [ref('evidence_unit', 'support_missing')],
    },
  };

  const result = await workflowHarness.runGenerateNeedCandidateScenario(scenarioInput({
    scenario_case_id: 'mocked-admission-blocked',
    mocked_output: {
      fixture_id: 'fixture_unresolved_admission_ref',
      output: unresolvedBatch,
    },
    persist_admitted_candidates: true,
    expectations: {
      status: 'blocked',
      routing_decision: 'block',
      admitted_draft_count: 0,
      persisted_candidate_count: 0,
      error_code: 'NO_ADMISSIBLE_NEED_CANDIDATE',
      blocker_codes: ['NO_ADMISSIBLE_NEED_CANDIDATE'],
      persistence: 'forbidden',
    },
  }));

  assert.equal(result.scenario_status, 'passed');
  assert.equal(result.adapter_result.status, 'blocked');
  assert.equal(result.adapter_result.candidate_draft_admission_report?.draft_results[0]?.decision, 'reject_artifact_only');
  assert.equal(result.adapter_result.supplemental_round_routing_decision?.routing_decision, 'block');
  assert.equal(result.adapter_result.persist_need_candidate_batch_result, null);
  assert.equal((await needValidationRepository.listNeedCandidatesByTitleCardId('title_card_001')).length, 0);
});

test('workflow harness keeps duplicate candidates as merge hints without persistence', async () => {
  const { workflowHarness, needValidationRepository } = await makeRuntime();
  const batch = rankedBatch();
  const duplicateArbiterPayload = arbiterPayload();
  duplicateArbiterPayload.candidate_pool_digest = {
    candidate_count: 1,
    candidate_entries: [
      {
        normalized_candidate_key: normalizedCandidateKey(batch),
        candidate_ref: ref('need_candidate', 'need_candidate_existing'),
      },
    ],
  };

  const result = await workflowHarness.runGenerateNeedCandidateScenario(scenarioInput({
    scenario_case_id: 'mocked-duplicate-merge-hint',
    arbiter_payload: duplicateArbiterPayload,
    mocked_output: {
      fixture_id: 'fixture_duplicate_need_candidate',
      output: batch,
    },
    persist_admitted_candidates: true,
    expectations: {
      status: 'blocked',
      routing_decision: 'block',
      admitted_draft_count: 0,
      persisted_candidate_count: 0,
      error_code: 'NO_ADMISSIBLE_NEED_CANDIDATE',
      blocker_codes: ['NO_ADMISSIBLE_NEED_CANDIDATE'],
      persistence: 'forbidden',
    },
  }));

  assert.equal(result.scenario_status, 'passed');
  assert.equal(result.adapter_result.candidate_draft_admission_report?.draft_results[0]?.decision, 'merge_hint_only');
  assert.equal(
    result.adapter_result.candidate_draft_admission_report?.draft_results[0]?.merge_target_ref?.ref_id,
    'need_candidate_existing',
  );
  assert.equal((await needValidationRepository.listNeedCandidatesByTitleCardId('title_card_001')).length, 0);
});

test('workflow harness blocks malformed structured output before downstream artifacts', async () => {
  const { workflowHarness, needValidationRepository } = await makeRuntime();
  const malformed = {
    schema_version: 'v1',
    draft_batch: {
      batch_id: 'draft_batch_001',
      node_attempt_id: 'node_attempt_001',
      terminal_result: 'finalize',
      ranking_rationale: 'Malformed missing required arrays.',
      max_persisted_candidates: 5,
    },
    drafts: [],
    rejected_framings: [],
  } as unknown as TopicSelectionRankedCandidateDraftBatch;

  const result = await workflowHarness.runGenerateNeedCandidateScenario(scenarioInput({
    scenario_case_id: 'mocked-malformed-schema-blocked',
    mocked_output: {
      fixture_id: 'fixture_malformed_ranked_batch',
      output: malformed,
    },
    persist_admitted_candidates: true,
    expectations: {
      status: 'blocked',
      routing_decision: null,
      persisted_candidate_count: 0,
      error_code: 'SCHEMA_VALIDATION_FAILED',
      blocker_codes: ['SCHEMA_VALIDATION_FAILED'],
      persistence: 'forbidden',
    },
  }));

  assert.equal(result.scenario_status, 'passed');
  assert.equal(result.adapter_result.ranked_candidate_draft_batch_artifact, null);
  assert.equal(result.adapter_result.minimum_schema_validation_report_artifact, null);
  assert.equal(result.adapter_result.candidate_draft_admission_report_artifact, null);
  assert.equal(result.adapter_result.supplemental_round_routing_decision_artifact, null);
  assert.equal((await needValidationRepository.listNeedCandidatesByTitleCardId('title_card_001')).length, 0);
});

test('workflow harness preserves result shape across mocked, codex, and provider execution modes', async () => {
  const modes = ['mocked_llm', 'codex_assisted', 'provider_llm'] as const;
  for (const mode of modes) {
    const { workflowHarness, llmGateway } = await makeRuntime();
    const batch = rankedBatch();
    const result = await workflowHarness.runGenerateNeedCandidateScenario(scenarioInput({
      scenario_case_id: `shape-${mode}`,
      execution_mode: mode,
      run_mode: mode === 'provider_llm' ? 'product' : 'acceptance',
      executor_kind: mode === 'codex_assisted' ? 'codex_assisted' : 'single_agent',
      persist_admitted_candidates: false,
      mocked_output: mode === 'mocked_llm'
        ? { fixture_id: 'fixture_generate_need_candidate_happy_path', output: batch }
        : null,
      codex_response: mode === 'codex_assisted'
        ? { output: batch, operator_label: 'codex-local' }
        : null,
      expectations: {
        status: 'succeeded',
        routing_decision: 'finalize_with_admitted_batch',
        admitted_draft_count: 1,
        persisted_candidate_count: 0,
        persistence: 'forbidden',
      },
    }));

    assert.equal(result.scenario_status, 'passed');
    assert.equal(result.schema_version, 'v1');
    assert.equal(result.adapter_result.invocation_result.provenance.execution_mode, mode);
    assert.equal(result.adapter_result.ranked_candidate_draft_batch?.drafts.length, 1);
    assert.equal(result.adapter_result.persist_need_candidate_batch_result, null);
    assert.equal(llmGateway.calls.length, mode === 'provider_llm' ? 1 : 0);
    if (mode === 'provider_llm') {
      assert.equal(llmGateway.calls[0]?.model.profileId, TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID);
      assert.equal(
        result.adapter_result.invocation_result.provenance.model_option_id,
        `${TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID}.openai-balanced`,
      );
    }
  }
});

test('workflow harness persistence conflict does not leave a partial duplicate batch', async () => {
  const { workflowHarness, needValidationRepository } = await makeRuntime();
  const first = await workflowHarness.runGenerateNeedCandidateScenario(scenarioInput());
  assert.equal(first.scenario_status, 'passed');
  assert.equal((await needValidationRepository.listNeedCandidatesByTitleCardId('title_card_001')).length, 1);

  await assert.rejects(
    () => workflowHarness.runGenerateNeedCandidateScenario(scenarioInput({
      scenario_case_id: 'mocked-persistence-conflict',
      workflow_run_id: 'workflow_run_002',
      input_snapshot_id: 'input_snapshot_002',
      node_attempt_id: 'node_attempt_002',
      mocked_output: {
        fixture_id: 'fixture_duplicate_persistence_conflict',
        output: rankedBatch('node_attempt_002'),
      },
    })),
    (error: unknown) => error instanceof AppError && error.errorCode === 'VERSION_CONFLICT',
  );
  assert.equal((await needValidationRepository.listNeedCandidatesByTitleCardId('title_card_001')).length, 1);
});
