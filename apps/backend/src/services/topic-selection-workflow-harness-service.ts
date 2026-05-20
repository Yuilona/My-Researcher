import type {
  TopicSelectionArtifactRefRecord,
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
import type {
  TopicSelectionCoverageIntentType,
  TopicSelectionCoverageRowIntentRecord,
  TopicSelectionEvidenceRole,
  TopicSelectionLiteratureResourcePoolSnapshotRecord,
  TopicSelectionResourcePoolSource,
  TopicSelectionSearchPlanBlueprint,
  TopicSelectionSearchPlanBlueprintCoverageIntent,
  TopicSelectionSearchPlanBlueprintOrigin,
  TopicSelectionSearchPlanRecord,
  TopicSelectionSourceHealthSummary,
  TopicSelectionTopicSeedRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-search-resource-contracts';
import {
  TOPIC_SELECTION_COVERAGE_INTENT_TYPES,
  TOPIC_SELECTION_EVIDENCE_ROLES,
  TOPIC_SELECTION_SEARCH_PLAN_BLUEPRINT_SCHEMA_VERSION,
  TOPIC_SELECTION_SEARCH_PLAN_BLUEPRINT_ORIGINS,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-search-resource-contracts';
import type { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import type { TopicSelectionSearchResourceService } from './topic-selection-search-resource-service.js';

const CREATE_TOPIC_SEED_NODE_ID = 'topic-selection.v1a.create-topic-seed.v1' as const;
const SNAPSHOT_LITERATURE_RESOURCE_POOL_NODE_ID =
  'topic-selection.v1a.snapshot-literature-resource-pool.v1' as const;
const CREATE_SEARCH_PLAN_NODE_ID = 'topic-selection.v1a.create-search-plan.v1' as const;
const GENERATE_NEED_CANDIDATE_NODE_ID = 'topic-selection.v1a.generate-need-candidate.v1' as const;
const TOPIC_SEED_TRACE_PAYLOAD_SCHEMA = 'WorkflowHarnessCreateTopicSeedScenarioTrace@v1';
const LITERATURE_RESOURCE_POOL_TRACE_PAYLOAD_SCHEMA =
  'WorkflowHarnessSnapshotLiteratureResourcePoolScenarioTrace@v1';
const SEARCH_PLAN_TRACE_PAYLOAD_SCHEMA = 'WorkflowHarnessCreateSearchPlanScenarioTrace@v1';
const HARNESS_TRACE_PAYLOAD_SCHEMA = 'WorkflowHarnessGenerateNeedCandidateScenarioTrace@v1';
const NORMALIZED_LITERATURE_RESOURCE_POOL_SOURCE_SCOPE = 'title_card_evidence_basket' as const;
const UNSUPPORTED_SOURCE_SCOPE_FOR_NORMALIZED_V1A = 'UNSUPPORTED_SOURCE_SCOPE_FOR_NORMALIZED_V1A';

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

export type TopicSelectionWorkflowHarnessCreateTopicSeedExpectation = {
  status?: 'succeeded' | 'blocked';
  error_code?: string | null;
  seed_version?: string | null;
  intent_summary?: string | null;
};

export type TopicSelectionWorkflowHarnessCreateTopicSeedInput = {
  scenario_id: string;
  scenario_case_id?: string | null;
  workspace_id?: string | null;
  title_card_id: string;
  workflow_run_id: string;
  node_attempt_id: string;
  seed_version?: string | null;
  intent_summary?: string | null;
  scope_notes?: string | null;
  intent_preparation_refs?: TopicSelectionFunctionalRef[];
  policy_version: string;
  output_schema_version: string;
  expectations?: TopicSelectionWorkflowHarnessCreateTopicSeedExpectation;
  created_by?: TopicSelectionActorType;
};

export type TopicSelectionWorkflowHarnessCreateTopicSeedNodeInput = {
  schema_version: string;
  workspace_id: string | null;
  title_card_id: string;
  seed_version: string | null;
  intent_summary: string | null;
  scope_notes: string | null;
  intent_preparation_refs: TopicSelectionFunctionalRef[];
  policy_version_id: string;
  created_by: TopicSelectionActorType;
};

export type TopicSelectionWorkflowHarnessCreateTopicSeedNodeResult = {
  status: 'succeeded' | 'blocked';
  topic_seed: TopicSelectionTopicSeedRecord | null;
  topic_seed_ref: TopicSelectionFunctionalRef | null;
  authority_refs: TopicSelectionFunctionalRef[];
  audit_refs: TopicSelectionFunctionalRef[];
  artifact_refs: TopicSelectionFunctionalRef[];
  warning_codes: string[];
  blocker_codes: string[];
  error_code: string | null;
  error_message: string | null;
};

export type TopicSelectionWorkflowHarnessCreateTopicSeedTraceSnapshot = {
  schema_version: 'topic-selection-workflow-harness-trace-v1';
  payload_schema: typeof TOPIC_SEED_TRACE_PAYLOAD_SCHEMA;
  scenario_id: string;
  scenario_case_id: string | null;
  node_id: typeof CREATE_TOPIC_SEED_NODE_ID;
  workflow_run_id: string;
  node_attempt_id: string;
  scenario_status: 'passed' | 'failed';
  node_status: 'succeeded' | 'blocked';
  authority_refs: TopicSelectionFunctionalRef[];
  audit_refs: TopicSelectionFunctionalRef[];
  artifact_refs: TopicSelectionFunctionalRef[];
  warning_codes: string[];
  blocker_codes: string[];
  assertions: TopicSelectionWorkflowHarnessAssertion[];
  created_at: string;
};

export type TopicSelectionWorkflowHarnessCreateTopicSeedResult = {
  schema_version: 'v1';
  scenario_id: string;
  scenario_case_id: string | null;
  node_id: typeof CREATE_TOPIC_SEED_NODE_ID;
  workflow_run_id: string;
  node_attempt_id: string;
  scenario_status: 'passed' | 'failed';
  node_input: TopicSelectionWorkflowHarnessCreateTopicSeedNodeInput;
  node_result: TopicSelectionWorkflowHarnessCreateTopicSeedNodeResult;
  assertions: TopicSelectionWorkflowHarnessAssertion[];
  harness_trace_snapshot: TopicSelectionWorkflowHarnessCreateTopicSeedTraceSnapshot;
  harness_trace_artifact: TopicSelectionArtifactRefRecord;
  harness_trace_artifact_ref: TopicSelectionFunctionalRef;
};

export type TopicSelectionWorkflowHarnessCreateSearchPlanExpectation = {
  status?: 'succeeded' | 'blocked';
  error_code?: string | null;
  blocker_codes?: string[];
  coverage_row_count?: number | null;
  plan_version?: string | null;
};

export type TopicSelectionWorkflowHarnessCreateSearchPlanInput = {
  scenario_id: string;
  scenario_case_id?: string | null;
  workspace_id?: string | null;
  title_card_id: string;
  workflow_run_id: string;
  node_attempt_id: string;
  blueprint?: TopicSelectionSearchPlanBlueprint | null;
  expectations?: TopicSelectionWorkflowHarnessCreateSearchPlanExpectation;
  created_by?: TopicSelectionActorType;
};

export type TopicSelectionWorkflowHarnessCreateSearchPlanNodeInput = {
  schema_version: string;
  workspace_id: string | null;
  title_card_id: string;
  blueprint: TopicSelectionSearchPlanBlueprint | null;
  created_by: TopicSelectionActorType;
};

export type TopicSelectionWorkflowHarnessCreateSearchPlanNodeResult = {
  status: 'succeeded' | 'blocked';
  search_plan: TopicSelectionSearchPlanRecord | null;
  search_plan_ref: TopicSelectionFunctionalRef | null;
  coverage_row_intents: TopicSelectionCoverageRowIntentRecord[];
  coverage_row_intent_refs: TopicSelectionFunctionalRef[];
  plan_version: string | null;
  query_intents: string[];
  must_check_constraints: string[];
  exclusion_rules: string[];
  authority_refs: TopicSelectionFunctionalRef[];
  audit_refs: TopicSelectionFunctionalRef[];
  artifact_refs: TopicSelectionFunctionalRef[];
  warning_codes: string[];
  blocker_codes: string[];
  error_code: string | null;
  error_message: string | null;
};

export type TopicSelectionWorkflowHarnessCreateSearchPlanTraceSnapshot = {
  schema_version: 'topic-selection-workflow-harness-trace-v1';
  payload_schema: typeof SEARCH_PLAN_TRACE_PAYLOAD_SCHEMA;
  scenario_id: string;
  scenario_case_id: string | null;
  node_id: typeof CREATE_SEARCH_PLAN_NODE_ID;
  workflow_run_id: string;
  node_attempt_id: string;
  scenario_status: 'passed' | 'failed';
  node_status: 'succeeded' | 'blocked';
  node_input: TopicSelectionWorkflowHarnessCreateSearchPlanNodeInput;
  node_result: TopicSelectionWorkflowHarnessCreateSearchPlanNodeResult;
  blueprint_origin: TopicSelectionSearchPlanBlueprintOrigin | null;
  blueprint_provenance_refs: TopicSelectionFunctionalRef[];
  expected_snapshot_hash: string | null;
  resolved_snapshot_hash: string | null;
  query_intents: string[];
  coverage_intents: TopicSelectionSearchPlanBlueprintCoverageIntent[];
  search_plan_ref: TopicSelectionFunctionalRef | null;
  coverage_row_intent_refs: TopicSelectionFunctionalRef[];
  authority_refs: TopicSelectionFunctionalRef[];
  audit_refs: TopicSelectionFunctionalRef[];
  artifact_refs: TopicSelectionFunctionalRef[];
  warning_codes: string[];
  blocker_codes: string[];
  assertions: TopicSelectionWorkflowHarnessAssertion[];
  created_at: string;
};

export type TopicSelectionWorkflowHarnessCreateSearchPlanResult = {
  schema_version: 'v1';
  scenario_id: string;
  scenario_case_id: string | null;
  node_id: typeof CREATE_SEARCH_PLAN_NODE_ID;
  workflow_run_id: string;
  node_attempt_id: string;
  scenario_status: 'passed' | 'failed';
  node_input: TopicSelectionWorkflowHarnessCreateSearchPlanNodeInput;
  node_result: TopicSelectionWorkflowHarnessCreateSearchPlanNodeResult;
  assertions: TopicSelectionWorkflowHarnessAssertion[];
  harness_trace_snapshot: TopicSelectionWorkflowHarnessCreateSearchPlanTraceSnapshot;
  harness_trace_artifact: TopicSelectionArtifactRefRecord;
  harness_trace_artifact_ref: TopicSelectionFunctionalRef;
};

type TopicSelectionCreateSearchPlanBlockedValidationResult = {
  blocked: true;
  error_code: string;
  error_message: string;
  blocker_codes: string[];
  resolved_snapshot_hash: string | null;
};

type TopicSelectionCreateSearchPlanValidationResult =
  | TopicSelectionCreateSearchPlanBlockedValidationResult
  | {
      blocked: false;
      error_code: null;
      error_message: null;
      blocker_codes: [];
      resolved_snapshot_hash: string;
    };

export type TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolExpectation = {
  status?: 'succeeded' | 'blocked';
  error_code?: string | null;
  blocker_codes?: string[];
  warning_codes?: string[];
  snapshot_hash?: string | null;
  included_literature_count?: number | null;
  content_source_count?: number | null;
};

export type TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolInput = {
  scenario_id: string;
  scenario_case_id?: string | null;
  workspace_id?: string | null;
  title_card_id: string;
  workflow_run_id: string;
  node_attempt_id: string;
  topic_seed_ref: TopicSelectionFunctionalRef;
  source_scope: TopicSelectionResourcePoolSource;
  resource_sample_set_provenance_ref?: TopicSelectionFunctionalRef | null;
  policy_version: string;
  output_schema_version: string;
  expectations?: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolExpectation;
  created_by?: TopicSelectionActorType;
};

export type TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeInput = {
  schema_version: string;
  workspace_id: string | null;
  title_card_id: string;
  topic_seed_ref: TopicSelectionFunctionalRef;
  source_scope: TopicSelectionResourcePoolSource;
  resource_sample_set_provenance_ref: TopicSelectionFunctionalRef | null;
  policy_version_id: string;
  created_by: TopicSelectionActorType;
};

export type TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolHandoff = {
  literature_resource_pool_snapshot_ref: TopicSelectionFunctionalRef;
  snapshot_version: string;
  snapshot_hash: string;
  source_scope: TopicSelectionResourcePoolSource;
  literature_refs: TopicSelectionFunctionalRef[];
  content_source_refs: TopicSelectionFunctionalRef[];
  source_health_summary: TopicSelectionSourceHealthSummary;
};

export type TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeResult = {
  status: 'succeeded' | 'blocked';
  literature_resource_pool_snapshot: TopicSelectionLiteratureResourcePoolSnapshotRecord | null;
  literature_resource_pool_snapshot_ref: TopicSelectionFunctionalRef | null;
  snapshot_version: string | null;
  snapshot_hash: string | null;
  source_scope: TopicSelectionResourcePoolSource;
  included_literature_refs: TopicSelectionFunctionalRef[];
  content_source_refs: TopicSelectionFunctionalRef[];
  source_health_summary: TopicSelectionSourceHealthSummary | null;
  downstream_handoff: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolHandoff | null;
  authority_refs: TopicSelectionFunctionalRef[];
  audit_refs: TopicSelectionFunctionalRef[];
  artifact_refs: TopicSelectionFunctionalRef[];
  warning_codes: string[];
  blocker_codes: string[];
  error_code: string | null;
  error_message: string | null;
};

export type TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolTraceSnapshot = {
  schema_version: 'topic-selection-workflow-harness-trace-v1';
  payload_schema: typeof LITERATURE_RESOURCE_POOL_TRACE_PAYLOAD_SCHEMA;
  scenario_id: string;
  scenario_case_id: string | null;
  node_id: typeof SNAPSHOT_LITERATURE_RESOURCE_POOL_NODE_ID;
  workflow_run_id: string;
  node_attempt_id: string;
  scenario_status: 'passed' | 'failed';
  node_status: 'succeeded' | 'blocked';
  node_input: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeInput;
  node_result: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeResult;
  snapshot_hash: string | null;
  source_health_summary: TopicSelectionSourceHealthSummary | null;
  authority_refs: TopicSelectionFunctionalRef[];
  audit_refs: TopicSelectionFunctionalRef[];
  artifact_refs: TopicSelectionFunctionalRef[];
  warning_codes: string[];
  blocker_codes: string[];
  assertions: TopicSelectionWorkflowHarnessAssertion[];
  created_at: string;
};

export type TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolResult = {
  schema_version: 'v1';
  scenario_id: string;
  scenario_case_id: string | null;
  node_id: typeof SNAPSHOT_LITERATURE_RESOURCE_POOL_NODE_ID;
  workflow_run_id: string;
  node_attempt_id: string;
  scenario_status: 'passed' | 'failed';
  node_input: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeInput;
  node_result: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeResult;
  assertions: TopicSelectionWorkflowHarnessAssertion[];
  harness_trace_snapshot: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolTraceSnapshot;
  harness_trace_artifact: TopicSelectionArtifactRefRecord;
  harness_trace_artifact_ref: TopicSelectionFunctionalRef;
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
      controlPlane?: TopicSelectionControlPlaneService;
      searchResources?: TopicSelectionSearchResourceService;
    },
    options: {
      now?: () => string;
    } = {},
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async runCreateTopicSeedScenario(
    input: TopicSelectionWorkflowHarnessCreateTopicSeedInput,
  ): Promise<TopicSelectionWorkflowHarnessCreateTopicSeedResult> {
    this.assertCreateTopicSeedScenarioInput(input);
    const controlPlane = this.requiredControlPlane();
    const searchResources = this.requiredSearchResources();
    const nodeInput = this.createTopicSeedNodeInput(input);
    let topicSeed: TopicSelectionTopicSeedRecord | null = null;
    let appError: AppError | null = null;

    try {
      topicSeed = await searchResources.createTopicSeedFromTitleCard({
        workspace_id: input.workspace_id ?? null,
        title_card_id: input.title_card_id,
        seed_version: input.seed_version ?? undefined,
        intent_summary: input.intent_summary ?? undefined,
        scope_notes: input.scope_notes ?? null,
        intent_preparation_refs: input.intent_preparation_refs ?? [],
        created_by: input.created_by ?? 'system',
        policy_version_id: input.policy_version,
      });
    } catch (error) {
      if (!(error instanceof AppError)) {
        throw error;
      }
      appError = error;
    }

    const topicSeedRef = topicSeed
      ? this.ref('topic_seed', topicSeed.topic_seed_id, topicSeed.title_card_id, topicSeed.seed_version)
      : null;
    const nodeResult: TopicSelectionWorkflowHarnessCreateTopicSeedNodeResult = {
      status: topicSeed ? 'succeeded' : 'blocked',
      topic_seed: topicSeed,
      topic_seed_ref: topicSeedRef,
      authority_refs: topicSeedRef ? [topicSeedRef] : [],
      audit_refs: topicSeed ? this.topicSeedAuditRefs(topicSeed) : [],
      artifact_refs: [],
      warning_codes: [],
      blocker_codes: appError ? [appError.errorCode] : [],
      error_code: appError?.errorCode ?? null,
      error_message: appError?.message ?? null,
    };
    const assertions = this.evaluateCreateTopicSeedAssertions(input, nodeResult);
    const scenarioStatus = assertions.every((assertion) => assertion.passed) ? 'passed' : 'failed';
    const traceSnapshot = this.createTopicSeedTraceSnapshot({
      input,
      nodeResult,
      assertions,
      scenarioStatus,
    });
    const traceArtifact = await controlPlane.recordArtifactRef({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      artifact_kind: 'trace',
      storage_kind: 'inline',
      payload: traceSnapshot as unknown as Record<string, unknown>,
      workflow_run_id: input.workflow_run_id,
      input_snapshot_id: topicSeed?.input_snapshot_id ?? null,
      created_by: input.created_by ?? 'system',
    });
    const traceArtifactRef = this.ref('artifact_ref', traceArtifact.artifact_ref_id, traceArtifact.title_card_id ?? input.title_card_id);

    return {
      schema_version: 'v1',
      scenario_id: input.scenario_id,
      scenario_case_id: input.scenario_case_id ?? null,
      node_id: CREATE_TOPIC_SEED_NODE_ID,
      workflow_run_id: input.workflow_run_id,
      node_attempt_id: input.node_attempt_id,
      scenario_status: scenarioStatus,
      node_input: nodeInput,
      node_result: {
        ...nodeResult,
        artifact_refs: [traceArtifactRef],
      },
      assertions,
      harness_trace_snapshot: traceSnapshot,
      harness_trace_artifact: traceArtifact,
      harness_trace_artifact_ref: traceArtifactRef,
    };
  }

  async runSnapshotLiteratureResourcePoolScenario(
    input: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolInput,
  ): Promise<TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolResult> {
    this.assertSnapshotLiteratureResourcePoolScenarioInput(input);
    const controlPlane = this.requiredControlPlane();
    const searchResources = this.requiredSearchResources();
    const nodeInput = this.snapshotLiteratureResourcePoolNodeInput(input);
    let snapshot: TopicSelectionLiteratureResourcePoolSnapshotRecord | null = null;
    let blockedSourceHealthSummary: TopicSelectionSourceHealthSummary | null = null;
    let blockedAuditRefs: TopicSelectionFunctionalRef[] = [];
    let errorCode: string | null = null;
    let errorMessage: string | null = null;
    let blockerCodes: string[] = [];

    if (input.source_scope !== NORMALIZED_LITERATURE_RESOURCE_POOL_SOURCE_SCOPE) {
      errorCode = UNSUPPORTED_SOURCE_SCOPE_FOR_NORMALIZED_V1A;
      errorMessage = 'Normalized v1a resource-pool snapshot only supports title_card_evidence_basket.';
      blockerCodes = [UNSUPPORTED_SOURCE_SCOPE_FOR_NORMALIZED_V1A];
    } else {
      try {
        snapshot = await searchResources.createLiteratureResourcePoolSnapshot({
          workspace_id: input.workspace_id ?? null,
          title_card_id: input.title_card_id,
          topic_seed_id: input.topic_seed_ref.ref_id,
          source_scope: input.source_scope,
          resource_sample_set_provenance_ref: input.resource_sample_set_provenance_ref ?? null,
          created_by: input.created_by ?? 'system',
          policy_version_id: input.policy_version,
        });
      } catch (error) {
        if (!(error instanceof AppError)) {
          throw error;
        }
        errorCode = error.errorCode;
        errorMessage = error.message;
        blockerCodes = this.blockerCodesFromAppError(error);
        blockedSourceHealthSummary = this.sourceHealthSummaryFromAppError(error);
        blockedAuditRefs = this.auditRefsFromAppError(error, input.title_card_id);
      }
    }

    const snapshotRef = snapshot
      ? this.ref(
        'literature_resource_pool_snapshot',
        snapshot.literature_resource_pool_snapshot_id,
        snapshot.title_card_id,
        snapshot.snapshot_version,
      )
      : null;
    const auditRefs = snapshot ? this.literatureResourcePoolSnapshotAuditRefs(snapshot) : [];
    const sourceHealthSummary = snapshot?.source_health_summary ?? blockedSourceHealthSummary;
    const warningCodes = sourceHealthSummary?.warning_codes ?? [];
    const nodeResult: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeResult = {
      status: snapshot ? 'succeeded' : 'blocked',
      literature_resource_pool_snapshot: snapshot,
      literature_resource_pool_snapshot_ref: snapshotRef,
      snapshot_version: snapshot?.snapshot_version ?? null,
      snapshot_hash: snapshot?.snapshot_hash ?? null,
      source_scope: input.source_scope,
      included_literature_refs: snapshot?.literature_refs ?? [],
      content_source_refs: snapshot?.content_source_refs ?? [],
      source_health_summary: sourceHealthSummary,
      downstream_handoff: snapshot && snapshotRef
        ? {
            literature_resource_pool_snapshot_ref: snapshotRef,
            snapshot_version: snapshot.snapshot_version,
            snapshot_hash: snapshot.snapshot_hash,
            source_scope: snapshot.source_scope,
            literature_refs: snapshot.literature_refs,
            content_source_refs: snapshot.content_source_refs,
            source_health_summary: snapshot.source_health_summary,
          }
        : null,
      authority_refs: snapshotRef ? [snapshotRef] : [],
      audit_refs: snapshot ? auditRefs : blockedAuditRefs,
      artifact_refs: [],
      warning_codes: warningCodes,
      blocker_codes: snapshot ? [] : blockerCodes,
      error_code: snapshot ? null : errorCode,
      error_message: snapshot ? null : errorMessage,
    };
    const assertions = this.evaluateSnapshotLiteratureResourcePoolAssertions(input, nodeResult);
    const scenarioStatus = assertions.every((assertion) => assertion.passed) ? 'passed' : 'failed';
    const traceSnapshot = this.createSnapshotLiteratureResourcePoolTraceSnapshot({
      input,
      nodeInput,
      nodeResult,
      assertions,
      scenarioStatus,
    });
    const traceArtifact = await controlPlane.recordArtifactRef({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      artifact_kind: 'trace',
      storage_kind: 'inline',
      payload: traceSnapshot as unknown as Record<string, unknown>,
      workflow_run_id: input.workflow_run_id,
      input_snapshot_id: snapshot?.input_snapshot_id ?? null,
      created_by: input.created_by ?? 'system',
    });
    const traceArtifactRef = this.ref(
      'artifact_ref',
      traceArtifact.artifact_ref_id,
      traceArtifact.title_card_id ?? input.title_card_id,
    );

    return {
      schema_version: 'v1',
      scenario_id: input.scenario_id,
      scenario_case_id: input.scenario_case_id ?? null,
      node_id: SNAPSHOT_LITERATURE_RESOURCE_POOL_NODE_ID,
      workflow_run_id: input.workflow_run_id,
      node_attempt_id: input.node_attempt_id,
      scenario_status: scenarioStatus,
      node_input: nodeInput,
      node_result: {
        ...nodeResult,
        artifact_refs: [traceArtifactRef],
      },
      assertions,
      harness_trace_snapshot: traceSnapshot,
      harness_trace_artifact: traceArtifact,
      harness_trace_artifact_ref: traceArtifactRef,
    };
  }

  async runCreateSearchPlanScenario(
    input: TopicSelectionWorkflowHarnessCreateSearchPlanInput,
  ): Promise<TopicSelectionWorkflowHarnessCreateSearchPlanResult> {
    this.assertCreateSearchPlanScenarioInput(input);
    const controlPlane = this.requiredControlPlane();
    const searchResources = this.requiredSearchResources();
    const nodeInput = this.createSearchPlanNodeInput(input);
    const validation = await this.validateCreateSearchPlanBlueprint(input);
    let searchPlan: TopicSelectionSearchPlanRecord | null = null;
    let coverageRowIntents: TopicSelectionCoverageRowIntentRecord[] = [];
    let errorCode = validation.error_code;
    let errorMessage = validation.error_message;
    let blockerCodes = validation.blocker_codes;

    if (!validation.blocked && input.blueprint) {
      try {
        const created = await searchResources.createSearchPlan({
          workspace_id: input.workspace_id ?? null,
          title_card_id: input.title_card_id,
          topic_seed_id: input.blueprint.topic_seed_ref.ref_id,
          literature_resource_pool_snapshot_id: input.blueprint.literature_resource_pool_snapshot_ref.ref_id,
          plan_version: input.blueprint.plan_version ?? undefined,
          query_intents: input.blueprint.query_intents,
          must_check_constraints: input.blueprint.must_check_constraints,
          exclusion_rules: input.blueprint.exclusion_rules,
          coverage_strategy: input.blueprint.coverage_strategy,
          coverage_intents: input.blueprint.coverage_intents,
          search_plan_blueprint: input.blueprint,
          parent_search_plan_ref: input.blueprint.parent_search_plan_ref,
          recheck_request_ref: input.blueprint.recheck_request_ref,
          created_by: input.created_by ?? 'system',
          policy_version_id: input.blueprint.policy_version,
        });
        searchPlan = created.search_plan;
        coverageRowIntents = created.coverage_row_intents;
      } catch (error) {
        if (!(error instanceof AppError)) {
          throw error;
        }
        errorCode = error.errorCode;
        errorMessage = error.message;
        blockerCodes = this.blockerCodesFromAppError(error);
      }
    }

    const searchPlanRef = searchPlan
      ? this.ref('search_plan', searchPlan.search_plan_id, searchPlan.title_card_id, searchPlan.plan_version)
      : null;
    const coverageRowIntentRefs = coverageRowIntents.map((row) =>
      this.ref('coverage_row_intent', row.coverage_row_intent_id, row.title_card_id ?? input.title_card_id),
    );
    const auditRefs = searchPlan ? this.searchPlanAuditRefs(searchPlan) : [];
    const serviceArtifactRefs = searchPlan?.artifact_refs ?? [];
    const nodeResult: TopicSelectionWorkflowHarnessCreateSearchPlanNodeResult = {
      status: searchPlan ? 'succeeded' : 'blocked',
      search_plan: searchPlan,
      search_plan_ref: searchPlanRef,
      coverage_row_intents: coverageRowIntents,
      coverage_row_intent_refs: coverageRowIntentRefs,
      plan_version: searchPlan?.plan_version ?? null,
      query_intents: searchPlan?.query_intents ?? input.blueprint?.query_intents ?? [],
      must_check_constraints: searchPlan?.must_check_constraints ?? input.blueprint?.must_check_constraints ?? [],
      exclusion_rules: searchPlan?.exclusion_rules ?? input.blueprint?.exclusion_rules ?? [],
      authority_refs: searchPlanRef ? [searchPlanRef, ...coverageRowIntentRefs] : [],
      audit_refs: auditRefs,
      artifact_refs: serviceArtifactRefs,
      warning_codes: [],
      blocker_codes: searchPlan ? [] : blockerCodes,
      error_code: searchPlan ? null : errorCode,
      error_message: searchPlan ? null : errorMessage,
    };
    const assertions = this.evaluateCreateSearchPlanAssertions(input, nodeResult);
    const scenarioStatus = assertions.every((assertion) => assertion.passed) ? 'passed' : 'failed';
    const traceSnapshot = this.createSearchPlanTraceSnapshot({
      input,
      nodeInput,
      nodeResult,
      assertions,
      scenarioStatus,
      resolvedSnapshotHash: validation.resolved_snapshot_hash,
    });
    const traceArtifact = await controlPlane.recordArtifactRef({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      artifact_kind: 'trace',
      storage_kind: 'inline',
      payload: traceSnapshot as unknown as Record<string, unknown>,
      workflow_run_id: input.workflow_run_id,
      input_snapshot_id: searchPlan?.input_snapshot_id ?? null,
      created_by: input.created_by ?? 'system',
    });
    const traceArtifactRef = this.ref(
      'artifact_ref',
      traceArtifact.artifact_ref_id,
      traceArtifact.title_card_id ?? input.title_card_id,
    );

    return {
      schema_version: 'v1',
      scenario_id: input.scenario_id,
      scenario_case_id: input.scenario_case_id ?? null,
      node_id: CREATE_SEARCH_PLAN_NODE_ID,
      workflow_run_id: input.workflow_run_id,
      node_attempt_id: input.node_attempt_id,
      scenario_status: scenarioStatus,
      node_input: nodeInput,
      node_result: {
        ...nodeResult,
        artifact_refs: [...serviceArtifactRefs, traceArtifactRef],
      },
      assertions,
      harness_trace_snapshot: traceSnapshot,
      harness_trace_artifact: traceArtifact,
      harness_trace_artifact_ref: traceArtifactRef,
    };
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

  private createTopicSeedNodeInput(
    input: TopicSelectionWorkflowHarnessCreateTopicSeedInput,
  ): TopicSelectionWorkflowHarnessCreateTopicSeedNodeInput {
    return {
      schema_version: input.output_schema_version,
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      seed_version: input.seed_version ?? null,
      intent_summary: input.intent_summary ?? null,
      scope_notes: input.scope_notes ?? null,
      intent_preparation_refs: input.intent_preparation_refs ?? [],
      policy_version_id: input.policy_version,
      created_by: input.created_by ?? 'system',
    };
  }

  private evaluateCreateTopicSeedAssertions(
    input: TopicSelectionWorkflowHarnessCreateTopicSeedInput,
    nodeResult: TopicSelectionWorkflowHarnessCreateTopicSeedNodeResult,
  ): TopicSelectionWorkflowHarnessAssertion[] {
    const expectations = input.expectations ?? {};
    const assertions: TopicSelectionWorkflowHarnessAssertion[] = [
      this.assertion(
        'expected_node_status',
        expectations.status ? nodeResult.status === expectations.status : nodeResult.status === 'succeeded',
        'TopicSeed node status must match scenario expectation.',
        expectations.status ?? 'succeeded',
        nodeResult.status,
      ),
      this.assertion(
        'no_model_execution',
        true,
        'Create TopicSeed is deterministic and never invokes AgentOrchestrator, provider, Codex, or debate runtime.',
        'none',
        'none',
      ),
    ];

    if (nodeResult.status === 'succeeded') {
      const topicSeed = nodeResult.topic_seed;
      assertions.push(
        this.assertion(
          'authority_ref_created',
          Boolean(nodeResult.topic_seed_ref && nodeResult.authority_refs.length === 1),
          'Successful TopicSeed scenario must expose exactly one TopicSeed authority ref.',
          1,
          nodeResult.authority_refs.length,
        ),
        this.assertion(
          'title_card_id_propagated',
          topicSeed?.title_card_id === input.title_card_id,
          'TopicSeed must belong to the scenario title card.',
          input.title_card_id,
          topicSeed?.title_card_id ?? null,
        ),
        this.assertion(
          'seed_kind_fixed',
          topicSeed?.seed_kind === 'title_card',
          'TopicSeed created by this node must use seed_kind title_card.',
          'title_card',
          topicSeed?.seed_kind ?? null,
        ),
        this.assertion(
          'source_title_card_ref_propagated',
          topicSeed?.source_title_card_ref.ref_type === 'title_card'
            && topicSeed.source_title_card_ref.ref_id === input.title_card_id,
          'TopicSeed must trace to the source TitleCard ref.',
          input.title_card_id,
          topicSeed?.source_title_card_ref.ref_id ?? null,
        ),
        this.assertion(
          'control_plane_refs_created',
          Boolean(topicSeed?.input_snapshot_id && topicSeed.gate_result_id && topicSeed.transition_attempt_id),
          'TopicSeed creation must produce input snapshot, gate result, and transition attempt refs.',
          ['input_snapshot_id', 'gate_result_id', 'transition_attempt_id'],
          {
            input_snapshot_id: topicSeed?.input_snapshot_id ?? null,
            gate_result_id: topicSeed?.gate_result_id ?? null,
            transition_attempt_id: topicSeed?.transition_attempt_id ?? null,
          },
        ),
      );
    } else {
      assertions.push(this.assertion(
        'blocked_without_authority',
        nodeResult.authority_refs.length === 0 && nodeResult.topic_seed === null,
        'Blocked TopicSeed scenario must not create authority refs.',
        0,
        nodeResult.authority_refs.length,
      ));
    }

    if (expectations.error_code !== undefined) {
      assertions.push(this.assertion(
        'expected_error_code',
        nodeResult.error_code === expectations.error_code,
        'TopicSeed node error code must match scenario expectation.',
        expectations.error_code,
        nodeResult.error_code,
      ));
    }
    if (expectations.seed_version !== undefined && expectations.seed_version !== null) {
      assertions.push(this.assertion(
        'expected_seed_version',
        nodeResult.topic_seed?.seed_version === expectations.seed_version,
        'TopicSeed version must match scenario expectation.',
        expectations.seed_version,
        nodeResult.topic_seed?.seed_version ?? null,
      ));
    }
    if (expectations.intent_summary !== undefined && expectations.intent_summary !== null) {
      assertions.push(this.assertion(
        'expected_intent_summary',
        nodeResult.topic_seed?.intent_summary === expectations.intent_summary,
        'TopicSeed intent summary must match scenario expectation.',
        expectations.intent_summary,
        nodeResult.topic_seed?.intent_summary ?? null,
      ));
    }
    return assertions;
  }

  private createTopicSeedTraceSnapshot(input: {
    input: TopicSelectionWorkflowHarnessCreateTopicSeedInput;
    nodeResult: TopicSelectionWorkflowHarnessCreateTopicSeedNodeResult;
    assertions: TopicSelectionWorkflowHarnessAssertion[];
    scenarioStatus: 'passed' | 'failed';
  }): TopicSelectionWorkflowHarnessCreateTopicSeedTraceSnapshot {
    return {
      schema_version: 'topic-selection-workflow-harness-trace-v1',
      payload_schema: TOPIC_SEED_TRACE_PAYLOAD_SCHEMA,
      scenario_id: input.input.scenario_id,
      scenario_case_id: input.input.scenario_case_id ?? null,
      node_id: CREATE_TOPIC_SEED_NODE_ID,
      workflow_run_id: input.input.workflow_run_id,
      node_attempt_id: input.input.node_attempt_id,
      scenario_status: input.scenarioStatus,
      node_status: input.nodeResult.status,
      authority_refs: input.nodeResult.authority_refs,
      audit_refs: input.nodeResult.audit_refs,
      artifact_refs: input.nodeResult.artifact_refs,
      warning_codes: input.nodeResult.warning_codes,
      blocker_codes: input.nodeResult.blocker_codes,
      assertions: input.assertions,
      created_at: this.now(),
    };
  }

  private snapshotLiteratureResourcePoolNodeInput(
    input: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolInput,
  ): TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeInput {
    return {
      schema_version: input.output_schema_version,
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      topic_seed_ref: input.topic_seed_ref,
      source_scope: input.source_scope,
      resource_sample_set_provenance_ref: input.resource_sample_set_provenance_ref ?? null,
      policy_version_id: input.policy_version,
      created_by: input.created_by ?? 'system',
    };
  }

  private evaluateSnapshotLiteratureResourcePoolAssertions(
    input: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolInput,
    nodeResult: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeResult,
  ): TopicSelectionWorkflowHarnessAssertion[] {
    const expectations = input.expectations ?? {};
    const assertions: TopicSelectionWorkflowHarnessAssertion[] = [
      this.assertion(
        'expected_node_status',
        expectations.status ? nodeResult.status === expectations.status : nodeResult.status === 'succeeded',
        'LiteratureResourcePoolSnapshot node status must match scenario expectation.',
        expectations.status ?? 'succeeded',
        nodeResult.status,
      ),
      this.assertion(
        'no_model_execution',
        true,
        'Snapshot LiteratureResourcePool is deterministic and never invokes AgentOrchestrator, provider, Codex, or debate runtime.',
        'none',
        'none',
      ),
    ];

    if (nodeResult.status === 'succeeded') {
      const snapshot = nodeResult.literature_resource_pool_snapshot;
      assertions.push(
        this.assertion(
          'authority_ref_created',
          Boolean(nodeResult.literature_resource_pool_snapshot_ref && nodeResult.authority_refs.length === 1),
          'Successful LiteratureResourcePoolSnapshot scenario must expose exactly one snapshot authority ref.',
          1,
          nodeResult.authority_refs.length,
        ),
        this.assertion(
          'source_scope_normalized',
          snapshot?.source_scope === NORMALIZED_LITERATURE_RESOURCE_POOL_SOURCE_SCOPE,
          'Normalized harness path only supports title_card_evidence_basket source scope.',
          NORMALIZED_LITERATURE_RESOURCE_POOL_SOURCE_SCOPE,
          snapshot?.source_scope ?? null,
        ),
        this.assertion(
          'title_card_id_propagated',
          snapshot?.title_card_id === input.title_card_id,
          'LiteratureResourcePoolSnapshot must belong to the scenario title card.',
          input.title_card_id,
          snapshot?.title_card_id ?? null,
        ),
        this.assertion(
          'topic_seed_ref_propagated',
          snapshot?.topic_seed_ref.ref_id === input.topic_seed_ref.ref_id,
          'LiteratureResourcePoolSnapshot must trace to the scenario TopicSeed ref.',
          input.topic_seed_ref.ref_id,
          snapshot?.topic_seed_ref.ref_id ?? null,
        ),
        this.assertion(
          'control_plane_refs_created',
          Boolean(snapshot?.input_snapshot_id && snapshot.gate_result_id && snapshot.transition_attempt_id),
          'LiteratureResourcePoolSnapshot creation must produce input snapshot, gate result, and transition attempt refs.',
          ['input_snapshot_id', 'gate_result_id', 'transition_attempt_id'],
          {
            input_snapshot_id: snapshot?.input_snapshot_id ?? null,
            gate_result_id: snapshot?.gate_result_id ?? null,
            transition_attempt_id: snapshot?.transition_attempt_id ?? null,
          },
        ),
        this.assertion(
          'downstream_handoff_created',
          Boolean(nodeResult.downstream_handoff?.literature_resource_pool_snapshot_ref),
          'Successful LiteratureResourcePoolSnapshot scenario must expose a SearchPlan handoff packet.',
          'handoff',
          nodeResult.downstream_handoff,
        ),
      );
    } else {
      assertions.push(this.assertion(
        'blocked_without_authority',
        nodeResult.authority_refs.length === 0 && nodeResult.literature_resource_pool_snapshot === null,
        'Blocked LiteratureResourcePoolSnapshot scenario must not create authority refs.',
        0,
        nodeResult.authority_refs.length,
      ));
    }

    if (expectations.error_code !== undefined) {
      assertions.push(this.assertion(
        'expected_error_code',
        nodeResult.error_code === expectations.error_code,
        'LiteratureResourcePoolSnapshot node error code must match scenario expectation.',
        expectations.error_code,
        nodeResult.error_code,
      ));
    }
    if (expectations.snapshot_hash !== undefined && expectations.snapshot_hash !== null) {
      assertions.push(this.assertion(
        'expected_snapshot_hash',
        nodeResult.snapshot_hash === expectations.snapshot_hash,
        'LiteratureResourcePoolSnapshot hash must match scenario expectation.',
        expectations.snapshot_hash,
        nodeResult.snapshot_hash,
      ));
    }
    if (expectations.included_literature_count !== undefined && expectations.included_literature_count !== null) {
      assertions.push(this.assertion(
        'expected_included_literature_count',
        nodeResult.included_literature_refs.length === expectations.included_literature_count,
        'Included literature count must match scenario expectation.',
        expectations.included_literature_count,
        nodeResult.included_literature_refs.length,
      ));
    }
    if (expectations.content_source_count !== undefined && expectations.content_source_count !== null) {
      assertions.push(this.assertion(
        'expected_content_source_count',
        nodeResult.content_source_refs.length === expectations.content_source_count,
        'Content source count must match scenario expectation.',
        expectations.content_source_count,
        nodeResult.content_source_refs.length,
      ));
    }
    if (expectations.blocker_codes) {
      const missing = expectations.blocker_codes.filter((code) => !nodeResult.blocker_codes.includes(code));
      assertions.push(this.assertion(
        'expected_blocker_codes',
        missing.length === 0,
        'LiteratureResourcePoolSnapshot blocker codes must include expected scenario blockers.',
        expectations.blocker_codes,
        nodeResult.blocker_codes,
      ));
    }
    if (expectations.warning_codes) {
      const missing = expectations.warning_codes.filter((code) => !nodeResult.warning_codes.includes(code));
      assertions.push(this.assertion(
        'expected_warning_codes',
        missing.length === 0,
        'LiteratureResourcePoolSnapshot warning codes must include expected scenario warnings.',
        expectations.warning_codes,
        nodeResult.warning_codes,
      ));
    }
    return assertions;
  }

  private createSnapshotLiteratureResourcePoolTraceSnapshot(input: {
    input: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolInput;
    nodeInput: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeInput;
    nodeResult: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeResult;
    assertions: TopicSelectionWorkflowHarnessAssertion[];
    scenarioStatus: 'passed' | 'failed';
  }): TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolTraceSnapshot {
    return {
      schema_version: 'topic-selection-workflow-harness-trace-v1',
      payload_schema: LITERATURE_RESOURCE_POOL_TRACE_PAYLOAD_SCHEMA,
      scenario_id: input.input.scenario_id,
      scenario_case_id: input.input.scenario_case_id ?? null,
      node_id: SNAPSHOT_LITERATURE_RESOURCE_POOL_NODE_ID,
      workflow_run_id: input.input.workflow_run_id,
      node_attempt_id: input.input.node_attempt_id,
      scenario_status: input.scenarioStatus,
      node_status: input.nodeResult.status,
      node_input: input.nodeInput,
      node_result: input.nodeResult,
      snapshot_hash: input.nodeResult.snapshot_hash,
      source_health_summary: input.nodeResult.source_health_summary,
      authority_refs: input.nodeResult.authority_refs,
      audit_refs: input.nodeResult.audit_refs,
      artifact_refs: input.nodeResult.artifact_refs,
      warning_codes: input.nodeResult.warning_codes,
      blocker_codes: input.nodeResult.blocker_codes,
      assertions: input.assertions,
      created_at: this.now(),
    };
  }

  private createSearchPlanNodeInput(
    input: TopicSelectionWorkflowHarnessCreateSearchPlanInput,
  ): TopicSelectionWorkflowHarnessCreateSearchPlanNodeInput {
    return {
      schema_version: input.blueprint?.output_schema_version ?? 'v1',
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      blueprint: input.blueprint ?? null,
      created_by: input.created_by ?? 'system',
    };
  }

  private async validateCreateSearchPlanBlueprint(
    input: TopicSelectionWorkflowHarnessCreateSearchPlanInput,
  ): Promise<TopicSelectionCreateSearchPlanValidationResult> {
    const blueprint = input.blueprint;
    if (!blueprint) {
      return this.blockedSearchPlanValidation(
        'INVALID_PAYLOAD',
        'SearchPlan blueprint is required for normalized Node 3 execution.',
        ['MISSING_SEARCH_PLAN_BLUEPRINT'],
      );
    }
    if (!this.isSearchPlanBlueprintOrigin(blueprint.blueprint_origin)) {
      return this.blockedSearchPlanValidation(
        'INVALID_PAYLOAD',
        'SearchPlan blueprint origin is invalid.',
        ['MALFORMED_SEARCH_PLAN_BLUEPRINT'],
      );
    }
    if (blueprint.schema_version !== TOPIC_SELECTION_SEARCH_PLAN_BLUEPRINT_SCHEMA_VERSION
      || !this.hasNonEmptyString(blueprint.expected_snapshot_hash)
      || !this.hasNonEmptyString(blueprint.policy_version)
      || !this.hasNonEmptyString(blueprint.output_schema_version)) {
      return this.blockedSearchPlanValidation(
        'INVALID_PAYLOAD',
        'SearchPlan blueprint requires schema, snapshot hash, policy, and output schema versions.',
        ['MALFORMED_SEARCH_PLAN_BLUEPRINT'],
      );
    }
    if (!Object.prototype.hasOwnProperty.call(blueprint, 'plan_version')
      || (blueprint.plan_version !== null && !this.hasNonEmptyString(blueprint.plan_version))) {
      return this.blockedSearchPlanValidation(
        'INVALID_PAYLOAD',
        'SearchPlan blueprint plan_version must be present as a non-empty string or null.',
        ['MALFORMED_SEARCH_PLAN_BLUEPRINT'],
      );
    }
    if (!this.isFunctionalRef(blueprint.title_card_ref)
      || blueprint.title_card_ref.ref_type !== 'title_card'
      || blueprint.title_card_ref.ref_id !== input.title_card_id) {
      return this.blockedSearchPlanValidation(
        'VERSION_CONFLICT',
        'SearchPlan blueprint title_card_ref must match the scenario title card.',
        ['TITLE_CARD_REF_MISMATCH'],
      );
    }
    const refValidation = this.validateConcreteSearchPlanRefs(blueprint, input.title_card_id);
    if (refValidation) {
      return refValidation;
    }
    if (!Array.isArray(blueprint.blueprint_provenance_refs)
      || !blueprint.blueprint_provenance_refs.every((ref) => this.isFunctionalRef(ref))) {
      return this.blockedSearchPlanValidation(
        'INVALID_PAYLOAD',
        'SearchPlan blueprint provenance refs must be functional refs.',
        ['MALFORMED_SEARCH_PLAN_BLUEPRINT'],
      );
    }
    if (!this.isNullableFunctionalRef(blueprint.parent_search_plan_ref)
      || !this.isNullableFunctionalRef(blueprint.recheck_request_ref)) {
      return this.blockedSearchPlanValidation(
        'INVALID_PAYLOAD',
        'SearchPlan blueprint parent/recheck refs must be functional refs or null.',
        ['MALFORMED_SEARCH_PLAN_BLUEPRINT'],
      );
    }
    if (!this.isNonEmptyStringArray(blueprint.query_intents)) {
      return this.blockedSearchPlanValidation(
        'GATE_CONSTRAINT_FAILED',
        'SearchPlan blueprint query_intents must be explicit and non-empty.',
        ['QUERY_INTENTS_REQUIRED'],
      );
    }
    if (!Array.isArray(blueprint.coverage_intents) || blueprint.coverage_intents.length === 0) {
      return this.blockedSearchPlanValidation(
        'GATE_CONSTRAINT_FAILED',
        'SearchPlan blueprint coverage_intents must be explicit and non-empty.',
        ['COVERAGE_INTENTS_REQUIRED'],
      );
    }
    const invalidCoverage = this.invalidCoverageIntentBlocker(blueprint.coverage_intents);
    if (invalidCoverage) {
      return invalidCoverage;
    }
    if (!this.isStringArray(blueprint.must_check_constraints)
      || !this.isStringArray(blueprint.exclusion_rules)
      || !this.isPlainRecord(blueprint.coverage_strategy)
      || !this.isPlainRecord(blueprint.role_coverage_expectation)) {
      return this.blockedSearchPlanValidation(
        'INVALID_PAYLOAD',
        'SearchPlan blueprint constraints, exclusions, strategy, and role expectations are malformed.',
        ['MALFORMED_SEARCH_PLAN_BLUEPRINT'],
      );
    }

    const searchResources = this.requiredSearchResources();
    const topicSeed = await searchResources.getTopicSeedById(blueprint.topic_seed_ref.ref_id);
    if (!topicSeed) {
      return this.blockedSearchPlanValidation(
        'NOT_FOUND',
        `TopicSeed ${blueprint.topic_seed_ref.ref_id} not found.`,
        ['MISSING_TOPIC_SEED'],
      );
    }
    if (topicSeed.title_card_id !== input.title_card_id
      || topicSeed.seed_version !== blueprint.topic_seed_ref.version_id) {
      return this.blockedSearchPlanValidation(
        'VERSION_CONFLICT',
        'SearchPlan blueprint TopicSeed lineage does not match the resolved TopicSeed.',
        ['TOPIC_SEED_LINEAGE_MISMATCH'],
      );
    }
    const snapshot = await searchResources.getLiteratureResourcePoolSnapshotById(
      blueprint.literature_resource_pool_snapshot_ref.ref_id,
    );
    if (!snapshot) {
      return this.blockedSearchPlanValidation(
        'NOT_FOUND',
        `LiteratureResourcePoolSnapshot ${blueprint.literature_resource_pool_snapshot_ref.ref_id} not found.`,
        ['MISSING_LITERATURE_RESOURCE_POOL_SNAPSHOT'],
      );
    }
    if (snapshot.title_card_id !== input.title_card_id
      || snapshot.snapshot_version !== blueprint.literature_resource_pool_snapshot_ref.version_id
      || snapshot.topic_seed_ref.ref_id !== topicSeed.topic_seed_id) {
      return this.blockedSearchPlanValidation(
        'VERSION_CONFLICT',
        'SearchPlan blueprint snapshot lineage does not match the resolved TopicSeed and title card.',
        ['SNAPSHOT_LINEAGE_MISMATCH'],
        snapshot.snapshot_hash,
      );
    }
    if (snapshot.snapshot_hash !== blueprint.expected_snapshot_hash) {
      return this.blockedSearchPlanValidation(
        'VERSION_CONFLICT',
        'SearchPlan blueprint expected_snapshot_hash does not match the resolved snapshot.',
        ['SNAPSHOT_HASH_MISMATCH'],
        snapshot.snapshot_hash,
      );
    }

    return {
      blocked: false,
      error_code: null,
      error_message: null,
      blocker_codes: [],
      resolved_snapshot_hash: snapshot.snapshot_hash,
    };
  }

  private validateConcreteSearchPlanRefs(
    blueprint: TopicSelectionSearchPlanBlueprint,
    titleCardId: string,
  ): TopicSelectionCreateSearchPlanBlockedValidationResult | null {
    if (!this.isFunctionalRef(blueprint.topic_seed_ref)
      || blueprint.topic_seed_ref.ref_type !== 'topic_seed'
      || !this.hasNonEmptyString(blueprint.topic_seed_ref.version_id)
      || blueprint.topic_seed_ref.title_card_id !== titleCardId) {
      return this.blockedSearchPlanValidation(
        'INVALID_PAYLOAD',
        'SearchPlan blueprint topic_seed_ref must be a concrete TopicSeed ref for the title card.',
        ['TOPIC_SEED_REF_REQUIRED'],
      );
    }
    if (!this.isFunctionalRef(blueprint.literature_resource_pool_snapshot_ref)
      || blueprint.literature_resource_pool_snapshot_ref.ref_type !== 'literature_resource_pool_snapshot'
      || !this.hasNonEmptyString(blueprint.literature_resource_pool_snapshot_ref.version_id)
      || blueprint.literature_resource_pool_snapshot_ref.title_card_id !== titleCardId) {
      return this.blockedSearchPlanValidation(
        'INVALID_PAYLOAD',
        'SearchPlan blueprint literature_resource_pool_snapshot_ref must be a concrete snapshot ref for the title card.',
        ['LITERATURE_RESOURCE_POOL_SNAPSHOT_REF_REQUIRED'],
      );
    }
    return null;
  }

  private invalidCoverageIntentBlocker(
    coverageIntents: TopicSelectionSearchPlanBlueprintCoverageIntent[],
  ): TopicSelectionCreateSearchPlanBlockedValidationResult | null {
    const requiredFields: Array<keyof TopicSelectionSearchPlanBlueprintCoverageIntent> = [
      'coverage_key',
      'intent_type',
      'query',
      'rationale',
      'required',
      'priority',
      'expected_evidence_role',
      'target_source_types',
      'refs',
    ];
    for (const [index, intent] of coverageIntents.entries()) {
      if (!this.isPlainRecord(intent)) {
        return this.blockedSearchPlanValidation(
          'INVALID_PAYLOAD',
          `SearchPlan coverage_intents[${index}] must be an object.`,
          ['COVERAGE_INTENT_FIELD_REQUIRED'],
        );
      }
      for (const field of requiredFields) {
        if (!Object.prototype.hasOwnProperty.call(intent, field)) {
          return this.blockedSearchPlanValidation(
            'INVALID_PAYLOAD',
            `SearchPlan coverage_intents[${index}] is missing ${field}.`,
            ['COVERAGE_INTENT_FIELD_REQUIRED'],
          );
        }
      }
      if (!this.hasNonEmptyString(intent.coverage_key)
        || !this.hasNonEmptyString(intent.query)
        || !this.hasNonEmptyString(intent.rationale)
        || !this.isCoverageIntentType(intent.intent_type)
        || typeof intent.required !== 'boolean'
        || !Number.isFinite(intent.priority)
        || !this.isEvidenceRole(intent.expected_evidence_role)
        || !this.isStringArray(intent.target_source_types)
        || !Array.isArray(intent.refs)
        || !intent.refs.every((ref) => this.isFunctionalRef(ref))) {
        return this.blockedSearchPlanValidation(
          'INVALID_PAYLOAD',
          `SearchPlan coverage_intents[${index}] has malformed strict coverage semantics.`,
          ['COVERAGE_INTENT_FIELD_REQUIRED'],
        );
      }
    }
    return null;
  }

  private blockedSearchPlanValidation(
    errorCode: string,
    errorMessage: string,
    blockerCodes: string[],
    resolvedSnapshotHash: string | null = null,
  ): TopicSelectionCreateSearchPlanBlockedValidationResult {
    return {
      blocked: true,
      error_code: errorCode,
      error_message: errorMessage,
      blocker_codes: blockerCodes,
      resolved_snapshot_hash: resolvedSnapshotHash,
    };
  }

  private evaluateCreateSearchPlanAssertions(
    input: TopicSelectionWorkflowHarnessCreateSearchPlanInput,
    nodeResult: TopicSelectionWorkflowHarnessCreateSearchPlanNodeResult,
  ): TopicSelectionWorkflowHarnessAssertion[] {
    const expectations = input.expectations ?? {};
    const assertions: TopicSelectionWorkflowHarnessAssertion[] = [
      this.assertion(
        'expected_node_status',
        expectations.status ? nodeResult.status === expectations.status : nodeResult.status === 'succeeded',
        'SearchPlan node status must match scenario expectation.',
        expectations.status ?? 'succeeded',
        nodeResult.status,
      ),
      this.assertion(
        'no_model_execution',
        true,
        'Create SearchPlan is deterministic and never invokes AgentOrchestrator, provider, Codex, or debate runtime.',
        'none',
        'none',
      ),
    ];

    if (nodeResult.status === 'succeeded') {
      assertions.push(
        this.assertion(
          'authority_refs_created',
          Boolean(nodeResult.search_plan_ref)
            && nodeResult.authority_refs.length === 1 + nodeResult.coverage_row_intent_refs.length,
          'Successful SearchPlan scenario must expose SearchPlan and CoverageRow authority refs.',
          1 + nodeResult.coverage_row_intent_refs.length,
          nodeResult.authority_refs.length,
        ),
        this.assertion(
          'control_plane_refs_created',
          Boolean(
            nodeResult.search_plan?.input_snapshot_id
              && nodeResult.search_plan.workflow_run_id
              && nodeResult.search_plan.gate_result_id
              && nodeResult.search_plan.transition_attempt_id,
          ),
          'SearchPlan creation must produce input snapshot, workflow run, gate result, and transition refs.',
          ['input_snapshot_id', 'workflow_run_id', 'gate_result_id', 'transition_attempt_id'],
          {
            input_snapshot_id: nodeResult.search_plan?.input_snapshot_id ?? null,
            workflow_run_id: nodeResult.search_plan?.workflow_run_id ?? null,
            gate_result_id: nodeResult.search_plan?.gate_result_id ?? null,
            transition_attempt_id: nodeResult.search_plan?.transition_attempt_id ?? null,
          },
        ),
        this.assertion(
          'coverage_rows_preserve_blueprint_semantics',
          this.coverageRowsMatchBlueprint(input.blueprint, nodeResult.coverage_row_intents),
          'Normalized SearchPlan runner must preserve explicit blueprint coverage semantics without fallback defaults.',
          input.blueprint?.coverage_intents ?? [],
          nodeResult.coverage_row_intents.map((row) => ({
            coverage_key: row.coverage_key,
            intent_type: row.intent_type,
            query: row.query,
            rationale: row.rationale,
            required: row.required,
            priority: row.priority,
            expected_evidence_role: row.expected_evidence_role,
            target_source_types: row.target_source_types,
            refs: row.refs,
          })),
        ),
      );
    } else {
      assertions.push(this.assertion(
        'blocked_without_authority',
        nodeResult.authority_refs.length === 0
          && nodeResult.search_plan === null
          && nodeResult.coverage_row_intents.length === 0,
        'Blocked SearchPlan scenario must not create SearchPlan or CoverageRow authority refs.',
        0,
        nodeResult.authority_refs.length,
      ));
    }

    if (expectations.error_code !== undefined) {
      assertions.push(this.assertion(
        'expected_error_code',
        nodeResult.error_code === expectations.error_code,
        'SearchPlan node error code must match scenario expectation.',
        expectations.error_code,
        nodeResult.error_code,
      ));
    }
    if (expectations.blocker_codes) {
      const missing = expectations.blocker_codes.filter((code) => !nodeResult.blocker_codes.includes(code));
      assertions.push(this.assertion(
        'expected_blocker_codes',
        missing.length === 0,
        'SearchPlan blocker codes must include expected scenario blockers.',
        expectations.blocker_codes,
        nodeResult.blocker_codes,
      ));
    }
    if (expectations.coverage_row_count !== undefined && expectations.coverage_row_count !== null) {
      assertions.push(this.assertion(
        'expected_coverage_row_count',
        nodeResult.coverage_row_intents.length === expectations.coverage_row_count,
        'SearchPlan coverage row count must match scenario expectation.',
        expectations.coverage_row_count,
        nodeResult.coverage_row_intents.length,
      ));
    }
    if (expectations.plan_version !== undefined && expectations.plan_version !== null) {
      assertions.push(this.assertion(
        'expected_plan_version',
        nodeResult.plan_version === expectations.plan_version,
        'SearchPlan version must match scenario expectation.',
        expectations.plan_version,
        nodeResult.plan_version,
      ));
    }
    return assertions;
  }

  private createSearchPlanTraceSnapshot(input: {
    input: TopicSelectionWorkflowHarnessCreateSearchPlanInput;
    nodeInput: TopicSelectionWorkflowHarnessCreateSearchPlanNodeInput;
    nodeResult: TopicSelectionWorkflowHarnessCreateSearchPlanNodeResult;
    assertions: TopicSelectionWorkflowHarnessAssertion[];
    scenarioStatus: 'passed' | 'failed';
    resolvedSnapshotHash: string | null;
  }): TopicSelectionWorkflowHarnessCreateSearchPlanTraceSnapshot {
    return {
      schema_version: 'topic-selection-workflow-harness-trace-v1',
      payload_schema: SEARCH_PLAN_TRACE_PAYLOAD_SCHEMA,
      scenario_id: input.input.scenario_id,
      scenario_case_id: input.input.scenario_case_id ?? null,
      node_id: CREATE_SEARCH_PLAN_NODE_ID,
      workflow_run_id: input.input.workflow_run_id,
      node_attempt_id: input.input.node_attempt_id,
      scenario_status: input.scenarioStatus,
      node_status: input.nodeResult.status,
      node_input: input.nodeInput,
      node_result: input.nodeResult,
      blueprint_origin: input.input.blueprint?.blueprint_origin ?? null,
      blueprint_provenance_refs: input.input.blueprint?.blueprint_provenance_refs ?? [],
      expected_snapshot_hash: input.input.blueprint?.expected_snapshot_hash ?? null,
      resolved_snapshot_hash: input.resolvedSnapshotHash,
      query_intents: input.input.blueprint?.query_intents ?? [],
      coverage_intents: input.input.blueprint?.coverage_intents ?? [],
      search_plan_ref: input.nodeResult.search_plan_ref,
      coverage_row_intent_refs: input.nodeResult.coverage_row_intent_refs,
      authority_refs: input.nodeResult.authority_refs,
      audit_refs: input.nodeResult.audit_refs,
      artifact_refs: input.nodeResult.artifact_refs,
      warning_codes: input.nodeResult.warning_codes,
      blocker_codes: input.nodeResult.blocker_codes,
      assertions: input.assertions,
      created_at: this.now(),
    };
  }

  private coverageRowsMatchBlueprint(
    blueprint: TopicSelectionSearchPlanBlueprint | null | undefined,
    rows: TopicSelectionCoverageRowIntentRecord[],
  ): boolean {
    if (!blueprint || blueprint.coverage_intents.length !== rows.length) {
      return false;
    }
    return blueprint.coverage_intents.every((intent, index) => {
      const row = rows[index];
      return Boolean(row)
        && row.coverage_key === intent.coverage_key
        && row.intent_type === intent.intent_type
        && row.query === intent.query
        && row.rationale === intent.rationale
        && row.required === intent.required
        && row.priority === intent.priority
        && row.expected_evidence_role === intent.expected_evidence_role
        && JSON.stringify(row.target_source_types) === JSON.stringify(intent.target_source_types)
        && JSON.stringify(row.refs) === JSON.stringify(intent.refs);
    });
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

  private topicSeedAuditRefs(topicSeed: TopicSelectionTopicSeedRecord): TopicSelectionFunctionalRef[] {
    return this.uniqueRefs([
      topicSeed.input_snapshot_id
        ? this.ref('input_snapshot', topicSeed.input_snapshot_id, topicSeed.title_card_id)
        : null,
      topicSeed.gate_result_id
        ? this.ref('readiness_gate_result', topicSeed.gate_result_id, topicSeed.title_card_id)
        : null,
      topicSeed.transition_attempt_id
        ? this.ref('chain_transition_attempt', topicSeed.transition_attempt_id, topicSeed.title_card_id)
        : null,
    ]);
  }

  private literatureResourcePoolSnapshotAuditRefs(
    snapshot: TopicSelectionLiteratureResourcePoolSnapshotRecord,
  ): TopicSelectionFunctionalRef[] {
    return this.uniqueRefs([
      snapshot.input_snapshot_id
        ? this.ref('input_snapshot', snapshot.input_snapshot_id, snapshot.title_card_id)
        : null,
      snapshot.gate_result_id
        ? this.ref('readiness_gate_result', snapshot.gate_result_id, snapshot.title_card_id)
        : null,
      snapshot.transition_attempt_id
        ? this.ref('chain_transition_attempt', snapshot.transition_attempt_id, snapshot.title_card_id)
        : null,
    ]);
  }

  private searchPlanAuditRefs(searchPlan: TopicSelectionSearchPlanRecord): TopicSelectionFunctionalRef[] {
    return this.uniqueRefs([
      searchPlan.input_snapshot_id
        ? this.ref('input_snapshot', searchPlan.input_snapshot_id, searchPlan.title_card_id)
        : null,
      searchPlan.workflow_run_id
        ? this.ref('workflow_run', searchPlan.workflow_run_id, searchPlan.title_card_id)
        : null,
      searchPlan.gate_result_id
        ? this.ref('readiness_gate_result', searchPlan.gate_result_id, searchPlan.title_card_id)
        : null,
      searchPlan.transition_attempt_id
        ? this.ref('chain_transition_attempt', searchPlan.transition_attempt_id, searchPlan.title_card_id)
        : null,
    ]);
  }

  private blockerCodesFromAppError(error: AppError): string[] {
    const blockerCodes = error.details?.blocker_codes;
    if (Array.isArray(blockerCodes)) {
      const stringCodes = blockerCodes.filter((code): code is string => typeof code === 'string' && code.trim().length > 0);
      if (stringCodes.length > 0) {
        return this.uniqueStrings(stringCodes);
      }
    }
    return [error.errorCode];
  }

  private sourceHealthSummaryFromAppError(error: AppError): TopicSelectionSourceHealthSummary | null {
    const sourceHealthSummary = error.details?.source_health_summary;
    if (!sourceHealthSummary || typeof sourceHealthSummary !== 'object') {
      return null;
    }
    const candidate = sourceHealthSummary as Partial<TopicSelectionSourceHealthSummary>;
    if (!Array.isArray(candidate.warning_codes) || !Array.isArray(candidate.missing_literature_ids)) {
      return null;
    }
    return sourceHealthSummary as TopicSelectionSourceHealthSummary;
  }

  private auditRefsFromAppError(error: AppError, fallbackTitleCardId: string): TopicSelectionFunctionalRef[] {
    const details = error.details;
    return this.uniqueRefs([
      this.refFromDetail('input_snapshot', details?.input_snapshot_id, details?.title_card_id, fallbackTitleCardId),
      this.refFromDetail('readiness_gate_result', details?.gate_result_id, details?.title_card_id, fallbackTitleCardId),
      this.refFromDetail(
        'chain_transition_attempt',
        details?.transition_attempt_id,
        details?.title_card_id,
        fallbackTitleCardId,
      ),
    ]);
  }

  private refFromDetail(
    refType: string,
    refId: unknown,
    titleCardId: unknown,
    fallbackTitleCardId: string,
  ): TopicSelectionFunctionalRef | null {
    if (typeof refId !== 'string' || refId.trim().length === 0) {
      return null;
    }
    return this.ref(
      refType,
      refId,
      typeof titleCardId === 'string' && titleCardId.trim().length > 0 ? titleCardId : fallbackTitleCardId,
    );
  }

  private ref(
    refType: string,
    refId: string,
    titleCardId: string | null,
    versionId: string | null = null,
  ): TopicSelectionFunctionalRef {
    return {
      ref_type: refType,
      ref_id: refId,
      version_id: versionId,
      title_card_id: titleCardId,
    };
  }

  private requiredControlPlane(): TopicSelectionControlPlaneService {
    if (!this.dependencies.controlPlane) {
      throw new AppError(500, 'INTERNAL_ERROR', 'WorkflowHarness create-topic-seed requires controlPlane dependency.');
    }
    return this.dependencies.controlPlane;
  }

  private requiredSearchResources(): TopicSelectionSearchResourceService {
    if (!this.dependencies.searchResources) {
      throw new AppError(500, 'INTERNAL_ERROR', 'WorkflowHarness create-topic-seed requires searchResources dependency.');
    }
    return this.dependencies.searchResources;
  }

  private assertCreateTopicSeedScenarioInput(input: TopicSelectionWorkflowHarnessCreateTopicSeedInput): void {
    this.assertNonEmpty(input.scenario_id, 'scenario_id');
    this.assertNonEmpty(input.title_card_id, 'title_card_id');
    this.assertNonEmpty(input.workflow_run_id, 'workflow_run_id');
    this.assertNonEmpty(input.node_attempt_id, 'node_attempt_id');
    this.assertNonEmpty(input.policy_version, 'policy_version');
    this.assertNonEmpty(input.output_schema_version, 'output_schema_version');
    if (input.seed_version !== undefined && input.seed_version !== null) {
      this.assertNonEmpty(input.seed_version, 'seed_version');
    }
    if (input.intent_summary !== undefined && input.intent_summary !== null) {
      this.assertNonEmpty(input.intent_summary, 'intent_summary');
    }
    if (input.intent_preparation_refs) {
      this.assertFunctionalRefs(input.intent_preparation_refs, 'intent_preparation_refs');
    }
  }

  private assertSnapshotLiteratureResourcePoolScenarioInput(
    input: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolInput,
  ): void {
    this.assertNonEmpty(input.scenario_id, 'scenario_id');
    this.assertNonEmpty(input.title_card_id, 'title_card_id');
    this.assertNonEmpty(input.workflow_run_id, 'workflow_run_id');
    this.assertNonEmpty(input.node_attempt_id, 'node_attempt_id');
    this.assertFunctionalRef(input.topic_seed_ref, 'topic_seed_ref');
    if (input.topic_seed_ref.ref_type !== 'topic_seed') {
      throw new AppError(400, 'INVALID_PAYLOAD', 'topic_seed_ref.ref_type must be topic_seed.');
    }
    this.assertNonEmpty(input.topic_seed_ref.version_id, 'topic_seed_ref.version_id');
    if (!input.topic_seed_ref.title_card_id) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'topic_seed_ref.title_card_id cannot be empty.');
    }
    if (input.topic_seed_ref.title_card_id !== input.title_card_id) {
      throw new AppError(409, 'VERSION_CONFLICT', 'topic_seed_ref belongs to a different title card.');
    }
    this.assertNonEmpty(input.source_scope, 'source_scope');
    if (input.resource_sample_set_provenance_ref) {
      this.assertFunctionalRef(input.resource_sample_set_provenance_ref, 'resource_sample_set_provenance_ref');
    }
    this.assertNonEmpty(input.policy_version, 'policy_version');
    this.assertNonEmpty(input.output_schema_version, 'output_schema_version');
  }

  private assertCreateSearchPlanScenarioInput(input: TopicSelectionWorkflowHarnessCreateSearchPlanInput): void {
    this.assertNonEmpty(input.scenario_id, 'scenario_id');
    this.assertNonEmpty(input.title_card_id, 'title_card_id');
    this.assertNonEmpty(input.workflow_run_id, 'workflow_run_id');
    this.assertNonEmpty(input.node_attempt_id, 'node_attempt_id');
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

  private assertFunctionalRef(value: unknown, fieldName: string): asserts value is TopicSelectionFunctionalRef {
    if (!value || typeof value !== 'object') {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} must be a functional ref.`);
    }
    const candidate = value as Partial<TopicSelectionFunctionalRef>;
    this.assertNonEmpty(candidate.ref_type, `${fieldName}.ref_type`);
    this.assertNonEmpty(candidate.ref_id, `${fieldName}.ref_id`);
  }

  private assertNonEmpty(value: unknown, fieldName: string): asserts value is string {
    if (typeof value !== 'string') {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} cannot be empty.`);
    }
    if (!value.trim()) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} cannot be empty.`);
    }
  }

  private hasNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value)
      && value.every((item) => typeof item === 'string' && item.trim().length > 0);
  }

  private isNonEmptyStringArray(value: unknown): value is string[] {
    return this.isStringArray(value) && value.length > 0 && value.every((item) => item.trim().length > 0);
  }

  private isPlainRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  private isFunctionalRef(value: unknown): value is TopicSelectionFunctionalRef {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const candidate = value as Partial<TopicSelectionFunctionalRef>;
    return this.hasNonEmptyString(candidate.ref_type) && this.hasNonEmptyString(candidate.ref_id);
  }

  private isNullableFunctionalRef(value: unknown): value is TopicSelectionFunctionalRef | null {
    return value === null || this.isFunctionalRef(value);
  }

  private isSearchPlanBlueprintOrigin(value: unknown): value is TopicSelectionSearchPlanBlueprintOrigin {
    return typeof value === 'string'
      && (TOPIC_SELECTION_SEARCH_PLAN_BLUEPRINT_ORIGINS as readonly string[]).includes(value);
  }

  private isCoverageIntentType(value: unknown): value is TopicSelectionCoverageIntentType {
    return typeof value === 'string' && (TOPIC_SELECTION_COVERAGE_INTENT_TYPES as readonly string[]).includes(value);
  }

  private isEvidenceRole(value: unknown): value is TopicSelectionEvidenceRole {
    return typeof value === 'string' && (TOPIC_SELECTION_EVIDENCE_ROLES as readonly string[]).includes(value);
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

  private uniqueStrings(values: string[]): string[] {
    return [...new Set(values)];
  }

  private uniqueArtifactRefs(
    refs: Array<TopicSelectionArtifactFunctionalRef | null | undefined>,
  ): TopicSelectionArtifactFunctionalRef[] {
    return this.uniqueRefs(refs).filter((ref): ref is TopicSelectionArtifactFunctionalRef =>
      ref.ref_type === 'artifact_ref',
    );
  }
}
